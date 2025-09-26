#!/usr/bin/env python3
"""
Advanced F1 Data Collector with Multiple Data Sources
Supports OpenF1, weather APIs, and historical data integration
"""

import asyncio
import json
import logging
import time
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
import aiohttp
import pandas as pd
import numpy as np

# Configuration for all data sources
@dataclass
class DataSourceConfig:
    openf1_base_url: str = "https://api.openf1.org/v1"
    weather_api_key: Optional[str] = None
    weather_base_url: str = "https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline"
    open_meteo_url: str = "https://api.open-meteo.com/v1/forecast"
    rate_limit_delay: float = 0.5
    max_retries: int = 3
    timeout: int = 30

@dataclass
class CircuitCoordinates:
    """F1 Circuit coordinates for weather data"""
    name: str
    latitude: float
    longitude: float
    timezone: str

# F1 Circuit coordinates (key circuits)
CIRCUIT_COORDS = {
    "albert_park": CircuitCoordinates("Albert Park", -37.8497, 144.9680, "Australia/Melbourne"),
    "bahrain": CircuitCoordinates("Bahrain International", 26.0325, 50.5106, "Asia/Bahrain"),
    "shanghai": CircuitCoordinates("Shanghai International", 31.3389, 121.2197, "Asia/Shanghai"),
    "imola": CircuitCoordinates("Imola", 44.3439, 11.7167, "Europe/Rome"),
    "miami": CircuitCoordinates("Miami International", 25.9581, -80.2389, "America/New_York"),
    "monaco": CircuitCoordinates("Monaco", 43.7347, 7.4206, "Europe/Monaco"),
    "catalunya": CircuitCoordinates("Catalunya", 41.5700, 2.2611, "Europe/Madrid"),
    "villeneuve": CircuitCoordinates("Circuit Gilles Villeneuve", 45.5000, -73.5278, "America/Toronto"),
    "red_bull_ring": CircuitCoordinates("Red Bull Ring", 47.2197, 14.7647, "Europe/Vienna"),
    "silverstone": CircuitCoordinates("Silverstone", 52.0786, -1.0169, "Europe/London"),
    "hungaroring": CircuitCoordinates("Hungaroring", 47.5789, 19.2486, "Europe/Budapest"),
    "spa": CircuitCoordinates("Spa-Francorchamps", 50.4372, 5.9714, "Europe/Brussels"),
    "zandvoort": CircuitCoordinates("Zandvoort", 52.3888, 4.5409, "Europe/Amsterdam"),
    "monza": CircuitCoordinates("Monza", 45.6156, 9.2811, "Europe/Rome"),
    "baku": CircuitCoordinates("Baku City Circuit", 40.3725, 49.8533, "Asia/Baku"),
    "marina_bay": CircuitCoordinates("Marina Bay", 1.2914, 103.8640, "Asia/Singapore"),
    "americas": CircuitCoordinates("Circuit of the Americas", 30.1328, -97.6411, "America/Chicago"),
    "rodriguez": CircuitCoordinates("Autódromo Hermanos Rodríguez", 19.4042, -99.0907, "America/Mexico_City"),
    "interlagos": CircuitCoordinates("Interlagos", -23.7036, -46.6997, "America/Sao_Paulo"),
    "vegas": CircuitCoordinates("Las Vegas Strip", 36.1147, -115.1728, "America/Los_Angeles"),
    "losail": CircuitCoordinates("Losail International", 25.4900, 51.4542, "Asia/Qatar"),
    "yas_marina": CircuitCoordinates("Yas Marina", 24.4672, 54.6031, "Asia/Dubai"),
}

