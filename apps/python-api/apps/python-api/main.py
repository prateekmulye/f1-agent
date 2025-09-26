"""
F1 API - FastAPI application with MVC architecture
"""
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import uvicorn

# Import configurations
from config.settings import settings
from config.database import db_manager

# Import controllers
from app.controllers import (
    f1_router,
    auth_router,
    prediction_router,
    data_router,
    health_router
)

# Import middleware
from app.middleware.rate_limiting import RateLimitingMiddleware, rate_limit_handler
from slowapi.errors import RateLimitExceeded


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    print("🚀 Starting F1 API application...")
    try:
        await db_manager.connect()
        await db_manager.create_connection_pool()
        print("✅ Application startup complete")
    except Exception as e:
        print(f"❌ Application startup failed: {e}")
        raise

    yield

    # Shutdown
    print("🛑 Shutting down F1 API application...")
    try:
        await db_manager.disconnect()
        print("✅ Application shutdown complete")
    except Exception as e:
        print(f"❌ Application shutdown error: {e}")


# Create FastAPI application
app = FastAPI(
    title="F1 Racing API",
    description="Formula 1 data API with predictions, standings, and real-time race information",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"] if settings.debug else ["localhost", "127.0.0.1"]
)

# Add rate limiting middleware
rate_limiting_middleware = RateLimitingMiddleware()
app.middleware("http")(rate_limiting_middleware)

# Add exception handlers
app.add_exception_handler(RateLimitExceeded, rate_limit_handler)


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Global HTTP exception handler"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "message": exc.detail,
                "code": f"HTTP_{exc.status_code}",
                "path": str(request.url)
            }
        }
    )


@app.exception_handler(500)
async def internal_server_error_handler(request, exc):
    """Global server error handler"""
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "message": "Internal server error",
                "code": "INTERNAL_ERROR",
                "path": str(request.url)
            }
        }
    )


# Include routers
app.include_router(health_router)
app.include_router(f1_router)
app.include_router(auth_router)
app.include_router(prediction_router)
app.include_router(data_router)


# Root endpoint
@app.get(
    "/",
    summary="API Root",
    description="Welcome endpoint with API information"
)
async def root():
    """API root endpoint"""
    return {
        "message": "Welcome to F1 Racing API",
        "version": "1.0.0",
        "documentation": "/docs",
        "health_check": "/api/v1/health",
        "endpoints": {
            "drivers": "/api/v1/drivers",
            "teams": "/api/v1/teams",
            "races": "/api/v1/races",
            "predictions": "/api/v1/predictions",
            "standings": "/api/v1/standings",
            "auth": "/api/v1/auth",
            "data": "/api/v1/data"
        }
    }


# Development server configuration
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="info" if settings.debug else "warning"
    )