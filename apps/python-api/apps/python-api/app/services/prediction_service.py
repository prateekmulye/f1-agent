"""
Prediction Service - Business logic for F1 race predictions
"""
import math
from typing import List, Dict, Optional, Any, Tuple
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.f1_models import Driver, Race, Prediction, ModelCoefficient
from app.schemas.f1_schemas import PredictionResponse, PredictionFactor


class PredictionService:
    """Service for F1 race predictions using ML models"""

    def __init__(self, db_session: AsyncSession):
        self.db = db_session
        self._model_coefficients = None

    async def load_model_coefficients(self) -> Dict[str, float]:
        """Load model coefficients from database"""
        if self._model_coefficients is None:
            query = select(ModelCoefficient).where(ModelCoefficient.model_version == "v1.0")
            result = await self.db.execute(query)
            coefficients = result.scalars().all()

            self._model_coefficients = {
                coeff.feature_name: coeff.coefficient
                for coeff in coefficients
            }

            # Default coefficients if none in database
            if not self._model_coefficients:
                self._model_coefficients = {
                    "quali_position": -0.15,
                    "long_run_pace": 0.12,
                    "team_form": 0.18,
                    "driver_form": 0.14,
                    "circuit_effect": 0.08,
                    "weather_risk": -0.06
                }

        return self._model_coefficients

    def generate_features(self, driver_code: str, constructor_points: int) -> Dict[str, float]:
        """Generate realistic features for a driver/team combination"""

        # Team strength based on constructor points (normalized 0-1)
        team_strength = min(constructor_points / 600.0, 1.0)

        # Driver skill ratings (based on real performance)
        driver_skills = {
            'VER': 0.95, 'HAM': 0.92, 'LEC': 0.90, 'RUS': 0.88, 'NOR': 0.87,
            'PIA': 0.85, 'SAI': 0.84, 'PER': 0.82, 'ALO': 0.89, 'STR': 0.83,
            'GAS': 0.78, 'OCO': 0.76, 'ALB': 0.75, 'TSU': 0.73, 'BOT': 0.74,
            'ZHO': 0.70, 'HUL': 0.72, 'MAG': 0.71, 'RIC': 0.77, 'LAW': 0.65
        }
        driver_skill = driver_skills.get(driver_code, 0.6)

        # Generate realistic features
        features = {
            # Qualifying position (1-20, lower is better)
            "quali_position": max(1, min(20,
                int(11 - (team_strength * 8) - (driver_skill - 0.7) * 5 +
                    (hash(driver_code) % 100 - 50) / 20))),

            # Long run pace (relative to fastest, 0-1 where 1 is fastest)
            "long_run_pace": min(1.0, team_strength * 0.7 + driver_skill * 0.3 +
                                (hash(driver_code + "pace") % 100 - 50) / 500),

            # Team form (recent performance, 0-1)
            "team_form": min(1.0, team_strength + (hash(str(constructor_points)) % 100 - 50) / 200),

            # Driver form (recent driver performance, 0-1)
            "driver_form": min(1.0, driver_skill + (hash(driver_code + "form") % 100 - 50) / 200),

            # Circuit effect (how well driver/team suits this circuit, -0.5 to 0.5)
            "circuit_effect": (hash(driver_code + "circuit") % 100 - 50) / 100,

            # Weather risk (impact of weather conditions, 0-1 where 1 is high risk)
            "weather_risk": abs((hash(driver_code + "weather") % 100) / 100)
        }

        return features

    def calculate_prediction(self, features: Dict[str, float], coefficients: Dict[str, float]) -> Tuple[float, float]:
        """Calculate prediction score and probability of points"""

        # Linear combination of features and coefficients
        score = sum(features.get(feature, 0) * coeff for feature, coeff in coefficients.items())

        # Apply sigmoid to get probability
        prob_points = 1 / (1 + math.exp(-score))

        return score, prob_points

    def get_top_factors(self, features: Dict[str, float], coefficients: Dict[str, float]) -> List[PredictionFactor]:
        """Get top contributing factors to the prediction"""

        factor_contributions = []
        for feature, value in features.items():
            if feature in coefficients:
                contribution = value * coefficients[feature]
                factor_contributions.append({
                    "feature": self._format_feature_name(feature),
                    "contribution": contribution,
                    "abs_contribution": abs(contribution)
                })

        # Sort by absolute contribution and take top 3
        sorted_factors = sorted(factor_contributions, key=lambda x: x["abs_contribution"], reverse=True)[:3]

        return [
            PredictionFactor(feature=factor["feature"], contribution=factor["contribution"])
            for factor in sorted_factors
        ]

    def _format_feature_name(self, feature: str) -> str:
        """Format feature name for display"""
        name_mapping = {
            "quali_position": "Qualifying Position",
            "long_run_pace": "Long Run Pace",
            "team_form": "Team Form",
            "driver_form": "Driver Form",
            "circuit_effect": "Circuit Effect",
            "weather_risk": "Weather Risk"
        }
        return name_mapping.get(feature, feature.replace("_", " ").title())

    async def predict_race(self, race_id: str) -> List[PredictionResponse]:
        """Generate predictions for all drivers in a race"""

        # Load model coefficients
        coefficients = await self.load_model_coefficients()

        # Get all drivers for current season
        query = select(Driver).where(Driver.season == 2025)
        result = await self.db.execute(query)
        drivers = result.scalars().all()

        predictions = []

        for driver in drivers:
            # Generate features for this driver
            features = self.generate_features(driver.code, driver.constructor_points)

            # Calculate prediction
            score, prob_points = self.calculate_prediction(features, coefficients)

            # Get top contributing factors
            top_factors = self.get_top_factors(features, coefficients)

            # Create prediction response
            prediction = PredictionResponse(
                driver_id=driver.id,
                race_id=race_id,
                prob_points=prob_points,
                score=score,
                top_factors=top_factors
            )

            predictions.append(prediction)

        # Sort by probability of points (descending)
        predictions.sort(key=lambda x: x.prob_points, reverse=True)

        return predictions

    async def save_prediction(self, prediction_data: Dict[str, Any]) -> Prediction:
        """Save a prediction to the database"""
        prediction = Prediction(**prediction_data)
        self.db.add(prediction)
        await self.db.commit()
        await self.db.refresh(prediction)
        return prediction

    async def get_predictions_for_race(self, race_id: str) -> List[PredictionResponse]:
        """Get existing predictions for a race"""
        query = (
            select(Prediction, Driver)
            .join(Driver, Prediction.driver_id == Driver.id)
            .where(Prediction.race_id == race_id)
            .order_by(Prediction.prob_points.desc())
        )
        result = await self.db.execute(query)
        predictions_data = result.all()

        predictions = []
        for prediction, driver in predictions_data:
            # Parse top factors from JSON
            top_factors = [
                PredictionFactor(**factor) for factor in prediction.top_factors
            ] if prediction.top_factors else []

            predictions.append(PredictionResponse(
                driver_id=prediction.driver_id,
                race_id=prediction.race_id,
                prob_points=prediction.prob_points,
                score=prediction.score,
                top_factors=top_factors
            ))

        return predictions

    async def update_prediction_result(self, prediction_id: int, actual_position: int) -> Optional[Prediction]:
        """Update prediction with actual race result"""
        query = select(Prediction).where(Prediction.id == prediction_id)
        result = await self.db.execute(query)
        prediction = result.scalar_one_or_none()

        if not prediction:
            return None

        prediction.actual_position = actual_position
        prediction.updated_at = datetime.now()
        await self.db.commit()
        await self.db.refresh(prediction)
        return prediction

    async def get_prediction_accuracy(self, race_id: str) -> Dict[str, float]:
        """Calculate prediction accuracy metrics for a race"""
        query = (
            select(Prediction)
            .where(Prediction.race_id == race_id)
            .where(Prediction.actual_position.isnot(None))
        )
        result = await self.db.execute(query)
        predictions = result.scalars().all()

        if not predictions:
            return {"accuracy": 0.0, "mae": 0.0, "rmse": 0.0}

        # Calculate metrics
        total_predictions = len(predictions)
        correct_predictions = sum(1 for p in predictions if p.predicted_position == p.actual_position)

        mae = sum(abs(p.predicted_position - p.actual_position) for p in predictions) / total_predictions
        rmse = math.sqrt(sum((p.predicted_position - p.actual_position) ** 2 for p in predictions) / total_predictions)

        return {
            "accuracy": correct_predictions / total_predictions,
            "mae": mae,
            "rmse": rmse,
            "total_predictions": total_predictions
        }