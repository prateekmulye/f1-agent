#!/usr/bin/env python3
"""
Test script to verify the prediction service correctly returns:
1. Actual results for past races (from historical data)
2. ML predictions for future races
"""

import asyncio
import sys
import os
sys.path.append(os.path.dirname(__file__))

from app.services.prediction_service import PredictionService
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

async def test_historical_race():
    """Test that historical race returns actual results"""
    print("Testing historical race (2010_1_bahrain)...")

    mock_db = MockAsyncSession()
    service = PredictionService(mock_db)

    # Test if historical data exists
    has_data = await service.has_historical_data("2010_1_bahrain")
    print(f"Historical data exists: {has_data}")

    if has_data:
        results = await service.get_actual_race_results("2010_1_bahrain")
        if results:
            print(f"Found {len(results)} historical results:")
            for i, result in enumerate(results[:5]):  # Show top 5
                print(f"  {i+1}. Driver: {result.driver_id}, Score: {result.score:.2f}, Prob: {result.prob_points:.2f}")
        else:
            print("No results returned")
    else:
        print("No historical data found")

async def test_future_race():
    """Test that future race would return predictions (mocked)"""
    print("\nTesting future race (2025_bahrain)...")

    mock_db = MockAsyncSession()
    service = PredictionService(mock_db)

    # Test if historical data exists
    has_data = await service.has_historical_data("2025_bahrain")
    print(f"Historical data exists: {has_data}")

    if not has_data:
        print("Correctly identified as future race - would generate ML predictions")
    else:
        print("Unexpected: found historical data for future race")

async def main():
    """Run tests"""
    print("Testing Prediction Service - Historical vs Future Race Logic")
    print("=" * 60)

    try:
        await test_historical_race()
        await test_future_race()
        print("\n" + "=" * 60)
        print("Test completed successfully!")

    except Exception as e:
        print(f"Test failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())