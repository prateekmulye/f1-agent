#!/usr/bin/env python3
"""
Advanced ML Models for F1 Prediction with Ensemble Methods and Continuous Learning
"""

import json
import logging
import numpy as np
import pandas as pd
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Dict, List, Tuple, Any, Optional
import joblib
from datetime import datetime, timedelta

# ML Libraries
from sklearn.ensemble import (
    RandomForestClassifier, GradientBoostingClassifier, ExtraTreesClassifier,
    VotingClassifier, StackingClassifier
)
from sklearn.neural_network import MLPClassifier
from sklearn.svm import SVC
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler, RobustScaler
from sklearn.model_selection import (
    cross_val_score, GridSearchCV, TimeSeriesSplit, StratifiedKFold
)
from sklearn.metrics import (
    brier_score_loss, log_loss, roc_auc_score, accuracy_score,
    precision_recall_curve, average_precision_score
)
from sklearn.pipeline import Pipeline
from sklearn.base import BaseEstimator, TransformerMixin

# Advanced ML libraries
try:
    import xgboost as xgb
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False

try:
    import lightgbm as lgb
    LIGHTGBM_AVAILABLE = True
except ImportError:
    LIGHTGBM_AVAILABLE = False

@dataclass
class ModelConfig:
    """Configuration for advanced ML models"""
    use_ensemble: bool = True
    use_neural_networks: bool = True
    use_time_series_validation: bool = True
    enable_continuous_learning: bool = True
    prediction_confidence_threshold: float = 0.7
    model_update_frequency: int = 5  # races
    feature_importance_threshold: float = 0.01
    ensemble_voting: str = "soft"  # "hard" or "soft"
    cv_folds: int = 5
    random_state: int = 42

class AdvancedFeatureEngineer(BaseEstimator, TransformerMixin):
    """Advanced feature engineering with domain-specific F1 knowledge"""

    def __init__(self, include_interaction_features=True, include_temporal_features=True):
        self.include_interaction_features = include_interaction_features
        self.include_temporal_features = include_temporal_features
        self.feature_names = []

    def fit(self, X, y=None):
        """Fit the feature engineer (learn feature names)"""
        if isinstance(X, pd.DataFrame):
            self.feature_names = X.columns.tolist()
        return self

    def transform(self, X):
        """Transform features with advanced engineering"""
        if isinstance(X, pd.DataFrame):
            X_transformed = X.copy()
        else:
            X_transformed = pd.DataFrame(X, columns=self.feature_names)

        # Interaction features
        if self.include_interaction_features:
            X_transformed = self._add_interaction_features(X_transformed)

        # Temporal features
        if self.include_temporal_features:
            X_transformed = self._add_temporal_features(X_transformed)

        # Domain-specific features
        X_transformed = self._add_domain_features(X_transformed)

        return X_transformed

    def _add_interaction_features(self, X):
        """Add interaction features between important variables"""
        # Qualifying position vs form interactions
        if 'quali_pos' in X.columns and 'driver_form' in X.columns:
            X['quali_pos_driver_form_interaction'] = X['quali_pos'] * X['driver_form']

        if 'quali_pos' in X.columns and 'constructor_form' in X.columns:
            X['quali_pos_constructor_form_interaction'] = X['quali_pos'] * X['constructor_form']

        # Weather interactions
        if 'weather_risk' in X.columns and 'quali_pos' in X.columns:
            X['weather_quali_interaction'] = X['weather_risk'] * (21 - X['quali_pos'])

        # Circuit-specific interactions
        if 'circuit_effect' in X.columns and 'driver_form' in X.columns:
            X['circuit_driver_synergy'] = X['circuit_effect'] * X['driver_form']

        return X

    def _add_temporal_features(self, X):
        """Add temporal/sequential features"""
        # Rolling averages (if we have sequential data)
        for feature in ['driver_form', 'constructor_form']:
            if feature in X.columns:
                X[f'{feature}_trend'] = X[feature].rolling(3, min_periods=1).mean() - X[feature]

        return X

    def _add_domain_features(self, X):
        """Add F1-specific domain features"""
        # Starting position advantage
        if 'quali_pos' in X.columns:
            X['starting_advantage'] = np.exp(-X['quali_pos'] / 5)  # Exponential decay

        # Compound performance metrics
        if 'driver_form' in X.columns and 'constructor_form' in X.columns:
            X['combined_form'] = (X['driver_form'] + X['constructor_form']) / 2
            X['form_differential'] = X['driver_form'] - X['constructor_form']

        # Consistency vs speed trade-off
        if 'driver_consistency' in X.columns and 'driver_form' in X.columns:
            X['consistency_speed_ratio'] = X['driver_consistency'] / (X['driver_form'] + 1e-8)

        return X

