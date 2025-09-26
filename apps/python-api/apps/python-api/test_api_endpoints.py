#!/usr/bin/env python3
"""
Test API Endpoints
Test the /drivers and /races endpoints to ensure they work with JSON fallback
"""

import asyncio
import sys
import os
sys.path.append(os.path.dirname(__file__))

from app.services.data_loader import DataLoaderService
from unittest.mock import Mock

class MockAsyncSession:
    """Mock database session for testing"""
    def __init__(self):
        pass

    async def execute(self, query):
        # Mock empty result for testing
        result = Mock()
        result.scalar_one_or_none.return_value = None
        result.scalars.return_value.all.return_value = []
        return result

    async def commit(self):
        pass

    async def rollback(self):
        pass

    def add(self, item):
        pass

async def test_drivers_endpoint():
    """Test drivers endpoint with JSON fallback"""
    print("🚗 Testing Drivers Endpoint...")
    print("=" * 40)

    mock_db = MockAsyncSession()
    data_loader = DataLoaderService(mock_db)

    # Test getting drivers (should fallback to JSON)
    drivers = await data_loader.get_drivers_with_fallback(2025)

    if drivers:
        print(f"✅ Found {len(drivers)} drivers:")
        for i, driver in enumerate(drivers[:5]):  # Show first 5
            print(f"  {i+1}. {driver.name} ({driver.code}) - {driver.constructor}")

        if len(drivers) > 5:
            print(f"  ... and {len(drivers) - 5} more")

        return True
    else:
        print("❌ No drivers found")
        return False

async def test_teams_endpoint():
    """Test teams endpoint with JSON fallback"""
    print("\n🏎️  Testing Teams Endpoint...")
    print("=" * 40)

    mock_db = MockAsyncSession()
    data_loader = DataLoaderService(mock_db)

    # Test getting teams (should generate from drivers JSON)
    teams = await data_loader.get_teams_with_fallback(2025)

    if teams:
        print(f"✅ Found {len(teams)} teams:")
        for i, team in enumerate(teams[:5]):  # Show first 5
            print(f"  {i+1}. {team.name} - {team.driverCount} drivers, {team.points} points")

        if len(teams) > 5:
            print(f"  ... and {len(teams) - 5} more")

        return True
    else:
        print("❌ No teams found")
        return False

async def test_races_endpoint():
    """Test races endpoint with JSON fallback"""
    print("\n🏁 Testing Races Endpoint...")
    print("=" * 40)

    mock_db = MockAsyncSession()
    data_loader = DataLoaderService(mock_db)

    # Test getting races (should fallback to JSON)
    races = await data_loader.get_races_with_fallback(2025)

    if races:
        print(f"✅ Found {len(races)} races for 2025:")
        for i, race in enumerate(races[:5]):  # Show first 5
            print(f"  R{race.round:2}. {race.name} ({race.country}) - {race.date.strftime('%Y-%m-%d')}")

        if len(races) > 5:
            print(f"  ... and {len(races) - 5} more")

        # Also test historical race
        historical_races = await data_loader.get_races_with_fallback(2024)
        if historical_races:
            print(f"\n📊 Found {len(historical_races)} historical races for 2024")

        return True
    else:
        print("❌ No races found")
        return False

async def test_data_availability():
    """Test data file availability"""
    print("\n📁 Testing Data File Availability...")
    print("=" * 40)

    mock_db = MockAsyncSession()
    data_loader = DataLoaderService(mock_db)

    # Test drivers.json
    drivers_data = data_loader._load_json_file("drivers.json")
    drivers_available = len(drivers_data) > 0
    print(f"{'✅' if drivers_available else '❌'} drivers.json: {len(drivers_data)} records")

    # Test races.json
    races_data = data_loader._load_json_file("races.json")
    races_available = len(races_data) > 0
    print(f"{'✅' if races_available else '❌'} races.json: {len(races_data)} records")

    return drivers_available and races_available

async def main():
    """Run all tests"""
    print("🧪 F1 API Endpoints Test Suite")
    print("=" * 60)

    try:
        # Test data availability first
        data_available = await test_data_availability()

        if not data_available:
            print("\n❌ Required data files not found. Check data/ directory.")
            return False

        # Test endpoints
        results = []
        results.append(await test_drivers_endpoint())
        results.append(await test_teams_endpoint())
        results.append(await test_races_endpoint())

        success_count = sum(results)
        total_tests = len(results)

        print(f"\n{'=' * 60}")
        print(f"🎯 Test Results: {success_count}/{total_tests} tests passed")

        if success_count == total_tests:
            print("🎉 All tests passed! API endpoints should work correctly.")
            print("\n💡 Next steps:")
            print("  1. Start the Python API server")
            print("  2. Test endpoints: GET /api/v1/drivers, GET /api/v1/races")
            print("  3. Optional: Load data to DB with POST /api/v1/data/load/json")
        else:
            print("💥 Some tests failed. Check data files and configuration.")

        return success_count == total_tests

    except Exception as e:
        print(f"\n❌ Test suite failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)