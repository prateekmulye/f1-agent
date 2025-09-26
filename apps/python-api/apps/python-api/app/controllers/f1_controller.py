"""
F1 Controller - API endpoints for F1 data
"""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.f1_service import F1Service
from app.schemas.f1_schemas import (
    DriverResponse, TeamResponse, RaceResponse,
    StandingsResponse, ErrorResponse
)
from config.database import get_database
from app.middleware.rate_limiting import apply_rate_limit

f1_router = APIRouter(prefix="/api/v1", tags=["F1 Data"])


async def get_f1_service(db: AsyncSession = Depends(get_database)) -> F1Service:
    """Get F1 service instance"""
    return F1Service(db)


@f1_router.get(
    "/drivers",
    response_model=List[DriverResponse],
    summary="Get all F1 drivers",
    description="Retrieve all F1 drivers for a specific season"
)
@apply_rate_limit("data")
async def get_drivers(
    season: int = Query(2025, description="Season year", ge=2020, le=2030),
    f1_service: F1Service = Depends(get_f1_service)
):
    """Get all F1 drivers for a season"""
    try:
        drivers = await f1_service.get_drivers(season)
        return drivers
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving drivers: {str(e)}")


@f1_router.get(
    "/drivers/{driver_id}",
    response_model=DriverResponse,
    summary="Get driver by ID",
    description="Retrieve a specific F1 driver by their ID"
)
@apply_rate_limit("data")
async def get_driver(
    driver_id: str,
    season: int = Query(2025, description="Season year", ge=2020, le=2030),
    f1_service: F1Service = Depends(get_f1_service)
):
    """Get a specific driver by ID"""
    try:
        driver = await f1_service.get_driver_by_id(driver_id, season)
        if not driver:
            raise HTTPException(status_code=404, detail="Driver not found")
        return driver
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving driver: {str(e)}")


@f1_router.get(
    "/teams",
    response_model=List[TeamResponse],
    summary="Get all F1 teams",
    description="Retrieve all F1 teams/constructors for a specific season"
)
@apply_rate_limit("data")
async def get_teams(
    season: int = Query(2025, description="Season year", ge=2020, le=2030),
    f1_service: F1Service = Depends(get_f1_service)
):
    """Get all F1 teams for a season"""
    try:
        teams = await f1_service.get_teams(season)
        return teams
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving teams: {str(e)}")


@f1_router.get(
    "/teams/{team_id}",
    response_model=TeamResponse,
    summary="Get team by ID",
    description="Retrieve a specific F1 team by their ID"
)
@apply_rate_limit("data")
async def get_team(
    team_id: str,
    season: int = Query(2025, description="Season year", ge=2020, le=2030),
    f1_service: F1Service = Depends(get_f1_service)
):
    """Get a specific team by ID"""
    try:
        team = await f1_service.get_team_by_id(team_id, season)
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        return team
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving team: {str(e)}")


@f1_router.get(
    "/races",
    response_model=List[RaceResponse],
    summary="Get all races",
    description="Retrieve all races for a specific season"
)
@apply_rate_limit("data")
async def get_races(
    season: int = Query(2025, description="Season year", ge=2020, le=2030),
    f1_service: F1Service = Depends(get_f1_service)
):
    """Get all races for a season"""
    try:
        races = await f1_service.get_races(season)
        return races
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving races: {str(e)}")


@f1_router.get(
    "/races/{race_id}",
    response_model=RaceResponse,
    summary="Get race by ID",
    description="Retrieve a specific race by ID"
)
@apply_rate_limit("data")
async def get_race(
    race_id: str,
    f1_service: F1Service = Depends(get_f1_service)
):
    """Get a specific race by ID"""
    try:
        race = await f1_service.get_race_by_id(race_id)
        if not race:
            raise HTTPException(status_code=404, detail="Race not found")
        return race
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving race: {str(e)}")


@f1_router.get(
    "/standings",
    response_model=StandingsResponse,
    summary="Get championship standings",
    description="Retrieve both driver and constructor championship standings"
)
@apply_rate_limit("data")
async def get_standings(
    season: int = Query(2025, description="Season year", ge=2020, le=2030),
    f1_service: F1Service = Depends(get_f1_service)
):
    """Get combined championship standings"""
    try:
        standings = await f1_service.get_standings(season)
        return standings
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving standings: {str(e)}")


@f1_router.get(
    "/races/upcoming",
    response_model=List[RaceResponse],
    summary="Get upcoming races",
    description="Retrieve upcoming races in chronological order"
)
@apply_rate_limit("data")
async def get_upcoming_races(
    limit: int = Query(5, description="Maximum number of races", ge=1, le=20),
    f1_service: F1Service = Depends(get_f1_service)
):
    """Get upcoming races"""
    try:
        races = await f1_service.get_upcoming_races(limit)
        return races
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving upcoming races: {str(e)}")


@f1_router.get(
    "/races/recent",
    response_model=List[RaceResponse],
    summary="Get recent races",
    description="Retrieve recently completed races in reverse chronological order"
)
@apply_rate_limit("data")
async def get_recent_races(
    limit: int = Query(5, description="Maximum number of races", ge=1, le=20),
    f1_service: F1Service = Depends(get_f1_service)
):
    """Get recent races"""
    try:
        races = await f1_service.get_recent_races(limit)
        return races
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving recent races: {str(e)}")


# Error handlers are handled in main.py at the application level


# Exception handlers removed - handled at application level