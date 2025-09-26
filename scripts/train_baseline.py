#!/usr/bin/env python3
"""Enhanced F1 prediction model training with modern ML best practices."""

import json
import logging
import warnings
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Any

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    brier_score_loss, log_loss, roc_auc_score, precision_score,
    recall_score, f1_score, classification_report, confusion_matrix
)
from sklearn.model_selection import (
    train_test_split, cross_val_score, GridSearchCV, StratifiedKFold
)
from sklearn.preprocessing import StandardScaler, RobustScaler
from sklearn.pipeline import Pipeline
from sklearn.feature_selection import SelectKBest, f_classif, RFECV
import joblib

# Suppress sklearn warnings for cleaner output
warnings.filterwarnings('ignore', category=FutureWarning)
warnings.filterwarnings('ignore', category=UserWarning)

@dataclass
class ModelConfig:
    """Configuration for model training."""
    data_file: Path = Path("data/historical_features.csv")
    output_dir: Path = Path("data")
    test_size: float = 0.2
    random_state: int = 42
    cv_folds: int = 5
    n_jobs: int = -1

    # Feature configurations
    target_column: str = "points_scored"
    feature_columns: List[str] = None

    # Model configurations
    models_to_train: List[str] = None
    hyperparameter_tuning: bool = True
    feature_selection: bool = True

    def __post_init__(self):
        if self.feature_columns is None:
            self.feature_columns = [
                "quali_pos", "avg_fp_longrun_delta", "constructor_form",
                "driver_form", "circuit_effect", "driver_consistency",
                "constructor_reliability", "driver_momentum", "weather_risk"
            ]

        if self.models_to_train is None:
            self.models_to_train = ["logistic", "random_forest", "gradient_boosting"]

@dataclass
class ModelResults:
    """Container for model training results."""
    model_name: str
    cv_scores: Dict[str, float]
    test_scores: Dict[str, float]
    feature_importance: Dict[str, float]
    best_params: Optional[Dict[str, Any]] = None
    model_path: Optional[str] = None