class ContinuousLearningSystem:
    """System for continuous learning from prediction errors"""

    def __init__(self, config: ModelConfig):
        self.config = config
        self.prediction_history = []
        self.model_performance_history = []
        self.error_patterns = {}
        self.logger = self._setup_logging()

    def _setup_logging(self):
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        return logging.getLogger(__name__)

    def record_prediction(self, features: np.ndarray, prediction: float,
                         actual_result: Optional[float] = None, metadata: Dict = None):
        """Record a prediction for later analysis"""
        record = {
            'timestamp': datetime.now().isoformat(),
            'features': features.tolist() if isinstance(features, np.ndarray) else features,
            'prediction': prediction,
            'actual_result': actual_result,
            'metadata': metadata or {},
            'error': None if actual_result is None else abs(prediction - actual_result)
        }

        self.prediction_history.append(record)
        self.logger.info(f"Recorded prediction: {prediction:.3f}, actual: {actual_result}")

        if actual_result is not None:
            self._analyze_error_patterns(record)

    def _analyze_error_patterns(self, record: Dict):
        """Analyze patterns in prediction errors"""
        error = record['error']
        if error > 0.1:  # Significant error threshold
            # Analyze feature contributions to error
            features = np.array(record['features'])
            feature_ranges = {
                'quali_pos_high': features[0] > 10 if len(features) > 0 else False,
                'weather_risk_high': features[-1] > 0.5 if len(features) > 0 else False,
                # Add more pattern detectors
            }

            for pattern, is_present in feature_ranges.items():
                if is_present:
                    if pattern not in self.error_patterns:
                        self.error_patterns[pattern] = []
                    self.error_patterns[pattern].append(error)

    def get_model_update_recommendation(self) -> bool:
        """Determine if model should be updated based on recent performance"""
        if len(self.prediction_history) < self.config.model_update_frequency:
            return False

        recent_predictions = self.prediction_history[-self.config.model_update_frequency:]
        recent_errors = [p['error'] for p in recent_predictions if p['error'] is not None]

        if len(recent_errors) < 3:
            return False

        # Check if error rate is increasing
        avg_recent_error = np.mean(recent_errors)
        if len(self.model_performance_history) > 0:
            last_avg_error = self.model_performance_history[-1]['avg_error']
            if avg_recent_error > last_avg_error * 1.2:  # 20% increase in errors
                self.logger.info(f"Model update recommended: error increased from {last_avg_error:.3f} to {avg_recent_error:.3f}")
                return True

        return False

    def get_feature_adjustment_suggestions(self) -> Dict[str, float]:
        """Suggest feature weight adjustments based on error patterns"""
        suggestions = {}

        for pattern, errors in self.error_patterns.items():
            if len(errors) >= 3:
                avg_error = np.mean(errors)
                if avg_error > 0.15:  # High error threshold
                    if 'quali_pos' in pattern:
                        suggestions['quali_pos_weight'] = 0.9  # Reduce weight
                    elif 'weather' in pattern:
                        suggestions['weather_weight'] = 1.1  # Increase weight

        return suggestions

