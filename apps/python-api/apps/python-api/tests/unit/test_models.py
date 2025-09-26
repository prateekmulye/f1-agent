"""
Unit tests for F1 models
"""
import pytest
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.f1_models import Driver, Team, Race, User, Prediction


@pytest.mark.unit
class TestDriverModel:
    """Test Driver model"""

    async def test_create_driver(self, async_session: AsyncSession):
        """Test creating a driver"""
        driver = Driver(
            id="test_driver",
            code="TST",
            name="Test Driver",
            constructor="Test Team",
            number=99,
            nationality="Test Country",
            flag="🏁",
            constructor_points=100,
            season=2025
        )
        
        async_session.add(driver)
        await async_session.commit()
        await async_session.refresh(driver)
        
        assert driver.id == "test_driver"
        assert driver.code == "TST"
        assert driver.name == "Test Driver"
        assert driver.constructor_points == 100
        assert driver.created_at is not None

    async def test_driver_relationships(self, async_session: AsyncSession, sample_drivers):
        """Test driver relationships"""
        driver = sample_drivers[0]
        
        # Test standings relationship
        assert hasattr(driver, 'standings')
        assert hasattr(driver, 'predictions')

    async def test_driver_validation(self):
        """Test driver field validation"""
        # Test with invalid data
        with pytest.raises(ValueError):
            Driver(
                id="",  # Empty ID should fail
                code="VER",
                name="Max Verstappen",
                constructor="Red Bull Racing",
                number=1,
                nationality="Dutch",
                flag="🇳🇱",
                constructor_points=589,
                season=2025
            )


@pytest.mark.unit
class TestTeamModel:
    """Test Team model"""

    async def test_create_team(self, async_session: AsyncSession):
        """Test creating a team"""
        team_colors = {
            "main": "#3671C6",
            "light": "#5A8CD9",
            "dark": "#2B5AA0",
            "logo": "🐂"
        }
        
        team = Team(
            id="test_team",
            name="Test Racing",
            position=1,
            points=500,
            driver_count=2,
            drivers=["Driver 1", "Driver 2"],
            driver_codes=["DR1", "DR2"],
            driver_flags=["🏁", "🏁"],
            colors=team_colors,
            season=2025
        )
        
        async_session.add(team)
        await async_session.commit()
        await async_session.refresh(team)
        
        assert team.id == "test_team"
        assert team.name == "Test Racing"
        assert team.position == 1
        assert team.points == 500
        assert team.driver_count == 2
        assert len(team.drivers) == 2
        assert team.colors["main"] == "#3671C6"

    async def test_team_json_fields(self, async_session: AsyncSession):
        """Test JSON field handling"""
        team = Team(
            id="json_test",
            name="JSON Test Team",
            position=1,
            points=100,
            driver_count=2,
            drivers=["John Doe", "Jane Smith"],
            driver_codes=["JDO", "JSM"],
            driver_flags=["🇺🇸", "🇨🇦"],
            colors={"main": "#FF0000", "logo": "🏎️"},
            season=2025
        )
        
        async_session.add(team)
        await async_session.commit()
        await async_session.refresh(team)
        
        assert isinstance(team.drivers, list)
        assert isinstance(team.driver_codes, list)
        assert isinstance(team.colors, dict)
        assert team.colors["logo"] == "🏎️"


@pytest.mark.unit
class TestRaceModel:
    """Test Race model"""

    async def test_create_race(self, async_session: AsyncSession):
        """Test creating a race"""
        race_date = datetime(2025, 3, 16, 14, 0)
        
        race = Race(
            id="2025_test",
            name="Test Grand Prix",
            season=2025,
            round=1,
            date=race_date,
            country="Test Country",
            circuit="Test Circuit",
            status="scheduled"
        )
        
        async_session.add(race)
        await async_session.commit()
        await async_session.refresh(race)
        
        assert race.id == "2025_test"
        assert race.name == "Test Grand Prix"
        assert race.season == 2025
        assert race.round == 1
        assert race.date == race_date
        assert race.status == "scheduled"

    async def test_race_status_values(self, async_session: AsyncSession):
        """Test valid race status values"""
        statuses = ["scheduled", "completed", "cancelled"]
        
        for status in statuses:
            race = Race(
                id=f"race_{status}",
                name=f"Race {status}",
                season=2025,
                round=1,
                date=datetime.now(),
                country="Test",
                status=status
            )
            
            async_session.add(race)
            await async_session.commit()
            await async_session.refresh(race)
            
            assert race.status == status


@pytest.mark.unit
class TestUserModel:
    """Test User model"""

    async def test_create_user(self, async_session: AsyncSession):
        """Test creating a user"""
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password="hashed_password_here",
            is_active=True,
            is_admin=False,
            api_calls_count=0
        )
        
        async_session.add(user)
        await async_session.commit()
        await async_session.refresh(user)
        
        assert user.username == "testuser"
        assert user.email == "test@example.com"
        assert user.is_active is True
        assert user.is_admin is False
        assert user.api_calls_count == 0
        assert user.created_at is not None

    async def test_user_defaults(self, async_session: AsyncSession):
        """Test user default values"""
        user = User(
            username="defaultuser",
            email="default@example.com",
            hashed_password="hashed"
        )
        
        async_session.add(user)
        await async_session.commit()
        await async_session.refresh(user)
        
        assert user.is_active is True  # Default
        assert user.is_admin is False  # Default
        assert user.api_calls_count == 0  # Default
        assert user.last_login is None  # Default


@pytest.mark.unit
class TestPredictionModel:
    """Test Prediction model"""

    async def test_create_prediction(self, async_session: AsyncSession, sample_drivers, sample_races):
        """Test creating a prediction"""
        driver = sample_drivers[0]
        race = sample_races[0]
        
        features = {
            "quali_position": 5,
            "long_run_pace": 0.85,
            "team_form": 0.9,
            "driver_form": 0.95,
            "circuit_effect": 0.1,
            "weather_risk": 0.2
        }
        
        top_factors = [
            {"feature": "Team Form", "contribution": 0.162},
            {"feature": "Driver Form", "contribution": 0.133}
        ]
        
        prediction = Prediction(
            driver_id=driver.id,
            race_id=race.id,
            prob_points=0.75,
            score=1.2,
            predicted_position=3,
            features=features,
            top_factors=top_factors
        )
        
        async_session.add(prediction)
        await async_session.commit()
        await async_session.refresh(prediction)
        
        assert prediction.driver_id == driver.id
        assert prediction.race_id == race.id
        assert prediction.prob_points == 0.75
        assert prediction.score == 1.2
        assert prediction.predicted_position == 3
        assert isinstance(prediction.features, dict)
        assert isinstance(prediction.top_factors, list)

    async def test_prediction_constraints(self, async_session: AsyncSession, sample_drivers, sample_races):
        """Test prediction field constraints"""
        driver = sample_drivers[0]
        race = sample_races[0]
        
        # Test probability constraint (should be 0-1)
        prediction = Prediction(
            driver_id=driver.id,
            race_id=race.id,
            prob_points=0.5,  # Valid: between 0 and 1
            score=0.8
        )
        
        async_session.add(prediction)
        await async_session.commit()
        
        assert prediction.prob_points == 0.5
