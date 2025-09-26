#!/usr/bin/env python3
"""
Real-time F1 Prediction Pipeline with Continuous Learning
Integrates multiple data sources, makes predictions, and learns from results
"""

import asyncio
import json
import logging
import schedule
import time
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple

import numpy as np
import pandas as pd
from advanced_data_collector import AdvancedDataCollector, DataSourceConfig
from advanced_ml_models import AdvancedEnsemblePredictor, ModelConfig, AdvancedFeatureEngineer, ContinuousLearningSystem

@dataclass
class PipelineConfig:
    """Configuration for the real-time pipeline"""
    data_collection_interval: int = 300  # seconds (5 minutes)
    prediction_interval: int = 900  # seconds (15 minutes)
    model_retrain_interval: int = 86400  # seconds (24 hours)
    results_check_interval: int = 3600  # seconds (1 hour)
    min_confidence_threshold: float = 0.6
    max_prediction_age: int = 7200  # seconds (2 hours)
    enable_real_time_updates: bool = True
    backup_model_count: int = 3
    performance_alert_threshold: float = 0.1  # 10% drop in accuracy

@dataclass
class PredictionRecord:
    """Record of a prediction made by the system"""
    prediction_id: str
    timestamp: datetime
    race_id: str
    driver_id: str
    features: Dict[str, Any]
    prediction_probability: float
    confidence: float
    model_version: str
    data_sources_used: List[str]
    actual_result: Optional[float] = None
    result_timestamp: Optional[datetime] = None
    error: Optional[float] = None