class AdvancedEnsemblePredictor:
    """Advanced ensemble predictor with multiple sophisticated models"""

    def __init__(self, config: ModelConfig):
        self.config = config
        self.models = {}
        self.ensemble_model = None
        self.feature_engineer = AdvancedFeatureEngineer()
        self.scaler = RobustScaler()
        self.continuous_learner = ContinuousLearningSystem(config)
        self.logger = self._setup_logging()
        self._initialize_models()

    def _setup_logging(self):
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        return logging.getLogger(__name__)

    def _initialize_models(self):
        """Initialize all models for the ensemble"""
        # Base models
        self.models['logistic'] = LogisticRegression(
            random_state=self.config.random_state, max_iter=1000
        )

        self.models['random_forest'] = RandomForestClassifier(
            n_estimators=200, max_depth=10, random_state=self.config.random_state,
            n_jobs=-1
        )

        self.models['gradient_boosting'] = GradientBoostingClassifier(
            n_estimators=150, learning_rate=0.1, max_depth=6,
            random_state=self.config.random_state
        )

        self.models['extra_trees'] = ExtraTreesClassifier(
            n_estimators=200, max_depth=12, random_state=self.config.random_state,
            n_jobs=-1
        )

        # Advanced models
        if XGBOOST_AVAILABLE:
            self.models['xgboost'] = xgb.XGBClassifier(
                n_estimators=150, max_depth=6, learning_rate=0.1,
                random_state=self.config.random_state, eval_metric='logloss'
            )

        if LIGHTGBM_AVAILABLE:
            self.models['lightgbm'] = lgb.LGBMClassifier(
                n_estimators=150, max_depth=6, learning_rate=0.1,
                random_state=self.config.random_state, verbose=-1
            )

        # Neural network
        if self.config.use_neural_networks:
            self.models['neural_network'] = MLPClassifier(
                hidden_layer_sizes=(100, 50, 25), max_iter=500,
                random_state=self.config.random_state, early_stopping=True
            )

        # SVM for non-linear patterns
        self.models['svm'] = SVC(
            probability=True, random_state=self.config.random_state,
            C=1.0, kernel='rbf'
        )

    def _create_ensemble(self):
        """Create ensemble model from base models"""
        base_models = [(name, model) for name, model in self.models.items()]

        if self.config.ensemble_voting == "soft":
            self.ensemble_model = VotingClassifier(
                estimators=base_models, voting='soft', n_jobs=-1
            )
        else:
            # Stacking ensemble with meta-learner
            meta_learner = LogisticRegression(random_state=self.config.random_state)
            self.ensemble_model = StackingClassifier(
                estimators=base_models, final_estimator=meta_learner,
                cv=3, n_jobs=-1
            )

    def fit(self, X, y):
        """Fit all models and create ensemble"""
        self.logger.info("Starting training of advanced ensemble models...")

        # Feature engineering
        X_engineered = self.feature_engineer.fit_transform(X)
        X_scaled = self.scaler.fit_transform(X_engineered)

        # Train individual models
        for name, model in self.models.items():
            try:
                self.logger.info(f"Training {name}...")
                model.fit(X_scaled, y)

                # Evaluate individual model
                cv_scores = cross_val_score(
                    model, X_scaled, y, cv=self.config.cv_folds,
                    scoring='roc_auc'
                )
                self.logger.info(f"{name} CV AUC: {cv_scores.mean():.4f} (+/- {cv_scores.std() * 2:.4f})")

            except Exception as e:
                self.logger.error(f"Failed to train {name}: {e}")
                del self.models[name]

        # Create and train ensemble
        if self.config.use_ensemble and len(self.models) > 1:
            self._create_ensemble()
            self.ensemble_model.fit(X_scaled, y)
            self.logger.info("Ensemble model trained successfully")

    def predict_proba(self, X, include_confidence=True) -> Tuple[np.ndarray, Optional[np.ndarray]]:
        """Predict probabilities with confidence estimates"""
        X_engineered = self.feature_engineer.transform(X)
        X_scaled = self.scaler.transform(X_engineered)

        if self.ensemble_model is not None:
            # Ensemble prediction
            proba = self.ensemble_model.predict_proba(X_scaled)

            if include_confidence:
                # Calculate prediction confidence based on model agreement
                individual_predictions = []
                for name, model in self.models.items():
                    try:
                        pred = model.predict_proba(X_scaled)
                        individual_predictions.append(pred)
                    except:
                        continue

                if individual_predictions:
                    predictions_array = np.array(individual_predictions)
                    # Confidence as inverse of standard deviation across models
                    confidence = 1 - np.std(predictions_array[:, :, 1], axis=0)
                    return proba, confidence

            return proba, None
        else:
            # Fallback to best individual model
            best_model_name = list(self.models.keys())[0]
            proba = self.models[best_model_name].predict_proba(X_scaled)
            return proba, None

    def predict_with_explanation(self, X, feature_names=None) -> Dict[str, Any]:
        """Predict with feature importance explanation"""
        proba, confidence = self.predict_proba(X, include_confidence=True)

        # Get feature importance from the best tree-based model
        feature_importance = {}
        for name, model in self.models.items():
            if hasattr(model, 'feature_importances_'):
                if feature_names:
                    feature_importance = dict(zip(feature_names, model.feature_importances_))
                else:
                    feature_importance = {f'feature_{i}': imp for i, imp in enumerate(model.feature_importances_)}
                break

        return {
            'prediction_probability': proba[0, 1] if len(proba) > 0 else 0.0,
            'confidence': confidence[0] if confidence is not None else 0.5,
            'feature_importance': feature_importance,
            'model_consensus': len(self.models)
        }

    def continuous_learning_update(self, X, y, actual_results):
        """Update models based on recent prediction errors"""
        if not self.config.enable_continuous_learning:
            return

        # Record predictions and results
        probabilities = self.predict_proba(X)[0]
        for i, (prob, actual) in enumerate(zip(probabilities[:, 1], actual_results)):
            self.continuous_learner.record_prediction(
                X.iloc[i] if isinstance(X, pd.DataFrame) else X[i],
                prob, actual
            )

        # Check if model update is needed
        if self.continuous_learner.get_model_update_recommendation():
            self.logger.info("Performing continuous learning update...")
            # Retrain with recent data (implement incremental learning)
            self._incremental_update(X, y)

    def _incremental_update(self, X_new, y_new):
        """Perform incremental model updates"""
        # For now, retrain completely with new data
        # In production, implement proper incremental learning
        X_engineered = self.feature_engineer.transform(X_new)
        X_scaled = self.scaler.transform(X_engineered)

        # Update only fast-training models
        fast_models = ['logistic', 'neural_network']
        for name in fast_models:
            if name in self.models:
                try:
                    self.models[name].fit(X_scaled, y_new)
                    self.logger.info(f"Updated {name} with new data")
                except:
                    self.logger.error(f"Failed to update {name}")

    def save_model(self, path: Path):
        """Save the complete model ensemble"""
        model_data = {
            'ensemble_model': self.ensemble_model,
            'individual_models': self.models,
            'feature_engineer': self.feature_engineer,
            'scaler': self.scaler,
            'config': asdict(self.config),
            'continuous_learner_history': self.continuous_learner.prediction_history[-100:]  # Last 100 predictions
        }

        joblib.dump(model_data, path)
        self.logger.info(f"Advanced ensemble model saved to {path}")

    @classmethod
    def load_model(cls, path: Path):
        """Load the complete model ensemble"""
        model_data = joblib.load(path)

        # Reconstruct the predictor
        config = ModelConfig(**model_data['config'])
        predictor = cls(config)

        predictor.ensemble_model = model_data['ensemble_model']
        predictor.models = model_data['individual_models']
        predictor.feature_engineer = model_data['feature_engineer']
        predictor.scaler = model_data['scaler']

        # Restore continuous learning history
        if 'continuous_learner_history' in model_data:
            predictor.continuous_learner.prediction_history = model_data['continuous_learner_history']

        return predictor

