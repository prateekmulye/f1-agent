"""
Pydantic schemas for F1 data validation
"""
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from pydantic import BaseModel, Field, validator


# Base schemas
class BaseF1Schema(BaseModel):
    """Base schema for all F1 entities"""
    class Config:
        orm_mode = True
        from_attributes = True


# Driver schemas
class DriverBase(BaseF1Schema):
    """Base driver schema"""
    id: str = Field(..., description="Driver ID (3-letter code)")
    code: str = Field(..., description="Driver code (3-letter abbreviation)")
    name: str = Field(..., description="Full driver name")
    constructor: str = Field(..., description="Team/constructor name")


class DriverEnhanced(DriverBase):
    """Enhanced driver schema with additional metadata"""
    number: int = Field(..., description="Race number")
    nationality: str = Field(..., description="Driver nationality")
    flag: str = Field(..., description="Country flag emoji")
    constructor_points: int = Field(alias="constructorPoints", description="Constructor championship points")


class DriverResponse(DriverEnhanced):
    """Driver response schema"""
    pass


# Team schemas
class TeamColors(BaseF1Schema):
    """Team color scheme"""
    main: str = Field(..., description="Primary team color (hex)")
    light: str = Field(..., description="Light variant (hex)")
    dark: str = Field(..., description="Dark variant (hex)")
    logo: str = Field(..., description="Team logo emoji")


class TeamBase(BaseF1Schema):
    """Base team schema"""
    id: str = Field(..., description="Team identifier")
    name: str = Field(..., description="Team name")
    position: int = Field(..., description="Championship position")
    points: int = Field(..., description="Constructor points")


class TeamResponse(TeamBase):
    """Team response with full details"""
    driver_count: int = Field(alias="driverCount", description="Number of drivers")
    drivers: List[str] = Field(..., description="Driver names")
    driver_codes: List[str] = Field(alias="driverCodes", description="Driver codes")
    colors: TeamColors = Field(..., description="Team color scheme")


# Race schemas
class RaceBase(BaseF1Schema):
    """Base race schema"""
    id: str = Field(..., description="Race identifier")
    name: str = Field(..., description="Race name")
    season: int = Field(..., description="Season year")
    round: int = Field(..., description="Round number")
    date: datetime = Field(..., description="Race date")
    country: str = Field(..., description="Country name")


class RaceResponse(RaceBase):
    """Race response schema"""
    pass


# Prediction schemas
class PredictionFactor(BaseF1Schema):
    """Prediction contributing factor"""
    feature: str = Field(..., description="Feature name")
    contribution: float = Field(..., description="Contribution value")


class PredictionBase(BaseF1Schema):
    """Base prediction schema"""
    driver_id: str = Field(..., description="Driver ID")
    race_id: str = Field(..., description="Race ID")
    prob_points: float = Field(..., ge=0, le=1, description="Probability of scoring points")
    score: float = Field(..., description="Prediction score")


class PredictionResponse(PredictionBase):
    """Prediction response with factors"""
    top_factors: List[PredictionFactor] = Field(..., description="Top contributing factors")


# Standings schemas
class DriverStandingBase(BaseF1Schema):
    """Driver championship standing"""
    position: int = Field(..., description="Championship position")
    driver_id: str = Field(..., description="Driver ID")
    driver_code: str = Field(..., description="Driver code")
    driver_name: str = Field(..., description="Driver full name")
    number: int = Field(..., description="Race number")
    constructor: str = Field(..., description="Team name")
    points: int = Field(..., description="Driver points")
    nationality: str = Field(..., description="Driver nationality")
    flag: str = Field(..., description="Country flag emoji")
    wins: int = Field(default=0, description="Number of wins")
    podiums: int = Field(default=0, description="Number of podiums")
    season: int = Field(..., description="Season year")


class ConstructorStandingBase(BaseF1Schema):
    """Constructor championship standing"""
    position: int = Field(..., description="Championship position")
    name: str = Field(..., description="Constructor name")
    points: int = Field(..., description="Constructor points")
    driver_count: int = Field(..., description="Number of drivers")
    drivers: List[str] = Field(..., description="Driver names")
    driver_codes: List[str] = Field(..., description="Driver codes")
    driver_flags: List[str] = Field(..., description="Driver flags")
    wins: int = Field(default=0, description="Number of wins")
    podiums: int = Field(default=0, description="Number of podiums")
    colors: TeamColors = Field(..., description="Team colors")


class StandingsResponse(BaseF1Schema):
    """Combined standings response"""
    year: int = Field(..., description="Season year")
    last_updated: datetime = Field(..., description="Last update timestamp")
    drivers: Optional[List[DriverStandingBase]] = Field(None, description="Driver standings")
    constructors: Optional[List[ConstructorStandingBase]] = Field(None, description="Constructor standings")


# OpenF1 integration schemas
class OpenF1Meeting(BaseF1Schema):
    """OpenF1 meeting data"""
    meeting_key: str = Field(..., description="Meeting identifier")
    year: int = Field(..., description="Year")
    round_number: int = Field(..., description="Round number")
    meeting_name: str = Field(..., description="Meeting name")
    official_name: Optional[str] = Field(None, description="Official meeting name")
    country_key: str = Field(..., description="Country code")
    country_name: str = Field(..., description="Country name")
    circuit_key: Optional[str] = Field(None, description="Circuit identifier")
    circuit_short_name: Optional[str] = Field(None, description="Circuit short name")
    date_start: date = Field(..., description="Start date")
    date_end: date = Field(..., description="End date")
    gmt_offset: Optional[str] = Field(None, description="GMT offset")
    location: Optional[str] = Field(None, description="Location")


class OpenF1MeetingsResponse(BaseF1Schema):
    """OpenF1 meetings response"""
    year: int = Field(..., description="Season year")
    count: int = Field(..., description="Number of meetings")
    synced: bool = Field(..., description="Whether data was synced from API")
    data: List[OpenF1Meeting] = Field(..., description="Meeting data")


# Error schemas
class ErrorDetail(BaseF1Schema):
    """Error detail schema"""
    message: str = Field(..., description="Error message")
    code: Optional[str] = Field(None, description="Error code")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")


class ErrorResponse(BaseF1Schema):
    """Error response schema"""
    error: ErrorDetail = Field(..., description="Error information")


# Health check schema
class HealthCheckResponse(BaseF1Schema):
    """Health check response"""
    status: str = Field(..., description="Health status")
    timestamp: datetime = Field(..., description="Check timestamp")
    version: str = Field(..., description="API version")
    database: bool = Field(..., description="Database connectivity")
    external_apis: Dict[str, bool] = Field(..., description="External API status")