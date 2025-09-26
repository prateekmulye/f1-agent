"""
Prediction Controller - API endpoints for F1 race predictions
"""
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.prediction_service import PredictionService
from app.schemas.f1_schemas import PredictionResponse, ErrorResponse
from config.database import get_database
from app.middleware.rate_limiting import apply_rate_limit

prediction_router = APIRouter(prefix="/api/v1/predictions", tags=["Predictions"])


async def get_prediction_service(db: AsyncSession = Depends(get_database)) -> PredictionService:
    """Get prediction service instance"""
    return PredictionService(db)


@prediction_router.post(
    "/race/{race_id}",
    response_model=List[PredictionResponse],
    summary="Get race predictions or results",
    description="Get ML-based predictions for upcoming races or actual results for completed races"
)
@apply_rate_limit("prediction")
async def predict_race(
    race_id: str,
    prediction_service: PredictionService = Depends(get_prediction_service)
):
    """Get predictions or actual results for all drivers in a race"""
    try:
        predictions = await prediction_service.predict_race(race_id)

        if not predictions:
            raise HTTPException(
                status_code=404,
                detail="No data found for race or race does not exist"
            )

        # Check if these are actual results or predictions
        is_historical = await prediction_service.has_historical_data(race_id)

        return {
            "race_id": race_id,
            "is_actual_results": is_historical,
            "data_type": "historical_results" if is_historical else "ml_predictions",
            "predictions": predictions
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving race data: {str(e)}"
        )


@prediction_router.get(
    "/race/{race_id}",
    response_model=List[PredictionResponse],
    summary="Get race predictions or results",
    description="Retrieve predictions for upcoming races or actual results for completed races"
)
@apply_rate_limit("prediction")
async def get_race_predictions(
    race_id: str,
    prediction_service: PredictionService = Depends(get_prediction_service)
):
    """Get predictions or actual results for a race"""
    try:
        predictions = await prediction_service.get_predictions_for_race(race_id)

        if not predictions:
            # If no cached predictions exist, generate new ones or get historical data
            predictions = await prediction_service.predict_race(race_id)

        # Check if these are actual results or predictions
        is_historical = await prediction_service.has_historical_data(race_id)

        return {
            "race_id": race_id,
            "is_actual_results": is_historical,
            "data_type": "historical_results" if is_historical else "ml_predictions",
            "predictions": predictions
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving race data: {str(e)}"
        )


@prediction_router.get(
    "/current",
    response_model=List[PredictionResponse],
    summary="Get current race predictions",
    description="Get predictions for the current or next upcoming race"
)
@apply_rate_limit("prediction")
async def get_current_race_predictions(
    prediction_service: PredictionService = Depends(get_prediction_service)
):
    """Get predictions for the current/next race"""
    try:
        # For now, use a default race ID - in production, this would find the current race
        current_race_id = "2025_current"
        predictions = await prediction_service.predict_race(current_race_id)
        return predictions
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving current race predictions: {str(e)}"
        )


@prediction_router.put(
    "/{prediction_id}/result",
    summary="Update prediction result",
    description="Update a prediction with the actual race result"
)
@apply_rate_limit("prediction")
async def update_prediction_result(
    prediction_id: int,
    actual_position: int = Query(..., description="Actual finishing position", ge=1, le=20),
    prediction_service: PredictionService = Depends(get_prediction_service)
):
    """Update prediction with actual race result"""
    try:
        updated_prediction = await prediction_service.update_prediction_result(
            prediction_id, actual_position
        )

        if not updated_prediction:
            raise HTTPException(
                status_code=404,
                detail="Prediction not found"
            )

        return {
            "message": "Prediction updated successfully",
            "prediction_id": prediction_id,
            "actual_position": actual_position
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating prediction: {str(e)}"
        )


@prediction_router.get(
    "/accuracy/{race_id}",
    summary="Get prediction accuracy",
    description="Get accuracy metrics for predictions of a completed race"
)
@apply_rate_limit("prediction")
async def get_prediction_accuracy(
    race_id: str,
    prediction_service: PredictionService = Depends(get_prediction_service)
):
    """Get prediction accuracy metrics for a race"""
    try:
        accuracy_metrics = await prediction_service.get_prediction_accuracy(race_id)

        if accuracy_metrics["total_predictions"] == 0:
            raise HTTPException(
                status_code=404,
                detail="No completed predictions found for this race"
            )

        return {
            "race_id": race_id,
            "metrics": accuracy_metrics
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error calculating accuracy: {str(e)}"
        )


@prediction_router.get(
    "/driver/{driver_id}",
    response_model=List[PredictionResponse],
    summary="Get driver predictions",
    description="Get all predictions for a specific driver across all races"
)
@apply_rate_limit("prediction")
async def get_driver_predictions(
    driver_id: str,
    season: int = Query(2025, description="Season year", ge=2020, le=2030),
    limit: int = Query(10, description="Maximum number of predictions", ge=1, le=50),
    prediction_service: PredictionService = Depends(get_prediction_service)
):
    """Get predictions for a specific driver"""
    try:
        # This would require additional service method - simplified for now
        return []
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving driver predictions: {str(e)}"
        )


@prediction_router.get(
    "/model/coefficients",
    summary="Get model coefficients",
    description="Get the current ML model coefficients and their importance"
)
@apply_rate_limit("data")
async def get_model_coefficients(
    prediction_service: PredictionService = Depends(get_prediction_service)
):
    """Get current model coefficients"""
    try:
        coefficients = await prediction_service.load_model_coefficients()

        # Format for API response
        formatted_coeffs = [
            {
                "feature": prediction_service._format_feature_name(feature),
                "coefficient": coeff,
                "importance": abs(coeff)
            }
            for feature, coeff in coefficients.items()
        ]

        # Sort by importance
        formatted_coeffs.sort(key=lambda x: x["importance"], reverse=True)

        return {
            "model_version": "v1.0",
            "total_features": len(formatted_coeffs),
            "coefficients": formatted_coeffs
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving model coefficients: {str(e)}"
        )


# Error handlers removed - handled at application level