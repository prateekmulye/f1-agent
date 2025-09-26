"""
F1 Data Ingestion Service
Fetches data from multiple F1 API sources and populates database
"""
import asyncio
import aiohttp
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
import json
from .cache_service import get_cache_service

logger = logging.getLogger(__name__)


class F1DataIngestion:
    """Main class for F1 data ingestion from various APIs"""

    def __init__(self, db_session: AsyncSession):
        self.db = db_session
        self.cache = get_cache_service()

        # F1 API endpoints
        self.ergast_base = "http://ergast.com/api/f1"
        self.openf1_base = "https://api.openf1.org/v1"

        # Weather API (you'll need to get your own key)
        self.weather_api_key = ""  # Set from environment
        self.weather_base = "http://api.weatherapi.com/v1"

    async def fetch_json(self, url: str, session: aiohttp.ClientSession) -> Optional[Dict[str, Any]]:
        """Fetch JSON data from URL with error handling"""
        try:
            async with session.get(url) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    logger.warning(f"HTTP {response.status} for {url}")
                    return None
        except Exception as e:
            logger.error(f"Error fetching {url}: {e}")
            return None

    async def ingest_drivers(self, season: int = 2025) -> List[Dict[str, Any]]:
        """Ingest driver data from Ergast API"""
        url = f"{self.ergast_base}/{season}/drivers.json"

        async with aiohttp.ClientSession() as session:
            data = await self.fetch_json(url, session)

            if not data or 'MRData' not in data:
                return []

            drivers = []
            driver_table = data['MRData'].get('DriverTable', {})

            for driver_data in driver_table.get('Drivers', []):
                driver = {
                    'id': driver_data['driverId'],
                    'code': driver_data['code'],
                    'first_name': driver_data['givenName'],
                    'last_name': driver_data['familyName'],
                    'full_name': f"{driver_data['givenName']} {driver_data['familyName']}",
                    'date_of_birth': driver_data.get('dateOfBirth'),
                    'nationality': driver_data.get('nationality'),
                    'number': driver_data.get('permanentNumber'),
                    'url': driver_data.get('url')
                }
                drivers.append(driver)

                # Cache driver data
                self.cache.cache_driver(driver['id'], driver)

            logger.info(f"Ingested {len(drivers)} drivers for season {season}")
            return drivers

    async def ingest_teams(self, season: int = 2025) -> List[Dict[str, Any]]:
        """Ingest constructor/team data from Ergast API"""
        url = f"{self.ergast_base}/{season}/constructors.json"

        async with aiohttp.ClientSession() as session:
            data = await self.fetch_json(url, session)

            if not data or 'MRData' not in data:
                return []

            teams = []
            constructor_table = data['MRData'].get('ConstructorTable', {})

            for team_data in constructor_table.get('Constructors', []):
                team = {
                    'id': team_data['constructorId'],
                    'name': team_data['name'],
                    'nationality': team_data.get('nationality'),
                    'url': team_data.get('url')
                }
                teams.append(team)

                # Cache team data
                self.cache.cache_team(team['id'], team)

            logger.info(f"Ingested {len(teams)} teams for season {season}")
            return teams

    async def ingest_circuits(self, season: int = 2025) -> List[Dict[str, Any]]:
        """Ingest circuit data from Ergast API"""
        url = f"{self.ergast_base}/{season}/circuits.json"

        async with aiohttp.ClientSession() as session:
            data = await self.fetch_json(url, session)

            if not data or 'MRData' not in data:
                return []

            circuits = []
            circuit_table = data['MRData'].get('CircuitTable', {})

            for circuit_data in circuit_table.get('Circuits', []):
                location = circuit_data.get('Location', {})
                circuit = {
                    'id': circuit_data['circuitId'],
                    'name': circuit_data['circuitName'],
                    'location': location.get('locality'),
                    'country': location.get('country'),
                    'latitude': float(location.get('lat', 0)),
                    'longitude': float(location.get('long', 0)),
                    'url': circuit_data.get('url')
                }
                circuits.append(circuit)

                # Cache circuit data
                self.cache.cache_circuit(circuit['id'], circuit)

            logger.info(f"Ingested {len(circuits)} circuits for season {season}")
            return circuits

    async def ingest_races(self, season: int = 2025) -> List[Dict[str, Any]]:
        """Ingest race schedule from Ergast API"""
        url = f"{self.ergast_base}/{season}.json"

        async with aiohttp.ClientSession() as session:
            data = await self.fetch_json(url, session)

            if not data or 'MRData' not in data:
                return []

            races = []
            race_table = data['MRData'].get('RaceTable', {})

            for race_data in race_table.get('Races', []):
                circuit = race_data.get('Circuit', {})
                race = {
                    'id': f"{season}_{race_data.get('round', '').zfill(2)}_{circuit.get('circuitId', '')}",
                    'season': season,
                    'round': int(race_data.get('round', 0)),
                    'name': race_data.get('raceName', ''),
                    'circuit_id': circuit.get('circuitId'),
                    'race_date': race_data.get('date'),
                    'race_time': race_data.get('time', '').replace('Z', ''),
                    'url': race_data.get('url')
                }

                # Add session times if available
                if 'FirstPractice' in race_data:
                    race['fp1_date'] = race_data['FirstPractice'].get('date')
                    race['fp1_time'] = race_data['FirstPractice'].get('time', '').replace('Z', '')

                if 'SecondPractice' in race_data:
                    race['fp2_date'] = race_data['SecondPractice'].get('date')
                    race['fp2_time'] = race_data['SecondPractice'].get('time', '').replace('Z', '')

                if 'ThirdPractice' in race_data:
                    race['fp3_date'] = race_data['ThirdPractice'].get('date')
                    race['fp3_time'] = race_data['ThirdPractice'].get('time', '').replace('Z', '')

                if 'Qualifying' in race_data:
                    race['qualifying_date'] = race_data['Qualifying'].get('date')
                    race['qualifying_time'] = race_data['Qualifying'].get('time', '').replace('Z', '')

                if 'Sprint' in race_data:
                    race['sprint_date'] = race_data['Sprint'].get('date')
                    race['sprint_time'] = race_data['Sprint'].get('time', '').replace('Z', '')

                races.append(race)

                # Cache race data
                self.cache.cache_race(season, race['id'], race)

            logger.info(f"Ingested {len(races)} races for season {season}")
            return races

    async def ingest_race_results(self, season: int, round_num: int) -> List[Dict[str, Any]]:
        """Ingest race results from Ergast API"""
        url = f"{self.ergast_base}/{season}/{round_num}/results.json"

        async with aiohttp.ClientSession() as session:
            data = await self.fetch_json(url, session)

            if not data or 'MRData' not in data:
                return []

            results = []
            race_table = data['MRData'].get('RaceTable', {})
            races = race_table.get('Races', [])

            if not races:
                return []

            race = races[0]
            race_id = f"{season}_{str(round_num).zfill(2)}_{race['Circuit']['circuitId']}"

            for result in race.get('Results', []):
                driver = result.get('Driver', {})
                constructor = result.get('Constructor', {})

                race_result = {
                    'race_id': race_id,
                    'driver_id': driver.get('driverId'),
                    'team_id': constructor.get('constructorId'),
                    'position': int(result.get('position', 0)) if result.get('position', '').isdigit() else None,
                    'grid_position': int(result.get('grid', 0)) if result.get('grid', '').isdigit() else None,
                    'points': float(result.get('points', 0)),
                    'laps': int(result.get('laps', 0)),
                    'status': result.get('status', ''),
                    'race_time': result.get('Time', {}).get('time') if result.get('Time') else None,
                    'fastest_lap_time': result.get('FastestLap', {}).get('Time', {}).get('time') if result.get('FastestLap') else None,
                    'fastest_lap_rank': int(result.get('FastestLap', {}).get('rank', 0)) if result.get('FastestLap', {}).get('rank', '').isdigit() else None
                }
                results.append(race_result)

            logger.info(f"Ingested {len(results)} race results for {season} round {round_num}")
            return results

    async def ingest_qualifying_results(self, season: int, round_num: int) -> List[Dict[str, Any]]:
        """Ingest qualifying results from Ergast API"""
        url = f"{self.ergast_base}/{season}/{round_num}/qualifying.json"

        async with aiohttp.ClientSession() as session:
            data = await self.fetch_json(url, session)

            if not data or 'MRData' not in data:
                return []

            results = []
            race_table = data['MRData'].get('RaceTable', {})
            races = race_table.get('Races', [])

            if not races:
                return []

            race = races[0]
            race_id = f"{season}_{str(round_num).zfill(2)}_{race['Circuit']['circuitId']}"

            for result in race.get('QualifyingResults', []):
                driver = result.get('Driver', {})
                constructor = result.get('Constructor', {})

                qualifying_result = {
                    'race_id': race_id,
                    'driver_id': driver.get('driverId'),
                    'team_id': constructor.get('constructorId'),
                    'position': int(result.get('position', 0)),
                    'q1_time': result.get('Q1'),
                    'q2_time': result.get('Q2'),
                    'q3_time': result.get('Q3')
                }
                results.append(qualifying_result)

            logger.info(f"Ingested {len(results)} qualifying results for {season} round {round_num}")
            return results

    async def ingest_standings(self, season: int) -> Dict[str, List[Dict[str, Any]]]:
        """Ingest championship standings from Ergast API"""

        # Driver standings
        driver_url = f"{self.ergast_base}/{season}/driverStandings.json"
        constructor_url = f"{self.ergast_base}/{season}/constructorStandings.json"

        async with aiohttp.ClientSession() as session:
            driver_data = await self.fetch_json(driver_url, session)
            constructor_data = await self.fetch_json(constructor_url, session)

            standings = {
                'driver_standings': [],
                'constructor_standings': []
            }

            # Process driver standings
            if driver_data and 'MRData' in driver_data:
                standings_table = driver_data['MRData'].get('StandingsTable', {})
                standings_lists = standings_table.get('StandingsLists', [])

                if standings_lists:
                    for standing in standings_lists[0].get('DriverStandings', []):
                        driver = standing.get('Driver', {})
                        standings['driver_standings'].append({
                            'position': int(standing.get('position', 0)),
                            'driver_id': driver.get('driverId'),
                            'driver_name': f"{driver.get('givenName', '')} {driver.get('familyName', '')}",
                            'points': float(standing.get('points', 0)),
                            'wins': int(standing.get('wins', 0))
                        })

            # Process constructor standings
            if constructor_data and 'MRData' in constructor_data:
                standings_table = constructor_data['MRData'].get('StandingsTable', {})
                standings_lists = standings_table.get('StandingsLists', [])

                if standings_lists:
                    for standing in standings_lists[0].get('ConstructorStandings', []):
                        constructor = standing.get('Constructor', {})
                        standings['constructor_standings'].append({
                            'position': int(standing.get('position', 0)),
                            'team_id': constructor.get('constructorId'),
                            'team_name': constructor.get('name'),
                            'points': float(standing.get('points', 0)),
                            'wins': int(standing.get('wins', 0))
                        })

            # Cache standings
            self.cache.cache_standings(season, standings)

            logger.info(f"Ingested standings for season {season}")
            return standings

    async def ingest_weather_forecast(self, race_id: str, circuit_location: str) -> Optional[Dict[str, Any]]:
        """Ingest weather forecast for a race location"""
        if not self.weather_api_key:
            logger.warning("Weather API key not configured")
            return None

        # Get race date from cache or database
        race_data = self.cache.get_race(2025, race_id)  # Simplified - you'd determine season dynamically
        if not race_data or not race_data.get('race_date'):
            return None

        url = f"{self.weather_base}/forecast.json"
        params = {
            'key': self.weather_api_key,
            'q': circuit_location,
            'dt': race_data['race_date'],
            'aqi': 'no'
        }

        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()

                        weather_data = {
                            'race_id': race_id,
                            'forecast_date': datetime.utcnow().isoformat(),
                            'temperature': data['forecast']['forecastday'][0]['day']['avgtemp_c'],
                            'humidity': data['forecast']['forecastday'][0]['day']['avghumidity'],
                            'wind_speed': data['forecast']['forecastday'][0]['day']['maxwind_kph'],
                            'precipitation_probability': data['forecast']['forecastday'][0]['day']['daily_chance_of_rain'],
                            'conditions': data['forecast']['forecastday'][0]['day']['condition']['text']
                        }

                        # Cache weather data
                        self.cache.cache_weather(race_id, weather_data)

                        logger.info(f"Ingested weather forecast for race {race_id}")
                        return weather_data

            except Exception as e:
                logger.error(f"Error fetching weather for {race_id}: {e}")

        return None

    async def full_season_sync(self, season: int = 2025) -> Dict[str, int]:
        """Perform a full synchronization of all season data"""
        logger.info(f"Starting full season sync for {season}")

        stats = {
            'drivers': 0,
            'teams': 0,
            'circuits': 0,
            'races': 0,
            'race_results': 0,
            'qualifying_results': 0
        }

        try:
            # Ingest basic data
            drivers = await self.ingest_drivers(season)
            teams = await self.ingest_teams(season)
            circuits = await self.ingest_circuits(season)
            races = await self.ingest_races(season)

            stats['drivers'] = len(drivers)
            stats['teams'] = len(teams)
            stats['circuits'] = len(circuits)
            stats['races'] = len(races)

            # Ingest results for completed races
            for race in races:
                if race.get('race_date'):
                    race_date = datetime.fromisoformat(race['race_date'])
                    if race_date < datetime.now():
                        # Race is completed, fetch results
                        race_results = await self.ingest_race_results(season, race['round'])
                        qualifying_results = await self.ingest_qualifying_results(season, race['round'])

                        stats['race_results'] += len(race_results)
                        stats['qualifying_results'] += len(qualifying_results)

            # Ingest current standings
            await self.ingest_standings(season)

            logger.info(f"Full season sync completed: {stats}")
            return stats

        except Exception as e:
            logger.error(f"Error during full season sync: {e}")
            raise

    async def incremental_sync(self) -> Dict[str, Any]:
        """Perform incremental sync of recent data"""
        logger.info("Starting incremental sync")

        # Determine what needs updating based on recent races
        current_date = datetime.now()
        recent_window = current_date - timedelta(days=7)  # Last 7 days

        # This would query database for races in the recent window
        # For now, sync current season standings and recent race results

        stats = await self.ingest_standings(2025)
        logger.info(f"Incremental sync completed")

        return {'standings_updated': True}


