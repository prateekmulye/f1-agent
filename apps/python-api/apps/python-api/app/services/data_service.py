"""
Data Service - External API integration and data synchronization
"""
import asyncio
import aiohttp
from typing import List, Dict, Any, Optional
from datetime import datetime, date
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.f1_models import OpenF1Meeting, Driver, Team, Race
from app.schemas.f1_schemas import OpenF1MeetingsResponse, OpenF1Meeting as OpenF1MeetingSchema
from config.settings import settings


class DataService:
    """Service for external data integration and synchronization"""

    def __init__(self, db_session: AsyncSession):
        self.db = db_session
        self.openf1_base_url = settings.openf1_base_url

    async def fetch_openf1_meetings(self, year: int = 2025) -> OpenF1MeetingsResponse:
        """Fetch meetings data from OpenF1 API"""
        url = f"{self.openf1_base_url}/meetings"
        params = {"year": year}

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params, timeout=30) as response:
                    if response.status == 200:
                        data = await response.json()

                        # Transform and validate data
                        meetings = []
                        for meeting_data in data:
                            try:
                                # Parse dates
                                date_start = datetime.strptime(meeting_data["date_start"], "%Y-%m-%d").date()
                                date_end = datetime.strptime(meeting_data["date_end"], "%Y-%m-%d").date()

                                meeting = OpenF1MeetingSchema(
                                    meeting_key=str(meeting_data["meeting_key"]),
                                    year=meeting_data["year"],
                                    round_number=meeting_data["round_number"],
                                    meeting_name=meeting_data["meeting_name"],
                                    official_name=meeting_data.get("meeting_official_name"),
                                    country_key=str(meeting_data["country_key"]),
                                    country_name=meeting_data["country_name"],
                                    circuit_key=str(meeting_data.get("circuit_key")) if meeting_data.get("circuit_key") else None,
                                    circuit_short_name=meeting_data.get("circuit_short_name"),
                                    date_start=date_start,
                                    date_end=date_end,
                                    gmt_offset=meeting_data.get("gmt_offset"),
                                    location=meeting_data.get("location")
                                )
                                meetings.append(meeting)
                            except (KeyError, ValueError) as e:
                                print(f"Error parsing meeting data: {e}")
                                continue

                        await self._sync_meetings_to_db(meetings, year)

                        return OpenF1MeetingsResponse(
                            year=year,
                            count=len(meetings),
                            synced=True,
                            data=meetings
                        )
                    else:
                        print(f"OpenF1 API error: {response.status}")
                        return await self._get_cached_meetings(year)

        except asyncio.TimeoutError:
            print("OpenF1 API timeout - using cached data")
            return await self._get_cached_meetings(year)
        except Exception as e:
            print(f"OpenF1 API error: {e} - using cached data")
            return await self._get_cached_meetings(year)

    async def _sync_meetings_to_db(self, meetings: List[OpenF1MeetingSchema], year: int) -> None:
        """Sync meetings data to database"""
        try:
            # Delete existing data for the year
            await self.db.execute(delete(OpenF1Meeting).where(OpenF1Meeting.year == year))

            # Insert new data
            for meeting in meetings:
                db_meeting = OpenF1Meeting(
                    meeting_key=meeting.meeting_key,
                    year=meeting.year,
                    round_number=meeting.round_number,
                    meeting_name=meeting.meeting_name,
                    official_name=meeting.official_name,
                    country_key=meeting.country_key,
                    country_name=meeting.country_name,
                    circuit_key=meeting.circuit_key,
                    circuit_short_name=meeting.circuit_short_name,
                    date_start=meeting.date_start,
                    date_end=meeting.date_end,
                    gmt_offset=meeting.gmt_offset,
                    location=meeting.location,
                    synced_at=datetime.now()
                )
                self.db.add(db_meeting)

            await self.db.commit()
            print(f"✅ Synced {len(meetings)} meetings for {year}")

        except Exception as e:
            await self.db.rollback()
            print(f"❌ Error syncing meetings to database: {e}")

    async def _get_cached_meetings(self, year: int) -> OpenF1MeetingsResponse:
        """Get cached meetings from database"""
        query = select(OpenF1Meeting).where(OpenF1Meeting.year == year)
        result = await self.db.execute(query)
        cached_meetings = result.scalars().all()

        meetings = [
            OpenF1MeetingSchema(
                meeting_key=meeting.meeting_key,
                year=meeting.year,
                round_number=meeting.round_number,
                meeting_name=meeting.meeting_name,
                official_name=meeting.official_name,
                country_key=meeting.country_key,
                country_name=meeting.country_name,
                circuit_key=meeting.circuit_key,
                circuit_short_name=meeting.circuit_short_name,
                date_start=meeting.date_start,
                date_end=meeting.date_end,
                gmt_offset=meeting.gmt_offset,
                location=meeting.location
            )
            for meeting in cached_meetings
        ]

        return OpenF1MeetingsResponse(
            year=year,
            count=len(meetings),
            synced=False,
            data=meetings
        )

    async def sync_race_calendar(self, year: int = 2025) -> int:
        """Sync race calendar from OpenF1 meetings"""
        meetings_response = await self.fetch_openf1_meetings(year)

        races_created = 0
        for meeting in meetings_response.data:
            # Create race from meeting
            race_id = f"{year}_{meeting.country_key.lower()}"

            # Check if race already exists
            existing_race = await self.db.execute(
                select(Race).where(Race.id == race_id)
            )

            if existing_race.scalar_one_or_none() is None:
                race = Race(
                    id=race_id,
                    name=meeting.meeting_name,
                    season=year,
                    round=meeting.round_number,
                    date=datetime.combine(meeting.date_start, datetime.min.time()),
                    country=meeting.country_name,
                    circuit=meeting.circuit_short_name or meeting.location,
                    status="scheduled"
                )

                self.db.add(race)
                races_created += 1

        await self.db.commit()
        return races_created

    async def seed_2025_driver_data(self) -> int:
        """Seed 2025 F1 driver data"""
        drivers_data = [
            {"id": "verstappen", "code": "VER", "name": "Max Verstappen", "constructor": "Red Bull Racing", "number": 1, "nationality": "Dutch", "flag": "🇳🇱", "constructor_points": 589},
            {"id": "hamilton", "code": "HAM", "name": "Lewis Hamilton", "constructor": "Ferrari", "number": 44, "nationality": "British", "flag": "🇬🇧", "constructor_points": 425},
            {"id": "leclerc", "code": "LEC", "name": "Charles Leclerc", "constructor": "Ferrari", "number": 16, "nationality": "Monégasque", "flag": "🇲🇨", "constructor_points": 425},
            {"id": "russell", "code": "RUS", "name": "George Russell", "constructor": "Mercedes", "number": 63, "nationality": "British", "flag": "🇬🇧", "constructor_points": 382},
            {"id": "antonelli", "code": "ANT", "name": "Kimi Antonelli", "constructor": "Mercedes", "number": 12, "nationality": "Italian", "flag": "🇮🇹", "constructor_points": 382},
            {"id": "norris", "code": "NOR", "name": "Lando Norris", "constructor": "McLaren", "number": 4, "nationality": "British", "flag": "🇬🇧", "constructor_points": 608},
            {"id": "piastri", "code": "PIA", "name": "Oscar Piastri", "constructor": "McLaren", "number": 81, "nationality": "Australian", "flag": "🇦🇺", "constructor_points": 608},
            {"id": "sainz", "code": "SAI", "name": "Carlos Sainz", "constructor": "Williams", "number": 55, "nationality": "Spanish", "flag": "🇪🇸", "constructor_points": 17},
            {"id": "albon", "code": "ALB", "name": "Alex Albon", "constructor": "Williams", "number": 23, "nationality": "Thai", "flag": "🇹🇭", "constructor_points": 17},
            {"id": "perez", "code": "PER", "name": "Sergio Pérez", "constructor": "Red Bull Racing", "number": 11, "nationality": "Mexican", "flag": "🇲🇽", "constructor_points": 589},
            {"id": "alonso", "code": "ALO", "name": "Fernando Alonso", "constructor": "Aston Martin", "number": 14, "nationality": "Spanish", "flag": "🇪🇸", "constructor_points": 94},
            {"id": "stroll", "code": "STR", "name": "Lance Stroll", "constructor": "Aston Martin", "number": 18, "nationality": "Canadian", "flag": "🇨🇦", "constructor_points": 94},
            {"id": "gasly", "code": "GAS", "name": "Pierre Gasly", "constructor": "Alpine", "number": 10, "nationality": "French", "flag": "🇫🇷", "constructor_points": 65},
            {"id": "ocon", "code": "OCO", "name": "Esteban Ocon", "constructor": "Alpine", "number": 31, "nationality": "French", "flag": "🇫🇷", "constructor_points": 65},
            {"id": "tsunoda", "code": "TSU", "name": "Yuki Tsunoda", "constructor": "RB", "number": 22, "nationality": "Japanese", "flag": "🇯🇵", "constructor_points": 46},
            {"id": "lawson", "code": "LAW", "name": "Liam Lawson", "constructor": "RB", "number": 30, "nationality": "New Zealand", "flag": "🇳🇿", "constructor_points": 46},
            {"id": "bottas", "code": "BOT", "name": "Valtteri Bottas", "constructor": "Stake F1 Team", "number": 77, "nationality": "Finnish", "flag": "🇫🇮", "constructor_points": 0},
            {"id": "zhou", "code": "ZHO", "name": "Guanyu Zhou", "constructor": "Stake F1 Team", "number": 24, "nationality": "Chinese", "flag": "🇨🇳", "constructor_points": 0},
            {"id": "hulkenberg", "code": "HUL", "name": "Nico Hülkenberg", "constructor": "Haas F1 Team", "number": 27, "nationality": "German", "flag": "🇩🇪", "constructor_points": 58},
            {"id": "magnussen", "code": "MAG", "name": "Kevin Magnussen", "constructor": "Haas F1 Team", "number": 20, "nationality": "Danish", "flag": "🇩🇰", "constructor_points": 58}
        ]

        drivers_created = 0
        for driver_data in drivers_data:
            # Check if driver already exists
            existing_driver = await self.db.execute(
                select(Driver).where(Driver.id == driver_data["id"])
            )

            if existing_driver.scalar_one_or_none() is None:
                driver = Driver(**driver_data, season=2025)
                self.db.add(driver)
                drivers_created += 1

        await self.db.commit()
        return drivers_created

    async def seed_2025_team_data(self) -> int:
        """Seed 2025 F1 team data"""
        teams_data = [
            {
                "id": "mclaren", "name": "McLaren", "position": 1, "points": 608,
                "driver_count": 2, "drivers": ["Lando Norris", "Oscar Piastri"],
                "driver_codes": ["NOR", "PIA"], "driver_flags": ["🇬🇧", "🇦🇺"],
                "colors": {"main": "#FF8000", "light": "#FFB366", "dark": "#CC6600", "logo": "🧡"}
            },
            {
                "id": "red_bull", "name": "Red Bull Racing", "position": 2, "points": 589,
                "driver_count": 2, "drivers": ["Max Verstappen", "Sergio Pérez"],
                "driver_codes": ["VER", "PER"], "driver_flags": ["🇳🇱", "🇲🇽"],
                "colors": {"main": "#3671C6", "light": "#5A8CD9", "dark": "#2B5AA0", "logo": "🐂"}
            },
            {
                "id": "ferrari", "name": "Ferrari", "position": 3, "points": 425,
                "driver_count": 2, "drivers": ["Lewis Hamilton", "Charles Leclerc"],
                "driver_codes": ["HAM", "LEC"], "driver_flags": ["🇬🇧", "🇲🇨"],
                "colors": {"main": "#E8002D", "light": "#EC4D70", "dark": "#BA0024", "logo": "🐎"}
            },
            {
                "id": "mercedes", "name": "Mercedes", "position": 4, "points": 382,
                "driver_count": 2, "drivers": ["George Russell", "Kimi Antonelli"],
                "driver_codes": ["RUS", "ANT"], "driver_flags": ["🇬🇧", "🇮🇹"],
                "colors": {"main": "#27F4D2", "light": "#5CF7DD", "dark": "#1FC3A8", "logo": "⭐"}
            },
            {
                "id": "aston_martin", "name": "Aston Martin", "position": 5, "points": 94,
                "driver_count": 2, "drivers": ["Fernando Alonso", "Lance Stroll"],
                "driver_codes": ["ALO", "STR"], "driver_flags": ["🇪🇸", "🇨🇦"],
                "colors": {"main": "#229971", "light": "#4BAF8A", "dark": "#1B7A5A", "logo": "💚"}
            }
        ]

        teams_created = 0
        for team_data in teams_data:
            # Check if team already exists
            existing_team = await self.db.execute(
                select(Team).where(Team.id == team_data["id"])
            )

            if existing_team.scalar_one_or_none() is None:
                team = Team(**team_data, season=2025)
                self.db.add(team)
                teams_created += 1

        await self.db.commit()
        return teams_created

    async def check_data_freshness(self) -> Dict[str, Any]:
        """Check the freshness of cached data"""
        # Check drivers
        driver_count = await self.db.execute(select(Driver).where(Driver.season == 2025))
        driver_total = len(driver_count.scalars().all())

        # Check teams
        team_count = await self.db.execute(select(Team).where(Team.season == 2025))
        team_total = len(team_count.scalars().all())

        # Check races
        race_count = await self.db.execute(select(Race).where(Race.season == 2025))
        race_total = len(race_count.scalars().all())

        # Check OpenF1 meetings
        meetings_count = await self.db.execute(select(OpenF1Meeting).where(OpenF1Meeting.year == 2025))
        meetings_total = len(meetings_count.scalars().all())

        return {
            "drivers": {"count": driver_total, "expected": 20, "fresh": driver_total >= 20},
            "teams": {"count": team_total, "expected": 10, "fresh": team_total >= 5},
            "races": {"count": race_total, "expected": 24, "fresh": race_total >= 20},
            "meetings": {"count": meetings_total, "expected": 24, "fresh": meetings_total >= 20},
            "last_checked": datetime.now().isoformat()
        }

    async def refresh_all_data(self) -> Dict[str, int]:
        """Refresh all data from external sources"""
        results = {}

        # Sync meetings and races
        await self.fetch_openf1_meetings(2025)
        results["races_synced"] = await self.sync_race_calendar(2025)

        # Seed base data
        results["drivers_created"] = await self.seed_2025_driver_data()
        results["teams_created"] = await self.seed_2025_team_data()

        return results