class AdvancedDataCollector:
    """Advanced F1 Data Collector with multiple data sources and real-time capabilities"""

    def __init__(self, config: DataSourceConfig):
        self.config = config
        self.logger = self._setup_logging()
        self.session: Optional[aiohttp.ClientSession] = None
        self.cache: Dict[str, Any] = {}

    def _setup_logging(self) -> logging.Logger:
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('advanced_data_collector.log'),
                logging.StreamHandler()
            ]
        )
        return logging.getLogger(__name__)

    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=self.config.timeout)
        )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()

    async def _make_request(self, url: str, params: Dict = None) -> Optional[Dict]:
        """Make HTTP request with retries and rate limiting"""
        if not self.session:
            raise RuntimeError("Session not initialized. Use async context manager.")

        for attempt in range(self.config.max_retries):
            try:
                await asyncio.sleep(self.config.rate_limit_delay)
                async with self.session.get(url, params=params) as response:
                    if response.status == 200:
                        return await response.json()
                    elif response.status == 429:  # Rate limited
                        wait_time = 2 ** attempt
                        self.logger.warning(f"Rate limited, waiting {wait_time}s")
                        await asyncio.sleep(wait_time)
                    else:
                        self.logger.error(f"HTTP {response.status} for {url}")
            except Exception as e:
                self.logger.error(f"Request failed (attempt {attempt + 1}): {e}")
                if attempt == self.config.max_retries - 1:
                    return None
                await asyncio.sleep(2 ** attempt)
        return None

    async def get_openf1_session_data(self, year: int, session_type: str = "Race") -> List[Dict]:
        """Get session data from OpenF1 API"""
        url = f"{self.config.openf1_base_url}/sessions"
        params = {
            "year": year,
            "session_name": session_type
        }

        data = await self._make_request(url, params)
        if data:
            self.logger.info(f"Retrieved {len(data)} {session_type} sessions for {year}")
            return data
        return []

    async def get_openf1_lap_data(self, session_key: int, driver_number: int = None) -> List[Dict]:
        """Get lap data from OpenF1 API"""
        url = f"{self.config.openf1_base_url}/laps"
        params = {"session_key": session_key}
        if driver_number:
            params["driver_number"] = driver_number

        data = await self._make_request(url, params)
        if data:
            self.logger.info(f"Retrieved {len(data)} lap records for session {session_key}")
            return data
        return []

    async def get_openf1_weather_data(self, session_key: int) -> List[Dict]:
        """Get weather data from OpenF1 API"""
        url = f"{self.config.openf1_base_url}/weather"
        params = {"session_key": session_key}

        data = await self._make_request(url, params)
        if data:
            self.logger.info(f"Retrieved {len(data)} weather records for session {session_key}")
            return data
        return []

    async def get_openf1_car_data(self, session_key: int, driver_number: int) -> List[Dict]:
        """Get car telemetry data from OpenF1 API"""
        url = f"{self.config.openf1_base_url}/car_data"
        params = {
            "session_key": session_key,
            "driver_number": driver_number
        }

        data = await self._make_request(url, params)
        if data:
            self.logger.info(f"Retrieved {len(data)} car data records for driver {driver_number}")
            return data
        return []

    async def get_weather_forecast(self, circuit_id: str, date: str) -> Optional[Dict]:
        """Get weather forecast for circuit using Open-Meteo (free)"""
        if circuit_id not in CIRCUIT_COORDS:
            self.logger.warning(f"Circuit {circuit_id} not found in coordinates")
            return None

        coords = CIRCUIT_COORDS[circuit_id]
        url = self.config.open_meteo_url
        params = {
            "latitude": coords.latitude,
            "longitude": coords.longitude,
            "hourly": "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_direction_10m,weather_code",
            "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max",
            "timezone": coords.timezone,
            "start_date": date,
            "end_date": date
        }

        data = await self._make_request(url, params)
        if data:
            self.logger.info(f"Retrieved weather forecast for {circuit_id} on {date}")
            return data
        return None

    async def get_historical_weather(self, circuit_id: str, date: str) -> Optional[Dict]:
        """Get historical weather data using Visual Crossing (if API key provided)"""
        if not self.config.weather_api_key or circuit_id not in CIRCUIT_COORDS:
            return None

        coords = CIRCUIT_COORDS[circuit_id]
        url = f"{self.config.weather_base_url}/{coords.latitude},{coords.longitude}/{date}"
        params = {
            "key": self.config.weather_api_key,
            "include": "hours",
            "elements": "datetime,temp,humidity,precip,windspeed,winddir,conditions,description"
        }

        data = await self._make_request(url, params)
        if data and "days" in data:
            self.logger.info(f"Retrieved historical weather for {circuit_id} on {date}")
            return data["days"][0] if data["days"] else None
        return None

    def calculate_weather_risk_score(self, weather_data: Dict) -> float:
        """Calculate weather risk score based on various factors"""
        if not weather_data:
            return 0.0

        risk_score = 0.0

        # Precipitation risk (0-1 scale)
        precip = weather_data.get("precip", 0) or weather_data.get("precipitation_sum", 0)
        if precip > 0:
            risk_score += min(precip * 0.2, 0.4)  # Max 0.4 for heavy rain

        # Wind risk (0-0.3 scale)
        wind_speed = weather_data.get("windspeed", 0) or weather_data.get("wind_speed_10m_max", 0)
        if wind_speed > 20:  # km/h
            risk_score += min((wind_speed - 20) * 0.01, 0.3)

        # Temperature extremes (0-0.2 scale)
        temp = weather_data.get("temp", 20) or weather_data.get("temperature_2m_max", 20)
        if temp < 10 or temp > 35:
            risk_score += 0.2

        # Weather conditions
        conditions = weather_data.get("conditions", "").lower()
        if any(word in conditions for word in ["rain", "storm", "snow"]):
            risk_score += 0.3
        elif any(word in conditions for word in ["fog", "mist", "overcast"]):
            risk_score += 0.1

        return min(risk_score, 1.0)

    def calculate_track_evolution_factor(self, lap_times: List[float]) -> float:
        """Calculate track evolution factor based on lap time improvements"""
        if len(lap_times) < 5:
            return 0.0

        # Calculate improvement rate over the session
        early_avg = np.mean(lap_times[:5])
        late_avg = np.mean(lap_times[-5:])

        if early_avg > 0:
            improvement = (early_avg - late_avg) / early_avg
            return min(max(improvement, -0.1), 0.1)  # Bounded between -10% and +10%

        return 0.0

    def calculate_tire_degradation_model(self, stint_data: List[Dict]) -> Dict[str, float]:
        """Advanced tire degradation modeling"""
        if not stint_data:
            return {"degradation_rate": 0.0, "cliff_point": 0.0, "grip_loss": 0.0}

        lap_times = [stint["lap_time"] for stint in stint_data if stint.get("lap_time")]
        if len(lap_times) < 3:
            return {"degradation_rate": 0.0, "cliff_point": 0.0, "grip_loss": 0.0}

        # Calculate degradation rate (seconds per lap)
        x = np.arange(len(lap_times))
        coeffs = np.polyfit(x, lap_times, 2)  # Quadratic fit

        degradation_rate = coeffs[1] if len(coeffs) > 1 else 0.0

        # Find potential cliff point (sudden performance drop)
        diffs = np.diff(lap_times)
        cliff_point = 0.0
        if len(diffs) > 5:
            threshold = np.mean(diffs) + 2 * np.std(diffs)
            cliff_indices = np.where(diffs > threshold)[0]
            if len(cliff_indices) > 0:
                cliff_point = cliff_indices[0] / len(lap_times)

        # Overall grip loss
        if lap_times[0] > 0:
            grip_loss = (lap_times[-1] - lap_times[0]) / lap_times[0]
        else:
            grip_loss = 0.0

        return {
            "degradation_rate": float(degradation_rate),
            "cliff_point": float(cliff_point),
            "grip_loss": float(grip_loss)
        }

    async def collect_comprehensive_race_data(self, year: int, round_number: int) -> Dict[str, Any]:
        """Collect comprehensive race data from all sources"""
        self.logger.info(f"Collecting comprehensive data for {year} Round {round_number}")

        # Get session information
        sessions = await self.get_openf1_session_data(year, "Race")
        target_session = None

        for session in sessions:
            if session.get("round_number") == round_number:
                target_session = session
                break

        if not target_session:
            self.logger.error(f"No race session found for {year} Round {round_number}")
            return {}

        session_key = target_session["session_key"]
        circuit_key = target_session.get("circuit_short_name", "").lower()
        race_date = target_session.get("date_start", "").split("T")[0]

        # Collect data concurrently
        tasks = [
            self.get_openf1_lap_data(session_key),
            self.get_openf1_weather_data(session_key),
            self.get_weather_forecast(circuit_key, race_date) if circuit_key in CIRCUIT_COORDS else None,
            self.get_historical_weather(circuit_key, race_date) if circuit_key in CIRCUIT_COORDS else None,
        ]

        results = await asyncio.gather(*[task for task in tasks if task is not None])
        lap_data, openf1_weather, forecast_weather, historical_weather = results + [None] * (4 - len(results))

        # Process and enhance data
        enhanced_data = {
            "session_info": target_session,
            "lap_data": lap_data or [],
            "weather_data": {
                "openf1": openf1_weather or [],
                "forecast": forecast_weather,
                "historical": historical_weather
            },
            "enhanced_features": {}
        }

        # Calculate enhanced features
        if lap_data:
            # Group by driver
            driver_data = {}
            for lap in lap_data:
                driver_num = lap.get("driver_number")
                if driver_num not in driver_data:
                    driver_data[driver_num] = []
                driver_data[driver_num].append(lap)

            # Calculate per-driver enhancements
            for driver_num, laps in driver_data.items():
                lap_times = [lap.get("lap_time") for lap in laps if lap.get("lap_time")]
                if lap_times:
                    enhanced_data["enhanced_features"][f"driver_{driver_num}"] = {
                        "track_evolution": self.calculate_track_evolution_factor(lap_times),
                        "tire_model": self.calculate_tire_degradation_model(laps),
                        "consistency": np.std(lap_times) if len(lap_times) > 1 else 0.0,
                        "pace_trend": np.polyfit(range(len(lap_times)), lap_times, 1)[0] if len(lap_times) > 2 else 0.0
                    }

        # Weather risk assessment
        weather_risk = 0.0
        if forecast_weather:
            weather_risk = max(weather_risk, self.calculate_weather_risk_score(forecast_weather.get("daily", {})))
        if historical_weather:
            weather_risk = max(weather_risk, self.calculate_weather_risk_score(historical_weather))

        enhanced_data["enhanced_features"]["weather_risk"] = weather_risk

        self.logger.info(f"Collected comprehensive data with {len(enhanced_data.get('enhanced_features', {}))} enhanced features")
        return enhanced_data

    async def save_enhanced_dataset(self, data: Dict[str, Any], output_path: Path):
        """Save enhanced dataset to file"""
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, 'w') as f:
            json.dump(data, f, indent=2, default=str)

        self.logger.info(f"Enhanced dataset saved to {output_path}")

async def main():
    """Main function for testing the advanced data collector"""
    config = DataSourceConfig()

    async with AdvancedDataCollector(config) as collector:
        # Test data collection for 2025 season
        data = await collector.collect_comprehensive_race_data(2025, 1)  # Australian GP

        if data:
            output_path = Path("data/enhanced_race_data_2025_1.json")
            await collector.save_enhanced_dataset(data, output_path)
            print(f"Collected data for 2025 Round 1 with {len(data.get('enhanced_features', {}))} features")
        else:
            print("No data collected")

if __name__ == "__main__":
    asyncio.run(main())