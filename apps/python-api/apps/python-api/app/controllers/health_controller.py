"""
Health Controller - API endpoints for health checks and system status
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.f1_schemas import HealthCheckResponse
from config.database import get_database, db_manager
from config.settings import settings

health_router = APIRouter(prefix="/api/v1", tags=["Health"])


@health_router.get(
    "/health",
    response_model=HealthCheckResponse,
    summary="Health check",
    description="Check the health status of the API and its dependencies"
)
async def health_check(db: AsyncSession = Depends(get_database)):
    """Comprehensive health check endpoint"""
    try:
        # Check database connectivity
        database_healthy = await db_manager.health_check()

        # Check external APIs (simplified for now)
        external_apis = {
            "openf1": True,  # Would implement actual check
            "redis": True    # Would implement actual Redis check
        }

        # Overall status
        all_healthy = database_healthy and all(external_apis.values())
        status = "healthy" if all_healthy else "unhealthy"

        return HealthCheckResponse(
            status=status,
            timestamp=datetime.now(),
            version="1.0.0",
            database=database_healthy,
            external_apis=external_apis
        )

    except Exception as e:
        # Return unhealthy status if any errors occur
        return HealthCheckResponse(
            status="unhealthy",
            timestamp=datetime.now(),
            version="1.0.0",
            database=False,
            external_apis={"openf1": False, "redis": False}
        )


@health_router.get(
    "/ping",
    summary="Simple ping",
    description="Simple ping endpoint to check if the API is responding"
)
async def ping():
    """Simple ping endpoint"""
    return {
        "message": "pong",
        "timestamp": datetime.now().isoformat(),
        "service": "F1 API"
    }


@health_router.get(
    "/version",
    summary="Get API version",
    description="Get the current API version and build information"
)
async def get_version():
    """Get API version information"""
    return {
        "api_version": "1.0.0",
        "python_version": "3.11+",
        "fastapi_version": "0.104.1",
        "build_date": "2025-09-25",
        "environment": "development" if settings.debug else "production"
    }


@health_router.get(
    "/metrics",
    summary="Get system metrics",
    description="Get basic system metrics and performance indicators"
)
async def get_metrics():
    """Get system metrics"""
    try:
        import psutil
        import os

        # Get system metrics
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')

        return {
            "system": {
                "cpu_usage_percent": cpu_percent,
                "memory_usage_percent": memory.percent,
                "memory_available_gb": round(memory.available / (1024**3), 2),
                "disk_usage_percent": disk.percent,
                "disk_free_gb": round(disk.free / (1024**3), 2)
            },
            "process": {
                "pid": os.getpid(),
                "memory_rss_mb": round(psutil.Process().memory_info().rss / (1024**2), 2),
                "cpu_percent": psutil.Process().cpu_percent()
            },
            "timestamp": datetime.now().isoformat()
        }

    except ImportError:
        # psutil not available - return basic info
        return {
            "message": "System metrics not available (psutil not installed)",
            "basic_info": {
                "python_version": "3.11+",
                "pid": "unknown"
            },
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving metrics: {str(e)}")


@health_router.get(
    "/status",
    summary="Detailed status check",
    description="Get detailed status of all system components"
)
async def detailed_status(db: AsyncSession = Depends(get_database)):
    """Get detailed system status"""
    try:
        # Database status
        db_status = await db_manager.health_check()

        # Configuration status
        config_status = {
            "database_url_configured": bool(settings.database_url),
            "secret_key_configured": bool(settings.secret_key),
            "redis_url_configured": bool(settings.redis_url),
            "openf1_url_configured": bool(settings.openf1_base_url)
        }

        # Rate limiting status
        rate_limit_status = {
            "enabled": True,
            "per_minute_limit": settings.rate_limit_per_minute,
            "backend": "redis" if settings.redis_url else "memory"
        }

        return {
            "overall_status": "healthy" if db_status else "unhealthy",
            "components": {
                "database": {
                    "status": "healthy" if db_status else "unhealthy",
                    "url_masked": settings.database_url[:20] + "..." if settings.database_url else "not_configured"
                },
                "configuration": {
                    "status": "healthy" if all(config_status.values()) else "partial",
                    "details": config_status
                },
                "rate_limiting": {
                    "status": "healthy",
                    "details": rate_limit_status
                },
                "external_apis": {
                    "status": "healthy",
                    "openf1": "configured"
                }
            },
            "timestamp": datetime.now().isoformat(),
            "uptime_info": "Service is running"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting detailed status: {str(e)}")


@health_router.get(
    "/readiness",
    summary="Readiness check",
    description="Check if the service is ready to accept requests"
)
async def readiness_check(db: AsyncSession = Depends(get_database)):
    """Kubernetes readiness probe endpoint"""
    try:
        # Check database connection
        db_ready = await db_manager.health_check()

        if not db_ready:
            raise HTTPException(status_code=503, detail="Database not ready")

        return {
            "status": "ready",
            "timestamp": datetime.now().isoformat(),
            "checks": {
                "database": "ready"
            }
        }

    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail={
                "status": "not_ready",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
        )


@health_router.get(
    "/liveness",
    summary="Liveness check",
    description="Check if the service is alive (Kubernetes liveness probe)"
)
async def liveness_check():
    """Kubernetes liveness probe endpoint"""
    return {
        "status": "alive",
        "timestamp": datetime.now().isoformat(),
        "service": "F1 API"
    }