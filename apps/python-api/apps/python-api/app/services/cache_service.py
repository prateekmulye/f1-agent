"""
Redis Cache Service for F1 data
Handles caching of static and semi-static F1 data
"""
import json
import redis
from typing import Any, Optional, Dict, List
from datetime import datetime, timedelta
import logging
from functools import wraps

logger = logging.getLogger(__name__)


class CacheService:
    def __init__(self, redis_url: str = "redis://localhost:6379/0"):
        """Initialize Redis connection"""
        try:
            self.redis_client = redis.from_url(redis_url, decode_responses=True)
            self.redis_client.ping()
            logger.info("Connected to Redis successfully")
        except Exception as e:
            logger.warning(f"Redis connection failed: {e}. Using memory fallback.")
            self.redis_client = None
            self._memory_cache: Dict[str, Dict[str, Any]] = {}

    def _serialize(self, data: Any) -> str:
        """Serialize data for storage"""
        return json.dumps(data, default=str, ensure_ascii=False)

    def _deserialize(self, data: str) -> Any:
        """Deserialize data from storage"""
        try:
            return json.loads(data)
        except json.JSONDecodeError:
            return data

    def set(self, key: str, value: Any, ttl: int = 3600) -> bool:
        """Set cache entry with TTL (Time To Live) in seconds"""
        try:
            if self.redis_client:
                serialized_data = self._serialize(value)
                return self.redis_client.setex(key, ttl, serialized_data)
            else:
                # Memory fallback
                expire_time = datetime.utcnow() + timedelta(seconds=ttl)
                self._memory_cache[key] = {
                    'data': value,
                    'expires_at': expire_time
                }
                return True
        except Exception as e:
            logger.error(f"Cache set error for key '{key}': {e}")
            return False

    def get(self, key: str) -> Optional[Any]:
        """Get cache entry"""
        try:
            if self.redis_client:
                data = self.redis_client.get(key)
                if data:
                    return self._deserialize(data)
                return None
            else:
                # Memory fallback
                if key in self._memory_cache:
                    entry = self._memory_cache[key]
                    if datetime.utcnow() < entry['expires_at']:
                        return entry['data']
                    else:
                        del self._memory_cache[key]
                return None
        except Exception as e:
            logger.error(f"Cache get error for key '{key}': {e}")
            return None

    def delete(self, key: str) -> bool:
        """Delete cache entry"""
        try:
            if self.redis_client:
                return bool(self.redis_client.delete(key))
            else:
                if key in self._memory_cache:
                    del self._memory_cache[key]
                    return True
                return False
        except Exception as e:
            logger.error(f"Cache delete error for key '{key}': {e}")
            return False

    def exists(self, key: str) -> bool:
        """Check if cache entry exists"""
        try:
            if self.redis_client:
                return bool(self.redis_client.exists(key))
            else:
                if key in self._memory_cache:
                    entry = self._memory_cache[key]
                    if datetime.utcnow() < entry['expires_at']:
                        return True
                    else:
                        del self._memory_cache[key]
                return False
        except Exception as e:
            logger.error(f"Cache exists error for key '{key}': {e}")
            return False

    def set_many(self, mapping: Dict[str, Any], ttl: int = 3600) -> bool:
        """Set multiple cache entries"""
        try:
            if self.redis_client:
                pipe = self.redis_client.pipeline()
                for key, value in mapping.items():
                    serialized_data = self._serialize(value)
                    pipe.setex(key, ttl, serialized_data)
                pipe.execute()
                return True
            else:
                expire_time = datetime.utcnow() + timedelta(seconds=ttl)
                for key, value in mapping.items():
                    self._memory_cache[key] = {
                        'data': value,
                        'expires_at': expire_time
                    }
                return True
        except Exception as e:
            logger.error(f"Cache set_many error: {e}")
            return False

    def get_many(self, keys: List[str]) -> Dict[str, Any]:
        """Get multiple cache entries"""
        try:
            result = {}
            if self.redis_client:
                values = self.redis_client.mget(keys)
                for key, value in zip(keys, values):
                    if value:
                        result[key] = self._deserialize(value)
            else:
                for key in keys:
                    value = self.get(key)
                    if value is not None:
                        result[key] = value
            return result
        except Exception as e:
            logger.error(f"Cache get_many error: {e}")
            return {}

    def clear_pattern(self, pattern: str) -> int:
        """Clear cache entries matching pattern"""
        try:
            if self.redis_client:
                keys = self.redis_client.keys(pattern)
                if keys:
                    return self.redis_client.delete(*keys)
                return 0
            else:
                count = 0
                import fnmatch
                keys_to_delete = []
                for key in self._memory_cache.keys():
                    if fnmatch.fnmatch(key, pattern):
                        keys_to_delete.append(key)

                for key in keys_to_delete:
                    del self._memory_cache[key]
                    count += 1
                return count
        except Exception as e:
            logger.error(f"Cache clear_pattern error for pattern '{pattern}': {e}")
            return 0

    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        try:
            if self.redis_client:
                info = self.redis_client.info('memory')
                return {
                    'type': 'redis',
                    'memory_used': info.get('used_memory_human', 'N/A'),
                    'connected_clients': self.redis_client.info('clients').get('connected_clients', 0),
                    'total_keys': self.redis_client.dbsize()
                }
            else:
                return {
                    'type': 'memory',
                    'total_keys': len(self._memory_cache),
                    'memory_used': 'N/A'
                }
        except Exception as e:
            logger.error(f"Cache stats error: {e}")
            return {'type': 'error', 'error': str(e)}


