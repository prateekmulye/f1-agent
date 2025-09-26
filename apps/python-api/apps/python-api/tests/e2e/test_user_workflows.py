"""
End-to-end tests for complete user workflows
"""
import pytest
from httpx import AsyncClient
from fastapi import status


@pytest.mark.e2e
class TestUserRegistrationAndAuthentication:
    """Test complete user registration and authentication flow"""

    async def test_user_registration_login_flow(self, async_client: AsyncClient):
        """Test complete user registration and login workflow"""
        # 1. Register new user
        registration_data = {
            "username": "e2e_user",
            "email": "e2e@example.com",
            "password": "securepassword123"
        }
        
        response = await async_client.post("/api/v1/auth/register", json=registration_data)
        assert response.status_code == status.HTTP_201_CREATED
        
        user_data = response.json()
        assert user_data["username"] == "e2e_user"
        assert user_data["email"] == "e2e@example.com"
        assert user_data["is_active"] is True
        
        # 2. Login with registered user
        login_data = {
            "username": "e2e_user",
            "password": "securepassword123"
        }
        
        response = await async_client.post("/api/v1/auth/login", json=login_data)
        assert response.status_code == status.HTTP_200_OK
        
        token_data = response.json()
        assert "access_token" in token_data
        assert token_data["token_type"] == "bearer"
        
        # 3. Use token to access protected endpoint
        headers = {"Authorization": f"Bearer {token_data['access_token']}"}
        response = await async_client.get("/api/v1/auth/me", headers=headers)
        
        assert response.status_code == status.HTTP_200_OK
        user_profile = response.json()
        assert user_profile["username"] == "e2e_user"

    async def test_duplicate_user_registration(self, async_client: AsyncClient):
        """Test handling of duplicate user registration"""
        user_data = {
            "username": "duplicate_user",
            "email": "duplicate@example.com",
            "password": "password123"
        }
        
        # First registration should succeed
        response = await async_client.post("/api/v1/auth/register", json=user_data)
        assert response.status_code == status.HTTP_201_CREATED
        
        # Second registration with same username should fail
        response = await async_client.post("/api/v1/auth/register", json=user_data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        
        error_data = response.json()
        assert "username already registered" in error_data["detail"].lower()

    async def test_invalid_login_credentials(self, async_client: AsyncClient):
        """Test login with invalid credentials"""
        login_data = {
            "username": "nonexistent_user",
            "password": "wrongpassword"
        }
        
        response = await async_client.post("/api/v1/auth/login", json=login_data)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.e2e
class TestF1DataWorkflow:
    """Test complete F1 data retrieval workflows"""

    async def test_race_prediction_workflow(self, async_client: AsyncClient, sample_drivers, sample_races):
        """Test complete race prediction workflow"""
        # 1. Get available races
        response = await async_client.get("/api/v1/races")
        assert response.status_code == status.HTTP_200_OK
        
        races = response.json()
        assert len(races) >= 1
        
        race_id = races[0]["id"]
        
        # 2. Generate predictions for race
        response = await async_client.post(f"/api/v1/predictions/race/{race_id}")
        assert response.status_code == status.HTTP_200_OK
        
        predictions = response.json()
        assert isinstance(predictions, list)
        assert len(predictions) >= 1
        
        # 3. Verify prediction structure
        prediction = predictions[0]
        required_fields = ["driver_id", "race_id", "prob_points", "score", "top_factors"]
        for field in required_fields:
            assert field in prediction
        
        assert 0 <= prediction["prob_points"] <= 1
        assert isinstance(prediction["top_factors"], list)
        
        # 4. Get cached predictions
        response = await async_client.get(f"/api/v1/predictions/race/{race_id}")
        assert response.status_code == status.HTTP_200_OK
        
        cached_predictions = response.json()
        assert len(cached_predictions) == len(predictions)

    async def test_driver_team_standings_workflow(self, async_client: AsyncClient, sample_drivers, sample_teams):
        """Test complete driver and team data workflow"""
        # 1. Get all drivers
        response = await async_client.get("/api/v1/drivers")
        assert response.status_code == status.HTTP_200_OK
        
        drivers = response.json()
        assert len(drivers) >= 2
        
        # 2. Get specific driver details
        driver_id = drivers[0]["id"]
        response = await async_client.get(f"/api/v1/drivers/{driver_id}")
        assert response.status_code == status.HTTP_200_OK
        
        driver_details = response.json()
        assert driver_details["id"] == driver_id
        
        # 3. Get all teams
        response = await async_client.get("/api/v1/teams")
        assert response.status_code == status.HTTP_200_OK
        
        teams = response.json()
        assert len(teams) >= 1
        
        # 4. Get team details
        team_id = teams[0]["id"]
        response = await async_client.get(f"/api/v1/teams/{team_id}")
        assert response.status_code == status.HTTP_200_OK
        
        team_details = response.json()
        assert team_details["id"] == team_id
        assert "colors" in team_details
        
        # 5. Get championship standings
        response = await async_client.get("/api/v1/standings")
        assert response.status_code == status.HTTP_200_OK
        
        standings = response.json()
        assert "year" in standings
        assert standings["year"] == 2025

    async def test_upcoming_recent_races_workflow(self, async_client: AsyncClient):
        """Test workflow for getting upcoming and recent races"""
        # 1. Get upcoming races
        response = await async_client.get("/api/v1/races/upcoming")
        assert response.status_code == status.HTTP_200_OK
        
        upcoming_races = response.json()
        assert isinstance(upcoming_races, list)
        
        # 2. Get recent races
        response = await async_client.get("/api/v1/races/recent")
        assert response.status_code == status.HTTP_200_OK
        
        recent_races = response.json()
        assert isinstance(recent_races, list)
        
        # 3. Get upcoming races with custom limit
        response = await async_client.get("/api/v1/races/upcoming?limit=3")
        assert response.status_code == status.HTTP_200_OK
        
        limited_races = response.json()
        assert len(limited_races) <= 3


@pytest.mark.e2e
class TestDataManagementWorkflow:
    """Test data management and synchronization workflows"""

    async def test_openf1_data_sync_workflow(self, async_client: AsyncClient, auth_headers):
        """Test OpenF1 data synchronization workflow"""
        # 1. Check current data health
        response = await async_client.get("/api/v1/data/health")
        assert response.status_code == status.HTTP_200_OK
        
        health_data = response.json()
        assert "status" in health_data
        assert "details" in health_data
        
        # 2. Get OpenF1 meetings data
        response = await async_client.get("/api/v1/data/openf1/meetings?year=2025")
        assert response.status_code == status.HTTP_200_OK
        
        meetings_data = response.json()
        assert "year" in meetings_data
        assert "count" in meetings_data
        assert "data" in meetings_data
        assert meetings_data["year"] == 2025
        
        # 3. Sync race calendar (requires authentication)
        response = await async_client.post("/api/v1/data/sync/calendar?year=2025", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        
        sync_result = response.json()
        assert "message" in sync_result
        assert "year" in sync_result
        assert sync_result["year"] == 2025

    async def test_data_statistics_workflow(self, async_client: AsyncClient, auth_headers):
        """Test data statistics and monitoring workflow"""
        # 1. Get data statistics
        response = await async_client.get("/api/v1/data/stats", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        
        stats = response.json()
        assert "total_records" in stats
        assert "data_freshness" in stats
        assert "database_status" in stats
        
        # 2. Check external API status
        response = await async_client.get("/api/v1/data/external/status")
        assert response.status_code == status.HTTP_200_OK
        
        api_status = response.json()
        assert "openf1" in api_status
        assert "overall_status" in api_status


@pytest.mark.e2e
class TestAuthenticatedWorkflows:
    """Test workflows requiring authentication"""

    async def test_admin_only_workflow(self, async_client: AsyncClient, admin_headers):
        """Test admin-only functionality workflow"""
        # 1. Seed driver data (admin only)
        response = await async_client.post("/api/v1/data/seed/drivers", headers=admin_headers)
        assert response.status_code == status.HTTP_200_OK
        
        result = response.json()
        assert "message" in result
        assert "drivers_created" in result
        
        # 2. Seed team data (admin only)
        response = await async_client.post("/api/v1/data/seed/teams", headers=admin_headers)
        assert response.status_code == status.HTTP_200_OK
        
        result = response.json()
        assert "message" in result
        assert "teams_created" in result

    async def test_unauthorized_admin_access(self, async_client: AsyncClient, auth_headers):
        """Test that non-admin users cannot access admin endpoints"""
        # Try to access admin endpoint with regular user token
        response = await async_client.post("/api/v1/data/seed/drivers", headers=auth_headers)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    async def test_user_profile_management_workflow(self, async_client: AsyncClient, auth_headers):
        """Test user profile management workflow"""
        # 1. Get user profile
        response = await async_client.get("/api/v1/auth/me", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        
        profile = response.json()
        assert "username" in profile
        assert "email" in profile
        
        # 2. Get user permissions
        response = await async_client.get("/api/v1/auth/permissions", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        
        permissions = response.json()
        assert "permissions" in permissions
        assert "username" in permissions
        
        # 3. Generate API key
        response = await async_client.get("/api/v1/auth/api-key", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        
        api_key_data = response.json()
        assert "api_key" in api_key_data
        assert api_key_data["api_key"].startswith("f1api_")


@pytest.mark.e2e
class TestErrorHandlingWorkflows:
    """Test error handling in complete workflows"""

    async def test_invalid_race_prediction_workflow(self, async_client: AsyncClient):
        """Test prediction workflow with invalid race"""
        # Try to get predictions for non-existent race
        response = await async_client.post("/api/v1/predictions/race/invalid_race")
        assert response.status_code == status.HTTP_404_NOT_FOUND
        
        # Try to get cached predictions for non-existent race
        response = await async_client.get("/api/v1/predictions/race/invalid_race")
        # Should either return empty list or 404
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]

    async def test_unauthenticated_workflow(self, async_client: AsyncClient):
        """Test workflows requiring authentication without token"""
        # Try to access user profile without token
        response = await async_client.get("/api/v1/auth/me")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        
        # Try to sync data without token
        response = await async_client.post("/api/v1/data/sync/calendar")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_invalid_token_workflow(self, async_client: AsyncClient):
        """Test workflow with invalid authentication token"""
        invalid_headers = {"Authorization": "Bearer invalid_token_here"}
        
        response = await async_client.get("/api/v1/auth/me", headers=invalid_headers)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.e2e
@pytest.mark.slow
class TestPerformanceWorkflows:
    """Test performance-related workflows"""

    async def test_bulk_driver_requests_workflow(self, async_client: AsyncClient, sample_drivers):
        """Test making multiple driver requests in sequence"""
        # Get all drivers first
        response = await async_client.get("/api/v1/drivers")
        assert response.status_code == status.HTTP_200_OK
        
        drivers = response.json()
        
        # Make individual requests for each driver
        for driver in drivers[:5]:  # Limit to first 5 drivers
            response = await async_client.get(f"/api/v1/drivers/{driver['id']}")
            assert response.status_code == status.HTTP_200_OK
            
            driver_details = response.json()
            assert driver_details["id"] == driver["id"]

    async def test_concurrent_prediction_requests(self, async_client: AsyncClient, sample_races):
        """Test concurrent prediction requests"""
        import asyncio
        
        if not sample_races:
            pytest.skip("No sample races available")
        
        race_id = sample_races[0].id
        
        # Make concurrent prediction requests
        async def make_prediction_request():
            response = await async_client.get(f"/api/v1/predictions/race/{race_id}")
            return response
        
        # Run 3 concurrent requests
        tasks = [make_prediction_request() for _ in range(3)]
        responses = await asyncio.gather(*tasks)
        
        # All should succeed
        for response in responses:
            assert response.status_code == status.HTTP_200_OK
