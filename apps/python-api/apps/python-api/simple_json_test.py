#!/usr/bin/env python3
"""
Simple JSON Data Test
Test that JSON files can be loaded correctly
"""

import json
import os

def test_json_files():
    """Test JSON files can be loaded"""
    print("📁 Testing JSON Data Files...")
    print("=" * 40)

    # Get the path to data directory
    data_dir = os.path.join(os.path.dirname(__file__), "../../../../data")
    print(f"Looking in: {data_dir}")

    results = {}

    # Test drivers.json
    drivers_path = os.path.join(data_dir, "drivers.json")
    if os.path.exists(drivers_path):
        try:
            with open(drivers_path, 'r', encoding='utf-8') as f:
                drivers_data = json.load(f)
            results["drivers"] = {
                "status": "✅ Found",
                "count": len(drivers_data),
                "sample": drivers_data[0]["name"] if drivers_data else "No data"
            }
        except Exception as e:
            results["drivers"] = {"status": "❌ Error", "error": str(e)}
    else:
        results["drivers"] = {"status": "❌ Not found"}

    # Test races.json
    races_path = os.path.join(data_dir, "races.json")
    if os.path.exists(races_path):
        try:
            with open(races_path, 'r', encoding='utf-8') as f:
                races_data = json.load(f)

            # Count by season
            season_counts = {}
            for race in races_data:
                season = race.get("season", "unknown")
                season_counts[season] = season_counts.get(season, 0) + 1

            results["races"] = {
                "status": "✅ Found",
                "total_count": len(races_data),
                "seasons": season_counts,
                "sample": races_data[0]["name"] if races_data else "No data"
            }
        except Exception as e:
            results["races"] = {"status": "❌ Error", "error": str(e)}
    else:
        results["races"] = {"status": "❌ Not found"}

    # Display results
    for data_type, result in results.items():
        print(f"\n{data_type.upper()} Data:")
        if result["status"].startswith("✅"):
            print(f"  Status: {result['status']}")
            if "count" in result:
                print(f"  Count: {result['count']} records")
            if "total_count" in result:
                print(f"  Total Count: {result['total_count']} records")
                if "seasons" in result:
                    print(f"  Seasons: {dict(result['seasons'])}")
            if "sample" in result:
                print(f"  Sample: {result['sample']}")
        else:
            print(f"  Status: {result['status']}")
            if "error" in result:
                print(f"  Error: {result['error']}")

    # Check if all required files exist
    all_good = all(r["status"].startswith("✅") for r in results.values())

    print(f"\n{'=' * 40}")
    if all_good:
        print("🎉 All JSON files found and loadable!")
        print("\n💡 This means the API endpoints should work with JSON fallback")
        print("📌 API Endpoints that should work:")
        print("   GET /api/v1/drivers")
        print("   GET /api/v1/races")
        print("   GET /api/v1/teams (generated from drivers)")
    else:
        print("❌ Some JSON files are missing or have errors")

    return all_good

def simulate_api_responses():
    """Simulate what API responses would look like"""
    print(f"\n{'=' * 60}")
    print("🚀 Simulating API Responses...")

    data_dir = os.path.join(os.path.dirname(__file__), "../../../../data")

    # Simulate drivers endpoint
    try:
        with open(os.path.join(data_dir, "drivers.json"), 'r') as f:
            drivers = json.load(f)

        print(f"\n📡 GET /api/v1/drivers (first 3 results):")
        for i, driver in enumerate(drivers[:3]):
            print(f"  {i+1}. {driver['name']} ({driver['code']}) - {driver['constructor']}")

    except Exception as e:
        print(f"❌ Drivers simulation failed: {e}")

    # Simulate races endpoint
    try:
        with open(os.path.join(data_dir, "races.json"), 'r') as f:
            races = json.load(f)

        # Filter 2025 races
        races_2025 = [r for r in races if r.get("season") == 2025]

        print(f"\n📡 GET /api/v1/races?season=2025 (first 3 results):")
        for i, race in enumerate(races_2025[:3]):
            print(f"  R{race['round']:2}. {race['name']} - {race['date']}")

        print(f"     Total 2025 races: {len(races_2025)}")

    except Exception as e:
        print(f"❌ Races simulation failed: {e}")

if __name__ == "__main__":
    success = test_json_files()

    if success:
        simulate_api_responses()

    print(f"\n{'=' * 60}")
    print("✅ Test completed!" if success else "❌ Test failed!")