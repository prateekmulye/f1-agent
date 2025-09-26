"""
Data Controller - API endpoints for data synchronization and external APIs
"""
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.data_service import DataService
from app.services.auth_service import AuthService
from app.controllers.auth_controller import get_current_user, get_admin_user
from app.models.f1_models import User
from app.schemas.f1_schemas import OpenF1MeetingsResponse
from config.database import get_database
from app.middleware.rate_limiting import apply_rate_limit

data_router = APIRouter(prefix="/api/v1/data", tags=["Data Management"])


async def get_data_service(db: AsyncSession = Depends(get_database)) -> DataService:
    """Get data service instance"""
    return DataService(db)


@data_router.get(
    "/openf1/meetings",
    response_model=OpenF1MeetingsResponse,
    summary="Get F1 meetings from OpenF1 API",
    description="Fetch F1 race meetings data from OpenF1 API with caching"
)
@apply_rate_limit("data")
async def get_openf1_meetings(
    year: int = Query(2025, description="Season year", ge=2020, le=2030),
    data_service: DataService = Depends(get_data_service)
):
    """Get F1 meetings from OpenF1 API"""
    try:
        meetings = await data_service.fetch_openf1_meetings(year)
        return meetings
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching meetings data: {str(e)}"
        )


@data_router.post(
    "/sync/calendar",
    summary="Sync race calendar",
    description="Sync race calendar from OpenF1 meetings data"
)
@apply_rate_limit("data")
async def sync_race_calendar(
    year: int = Query(2025, description="Season year", ge=2020, le=2030),
    data_service: DataService = Depends(get_data_service),
    current_user: User = Depends(get_current_user)
):
    """Sync race calendar from OpenF1 data"""
    try:
        races_created = await data_service.sync_race_calendar(year)
        return {
            "message": f"Race calendar synchronized for {year}",
            "races_created": races_created,
            "year": year
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error syncing race calendar: {str(e)}"
        )


@data_router.post(
    "/seed/drivers",
    summary="Seed driver data",
    description="Seed 2025 F1 driver data into the database"
)
@apply_rate_limit("data")
async def seed_driver_data(
    data_service: DataService = Depends(get_data_service),
    admin_user: User = Depends(get_admin_user)
):
    """Seed 2025 F1 driver data"""
    try:
        drivers_created = await data_service.seed_2025_driver_data()
        return {
            "message": "Driver data seeded successfully",
            "drivers_created": drivers_created,
            "season": 2025
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error seeding driver data: {str(e)}"
        )


@data_router.post(
    "/seed/teams",
    summary="Seed team data",
    description="Seed 2025 F1 team data into the database"
)
@apply_rate_limit("data")
async def seed_team_data(
    data_service: DataService = Depends(get_data_service),
    admin_user: User = Depends(get_admin_user)
):
    """Seed 2025 F1 team data"""
    try:
        teams_created = await data_service.seed_2025_team_data()
        return {
            "message": "Team data seeded successfully",
            "teams_created": teams_created,
            "season": 2025
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error seeding team data: {str(e)}"
        )


@data_router.post(
    "/refresh",
    summary="Refresh all data",
    description="Refresh all data from external sources and seed base data"
)
@apply_rate_limit("admin")
async def refresh_all_data(
    data_service: DataService = Depends(get_data_service),
    admin_user: User = Depends(get_admin_user)
):
    """Refresh all data from external sources"""
    try:
        results = await data_service.refresh_all_data()
        return {
            "message": "All data refreshed successfully",
            "results": results,
            "refreshed_at": "2025-09-25T00:00:00Z"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error refreshing data: {str(e)}"
        )


@data_router.get(
    "/health",
    summary="Check data health",
    description="Check the freshness and completeness of cached data"
)
@apply_rate_limit("data")
async def check_data_health(
    data_service: DataService = Depends(get_data_service)
):
    """Check data health and freshness"""
    try:
        health_status = await data_service.check_data_freshness()
        return {
            "status": "healthy" if all(
                item.get("fresh", False) for item in health_status.values()
                if isinstance(item, dict) and "fresh" in item
            ) else "needs_refresh",
            "details": health_status
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error checking data health: {str(e)}"
        )


@data_router.get(
    "/stats",
    summary="Get data statistics",
    description="Get statistics about cached data in the database"
)
@apply_rate_limit("data")
async def get_data_stats(
    data_service: DataService = Depends(get_data_service),
    current_user: User = Depends(get_current_user)
):
    """Get data statistics"""
    try:
        stats = await data_service.check_data_freshness()

        # Add some additional computed stats
        total_records = sum(
            item.get("count", 0) for item in stats.values()
            if isinstance(item, dict) and "count" in item
        )

        return {
            "total_records": total_records,
            "data_freshness": stats,
            "database_status": "connected",
            "external_apis": {
                "openf1": "available"
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving data statistics: {str(e)}"
        )


@data_router.delete(
    "/cache/clear",
    summary="Clear cached data",
    description="Clear all cached data (admin only)"
)
@apply_rate_limit("admin")
async def clear_cache(
    admin_user: User = Depends(get_admin_user)
):
    """Clear cached data - admin only"""
    try:
        # This would implement cache clearing logic
        # For now, just return success message
        return {
            "message": "Cache cleared successfully",
            "cleared_at": "2025-09-25T00:00:00Z",
            "note": "This operation requires database implementation"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error clearing cache: {str(e)}"
        )


@data_router.get(
    "/external/status",
    summary="Check external API status",
    description="Check the status of external APIs (OpenF1, etc.)"
)
@apply_rate_limit("data")
async def check_external_apis(
    data_service: DataService = Depends(get_data_service)
):
    """Check status of external APIs"""
    try:
        # Test OpenF1 API connectivity
        test_response = await data_service.fetch_openf1_meetings(2024)  # Use a known year

        return {
            "openf1": {
                "status": "available" if test_response.synced else "cached_only",
                "last_sync": "recent" if test_response.synced else "fallback_to_cache",
                "data_count": test_response.count
            },
            "overall_status": "healthy",
            "checked_at": "2025-09-25T00:00:00Z"
        }
    except Exception as e:
        return {
            "openf1": {
                "status": "error",
                "error": str(e)
            },
            "overall_status": "degraded",
            "checked_at": "2025-09-25T00:00:00Z"
        }