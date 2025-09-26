"""
Data Loader Service - Load JSON data into database and provide fallback
"""
import json
import os
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.f1_models import Driver, Team, Race
from app.schemas.f1_schemas import DriverResponse, TeamResponse, RaceResponse


class DataLoaderService:
    """Service for loading data from JSON files and database operations"""

    def __init__(self, db_session: AsyncSession):
        self.db = db_session
        self.data_dir = os.path.join(os.path.dirname(__file__), "../../../../data")

    def _load_json_file(self, filename: str) -> List[Dict[str, Any]]:
        """Load data from JSON file"""
        file_path = os.path.join(self.data_dir, filename)

        if not os.path.exists(file_path):
            return []

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading {filename}: {e}")
            return []

    async def get_drivers_with_fallback(self, season: int = 2025) -> List[DriverResponse]:
        """Get drivers from database, fallback to JSON if empty"""
        # First try database
        try:
            query = select(Driver).where(Driver.season == season)
            result = await self.db.execute(query)
            drivers_db = result.scalars().all()

            if drivers_db:
                return [
                    DriverResponse(
                        id=driver.id,
                        code=driver.code,
                        name=driver.name,
                        constructor=driver.constructor,
                        number=driver.number,
                        nationality=driver.nationality,
                        flag=driver.flag,
                        constructorPoints=driver.constructor_points
                    )
                    for driver in drivers_db
                ]
        except Exception as e:
            print(f"Database error, falling back to JSON: {e}")

        # Fallback to JSON
        drivers_json = self._load_json_file("drivers.json")
        return [
            DriverResponse(
                id=driver["id"],
                code=driver["code"],
                name=driver["name"],
                constructor=driver["constructor"],
                number=driver["number"],
                nationality=driver["nationality"],
                flag=driver["flag"],
                constructorPoints=driver["constructorPoints"]
            )
            for driver in drivers_json
        ]

    async def get_teams_with_fallback(self, season: int = 2025) -> List[TeamResponse]:
        """Get teams from database, fallback to JSON if empty"""
        # First try database
        try:
            query = select(Team).where(Team.season == season)
            result = await self.db.execute(query)
            teams_db = result.scalars().all()

            if teams_db:
                return [
                    TeamResponse(
                        id=team.id,
                        name=team.name,
                        position=team.position,
                        points=team.points,
                        driverCount=team.driver_count,
                        drivers=team.drivers,
                        driverCodes=team.driver_codes,
                        colors=team.colors
                    )
                    for team in teams_db
                ]
        except Exception as e:
            print(f"Database error, falling back to team generation: {e}")

        # Generate teams from drivers JSON as fallback
        drivers_json = self._load_json_file("drivers.json")
        teams_dict = {}

        for driver in drivers_json:
            constructor = driver["constructor"]
            if constructor not in teams_dict:
                teams_dict[constructor] = {
                    "id": constructor.lower().replace(" ", "_"),
                    "name": constructor,
                    "position": len(teams_dict) + 1,
                    "points": driver["constructorPoints"],
                    "driverCount": 0,
                    "drivers": [],
                    "driverCodes": [],
                    "colors": self._get_team_colors(constructor)
                }

            teams_dict[constructor]["drivers"].append(driver["name"])
            teams_dict[constructor]["driverCodes"].append(driver["code"])
            teams_dict[constructor]["driverCount"] += 1

        return [
            TeamResponse(**team_data)
            for team_data in teams_dict.values()
        ]

    async def get_races_with_fallback(self, season: int = 2025) -> List[RaceResponse]:
        """Get races from database, fallback to JSON if empty"""
        # First try database
        try:
            query = select(Race).where(Race.season == season)
            result = await self.db.execute(query)
            races_db = result.scalars().all()

            if races_db:
                return [
                    RaceResponse(
                        id=race.id,
                        name=race.name,
                        season=race.season,
                        round=race.round,
                        date=race.date,
                        country=race.country
                    )
                    for race in races_db
                ]
        except Exception as e:
            print(f"Database error, falling back to JSON: {e}")

        # Fallback to JSON
        races_json = self._load_json_file("races.json")
        return [
            RaceResponse(
                id=race["id"],
                name=race["name"],
                season=race["season"],
                round=race["round"],
                date=datetime.fromisoformat(race["date"]) if isinstance(race["date"], str) else race["date"],
                country=race["country"]
            )
            for race in races_json
            if race["season"] == season
        ]

    async def load_drivers_to_db(self) -> int:
        """Load drivers from JSON to database"""
        drivers_json = self._load_json_file("drivers.json")
        loaded_count = 0

        for driver_data in drivers_json:
            try:
                # Check if driver already exists
                query = select(Driver).where(Driver.id == driver_data["id"])
                result = await self.db.execute(query)
                existing = result.scalar_one_or_none()

                if not existing:
                    driver = Driver(
                        id=driver_data["id"],
                        code=driver_data["code"],
                        name=driver_data["name"],
                        constructor=driver_data["constructor"],
                        number=driver_data["number"],
                        nationality=driver_data["nationality"],
                        flag=driver_data["flag"],
                        constructor_points=driver_data["constructorPoints"],
                        season=2025
                    )
                    self.db.add(driver)
                    loaded_count += 1

            except Exception as e:
                print(f"Error loading driver {driver_data.get('id')}: {e}")

        try:
            await self.db.commit()
        except Exception as e:
            print(f"Error committing drivers: {e}")
            await self.db.rollback()

        return loaded_count

    async def load_races_to_db(self) -> int:
        """Load races from JSON to database"""
        races_json = self._load_json_file("races.json")
        loaded_count = 0

        for race_data in races_json:
            try:
                # Check if race already exists
                query = select(Race).where(Race.id == race_data["id"])
                result = await self.db.execute(query)
                existing = result.scalar_one_or_none()

                if not existing:
                    race = Race(
                        id=race_data["id"],
                        name=race_data["name"],
                        season=race_data["season"],
                        round=race_data["round"],
                        date=datetime.fromisoformat(race_data["date"]) if isinstance(race_data["date"], str) else race_data["date"],
                        country=race_data["country"],
                        circuit=race_data.get("circuit", ""),
                        status="scheduled"
                    )
                    self.db.add(race)
                    loaded_count += 1

            except Exception as e:
                print(f"Error loading race {race_data.get('id')}: {e}")

        try:
            await self.db.commit()
        except Exception as e:
            print(f"Error committing races: {e}")
            await self.db.rollback()

        return loaded_count

    def _get_team_colors(self, team_name: str) -> Dict[str, str]:
        """Get team colors based on team name"""
        colors = {
            "Red Bull Racing": {"primary": "#3671C6", "secondary": "#DC143C"},
            "Ferrari": {"primary": "#E8002D", "secondary": "#FFF200"},
            "Mercedes": {"primary": "#27F4D2", "secondary": "#000000"},
            "McLaren": {"primary": "#FF8000", "secondary": "#000000"},
            "Aston Martin": {"primary": "#229971", "secondary": "#000000"},
            "Alpine": {"primary": "#0093CC", "secondary": "#FF1801"},
            "Williams": {"primary": "#64C4FF", "secondary": "#000000"},
            "AlphaTauri": {"primary": "#5E8FAA", "secondary": "#000000"},
            "Alfa Romeo": {"primary": "#C92D4B", "secondary": "#000000"},
            "Haas F1 Team": {"primary": "#B6BABD", "secondary": "#FF0000"}
        }
        return colors.get(team_name, {"primary": "#000000", "secondary": "#FFFFFF"})