"""
Rate limiting middleware using SlowAPI
"""
import time
from typing import Callable
import redis
from fastapi import Request, HTTPException
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from config.settings import settings

# Redis client for distributed rate limiting
try:
    redis_client = redis.from_url(settings.redis_url, decode_responses=True)
except Exception as e:
    print(f"⚠️ Redis connection failed: {e}. Using in-memory rate limiting.")
    redis_client = None


def get_client_identifier(request: Request) -> str:
    """
    Get client identifier for rate limiting
    Uses IP address as primary identifier
    """
    # Check for forwarded headers first
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()

    # Check for real IP
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip

    # Fall back to remote address
    return get_remote_address(request)


# Create limiter instance
limiter = Limiter(
    key_func=get_client_identifier,
    storage_uri=settings.redis_url if redis_client else "memory://",
    default_limits=[f"{settings.rate_limit_per_minute}/minute"]
)


class RateLimitingMiddleware:
    """Custom rate limiting middleware with advanced features"""

    def __init__(self):
        self.limiter = limiter
        self.memory_store = {}  # Fallback in-memory store

    async def __call__(self, request: Request, call_next):
        """Process request with rate limiting"""
        client_id = get_client_identifier(request)

        # Skip rate limiting for health checks and specific paths
        if request.url.path in ["/health", "/docs", "/redoc", "/openapi.json"]:
            return await call_next(request)

        # Check rate limit
        if not await self._check_rate_limit(client_id, request):
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "Rate limit exceeded",
                    "message": f"Maximum {settings.rate_limit_per_minute} requests per minute allowed",
                    "retry_after": 60
                },
                headers={"Retry-After": "60"}
            )

        # Add rate limiting headers to response
        response = await call_next(request)
        await self._add_rate_limit_headers(response, client_id)

        return response

    async def _check_rate_limit(self, client_id: str, request: Request) -> bool:
        """Check if client has exceeded rate limit"""
        try:
            if redis_client:
                return await self._redis_rate_limit(client_id)
            else:
                return await self._memory_rate_limit(client_id)
        except Exception as e:
            print(f"Rate limiting error: {e}")
            # Allow request if rate limiting fails
            return True

    async def _redis_rate_limit(self, client_id: str) -> bool:
        """Redis-based rate limiting"""
        current_time = int(time.time())
        window_start = current_time - 60  # 1-minute window

        pipe = redis_client.pipeline()
        pipe.zremrangebyscore(f"rate_limit:{client_id}", 0, window_start)
        pipe.zcard(f"rate_limit:{client_id}")
        pipe.zadd(f"rate_limit:{client_id}", {str(current_time): current_time})
        pipe.expire(f"rate_limit:{client_id}", 60)

        results = pipe.execute()
        current_requests = results[1]

        return current_requests < settings.rate_limit_per_minute

    async def _memory_rate_limit(self, client_id: str) -> bool:
        """In-memory rate limiting fallback"""
        current_time = time.time()
        window_start = current_time - 60

        if client_id not in self.memory_store:
            self.memory_store[client_id] = []

        # Clean old requests
        self.memory_store[client_id] = [
            req_time for req_time in self.memory_store[client_id]
            if req_time > window_start
        ]

        # Check limit
        if len(self.memory_store[client_id]) >= settings.rate_limit_per_minute:
            return False

        # Add current request
        self.memory_store[client_id].append(current_time)
        return True

    async def _add_rate_limit_headers(self, response, client_id: str):
        """Add rate limiting headers to response"""
        try:
            if redis_client:
                current_requests = redis_client.zcard(f"rate_limit:{client_id}")
            else:
                current_requests = len(self.memory_store.get(client_id, []))

            remaining = max(0, settings.rate_limit_per_minute - current_requests)

            response.headers["X-RateLimit-Limit"] = str(settings.rate_limit_per_minute)
            response.headers["X-RateLimit-Remaining"] = str(remaining)
            response.headers["X-RateLimit-Reset"] = str(int(time.time()) + 60)

        except Exception as e:
            print(f"Error adding rate limit headers: {e}")


# Custom exception handler for rate limiting
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    """Custom rate limit exceeded handler"""
    return HTTPException(
        status_code=429,
        detail={
            "error": "Too Many Requests",
            "message": "Rate limit exceeded. Please try again later.",
            "retry_after": 60
        },
        headers={"Retry-After": "60"}
    )


# Rate limiting decorators for specific endpoints
def apply_rate_limit(limit: str = None):
    """Decorator to apply custom rate limits to specific endpoints (temporarily disabled for development)"""
    def decorator(func):
        # Temporarily disable rate limiting for development
        return func
    return decorator


# Pre-configured rate limits for different endpoint types
RATE_LIMITS = {
    "auth": "5/minute",          # Authentication endpoints
    "prediction": "30/minute",    # Prediction endpoints
    "data": "60/minute",         # Data fetching endpoints
    "health": "120/minute",      # Health checks
    "admin": "10/minute"         # Admin endpoints
}