# Cache Decorators
def cache_result(cache_service: CacheService, key_prefix: str, ttl: int = 3600):
    """Decorator to cache function results"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Create cache key from function name and arguments
            cache_key = f"{key_prefix}:{func.__name__}:{hash(str(args) + str(sorted(kwargs.items())))}"

            # Try to get from cache first
            cached_result = cache_service.get(cache_key)
            if cached_result is not None:
                logger.debug(f"Cache hit for {cache_key}")
                return cached_result

            # Execute function and cache result
            result = await func(*args, **kwargs)
            if result is not None:
                cache_service.set(cache_key, result, ttl)
                logger.debug(f"Cached result for {cache_key}")

            return result
        return wrapper
    return decorator


class F1CacheService(CacheService):
    """Specialized cache service for F1 data with predefined cache keys and TTLs"""

    # Cache TTL settings (in seconds)
    TTL_STATIC = 86400 * 7  # 7 days for static data (drivers, teams)
    TTL_SEMI_STATIC = 3600  # 1 hour for semi-static data (season standings)
    TTL_DYNAMIC = 300       # 5 minutes for dynamic data (weather, practice times)
    TTL_PREDICTIONS = 1800  # 30 minutes for predictions

    # Cache key patterns
    KEYS = {
        'driver': 'f1:driver:{}',
        'team': 'f1:team:{}',
        'circuit': 'f1:circuit:{}',
        'race': 'f1:race:{}:{}',  # season:race_id
        'standings': 'f1:standings:{}',  # season
        'weather': 'f1:weather:{}',  # race_id
        'predictions': 'f1:predictions:{}',  # race_id
        'driver_stats': 'f1:driver_stats:{}:{}',  # driver_id:circuit_id
        'team_stats': 'f1:team_stats:{}:{}',  # team_id:circuit_id
        'performance': 'f1:performance:{}:{}',  # driver_id/team_id:season
    }

    def cache_driver(self, driver_id: str, driver_data: Dict[str, Any]) -> bool:
        """Cache driver data (static, long TTL)"""
        key = self.KEYS['driver'].format(driver_id)
        return self.set(key, driver_data, self.TTL_STATIC)

    def get_driver(self, driver_id: str) -> Optional[Dict[str, Any]]:
        """Get cached driver data"""
        key = self.KEYS['driver'].format(driver_id)
        return self.get(key)

    def cache_team(self, team_id: str, team_data: Dict[str, Any]) -> bool:
        """Cache team data (static, long TTL)"""
        key = self.KEYS['team'].format(team_id)
        return self.set(key, team_data, self.TTL_STATIC)

    def get_team(self, team_id: str) -> Optional[Dict[str, Any]]:
        """Get cached team data"""
        key = self.KEYS['team'].format(team_id)
        return self.get(key)

    def cache_circuit(self, circuit_id: str, circuit_data: Dict[str, Any]) -> bool:
        """Cache circuit data (static, long TTL)"""
        key = self.KEYS['circuit'].format(circuit_id)
        return self.set(key, circuit_data, self.TTL_STATIC)

    def get_circuit(self, circuit_id: str) -> Optional[Dict[str, Any]]:
        """Get cached circuit data"""
        key = self.KEYS['circuit'].format(circuit_id)
        return self.get(key)

    def cache_race(self, season: int, race_id: str, race_data: Dict[str, Any]) -> bool:
        """Cache race data (semi-static)"""
        key = self.KEYS['race'].format(season, race_id)
        return self.set(key, race_data, self.TTL_SEMI_STATIC)

    def get_race(self, season: int, race_id: str) -> Optional[Dict[str, Any]]:
        """Get cached race data"""
        key = self.KEYS['race'].format(season, race_id)
        return self.get(key)

    def cache_standings(self, season: int, standings_data: Dict[str, Any]) -> bool:
        """Cache championship standings (semi-static)"""
        key = self.KEYS['standings'].format(season)
        return self.set(key, standings_data, self.TTL_SEMI_STATIC)

    def get_standings(self, season: int) -> Optional[Dict[str, Any]]:
        """Get cached standings data"""
        key = self.KEYS['standings'].format(season)
        return self.get(key)

    def cache_predictions(self, race_id: str, predictions_data: List[Dict[str, Any]]) -> bool:
        """Cache race predictions (medium TTL)"""
        key = self.KEYS['predictions'].format(race_id)
        return self.set(key, predictions_data, self.TTL_PREDICTIONS)

    def get_predictions(self, race_id: str) -> Optional[List[Dict[str, Any]]]:
        """Get cached predictions data"""
        key = self.KEYS['predictions'].format(race_id)
        return self.get(key)

    def cache_weather(self, race_id: str, weather_data: Dict[str, Any]) -> bool:
        """Cache weather data (short TTL - dynamic)"""
        key = self.KEYS['weather'].format(race_id)
        return self.set(key, weather_data, self.TTL_DYNAMIC)

    def get_weather(self, race_id: str) -> Optional[Dict[str, Any]]:
        """Get cached weather data"""
        key = self.KEYS['weather'].format(race_id)
        return self.get(key)

    def invalidate_season(self, season: int) -> int:
        """Invalidate all cache entries for a specific season"""
        patterns = [
            f"f1:race:{season}:*",
            f"f1:standings:{season}",
            f"f1:performance:*:{season}"
        ]
        total_deleted = 0
        for pattern in patterns:
            total_deleted += self.clear_pattern(pattern)
        logger.info(f"Invalidated {total_deleted} cache entries for season {season}")
        return total_deleted

    def invalidate_race(self, season: int, race_id: str) -> int:
        """Invalidate all cache entries for a specific race"""
        patterns = [
            self.KEYS['race'].format(season, race_id),
            self.KEYS['predictions'].format(race_id),
            self.KEYS['weather'].format(race_id)
        ]
        total_deleted = 0
        for pattern in patterns:
            if self.delete(pattern):
                total_deleted += 1
        logger.info(f"Invalidated {total_deleted} cache entries for race {race_id}")
        return total_deleted


# Global cache instance
f1_cache: Optional[F1CacheService] = None


def get_cache_service(redis_url: str = "redis://localhost:6379/0") -> F1CacheService:
    """Get or create the global cache service instance"""
    global f1_cache
    if f1_cache is None:
        f1_cache = F1CacheService(redis_url)
    return f1_cache