class RealTimePredictionPipeline:
    """Real-time F1 prediction pipeline with continuous learning"""

    def __init__(self, pipeline_config: PipelineConfig, data_config: DataSourceConfig, model_config: ModelConfig):
        self.pipeline_config = pipeline_config
        self.data_config = data_config
        self.model_config = model_config

        self.logger = self._setup_logging()
        self.executor = ThreadPoolExecutor(max_workers=4)

        # Core components
        self.data_collector: Optional[AdvancedDataCollector] = None
        self.predictor: Optional[AdvancedEnsemblePredictor] = None

        # State management
        self.active_predictions: Dict[str, PredictionRecord] = {}
        self.prediction_history: List[PredictionRecord] = []
        self.model_performance_history: List[Dict[str, Any]] = []
        self.last_retrain_time: Optional[datetime] = None

        # Data caches
        self.current_race_sessions: Dict[str, Any] = {}
        self.weather_cache: Dict[str, Any] = {}
        self.telemetry_cache: Dict[str, Any] = {}

        self.running = False

    def _setup_logging(self) -> logging.Logger:
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('real_time_pipeline.log'),
                logging.StreamHandler()
            ]
        )
        return logging.getLogger(__name__)

    async def initialize(self):
        """Initialize the pipeline components"""
        self.logger.info("Initializing real-time prediction pipeline...")

        # Initialize data collector
        self.data_collector = AdvancedDataCollector(self.data_config)

        # Load or create predictor
        model_path = Path("data/advanced_ensemble_model.pkl")
        if model_path.exists():
            self.logger.info("Loading existing advanced model...")
            self.predictor = AdvancedEnsemblePredictor.load_model(model_path)
        else:
            self.logger.info("Creating new advanced model...")
            self.predictor = AdvancedEnsemblePredictor(self.model_config)
            await self._initial_model_training()

        # Load historical predictions
        await self._load_prediction_history()

        # Schedule tasks
        self._schedule_tasks()

        self.logger.info("Pipeline initialization complete")

    def _schedule_tasks(self):
        """Schedule recurring tasks"""
        schedule.every(self.pipeline_config.data_collection_interval).seconds.do(
            self._schedule_async_task, self._collect_data
        )

        schedule.every(self.pipeline_config.prediction_interval).seconds.do(
            self._schedule_async_task, self._make_predictions
        )

        schedule.every(self.pipeline_config.results_check_interval).seconds.do(
            self._schedule_async_task, self._check_results
        )

        schedule.every(self.pipeline_config.model_retrain_interval).seconds.do(
            self._schedule_async_task, self._retrain_model
        )

    def _schedule_async_task(self, coro):
        """Schedule an async task to run in the event loop"""
        if self.running:
            asyncio.create_task(coro())

    async def _initial_model_training(self):
        """Train the initial model with historical data"""
        self.logger.info("Training initial model with historical data...")

        # Load historical data
        data_path = Path("data/historical_features.csv")
        if data_path.exists():
            df = pd.read_csv(data_path)

            feature_cols = [
                "quali_pos", "avg_fp_longrun_delta", "constructor_form",
                "driver_form", "circuit_effect", "driver_consistency",
                "constructor_reliability", "driver_momentum", "weather_risk"
            ]

            available_cols = [col for col in feature_cols if col in df.columns]
            X = df[available_cols].fillna(0)
            y = df['points_scored'].astype(int)

            # Train the ensemble
            self.predictor.fit(X, y)

            # Save the model
            model_path = Path("data/advanced_ensemble_model.pkl")
            self.predictor.save_model(model_path)

            self.last_retrain_time = datetime.now()
            self.logger.info("Initial model training completed")
        else:
            self.logger.warning("No historical data found for initial training")

    async def _load_prediction_history(self):
        """Load prediction history from storage"""
        history_path = Path("data/prediction_history.json")
        if history_path.exists():
            try:
                with open(history_path, 'r') as f:
                    history_data = json.load(f)

                for record_data in history_data:
                    record = PredictionRecord(**record_data)
                    # Convert string timestamps back to datetime
                    record.timestamp = datetime.fromisoformat(record_data['timestamp'])
                    if record_data.get('result_timestamp'):
                        record.result_timestamp = datetime.fromisoformat(record_data['result_timestamp'])

                    self.prediction_history.append(record)

                self.logger.info(f"Loaded {len(self.prediction_history)} historical predictions")
            except Exception as e:
                self.logger.error(f"Failed to load prediction history: {e}")

    async def _save_prediction_history(self):
        """Save prediction history to storage"""
        history_path = Path("data/prediction_history.json")
        try:
            history_data = []
            for record in self.prediction_history[-1000:]:  # Keep last 1000 predictions
                record_dict = asdict(record)
                # Convert datetime objects to strings
                record_dict['timestamp'] = record.timestamp.isoformat()
                if record.result_timestamp:
                    record_dict['result_timestamp'] = record.result_timestamp.isoformat()
                history_data.append(record_dict)

            history_path.parent.mkdir(parents=True, exist_ok=True)
            with open(history_path, 'w') as f:
                json.dump(history_data, f, indent=2)

        except Exception as e:
            self.logger.error(f"Failed to save prediction history: {e}")

    async def _collect_data(self):
        """Collect fresh data from all sources"""
        if not self.data_collector:
            return

        self.logger.info("Collecting fresh data from all sources...")

        try:
            async with self.data_collector as collector:
                # Get current active sessions
                current_year = datetime.now().year
                sessions = await collector.get_openf1_session_data(current_year, "Race")

                # Filter to upcoming/current races
                now = datetime.now()
                active_sessions = []

                for session in sessions:
                    session_date = datetime.fromisoformat(session.get('date_start', '').replace('Z', '+00:00'))
                    time_diff = (session_date - now).total_seconds()

                    # Include races that are within 24 hours (upcoming or recently finished)
                    if -3600 <= time_diff <= 86400:  # -1 hour to +24 hours
                        active_sessions.append(session)

                self.current_race_sessions = {s['session_key']: s for s in active_sessions}

                # Collect detailed data for active sessions
                for session_key, session in self.current_race_sessions.items():
                    try:
                        # Collect weather data
                        weather_data = await collector.get_openf1_weather_data(session_key)
                        if weather_data:
                            self.weather_cache[session_key] = weather_data

                        # Collect lap data for top drivers (for live sessions)
                        lap_data = await collector.get_openf1_lap_data(session_key)
                        if lap_data:
                            self.telemetry_cache[session_key] = lap_data

                    except Exception as e:
                        self.logger.error(f"Failed to collect data for session {session_key}: {e}")

                self.logger.info(f"Data collection complete. Active sessions: {len(active_sessions)}")

        except Exception as e:
            self.logger.error(f"Data collection failed: {e}")

    async def _make_predictions(self):
        """Make predictions for current/upcoming races"""
        if not self.predictor or not self.current_race_sessions:
            return

        self.logger.info("Making predictions for active races...")

        try:
            for session_key, session in self.current_race_sessions.items():
                race_id = f"{session['year']}_{session['round_number']}_{session.get('circuit_short_name', 'unknown')}"

                # Check if we already have recent predictions for this race
                recent_predictions = [
                    p for p in self.active_predictions.values()
                    if p.race_id == race_id and
                    (datetime.now() - p.timestamp).total_seconds() < self.pipeline_config.max_prediction_age
                ]

                if recent_predictions:
                    self.logger.info(f"Recent predictions exist for {race_id}, skipping")
                    continue

                # Get drivers for this session (simplified - in practice, get from qualifying/practice)
                drivers = ['max_verstappen', 'perez', 'hamilton', 'russell', 'leclerc', 'sainz',
                          'norris', 'piastri', 'alonso', 'stroll']  # Example drivers

                for driver_id in drivers:
                    try:
                        # Prepare features for prediction
                        features = await self._prepare_prediction_features(session, driver_id)

                        if features is not None:
                            # Make prediction
                            X_pred = pd.DataFrame([features])
                            prediction_result = self.predictor.predict_with_explanation(
                                X_pred, feature_names=list(features.keys())
                            )

                            # Only store high-confidence predictions
                            if prediction_result['confidence'] >= self.pipeline_config.min_confidence_threshold:
                                prediction_record = PredictionRecord(
                                    prediction_id=f"{race_id}_{driver_id}_{int(time.time())}",
                                    timestamp=datetime.now(),
                                    race_id=race_id,
                                    driver_id=driver_id,
                                    features=features,
                                    prediction_probability=prediction_result['prediction_probability'],
                                    confidence=prediction_result['confidence'],
                                    model_version="ensemble_v2.0",
                                    data_sources_used=['openf1', 'weather_api']
                                )

                                self.active_predictions[prediction_record.prediction_id] = prediction_record

                                self.logger.info(
                                    f"Prediction made for {driver_id} in {race_id}: "
                                    f"{prediction_result['prediction_probability']:.3f} "
                                    f"(confidence: {prediction_result['confidence']:.3f})"
                                )

                    except Exception as e:
                        self.logger.error(f"Failed to predict for {driver_id} in {race_id}: {e}")

            self.logger.info(f"Prediction cycle complete. Active predictions: {len(self.active_predictions)}")

        except Exception as e:
            self.logger.error(f"Prediction cycle failed: {e}")

    async def _prepare_prediction_features(self, session: Dict, driver_id: str) -> Optional[Dict[str, float]]:
        """Prepare features for prediction from collected data"""
        try:
            session_key = session['session_key']

            # Base features (you would calculate these from real data)
            features = {
                'quali_pos': 5.0,  # Would get from qualifying results
                'avg_fp_longrun_delta': 0.0,  # From practice sessions
                'constructor_form': 0.7,  # From recent constructor performance
                'driver_form': 0.8,  # From recent driver performance
                'circuit_effect': 0.6,  # From historical circuit performance
                'driver_consistency': 0.75,  # From recent consistency metrics
                'constructor_reliability': 0.8,  # From recent reliability data
                'driver_momentum': 0.1,  # From recent trend analysis
                'weather_risk': 0.0  # From weather data
            }

            # Update weather risk from collected data
            if session_key in self.weather_cache:
                weather_data = self.weather_cache[session_key]
                if weather_data:
                    # Calculate weather risk (simplified)
                    latest_weather = weather_data[-1] if weather_data else {}
                    features['weather_risk'] = self._calculate_weather_risk(latest_weather)

            # Update other features from telemetry data if available
            if session_key in self.telemetry_cache:
                telemetry_data = self.telemetry_cache[session_key]
                # Update features based on telemetry...

            return features

        except Exception as e:
            self.logger.error(f"Failed to prepare features for {driver_id}: {e}")
            return None

    def _calculate_weather_risk(self, weather_data: Dict) -> float:
        """Calculate weather risk score from weather data"""
        risk = 0.0

        # Rain probability
        if 'precipitation' in weather_data:
            precip = weather_data.get('precipitation', 0)
            if precip > 0:
                risk += min(precip * 0.1, 0.4)

        # Wind conditions
        if 'wind_speed' in weather_data:
            wind_speed = weather_data.get('wind_speed', 0)
            if wind_speed > 20:  # Strong wind
                risk += min((wind_speed - 20) * 0.01, 0.3)

        # Temperature extremes
        if 'air_temperature' in weather_data:
            temp = weather_data.get('air_temperature', 25)
            if temp < 10 or temp > 40:
                risk += 0.2

        return min(risk, 1.0)

    async def _check_results(self):
        """Check for race results and update prediction records"""
        if not self.active_predictions:
            return

        self.logger.info("Checking for race results...")

        try:
            # Group predictions by race
            race_predictions = {}
            for pred_id, prediction in self.active_predictions.items():
                race_id = prediction.race_id
                if race_id not in race_predictions:
                    race_predictions[race_id] = []
                race_predictions[race_id].append(prediction)

            # Check results for each race
            for race_id, predictions in race_predictions.items():
                try:
                    # Get actual race results (simplified - would use real API)
                    results = await self._get_race_results(race_id)

                    if results:
                        self.logger.info(f"Found results for {race_id}")

                        for prediction in predictions:
                            driver_result = results.get(prediction.driver_id)
                            if driver_result is not None:
                                # Update prediction with actual result
                                prediction.actual_result = float(driver_result['points'] > 0)
                                prediction.result_timestamp = datetime.now()
                                prediction.error = abs(
                                    prediction.prediction_probability - prediction.actual_result
                                )

                                # Move to history
                                self.prediction_history.append(prediction)
                                del self.active_predictions[prediction.prediction_id]

                                # Update continuous learning system
                                if self.predictor:
                                    features_array = np.array(list(prediction.features.values())).reshape(1, -1)
                                    self.predictor.continuous_learner.record_prediction(
                                        features_array[0],
                                        prediction.prediction_probability,
                                        prediction.actual_result,
                                        {'driver_id': prediction.driver_id, 'race_id': race_id}
                                    )

                                self.logger.info(
                                    f"Updated prediction for {prediction.driver_id}: "
                                    f"predicted {prediction.prediction_probability:.3f}, "
                                    f"actual {prediction.actual_result}, "
                                    f"error {prediction.error:.3f}"
                                )

                except Exception as e:
                    self.logger.error(f"Failed to check results for {race_id}: {e}")

            # Save updated history
            await self._save_prediction_history()

        except Exception as e:
            self.logger.error(f"Result checking failed: {e}")

    async def _get_race_results(self, race_id: str) -> Optional[Dict[str, Dict]]:
        """Get race results from data sources"""
        try:
            # Parse race_id to get year and round
            parts = race_id.split('_')
            if len(parts) >= 2:
                year = int(parts[0])
                round_num = int(parts[1])

                # Use data collector to get results
                if self.data_collector:
                    async with self.data_collector as collector:
                        sessions = await collector.get_openf1_session_data(year, "Race")
                        target_session = None

                        for session in sessions:
                            if session.get('round_number') == round_num:
                                target_session = session
                                break

                        if target_session:
                            # Get race results (simplified)
                            session_key = target_session['session_key']
                            lap_data = await collector.get_openf1_lap_data(session_key)

                            if lap_data:
                                # Process lap data to determine final results
                                # This is simplified - real implementation would be more complex
                                driver_results = {}
                                for lap in lap_data:
                                    driver_id = lap.get('driver_number', 'unknown')
                                    position = lap.get('position', 25)

                                    # Simulate points based on position (simplified)
                                    points = max(0, 26 - position) if position <= 10 else 0

                                    driver_results[f"driver_{driver_id}"] = {
                                        'position': position,
                                        'points': points
                                    }

                                return driver_results

        except Exception as e:
            self.logger.error(f"Failed to get race results for {race_id}: {e}")

        return None

    async def _retrain_model(self):
        """Retrain the model with recent data and feedback"""
        if not self.predictor or len(self.prediction_history) < 50:
            return

        self.logger.info("Starting model retraining...")

        try:
            # Collect recent predictions with results
            recent_predictions = [
                p for p in self.prediction_history
                if p.actual_result is not None and p.result_timestamp is not None
                and (datetime.now() - p.result_timestamp).days <= 30  # Last 30 days
            ]

            if len(recent_predictions) < 20:
                self.logger.info("Not enough recent data for retraining")
                return

            # Prepare training data
            features_list = []
            targets = []

            for pred in recent_predictions:
                features_list.append(list(pred.features.values()))
                targets.append(int(pred.actual_result))

            X_new = pd.DataFrame(features_list, columns=list(recent_predictions[0].features.keys()))
            y_new = np.array(targets)

            # Perform incremental update
            self.predictor.continuous_learning_update(X_new, y_new, y_new)

            # Save updated model
            model_path = Path("data/advanced_ensemble_model.pkl")
            self.predictor.save_model(model_path)

            self.last_retrain_time = datetime.now()

            # Evaluate performance
            accuracy = np.mean([
                1 if abs(p.prediction_probability - p.actual_result) < 0.3 else 0
                for p in recent_predictions
            ])

            self.model_performance_history.append({
                'timestamp': datetime.now().isoformat(),
                'accuracy': accuracy,
                'predictions_count': len(recent_predictions),
                'retrain_trigger': 'scheduled'
            })

            self.logger.info(f"Model retraining complete. Accuracy on recent data: {accuracy:.3f}")

        except Exception as e:
            self.logger.error(f"Model retraining failed: {e}")

    async def run(self):
        """Run the real-time pipeline"""
        self.running = True
        self.logger.info("Starting real-time prediction pipeline...")

        try:
            await self.initialize()

            while self.running:
                # Run scheduled tasks
                schedule.run_pending()

                # Sleep for a short interval
                await asyncio.sleep(10)

        except KeyboardInterrupt:
            self.logger.info("Pipeline shutdown requested")
        except Exception as e:
            self.logger.error(f"Pipeline error: {e}")
        finally:
            await self.shutdown()

    async def shutdown(self):
        """Shutdown the pipeline gracefully"""
        self.logger.info("Shutting down pipeline...")
        self.running = False

        # Save current state
        await self._save_prediction_history()

        # Shutdown executor
        self.executor.shutdown(wait=True)

        self.logger.info("Pipeline shutdown complete")

    def get_current_predictions(self) -> List[Dict[str, Any]]:
        """Get current active predictions for API"""
        predictions = []
        for prediction in self.active_predictions.values():
            predictions.append({
                'prediction_id': prediction.prediction_id,
                'timestamp': prediction.timestamp.isoformat(),
                'race_id': prediction.race_id,
                'driver_id': prediction.driver_id,
                'prediction_probability': prediction.prediction_probability,
                'confidence': prediction.confidence,
                'features': prediction.features
            })
        return predictions

    def get_performance_metrics(self) -> Dict[str, Any]:
        """Get current performance metrics"""
        if not self.prediction_history:
            return {'status': 'no_data'}

        # Calculate metrics from recent predictions with results
        recent_with_results = [
            p for p in self.prediction_history[-100:]  # Last 100
            if p.actual_result is not None
        ]

        if not recent_with_results:
            return {'status': 'no_results'}

        accuracy = np.mean([
            1 if abs(p.prediction_probability - p.actual_result) < 0.3 else 0
            for p in recent_with_results
        ])

        avg_error = np.mean([p.error for p in recent_with_results if p.error is not None])
        avg_confidence = np.mean([p.confidence for p in recent_with_results])

        return {
            'status': 'active',
            'accuracy': float(accuracy),
            'average_error': float(avg_error),
            'average_confidence': float(avg_confidence),
            'total_predictions': len(self.prediction_history),
            'recent_predictions_with_results': len(recent_with_results),
            'last_retrain': self.last_retrain_time.isoformat() if self.last_retrain_time else None,
            'active_predictions': len(self.active_predictions)
        }

async def main():
    """Main function to run the pipeline"""
    # Configuration
    pipeline_config = PipelineConfig(
        data_collection_interval=300,  # 5 minutes
        prediction_interval=900,       # 15 minutes
        results_check_interval=3600,   # 1 hour
        model_retrain_interval=86400   # 24 hours
    )

    data_config = DataSourceConfig()
    model_config = ModelConfig(use_ensemble=True, enable_continuous_learning=True)

    # Create and run pipeline
    pipeline = RealTimePredictionPipeline(pipeline_config, data_config, model_config)
    await pipeline.run()

if __name__ == "__main__":
    asyncio.run(main())