class EnhancedF1ModelTrainer:
    """Enhanced F1 model trainer with multiple algorithms and validation."""

    def __init__(self, config: ModelConfig):
        self.config = config
        self.logger = self._setup_logging()
        self.models = self._initialize_models()
        self.scalers = {
            "standard": StandardScaler(),
            "robust": RobustScaler()
        }

    def _setup_logging(self) -> logging.Logger:
        """Setup logging configuration."""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('model_training.log'),
                logging.StreamHandler()
            ]
        )
        return logging.getLogger(__name__)

    def _initialize_models(self) -> Dict[str, Pipeline]:
        """Initialize model pipelines with hyperparameter grids."""
        models = {}

        if "logistic" in self.config.models_to_train:
            models["logistic"] = {
                "pipeline": Pipeline([
                    ("scaler", StandardScaler()),
                    ("selector", SelectKBest(f_classif, k='all')),
                    ("classifier", LogisticRegression(random_state=self.config.random_state, max_iter=1000))
                ]),
                "param_grid": {
                    "classifier__C": [0.1, 1.0, 10.0, 100.0],
                    "classifier__penalty": ['l1', 'l2'],
                    "classifier__solver": ['liblinear', 'saga'],
                    "selector__k": [5, 7, 9, 'all']
                }
            }

        if "random_forest" in self.config.models_to_train:
            models["random_forest"] = {
                "pipeline": Pipeline([
                    ("scaler", RobustScaler()),
                    ("classifier", RandomForestClassifier(random_state=self.config.random_state, n_jobs=self.config.n_jobs))
                ]),
                "param_grid": {
                    "classifier__n_estimators": [100, 200, 300],
                    "classifier__max_depth": [5, 10, 15, None],
                    "classifier__min_samples_split": [2, 5, 10],
                    "classifier__min_samples_leaf": [1, 2, 4]
                }
            }

        if "gradient_boosting" in self.config.models_to_train:
            models["gradient_boosting"] = {
                "pipeline": Pipeline([
                    ("scaler", StandardScaler()),
                    ("classifier", GradientBoostingClassifier(random_state=self.config.random_state))
                ]),
                "param_grid": {
                    "classifier__n_estimators": [100, 200],
                    "classifier__learning_rate": [0.05, 0.1, 0.2],
                    "classifier__max_depth": [3, 5, 7],
                    "classifier__min_samples_split": [2, 5]
                }
            }

        return models

    def load_and_prepare_data(self) -> Tuple[np.ndarray, np.ndarray, List[str]]:
        """Load and prepare training data."""
        self.logger.info(f"Loading data from {self.config.data_file}")

        if not self.config.data_file.exists():
            raise FileNotFoundError(f"Data file not found: {self.config.data_file}")

        df = pd.read_csv(self.config.data_file)
        self.logger.info(f"Loaded {len(df)} samples with {len(df.columns)} columns")

        # Check if enhanced features are available
        available_features = [col for col in self.config.feature_columns if col in df.columns]
        missing_features = [col for col in self.config.feature_columns if col not in df.columns]

        if missing_features:
            self.logger.warning(f"Missing features (using fallback): {missing_features}")
            # Fallback to original features for backward compatibility
            available_features = ["quali_pos", "avg_fp_longrun_delta", "constructor_form",
                                "driver_form", "circuit_effect", "weather_risk"]
            available_features = [col for col in available_features if col in df.columns]

        # Handle different target column names for backward compatibility
        if self.config.target_column not in df.columns:
            if "points" in df.columns:
                self.logger.info("Using legacy target: points > 0")
                y = (df["points"] > 0).astype(int).values
            else:
                raise ValueError(f"Target column '{self.config.target_column}' not found")
        else:
            y = df[self.config.target_column].astype(int).values

        X = df[available_features].fillna(0).values

        self.logger.info(f"Features used: {available_features}")
        self.logger.info(f"Target distribution: {np.bincount(y)}")

        return X, y, available_features

    def evaluate_model(self, model: Pipeline, X_train: np.ndarray, X_test: np.ndarray,
                      y_train: np.ndarray, y_test: np.ndarray) -> Dict[str, float]:
        """Comprehensive model evaluation."""
        # Cross-validation scores
        cv = StratifiedKFold(n_splits=self.config.cv_folds, shuffle=True, random_state=self.config.random_state)

        cv_scores = {
            "cv_brier_score": -cross_val_score(model, X_train, y_train,
                                              scoring='neg_brier_score', cv=cv, n_jobs=self.config.n_jobs).mean(),
            "cv_log_loss": -cross_val_score(model, X_train, y_train,
                                           scoring='neg_log_loss', cv=cv, n_jobs=self.config.n_jobs).mean(),
            "cv_roc_auc": cross_val_score(model, X_train, y_train,
                                         scoring='roc_auc', cv=cv, n_jobs=self.config.n_jobs).mean(),
            "cv_f1": cross_val_score(model, X_train, y_train,
                                    scoring='f1', cv=cv, n_jobs=self.config.n_jobs).mean()
        }

        # Test set evaluation
        y_pred_proba = model.predict_proba(X_test)[:, 1]
        y_pred = model.predict(X_test)

        test_scores = {
            "test_brier_score": brier_score_loss(y_test, y_pred_proba),
            "test_log_loss": log_loss(y_test, y_pred_proba),
            "test_roc_auc": roc_auc_score(y_test, y_pred_proba),
            "test_precision": precision_score(y_test, y_pred),
            "test_recall": recall_score(y_test, y_pred),
            "test_f1": f1_score(y_test, y_pred)
        }

        return {**cv_scores, **test_scores}

    def extract_feature_importance(self, model: Pipeline, feature_names: List[str]) -> Dict[str, float]:
        """Extract feature importance from trained model."""
        classifier = model.named_steps['classifier']

        if hasattr(classifier, 'feature_importances_'):
            # Tree-based models
            importance_values = classifier.feature_importances_
        elif hasattr(classifier, 'coef_'):
            # Linear models - use absolute coefficients
            importance_values = np.abs(classifier.coef_[0])
        else:
            self.logger.warning("Cannot extract feature importance for this model type")
            return {}

        # Handle feature selection
        if 'selector' in model.named_steps:
            selector = model.named_steps['selector']
            if hasattr(selector, 'get_support'):
                selected_features = np.array(feature_names)[selector.get_support()]
                return dict(zip(selected_features, importance_values))

        return dict(zip(feature_names, importance_values))

    def train_models(self) -> List[ModelResults]:
        """Train and evaluate all configured models."""
        X, y, feature_names = self.load_and_prepare_data()

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=self.config.test_size,
            random_state=self.config.random_state, stratify=y
        )

        self.logger.info(f"Training set: {len(X_train)} samples, Test set: {len(X_test)} samples")

        results = []

        for model_name, model_config in self.models.items():
            self.logger.info(f"Training {model_name} model...")

            pipeline = model_config["pipeline"]

            if self.config.hyperparameter_tuning:
                # Hyperparameter tuning with GridSearchCV
                self.logger.info(f"Performing hyperparameter tuning for {model_name}...")

                cv = StratifiedKFold(n_splits=3, shuffle=True, random_state=self.config.random_state)
                grid_search = GridSearchCV(
                    pipeline, model_config["param_grid"],
                    scoring='neg_brier_score', cv=cv,
                    n_jobs=self.config.n_jobs, verbose=0
                )

                grid_search.fit(X_train, y_train)
                best_model = grid_search.best_estimator_
                best_params = grid_search.best_params_

                self.logger.info(f"Best parameters for {model_name}: {best_params}")
            else:
                # Use default parameters
                pipeline.fit(X_train, y_train)
                best_model = pipeline
                best_params = None

            # Evaluate model
            scores = self.evaluate_model(best_model, X_train, X_test, y_train, y_test)
            feature_importance = self.extract_feature_importance(best_model, feature_names)

            # Save model
            model_path = self.config.output_dir / f"{model_name}_model.pkl"
            joblib.dump(best_model, model_path)

            result = ModelResults(
                model_name=model_name,
                cv_scores={k: v for k, v in scores.items() if k.startswith('cv_')},
                test_scores={k: v for k, v in scores.items() if k.startswith('test_')},
                feature_importance=feature_importance,
                best_params=best_params,
                model_path=str(model_path)
            )

            results.append(result)

            # Log results
            self.logger.info(f"Results for {model_name}:")
            self.logger.info(f"  CV Brier Score: {result.cv_scores.get('cv_brier_score', 'N/A'):.4f}")
            self.logger.info(f"  Test Brier Score: {result.test_scores.get('test_brier_score', 'N/A'):.4f}")
            self.logger.info(f"  Test ROC AUC: {result.test_scores.get('test_roc_auc', 'N/A'):.4f}")
            self.logger.info(f"  Test F1: {result.test_scores.get('test_f1', 'N/A'):.4f}")

        return results

    def save_results(self, results: List[ModelResults], feature_names: List[str]) -> None:
        """Save training results and model artifacts."""
        self.config.output_dir.mkdir(parents=True, exist_ok=True)

        # Find best model based on CV Brier score
        best_result = min(results, key=lambda r: r.cv_scores.get('cv_brier_score', float('inf')))

        # Save best model as legacy format for backward compatibility
        legacy_model = []
        for feature, importance in best_result.feature_importance.items():
            legacy_model.append({
                "feature": feature,
                "weight": float(importance)
            })

        legacy_path = self.config.output_dir / "model.json"
        with open(legacy_path, "w") as f:
            json.dump(legacy_model, f, indent=2)

        # Save comprehensive results
        results_data = {
            "best_model": best_result.model_name,
            "training_config": asdict(self.config),
            "feature_names": feature_names,
            "models": {}
        }

        for result in results:
            results_data["models"][result.model_name] = {
                "cv_scores": result.cv_scores,
                "test_scores": result.test_scores,
                "feature_importance": result.feature_importance,
                "best_params": result.best_params,
                "model_path": result.model_path
            }

        results_path = self.config.output_dir / "training_results.json"
        with open(results_path, "w") as f:
            json.dump(results_data, f, indent=2, default=str)

        self.logger.info(f"Results saved to {results_path}")
        self.logger.info(f"Best model: {best_result.model_name}")
        self.logger.info(f"Legacy model format saved to {legacy_path}")

def main():
    """Main execution function."""
    config = ModelConfig()
    trainer = EnhancedF1ModelTrainer(config)

    results = trainer.train_models()
    trainer.save_results(results, config.feature_columns)

    print("\n" + "="*60)
    print("MODEL TRAINING COMPLETE")
    print("="*60)

    for result in results:
        print(f"\n{result.model_name.upper()} RESULTS:")
        print(f"  CV Brier Score: {result.cv_scores.get('cv_brier_score', 'N/A'):.4f}")
        print(f"  Test Brier Score: {result.test_scores.get('test_brier_score', 'N/A'):.4f}")
        print(f"  Test ROC AUC: {result.test_scores.get('test_roc_auc', 'N/A'):.4f}")
        print(f"  Test F1 Score: {result.test_scores.get('test_f1', 'N/A'):.4f}")

    best_model = min(results, key=lambda r: r.cv_scores.get('cv_brier_score', float('inf')))
    print(f"\nBEST MODEL: {best_model.model_name}")

if __name__ == "__main__":
    main()