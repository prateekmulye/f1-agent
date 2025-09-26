"""
Test configuration and fixtures for F1 API
"""
import asyncio
from typing import AsyncGenerator, Generator
import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from httpx import AsyncClient
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Test environment setup
import os
os.environ["TESTING"] = "true"
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
os.environ["SECRET_KEY"] = "test-secret-key-for-testing-only"
os.environ["REDIS_URL"] = "redis://localhost:6379"

from main import app
from config.database import get_database, Base
from config.settings import settings


# Database fixtures
@pytest_asyncio.fixture
async def async_engine():
    """Create async test database engine"""
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    await engine.dispose()


@pytest_asyncio.fixture
async def async_session(async_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create async test database session"""
    async_session_maker = sessionmaker(
        async_engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session_maker() as session:
        yield session


@pytest.fixture
def override_get_database(async_session: AsyncSession):
    """Override database dependency for testing"""
    async def _get_test_database():
        yield async_session
    
    app.dependency_overrides[get_database] = _get_test_database
    yield
    app.dependency_overrides.clear()


# HTTP Client fixtures
@pytest.fixture
def client(override_get_database) -> Generator[TestClient, None, None]:
    """Create test client"""
    with TestClient(app) as test_client:
        yield test_client


@pytest_asyncio.fixture
async def async_client(override_get_database) -> AsyncGenerator[AsyncClient, None]:
    """Create async test client"""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


# Authentication fixtures
@pytest_asyncio.fixture
async def test_user(async_session: AsyncSession):
    """Create test user"""
    from app.models.f1_models import User
    from app.services.auth_service import AuthService
    
    auth_service = AuthService(async_session)
    user = await auth_service.create_user(
        username="testuser",
        email="test@example.com",
        password="testpassword123"
    )
    return user


@pytest_asyncio.fixture
async def auth_headers(test_user, async_session: AsyncSession):
    """Create authentication headers for test user"""
    from app.services.auth_service import AuthService
    
    auth_service = AuthService(async_session)
    token = auth_service.create_access_token(data={"sub": test_user.username})
    
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def admin_user(async_session: AsyncSession):
    """Create test admin user"""
    from app.models.f1_models import User
    from app.services.auth_service import AuthService
    
    auth_service = AuthService(async_session)
    user = await auth_service.create_user(
        username="admin",
        email="admin@example.com",
        password="adminpassword123"
    )
    user.is_admin = True
    await async_session.commit()
    return user


@pytest_asyncio.fixture
async def admin_headers(admin_user, async_session: AsyncSession):
    """Create admin authentication headers"""
    from app.services.auth_service import AuthService
    
    auth_service = AuthService(async_session)
    token = auth_service.create_access_token(data={"sub": admin_user.username})
    
    return {"Authorization": f"Bearer {token}"}


# F1 Data fixtures
@pytest_asyncio.fixture
async def sample_drivers(async_session: AsyncSession):
    """Create sample F1 drivers for testing"""
    from app.models.f1_models import Driver
    
    drivers_data = [
        {
            "id": "verstappen",
            "code": "VER",
            "name": "Max Verstappen",
            "constructor": "Red Bull Racing",
            "number": 1,
            "nationality": "Dutch",
            "flag": "🇳🇱",
            "constructor_points": 589,
            "season": 2025
        },
        {
            "id": "hamilton",
            "code": "HAM",
            "name": "Lewis Hamilton",
            "constructor": "Ferrari",
            "number": 44,
            "nationality": "British",
            "flag": "🇬🇧",
            "constructor_points": 425,
            "season": 2025
        }
    ]
    
    drivers = []
    for driver_data in drivers_data:
        driver = Driver(**driver_data)
        async_session.add(driver)
        drivers.append(driver)
    
    await async_session.commit()
    return drivers


@pytest_asyncio.fixture
async def sample_teams(async_session: AsyncSession):
    """Create sample F1 teams for testing"""
    from app.models.f1_models import Team
    
    teams_data = [
        {
            "id": "red_bull",
            "name": "Red Bull Racing",
            "position": 1,
            "points": 589,
            "driver_count": 2,
            "drivers": ["Max Verstappen", "Sergio Pérez"],
            "driver_codes": ["VER", "PER"],
            "driver_flags": ["🇳🇱", "🇲🇽"],
            "colors": {
                "main": "#3671C6",
                "light": "#5A8CD9", 
                "dark": "#2B5AA0",
                "logo": "🐂"
            },
            "season": 2025
        }
    ]
    
    teams = []
    for team_data in teams_data:
        team = Team(**team_data)
        async_session.add(team)
        teams.append(team)
    
    await async_session.commit()
    return teams


@pytest_asyncio.fixture
async def sample_races(async_session: AsyncSession):
    """Create sample races for testing"""
    from app.models.f1_models import Race
    from datetime import datetime, timedelta
    
    races_data = [
        {
            "id": "2025_aus",
            "name": "Australian Grand Prix",
            "season": 2025,
            "round": 1,
            "date": datetime.now() + timedelta(days=30),
            "country": "Australia",
            "circuit": "Albert Park",
            "status": "scheduled"
        }
    ]
    
    races = []
    for race_data in races_data:
        race = Race(**race_data)
        async_session.add(race)
        races.append(race)
    
    await async_session.commit()
    return races


# Mock external API fixtures
@pytest.fixture
def mock_openf1_response():
    """Mock OpenF1 API response"""
    return [
        {
            "meeting_key": "1234",
            "year": 2025,
            "round_number": 1,
            "meeting_name": "Australian Grand Prix",
            "meeting_official_name": "Formula 1 Australian Grand Prix 2025",
            "country_key": "AUS",
            "country_name": "Australia",
            "circuit_key": "albert_park",
            "circuit_short_name": "Albert Park",
            "date_start": "2025-03-16",
            "date_end": "2025-03-16",
            "gmt_offset": "+11:00",
            "location": "Melbourne"
        }
    ]


# Performance testing fixtures
@pytest.fixture
def performance_test_data():
    """Generate data for performance testing"""
    from faker import Faker
    fake = Faker()
    
    return {
        "drivers": [
            {
                "id": f"driver_{i}",
                "code": f"D{i:02d}",
                "name": fake.name(),
                "constructor": fake.company(),
                "number": i,
                "nationality": fake.country(),
                "flag": "🏁",
                "constructor_points": fake.random_int(0, 600),
                "season": 2025
            }
            for i in range(1, 21)
        ]
    }


# Test event loop configuration
@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()