def main():
    """Test the advanced ML system"""
    from pathlib import Path

    # Load existing data
    data_path = Path("data/historical_features.csv")
    if data_path.exists():
        df = pd.read_csv(data_path)

        # Prepare features and target
        feature_cols = ["quali_pos", "avg_fp_longrun_delta", "constructor_form",
                       "driver_form", "circuit_effect", "driver_consistency",
                       "constructor_reliability", "driver_momentum", "weather_risk"]

        available_cols = [col for col in feature_cols if col in df.columns]
        X = df[available_cols].fillna(0)
        y = df['points_scored'].astype(int)

        # Create and train advanced ensemble
        config = ModelConfig(use_ensemble=True, use_neural_networks=True)
        predictor = AdvancedEnsemblePredictor(config)

        print("Training advanced ensemble models...")
        predictor.fit(X, y)

        # Test predictions
        test_X = X.head(5)
        predictions = predictor.predict_with_explanation(test_X, feature_names=available_cols)

        print("\nSample predictions with explanations:")
        print(json.dumps(predictions, indent=2))

        # Save model
        model_path = Path("data/advanced_ensemble_model.pkl")
        predictor.save_model(model_path)
        print(f"\nAdvanced model saved to {model_path}")

    else:
        print(f"Data file not found: {data_path}")

if __name__ == "__main__":
    main()