class F1DataPipeline:
    """Orchestrates data ingestion jobs"""

    def __init__(self, db_session: AsyncSession):
        self.ingestion = F1DataIngestion(db_session)
        self.db = db_session

    async def run_daily_job(self):
        """Daily data sync job"""
        logger.info("Starting daily F1 data job")

        try:
            # Incremental sync for current season
            await self.ingestion.incremental_sync()

            # Update weather forecasts for upcoming races
            # This would query for upcoming races and fetch weather

            # Log job completion
            await self._log_job_completion("daily_sync", "completed", records_processed=0)

        except Exception as e:
            logger.error(f"Daily job failed: {e}")
            await self._log_job_completion("daily_sync", "failed", errors_count=1, error_message=str(e))
            raise

    async def run_weekly_job(self):
        """Weekly full sync job"""
        logger.info("Starting weekly F1 data job")

        try:
            # Full season sync
            stats = await self.ingestion.full_season_sync(2025)
            total_records = sum(stats.values())

            await self._log_job_completion("weekly_sync", "completed", records_processed=total_records)

        except Exception as e:
            logger.error(f"Weekly job failed: {e}")
            await self._log_job_completion("weekly_sync", "failed", errors_count=1, error_message=str(e))
            raise

    async def _log_job_completion(self, job_name: str, status: str, **kwargs):
        """Log ETL job completion to database"""
        try:
            # This would insert into etl_jobs table
            log_data = {
                'job_name': job_name,
                'status': status,
                'last_run': datetime.utcnow(),
                **kwargs
            }

            # For now, just log to console
            logger.info(f"Job {job_name} {status}: {log_data}")

        except Exception as e:
            logger.error(f"Error logging job completion: {e}")