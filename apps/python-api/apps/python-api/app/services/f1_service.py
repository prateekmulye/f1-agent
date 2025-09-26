"""
F1 Service Layer - Business logic for F1 data operations
"""
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from sqlalchemy import select, desc, asc
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.f1_models import Driver, Team, Race, DriverStanding, ConstructorStanding
from app.schemas.f1_schemas import (
    DriverResponse, TeamResponse, RaceResponse,
    StandingsResponse, DriverStandingBase, ConstructorStandingBase
)
from app.services.data_loader import DataLoaderService


class F1Service:
    """Service for F1 data operations"""

    def __init__(self, db_session: AsyncSession):
        self.db = db_session
        self.data_loader = DataLoaderService(db_session)

    async def get_drivers(self, season: int = 2025) -> List[DriverResponse]:
        """Get all drivers for a season with JSON fallback"""
        return await self.data_loader.get_drivers_with_fallback(season)

    async def get_driver_by_id(self, driver_id: str, season: int = 2025) -> Optional[DriverResponse]:
        """Get a specific driver by ID"""
        query = select(Driver).where(Driver.id == driver_id, Driver.season == season)
        result = await self.db.execute(query)
        driver = result.scalar_one_or_none()

        if not driver:
            return None

        return DriverResponse(
            id=driver.id,
            code=driver.code,
            name=driver.name,
            constructor=driver.constructor,
            number=driver.number,
            nationality=driver.nationality,
            flag=driver.flag,
            constructorPoints=driver.constructor_points
        )

    async def get_teams(self, season: int = 2025) -> List[TeamResponse]:
        """Get all teams for a season with JSON fallback"""
        return await self.data_loader.get_teams_with_fallback(season)

    async def get_team_by_id(self, team_id: str, season: int = 2025) -> Optional[TeamResponse]:
        """Get a specific team by ID"""
        query = select(Team).where(Team.id == team_id, Team.season == season)
        result = await self.db.execute(query)
        team = result.scalar_one_or_none()

        if not team:
            return None

        return TeamResponse(
            id=team.id,
            name=team.name,
            position=team.position,
            points=team.points,
            driverCount=team.driver_count,
            drivers=team.drivers,
            driverCodes=team.driver_codes,
            colors=team.colors
        )

    async def get_races(self, season: int = 2025) -> List[RaceResponse]:
        """Get all races for a season with JSON fallback"""
        return await self.data_loader.get_races_with_fallback(season)

    async def get_race_by_id(self, race_id: str) -> Optional[RaceResponse]:
        """Get a specific race by ID"""
        query = select(Race).where(Race.id == race_id)
        result = await self.db.execute(query)
        race = result.scalar_one_or_none()

        if not race:
            return None

        return RaceResponse(
            id=race.id,
            name=race.name,
            season=race.season,
            round=race.round,
            date=race.date,
            country=race.country
        )

    async def get_driver_standings(self, season: int = 2025) -> List[DriverStandingBase]:
        """Get driver championship standings"""
        query = (
            select(DriverStanding, Driver)
            .join(Driver, DriverStanding.driver_id == Driver.id)
            .where(DriverStanding.season == season)
            .order_by(DriverStanding.position)
        )
        result = await self.db.execute(query)
        standings = result.all()

        return [
            DriverStandingBase(
                position=standing.position,
                driver_id=driver.id,
                driver_code=driver.code,
                driver_name=driver.name,
                number=driver.number,
                constructor=driver.constructor,
                points=standing.points,
                nationality=driver.nationality,
                flag=driver.flag,
                wins=standing.wins,
                podiums=standing.podiums,
                season=standing.season
            )
            for standing, driver in standings
        ]

    async def get_constructor_standings(self, season: int = 2025) -> List[ConstructorStandingBase]:
        """Get constructor championship standings"""
        query = (
            select(ConstructorStanding, Team)
            .join(Team, ConstructorStanding.team_id == Team.id)
            .where(ConstructorStanding.season == season)
            .order_by(ConstructorStanding.position)
        )
        result = await self.db.execute(query)
        standings = result.all()

        return [
            ConstructorStandingBase(
                position=standing.position,
                name=team.name,
                points=standing.points,
                driver_count=team.driver_count,
                drivers=team.drivers,
                driver_codes=team.driver_codes,
                driver_flags=team.driver_flags,
                wins=standing.wins,
                podiums=standing.podiums,
                colors=team.colors
            )
            for standing, team in standings
        ]

    async def get_standings(self, season: int = 2025) -> StandingsResponse:
        """Get combined driver and constructor standings"""
        drivers = await self.get_driver_standings(season)
        constructors = await self.get_constructor_standings(season)

        return StandingsResponse(
            year=season,
            last_updated=datetime.now(),
            drivers=drivers,
            constructors=constructors
        )

    async def create_driver(self, driver_data: Dict[str, Any]) -> Driver:
        """Create a new driver"""
        driver = Driver(**driver_data)
        self.db.add(driver)
        await self.db.commit()
        await self.db.refresh(driver)
        return driver

    async def update_driver(self, driver_id: str, driver_data: Dict[str, Any]) -> Optional[Driver]:
        """Update a driver"""
        query = select(Driver).where(Driver.id == driver_id)
        result = await self.db.execute(query)
        driver = result.scalar_one_or_none()

        if not driver:
            return None

        for key, value in driver_data.items():
            if hasattr(driver, key):
                setattr(driver, key, value)

        driver.updated_at = datetime.now()
        await self.db.commit()
        await self.db.refresh(driver)
        return driver

    async def delete_driver(self, driver_id: str) -> bool:
        """Delete a driver"""
        query = select(Driver).where(Driver.id == driver_id)
        result = await self.db.execute(query)
        driver = result.scalar_one_or_none()

        if not driver:
            return False

        await self.db.delete(driver)
        await self.db.commit()
        return True

    async def get_upcoming_races(self, limit: int = 5) -> List[RaceResponse]:
        """Get upcoming races"""
        query = (
            select(Race)
            .where(Race.date > datetime.now())
            .order_by(Race.date)
            .limit(limit)
        )
        result = await self.db.execute(query)
        races = result.scalars().all()

        return [
            RaceResponse(
                id=race.id,
                name=race.name,
                season=race.season,
                round=race.round,
                date=race.date,
                country=race.country
            )
            for race in races
        ]

    async def get_recent_races(self, limit: int = 5) -> List[RaceResponse]:
        """Get recently completed races"""
        query = (
            select(Race)
            .where(Race.date < datetime.now())
            .order_by(desc(Race.date))
            .limit(limit)
        )
        result = await self.db.execute(query)
        races = result.scalars().all()

        return [
            RaceResponse(
                id=race.id,
                name=race.name,
                season=race.season,
                round=race.round,
                date=race.date,
                country=race.country
            )
            for race in races
        ]