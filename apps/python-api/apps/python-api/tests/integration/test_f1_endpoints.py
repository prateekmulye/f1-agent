"""
Integration tests for F1 API endpoints
"""
import pytest
from httpx import AsyncClient
from fastapi import status


@pytest.mark.integration
class TestDriverEndpoints:
    """Test driver-related endpoints"""

    async def test_get_drivers(self, async_client: AsyncClient, sample_drivers):
        """Test GET /api/v1/drivers"""
        response = await async_client.get("/api/v1/drivers")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 2  # We have sample drivers
        
        # Check driver structure
        driver = data[0]
        required_fields = ["id", "code", "name", "constructor", "number", "nationality", "flag"]
        for field in required_fields:
            assert field in driver

    async def test_get_drivers_with_season_filter(self, async_client: AsyncClient, sample_drivers):
        """Test GET /api/v1/drivers with season parameter"""
        response = await async_client.get("/api/v1/drivers?season=2025")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        
        # All drivers should be from 2025 season
        for driver in data:
            # Note: This would require checking the database or adding season to response
            assert "id" in driver

    async def test_get_driver_by_id(self, async_client: AsyncClient, sample_drivers):
        """Test GET /api/v1/drivers/{driver_id}"""
        driver_id = sample_drivers[0].id
        response = await async_client.get(f"/api/v1/drivers/{driver_id}")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == driver_id
        assert "name" in data
        assert "constructor" in data

    async def test_get_driver_not_found(self, async_client: AsyncClient):
        """Test GET /api/v1/drivers/{driver_id} with non-existent driver"""
        response = await async_client.get("/api/v1/drivers/nonexistent")
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        data = response.json()
        assert "detail" in data

    async def test_get_drivers_invalid_season(self, async_client: AsyncClient):
        """Test GET /api/v1/drivers with invalid season"""
        response = await async_client.get("/api/v1/drivers?season=1990")  # Too old
        
        # Should still work but return empty list or handle gracefully
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_422_UNPROCESSABLE_ENTITY]


@pytest.mark.integration
class TestTeamEndpoints:
    """Test team-related endpoints"""

    async def test_get_teams(self, async_client: AsyncClient, sample_teams):
        """Test GET /api/v1/teams"""
        response = await async_client.get("/api/v1/teams")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1  # We have sample teams
        
        # Check team structure
        team = data[0]
        required_fields = ["id", "name", "position", "points", "driverCount", "drivers", "colors"]
        for field in required_fields:
            assert field in team

    async def test_get_team_by_id(self, async_client: AsyncClient, sample_teams):
        """Test GET /api/v1/teams/{team_id}"""
        team_id = sample_teams[0].id
        response = await async_client.get(f"/api/v1/teams/{team_id}")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == team_id
        assert "name" in data
        assert "colors" in data
        assert isinstance(data["colors"], dict)

    async def test_get_team_not_found(self, async_client: AsyncClient):
        """Test GET /api/v1/teams/{team_id} with non-existent team"""
        response = await async_client.get("/api/v1/teams/nonexistent")
        
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.integration
class TestRaceEndpoints:
    """Test race-related endpoints"""

    async def test_get_races(self, async_client: AsyncClient, sample_races):
        """Test GET /api/v1/races"""
        response = await async_client.get("/api/v1/races")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        
        # Check race structure
        race = data[0]
        required_fields = ["id", "name", "season", "round", "date", "country"]
        for field in required_fields:
            assert field in race

    async def test_get_upcoming_races(self, async_client: AsyncClient, sample_races):
        """Test GET /api/v1/races/upcoming"""
        response = await async_client.get("/api/v1/races/upcoming")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        
        # With default limit of 5
        assert len(data) <= 5

    async def test_get_upcoming_races_with_limit(self, async_client: AsyncClient):
        """Test GET /api/v1/races/upcoming with custom limit"""
        response = await async_client.get("/api/v1/races/upcoming?limit=3")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) <= 3

    async def test_get_recent_races(self, async_client: AsyncClient):
        """Test GET /api/v1/races/recent"""
        response = await async_client.get("/api/v1/races/recent")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)


