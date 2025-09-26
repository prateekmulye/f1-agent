"""
Controllers package
"""
from .f1_controller import f1_router
from .auth_controller import auth_router
from .prediction_controller import prediction_router
from .data_controller import data_router
from .health_controller import health_router

__all__ = [
    "f1_router",
    "auth_router",
    "prediction_router",
    "data_router",
    "health_router"
]