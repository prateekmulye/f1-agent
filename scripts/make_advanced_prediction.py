#!/usr/bin/env python3
"""
Script to make advanced predictions using the ensemble model
"""

import argparse
import json
import sys
from pathlib import Path
import pandas as pd
import numpy as np
from datetime import datetime

# Add the scripts directory to the path
sys.path.append(str(Path(__file__).parent))

try:
    from advanced_ml_models import AdvancedEnsemblePredictor
    from advanced_data_collector import AdvancedDataCollector, DataSourceConfig
except ImportError as e:
    print(json.dumps({
        "success": False,
        "error": f"Failed to import required modules: {e}"
    }))
    sys.exit(1)

def get_driver_features(race_id: str, driver_id: str) -> dict:
    """Get features for a driver in a specific race (simplified for demo)"""

    # Parse race_id to get circuit info
    parts = race_id.split('_')
    if len(parts) >= 3:
        year = parts[0]
        round_num = parts[1]
        circuit = parts[2]
    else:
        year = "2025"
        round_num = "1"
        circuit = "unknown"

    # Driver-specific base performance (would come from data sources)
    driver_base_performance = {
        'max_verstappen': {'form': 0.92, 'consistency': 0.89, 'quali_skill': 0.85},
        'perez': {'form': 0.75, 'consistency': 0.72, 'quali_skill': 0.71},
        'hamilton': {'form': 0.82, 'consistency': 0.88, 'quali_skill': 0.91},
        'russell': {'form': 0.78, 'consistency': 0.75, 'quali_skill': 0.79},
        'leclerc': {'form': 0.84, 'consistency': 0.73, 'quali_skill': 0.87},
        'sainz': {'form': 0.76, 'consistency': 0.81, 'quali_skill': 0.74},
        'norris': {'form': 0.81, 'consistency': 0.83, 'quali_skill': 0.76},
        'piastri': {'form': 0.74, 'consistency': 0.79, 'quali_skill': 0.72},
        'alonso': {'form': 0.79, 'consistency': 0.85, 'quali_skill': 0.82},
        'stroll': {'form': 0.65, 'consistency': 0.68, 'quali_skill': 0.64}
    }

    # Constructor performance (would come from data sources)
    constructor_performance = {
        'red_bull': 0.88,
        'mercedes': 0.78,
        'ferrari': 0.81,
        'mclaren': 0.83,
        'aston_martin': 0.72,
        'alpine': 0.65,
        'williams': 0.58,
        'alphatauri': 0.62,
        'alfa_romeo': 0.60,
        'haas': 0.56
    }

    # Map driver to constructor (simplified)
    driver_constructor_map = {
        'max_verstappen': 'red_bull',
        'perez': 'red_bull',
        'hamilton': 'mercedes',
        'russell': 'mercedes',
        'leclerc': 'ferrari',
        'sainz': 'ferrari',
        'norris': 'mclaren',
        'piastri': 'mclaren',
        'alonso': 'aston_martin',
        'stroll': 'aston_martin'
    }

    # Get driver and constructor info
    driver_info = driver_base_performance.get(driver_id, {'form': 0.6, 'consistency': 0.6, 'quali_skill': 0.6})
    constructor_id = driver_constructor_map.get(driver_id, 'unknown')
    constructor_form = constructor_performance.get(constructor_id, 0.5)

    # Circuit-specific adjustments (simplified)
    circuit_adjustments = {
        'monaco': {'aero_importance': 0.9, 'power_importance': 0.3},
        'monza': {'aero_importance': 0.4, 'power_importance': 0.9},
        'singapore': {'aero_importance': 0.8, 'power_importance': 0.4},
        'spa': {'aero_importance': 0.7, 'power_importance': 0.8}
    }

    circuit_adj = circuit_adjustments.get(circuit, {'aero_importance': 0.6, 'power_importance': 0.6})

    # Calculate features
    features = {
        'quali_pos': max(1, min(20, np.random.normal(5, 3))),  # Simulated quali position
        'avg_fp_longrun_delta': np.random.normal(0, 0.2),  # Simulated practice performance
        'constructor_form': constructor_form,
        'driver_form': driver_info['form'],
        'circuit_effect': (driver_info['form'] * circuit_adj['aero_importance'] +
                          constructor_form * circuit_adj['power_importance']) / 2,
        'driver_consistency': driver_info['consistency'],
        'constructor_reliability': constructor_form * 0.9,  # Reliability correlated with performance
        'driver_momentum': np.random.normal(0, 0.1),  # Recent trend
        'weather_risk': np.random.uniform(0, 0.3)  # Weather uncertainty
    }

    return features