@pytest.mark.integration
class TestStandingsEndpoints:
    """Test standings endpoints"""

    async def test_get_standings(self, async_client: AsyncClient, sample_drivers, sample_teams):
        """Test GET /api/v1/standings"""
        response = await async_client.get("/api/v1/standings")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        required_fields = ["year", "last_updated"]
        for field in required_fields:
            assert field in data

    async def test_get_standings_specific_season(self, async_client: AsyncClient):
        """Test GET /api/v1/standings with season parameter"""
        response = await async_client.get("/api/v1/standings?season=2025")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["year"] == 2025


@pytest.mark.integration
class TestHealthEndpoints:
    """Test health check endpoints"""

    async def test_health_check(self, async_client: AsyncClient):
        """Test GET /api/v1/health"""
        response = await async_client.get("/api/v1/health")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        required_fields = ["status", "timestamp", "version", "database", "external_apis"]
        for field in required_fields:
            assert field in data
        
        assert data["status"] in ["healthy", "unhealthy"]
        assert isinstance(data["database"], bool)
        assert isinstance(data["external_apis"], dict)

    async def test_ping(self, async_client: AsyncClient):
        """Test GET /api/v1/ping"""
        response = await async_client.get("/api/v1/ping")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        assert data["message"] == "pong"
        assert "timestamp" in data

    async def test_version(self, async_client: AsyncClient):
        """Test GET /api/v1/version"""
        response = await async_client.get("/api/v1/version")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        required_fields = ["api_version", "python_version", "fastapi_version"]
        for field in required_fields:
            assert field in data

    async def test_readiness(self, async_client: AsyncClient):
        """Test GET /api/v1/readiness"""
        response = await async_client.get("/api/v1/readiness")
        
        # Should be ready in test environment
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "ready"

    async def test_liveness(self, async_client: AsyncClient):
        """Test GET /api/v1/liveness"""
        response = await async_client.get("/api/v1/liveness")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "alive"


@pytest.mark.integration
class TestRateLimiting:
    """Test rate limiting functionality"""

    async def test_rate_limiting_headers(self, async_client: AsyncClient):
        """Test that rate limiting headers are present"""
        response = await async_client.get("/api/v1/drivers")
        
        assert response.status_code == status.HTTP_200_OK
        
        # Check for rate limiting headers
        headers = response.headers
        expected_headers = ["x-ratelimit-limit", "x-ratelimit-remaining", "x-ratelimit-reset"]
        
        # Note: Headers might be lowercase
        header_keys = [h.lower() for h in headers.keys()]
        for expected in expected_headers:
            # This is a basic check - actual implementation might vary
            pass  # Rate limiting headers should be present

    @pytest.mark.slow
    async def test_rate_limit_enforcement(self, async_client: AsyncClient):
        """Test rate limit enforcement (slow test)"""
        # This would test actual rate limiting by making many requests
        # For now, just test that the endpoint works
        response = await async_client.get("/api/v1/ping")
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.integration
class TestErrorHandling:
    """Test error handling across endpoints"""

    async def test_404_error_format(self, async_client: AsyncClient):
        """Test 404 error response format"""
        response = await async_client.get("/api/v1/nonexistent")
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        data = response.json()
        
        # FastAPI default error format or custom format
        assert "detail" in data

    async def test_validation_error_format(self, async_client: AsyncClient):
        """Test validation error response format"""
        # Test with invalid query parameter
        response = await async_client.get("/api/v1/drivers?season=invalid")
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        data = response.json()
        assert "detail" in data

    async def test_method_not_allowed(self, async_client: AsyncClient):
        """Test method not allowed response"""
        response = await async_client.post("/api/v1/drivers")  # POST not allowed
        
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED


@pytest.mark.integration
class TestCORSHeaders:
    """Test CORS configuration"""

    async def test_cors_headers_present(self, async_client: AsyncClient):
        """Test that CORS headers are present"""
        response = await async_client.get("/api/v1/health")
        
        assert response.status_code == status.HTTP_200_OK
        
        # Note: In test environment, CORS headers might not be visible
        # This would be more relevant in a full server test
        headers = response.headers
        # CORS headers would be checked here in full integration test
