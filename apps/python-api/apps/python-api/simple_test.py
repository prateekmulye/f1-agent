#!/usr/bin/env python3
"""
Simple test to verify historical data detection
"""
import csv
import os

def test_historical_data_detection():
    """Test that we can detect historical races"""
    print("Testing historical data detection...")

    # Get the path to historical features CSV
    csv_path = os.path.join(os.path.dirname(__file__), "../../../../data/historical_features.csv")
    print(f"Looking for CSV at: {csv_path}")

    if not os.path.exists(csv_path):
        print("❌ CSV file not found!")
        return False

    print("✅ CSV file found!")

    # Test cases
    test_cases = [
        ("2010_1_bahrain", True),   # Should exist in historical data
        ("2025_bahrain", False),    # Should NOT exist (future race)
        ("2024_hun", False),        # Might exist depending on data
    ]

    results = []

    for race_id, expected in test_cases:
        found = False
        try:
            with open(csv_path, 'r', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile)
                for row in reader:
                    if row['race_id'] == race_id:
                        found = True
                        break
        except Exception as e:
            print(f"❌ Error reading CSV: {e}")
            return False

        status = "✅" if (found == expected) else "❌"
        print(f"{status} Race {race_id}: Expected {expected}, Found {found}")
        results.append(found == expected)

    # Show some sample data
    print("\nSample historical races:")
    try:
        with open(csv_path, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            races_shown = set()
            count = 0
            for row in reader:
                if row['race_id'] not in races_shown and count < 5:
                    print(f"  - {row['race_id']}: {row['driver_id']} finished P{row['finish_position']} with {row['points_scored']} points")
                    races_shown.add(row['race_id'])
                    count += 1
    except Exception as e:
        print(f"Error showing sample data: {e}")

    return all(results)

if __name__ == "__main__":
    success = test_historical_data_detection()
    if success:
        print("\n🎉 All tests passed!")
    else:
        print("\n💥 Some tests failed!")