def make_prediction(race_id: str, driver_id: str = None, include_features: bool = False,
                   confidence_threshold: float = 0.0):
    """Make advanced predictions for a race"""

    try:
        # Load the advanced model
        model_path = Path("data/advanced_ensemble_model.pkl")

        if not model_path.exists():
            return {
                "success": False,
                "error": "Advanced model not found. Please train the model first."
            }

        predictor = AdvancedEnsemblePredictor.load_model(model_path)

        predictions = []

        # Determine which drivers to predict for
        if driver_id:
            drivers_to_predict = [driver_id]
        else:
            # Predict for all main drivers
            drivers_to_predict = [
                'max_verstappen', 'perez', 'hamilton', 'russell', 'leclerc', 'sainz',
                'norris', 'piastri', 'alonso', 'stroll'
            ]

        for driver in drivers_to_predict:
            try:
                # Get features for this driver
                features = get_driver_features(race_id, driver)

                # Prepare for prediction
                feature_names = list(features.keys())
                X_pred = pd.DataFrame([features])

                # Make prediction with explanation
                result = predictor.predict_with_explanation(X_pred, feature_names=feature_names)

                # Only include predictions above confidence threshold
                if result['confidence'] >= confidence_threshold:
                    prediction_record = {
                        "prediction_id": f"{race_id}_{driver}_{int(datetime.now().timestamp())}",
                        "timestamp": datetime.now().isoformat(),
                        "race_id": race_id,
                        "driver_id": driver,
                        "prediction_probability": result['prediction_probability'],
                        "confidence": result['confidence'],
                        "model_consensus": result['model_consensus'],
                        "model_version": "ensemble_v2.0",
                        "data_sources_used": ["historical", "simulated"]
                    }

                    # Add feature explanation if requested
                    if include_features:
                        formatted_features = {}
                        for feature_name, importance in result['feature_importance'].items():
                            formatted_features[feature_name] = {
                                "value": features.get(feature_name, 0),
                                "importance": importance,
                                "description": get_feature_description(feature_name)
                            }
                        prediction_record["features"] = formatted_features

                    predictions.append(prediction_record)

            except Exception as e:
                print(f"Warning: Failed to predict for {driver}: {e}", file=sys.stderr)
                continue

        return {
            "success": True,
            "predictions": predictions,
            "model_version": "ensemble_v2.0",
            "data_sources_used": ["historical", "simulated"],
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def get_feature_description(feature_name: str) -> str:
    """Get human-readable description for features"""
    descriptions = {
        'quali_pos': 'Qualifying Position',
        'avg_fp_longrun_delta': 'Practice Long Run Performance',
        'constructor_form': 'Team Recent Performance',
        'driver_form': 'Driver Recent Performance',
        'circuit_effect': 'Track-Specific Performance',
        'driver_consistency': 'Driver Consistency Rating',
        'constructor_reliability': 'Team Reliability Rating',
        'driver_momentum': 'Recent Performance Trend',
        'weather_risk': 'Weather Uncertainty Factor'
    }
    return descriptions.get(feature_name, feature_name.replace('_', ' ').title())

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description='Make advanced F1 race predictions')
    parser.add_argument('--race-id', required=True, help='Race ID in format YYYY_ROUND_CIRCUIT')
    parser.add_argument('--driver-id', help='Specific driver ID to predict for')
    parser.add_argument('--include-features', action='store_true',
                       help='Include feature explanations in output')
    parser.add_argument('--confidence-threshold', type=float, default=0.0,
                       help='Minimum confidence threshold for predictions')

    args = parser.parse_args()

    # Make predictions
    result = make_prediction(
        race_id=args.race_id,
        driver_id=args.driver_id,
        include_features=args.include_features,
        confidence_threshold=args.confidence_threshold
    )

    # Output as JSON
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()