"""
F1 Database Models using SQLAlchemy
"""
from datetime import datetime, date
from typing import Optional
from sqlalchemy import Column, String, Integer, Float, DateTime, Date, Boolean, Text, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func

Base = declarative_base()


class Driver(Base):
    """Driver model"""
    __tablename__ = "drivers"

    id: Mapped[str] = mapped_column(String(10), primary_key=True)
    code: Mapped[str] = mapped_column(String(3), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    constructor: Mapped[str] = mapped_column(String(50), nullable=False)
    number: Mapped[int] = mapped_column(Integer, nullable=False)
    nationality: Mapped[str] = mapped_column(String(50), nullable=False)
    flag: Mapped[str] = mapped_column(String(10), nullable=False)
    constructor_points: Mapped[int] = mapped_column(Integer, default=0)
    season: Mapped[int] = mapped_column(Integer, default=2025)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    standings = relationship("DriverStanding", back_populates="driver")
    predictions = relationship("Prediction", back_populates="driver")


class Team(Base):
    """Team/Constructor model"""
    __tablename__ = "teams"

    id: Mapped[str] = mapped_column(String(10), primary_key=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    points: Mapped[int] = mapped_column(Integer, default=0)
    driver_count: Mapped[int] = mapped_column(Integer, default=2)
    drivers: Mapped[str] = mapped_column(JSON)  # List of driver names
    driver_codes: Mapped[str] = mapped_column(JSON)  # List of driver codes
    driver_flags: Mapped[str] = mapped_column(JSON)  # List of driver flags
    colors: Mapped[str] = mapped_column(JSON)  # Team color scheme
    season: Mapped[int] = mapped_column(Integer, default=2025)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    standings = relationship("ConstructorStanding", back_populates="team")


class Race(Base):
    """Race model"""
    __tablename__ = "races"

    id: Mapped[str] = mapped_column(String(20), primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    season: Mapped[int] = mapped_column(Integer, nullable=False)
    round: Mapped[int] = mapped_column(Integer, nullable=False)
    date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    country: Mapped[str] = mapped_column(String(50), nullable=False)
    circuit: Mapped[str] = mapped_column(String(100))
    status: Mapped[str] = mapped_column(String(20), default="scheduled")  # scheduled, completed, cancelled
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    predictions = relationship("Prediction", back_populates="race")


class DriverStanding(Base):
    """Driver championship standings"""
    __tablename__ = "driver_standings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    driver_id: Mapped[str] = mapped_column(String(10), ForeignKey("drivers.id"), nullable=False)
    points: Mapped[int] = mapped_column(Integer, default=0)
    wins: Mapped[int] = mapped_column(Integer, default=0)
    podiums: Mapped[int] = mapped_column(Integer, default=0)
    season: Mapped[int] = mapped_column(Integer, default=2025)
    last_updated: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    driver = relationship("Driver", back_populates="standings")


class ConstructorStanding(Base):
    """Constructor championship standings"""
    __tablename__ = "constructor_standings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    team_id: Mapped[str] = mapped_column(String(10), ForeignKey("teams.id"), nullable=False)
    points: Mapped[int] = mapped_column(Integer, default=0)
    wins: Mapped[int] = mapped_column(Integer, default=0)
    podiums: Mapped[int] = mapped_column(Integer, default=0)
    season: Mapped[int] = mapped_column(Integer, default=2025)
    last_updated: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    team = relationship("Team", back_populates="standings")


class Prediction(Base):
    """F1 race predictions"""
    __tablename__ = "predictions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    driver_id: Mapped[str] = mapped_column(String(10), ForeignKey("drivers.id"), nullable=False)
    race_id: Mapped[str] = mapped_column(String(20), ForeignKey("races.id"), nullable=False)
    prob_points: Mapped[float] = mapped_column(Float, nullable=False)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    predicted_position: Mapped[int] = mapped_column(Integer)
    actual_position: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    features: Mapped[str] = mapped_column(JSON)  # Feature values used for prediction
    top_factors: Mapped[str] = mapped_column(JSON)  # Top contributing factors
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    driver = relationship("Driver", back_populates="predictions")
    race = relationship("Race", back_populates="predictions")


class ModelCoefficient(Base):
    """Machine learning model coefficients"""
    __tablename__ = "model_coefficients"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    feature_name: Mapped[str] = mapped_column(String(100), nullable=False)
    coefficient: Mapped[float] = mapped_column(Float, nullable=False)
    model_version: Mapped[str] = mapped_column(String(20), default="v1.0")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class OpenF1Meeting(Base):
    """OpenF1 API meeting data"""
    __tablename__ = "openf1_meetings"

    meeting_key: Mapped[str] = mapped_column(String(20), primary_key=True)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    round_number: Mapped[int] = mapped_column(Integer, nullable=False)
    meeting_name: Mapped[str] = mapped_column(String(100), nullable=False)
    official_name: Mapped[Optional[str]] = mapped_column(String(200))
    country_key: Mapped[str] = mapped_column(String(10), nullable=False)
    country_name: Mapped[str] = mapped_column(String(50), nullable=False)
    circuit_key: Mapped[Optional[str]] = mapped_column(String(20))
    circuit_short_name: Mapped[Optional[str]] = mapped_column(String(50))
    date_start: Mapped[date] = mapped_column(Date, nullable=False)
    date_end: Mapped[date] = mapped_column(Date, nullable=False)
    gmt_offset: Mapped[Optional[str]] = mapped_column(String(10))
    location: Mapped[Optional[str]] = mapped_column(String(100))
    synced_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class User(Base):
    """User authentication and session management"""
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    api_calls_count: Mapped[int] = mapped_column(Integer, default=0)
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


# Database initialization functions
def create_tables(engine):
    """Create all database tables"""
    Base.metadata.create_all(bind=engine)


def drop_tables(engine):
    """Drop all database tables (use with caution!)"""
    Base.metadata.drop_all(bind=engine)