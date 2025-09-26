"""
Base SQLAlchemy model for F1 prediction system
"""
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, DateTime
from sqlalchemy.sql import func

Base = declarative_base()

class TimeStampMixin:
    """Mixin to add created_at and updated_at timestamps"""
    created_at = Column(DateTime, default=func.current_timestamp())
    updated_at = Column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())