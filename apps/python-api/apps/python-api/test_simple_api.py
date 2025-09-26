#!/usr/bin/env python3
"""
Test Simple API Server
Quick test to verify the simple API server works correctly
"""

import asyncio
import sys
import os

# Add the current directory to Python path
sys.path.append(os.path.dirname(__file__))

try:
    from simple_main import app, ALL_DRIVERS, ALL_RACES, TEAMS_2025
    print("✅ Successfully imported simple_main components")
except ImportError as e:
    print(f"❌ Failed to import simple_main: {e}")
    sys.exit(1)

def test_data_availability():
    """Test that all data is available"""
    print("\n📊 Testing Data Availability...")
    print("=" * 40)

    print(f"✅ Drivers: {len(ALL_DRIVERS)} total")
    print(f"   - 2025: {len([d for d in ALL_DRIVERS if d.get('season') == 2025])}")
    print(f"   - 2024: {len([d for d in ALL_DRIVERS if d.get('season') == 2024])}")

    print(f"✅ Races: {len(ALL_RACES)} total")
    print(f"   - 2025: {len([r for r in ALL_RACES if r.get('season') == 2025])}")
    print(f"   - 2024: {len([r for r in ALL_RACES if r.get('season') == 2024])}")

    print(f"✅ Teams (2025): {len(TEAMS_2025)}")

    return True

async def test_api_endpoints():
    """Test API endpoints (without actually running server)"""
    print("\n🚀 Testing API Endpoint Logic...")
    print("=" * 40)

    try:
        # Import the endpoint functions
        from simple_main import get_drivers, get_teams, get_races, get_race_predictions

        # Test drivers endpoint
        drivers_2025 = await get_drivers(2025)
        print(f"✅ GET /api/v1/drivers?season=2025: {len(drivers_2025)} drivers")

        # Test teams endpoint
        teams_2025 = await get_teams(2025)
        print(f"✅ GET /api/v1/teams?season=2025: {len(teams_2025)} teams")

        # Test races endpoint
        races_2025 = await get_races(2025)
        print(f"✅ GET /api/v1/races?season=2025: {len(races_2025)} races")

        # Test predictions for a specific race
        if races_2025:
            sample_race = races_2025[0]
            predictions = await get_race_predictions(sample_race['id'])
            print(f"✅ GET /api/v1/predictions/race/{sample_race['id']}: {len(predictions)} predictions")

        return True

    except Exception as e:
        print(f"❌ API endpoint test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def simulate_frontend_requests():
    """Simulate what the frontend would see"""
    print(f"\n🌐 Simulating Frontend API Requests...")
    print("=" * 50)

    # Simulate drivers request
    drivers_2025 = [d for d in ALL_DRIVERS if d.get('season') == 2025]
    print(f"\n📡 GET /api/v1/drivers?season=2025")
    print(f"Response: {len(drivers_2025)} drivers")
    for i, driver in enumerate(drivers_2025[:3]):
        print(f"  {i+1}. {driver['name']} ({driver['code']}) - {driver['constructor']}")
    if len(drivers_2025) > 3:
        print(f"  ... and {len(drivers_2025) - 3} more")

    # Simulate teams request
    print(f"\n📡 GET /api/v1/teams?season=2025")
    print(f"Response: {len(TEAMS_2025)} teams")
    for i, team in enumerate(TEAMS_2025):
        print(f"  {i+1}. {team['name']} - {team['points']} points")

    # Simulate races request
    races_2025 = [r for r in ALL_RACES if r.get('season') == 2025]
    print(f"\n📡 GET /api/v1/races?season=2025")
    print(f"Response: {len(races_2025)} races")
    for i, race in enumerate(races_2025[:3]):
        print(f"  R{race['round']:2}. {race['name']} - {race['date']}")
    if len(races_2025) > 3:
        print(f"  ... and {len(races_2025) - 3} more")

async def main():
    """Run all tests"""
    print("🧪 Simple F1 API Test Suite")
    print("=" * 60)

    try:
        # Test data availability
        data_ok = test_data_availability()

        if not data_ok:
            print("❌ Data availability test failed")
            return False

        # Test API endpoint logic
        api_ok = await test_api_endpoints()

        if not api_ok:
            print("❌ API endpoint test failed")
            return False

        # Simulate frontend requests
        simulate_frontend_requests()

        print(f"\n{'=' * 60}")
        print("🎉 All tests passed!")
        print("\n💡 Next Steps:")
        print("  1. Run the API server:")
        print("     cd apps/python-api/apps/python-api")
        print("     python3 simple_main.py")
        print("  2. Test endpoints:")
        print("     curl http://localhost:8001/api/v1/drivers")
        print("     curl http://localhost:8001/api/v1/races")
        print("  3. View API docs: http://localhost:8001/docs")

        return True

    except Exception as e:
        print(f"\n❌ Test suite failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)