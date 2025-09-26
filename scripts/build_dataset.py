#!/usr/bin/env python3
"""Enhanced F1 dataset builder with modern ML features and robust data processing."""

import csv
import json
import logging
import time
from collections import defaultdict
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import requests
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry

# Configuration
@dataclass
class Config:
    base_url: str = "https://api.jolpi.ca/ergast/f1"
    timeout: int = 30
    retry_attempts: int = 3
    retry_backoff: float = 0.3
    rate_limit_delay: float = 0.1
    seasons: List[str] = None
    output_dir: Path = Path("data")

    def __post_init__(self):
        if self.seasons is None:
            # Extended season range including 2025 for latest production data
            self.seasons = [str(year) for year in range(2010, 2026)]

@dataclass
class RaceResult:
    race_id: str
    race_name: str
    circuit_id: str
    season: str
    round_num: int
    driver_id: str
    constructor_id: str
    grid_position: int
    finish_position: int
    points: float

class F1DataAPI:
    """Enhanced F1 API client with retry logic and rate limiting."""

    def __init__(self, config: Config):
        self.config = config
        self.session = self._create_session()
        self.logger = logging.getLogger(__name__)

    def _create_session(self) -> requests.Session:
        session = requests.Session()
        retry_strategy = Retry(
            total=self.config.retry_attempts,
            backoff_factor=self.config.retry_backoff,
            status_forcelist=[429, 500, 502, 503, 504],
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        return session

    def get_data(self, path: str) -> dict:
        """Get data from F1 API with retry logic and rate limiting."""
        url = f"{self.config.base_url}/{path}.json"

        try:
            response = self.session.get(url, timeout=self.config.timeout)
            response.raise_for_status()
            time.sleep(self.config.rate_limit_delay)  # Rate limiting
            return response.json()["MRData"]
        except requests.exceptions.RequestException as e:
            self.logger.error(f"Failed to fetch {url}: {e}")
            raise

    def get_results_for_season(self, season: str) -> List[RaceResult]:
        """Get race results for a given season."""
        try:
            data = self.get_data(f"{season}/results")
            races = data["RaceTable"]["Races"]
            results = []

            for race in races:
                race_id = f"{season}_{race['round']}_{race['Circuit']['circuitId']}"

                for result in race["Results"]:
                    race_result = RaceResult(
                        race_id=race_id,
                        race_name=race["raceName"],
                        circuit_id=race["Circuit"]["circuitId"],
                        season=season,
                        round_num=int(race["round"]),
                        driver_id=result["Driver"]["driverId"],
                        constructor_id=result["Constructor"]["constructorId"],
                        grid_position=int(result.get("grid", 0) or 0),
                        finish_position=int(result.get("position", 25) or 25),  # Updated for modern F1
                        points=float(result.get("points", 0) or 0)
                    )
                    results.append(race_result)

            return results
        except Exception as e:
            self.logger.error(f"Failed to get results for season {season}: {e}")
            return []

    def get_qualifying_positions(self, season: str) -> Dict[Tuple[str, str], int]:
        """Get qualifying positions for all races in a season."""
        try:
            data = self.get_data(f"{season}/qualifying")
            races = data["RaceTable"]["Races"]
            positions = {}

            for race in races:
                race_id = f"{season}_{race['round']}_{race['Circuit']['circuitId']}"

                for quali in race.get("QualifyingResults", []):
                    driver_id = quali["Driver"]["driverId"]
                    position = int(quali.get("position", 25) or 25)
                    positions[(race_id, driver_id)] = position

            return positions
        except Exception as e:
            self.logger.error(f"Failed to get qualifying for season {season}: {e}")
            return {}

class FeatureEngineer:
    """Enhanced feature engineering with more sophisticated calculations."""

    def __init__(self):
        self.driver_points_history = defaultdict(list)
        self.constructor_points_history = defaultdict(list)
        self.circuit_points_history = defaultdict(list)
        self.driver_positions_history = defaultdict(list)
        self.constructor_reliability = defaultdict(list)  # Track DNFs

    def calculate_exponential_weighted_form(self, history: List[float], races: int = 5, alpha: float = 0.3) -> float:
        """Calculate exponentially weighted form (recent races matter more)."""
        if not history:
            return 0.0

        recent_history = history[-races:]
        if len(recent_history) == 1:
            return recent_history[0]

        weights = [alpha * (1 - alpha) ** i for i in range(len(recent_history))]
        weights.reverse()  # Most recent gets highest weight

        weighted_sum = sum(p * w for p, w in zip(recent_history, weights))
        weight_sum = sum(weights)

        return weighted_sum / weight_sum if weight_sum > 0 else 0.0

    def calculate_consistency_metric(self, history: List[float], races: int = 5) -> float:
        """Calculate driver/constructor consistency (lower variance = more consistent)."""
        if len(history) < 2:
            return 0.0

        recent = history[-races:]
        if len(recent) < 2:
            return 0.0

        mean_points = sum(recent) / len(recent)
        variance = sum((p - mean_points) ** 2 for p in recent) / len(recent)

        # Return inverse of coefficient of variation (normalized consistency)
        if mean_points > 0:
            cv = (variance ** 0.5) / mean_points
            return 1 / (1 + cv)  # Scale between 0-1, higher = more consistent
        return 0.0

    def calculate_momentum(self, history: List[float], races: int = 3) -> float:
        """Calculate recent performance momentum (trend)."""
        if len(history) < races:
            return 0.0

        recent = history[-races:]
        if len(recent) < 2:
            return 0.0

        # Simple linear trend calculation
        n = len(recent)
        x_mean = (n - 1) / 2
        y_mean = sum(recent) / n

        numerator = sum((i - x_mean) * (y - y_mean) for i, y in enumerate(recent))
        denominator = sum((i - x_mean) ** 2 for i in range(n))

        return numerator / denominator if denominator > 0 else 0.0

def build_enhanced_dataset(config: Config) -> None:
    """Build enhanced F1 dataset with modern feature engineering."""
    # Setup logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler('dataset_build.log'),
            logging.StreamHandler()
        ]
    )
    logger = logging.getLogger(__name__)

    api = F1DataAPI(config)
    feature_engineer = FeatureEngineer()

    all_rows = []

    logger.info(f"Starting dataset build for seasons: {config.seasons}")

    # Process seasons chronologically for proper form calculation
    for season in sorted(config.seasons):
        logger.info(f"Processing season {season}...")

        try:
            results = api.get_results_for_season(season)
            qualifying_positions = api.get_qualifying_positions(season)

            # Sort results by season and round for chronological processing
            results.sort(key=lambda x: (x.season, x.round_num))

            for result in results:
                # Enhanced form calculations
                driver_form = feature_engineer.calculate_exponential_weighted_form(
                    feature_engineer.driver_points_history[result.driver_id]
                )

                constructor_form = feature_engineer.calculate_exponential_weighted_form(
                    feature_engineer.constructor_points_history[result.constructor_id]
                )

                # Circuit-specific performance
                circuit_key = f"{result.driver_id}:{result.circuit_id}"
                circuit_effect = feature_engineer.calculate_exponential_weighted_form(
                    feature_engineer.circuit_points_history[circuit_key], races=3
                )

                # New consistency metrics
                driver_consistency = feature_engineer.calculate_consistency_metric(
                    feature_engineer.driver_points_history[result.driver_id]
                )

                constructor_reliability = feature_engineer.calculate_consistency_metric(
                    feature_engineer.driver_positions_history[result.constructor_id]
                )

                # Momentum indicators
                driver_momentum = feature_engineer.calculate_momentum(
                    feature_engineer.driver_points_history[result.driver_id]
                )

                # Get qualifying position (fallback to grid if not available)
                quali_pos = qualifying_positions.get(
                    (result.race_id, result.driver_id),
                    result.grid_position if result.grid_position > 0 else 25
                )

                # Enhanced feature row
                row = {
                    "race_id": result.race_id,
                    "driver_id": result.driver_id,
                    "constructor_id": result.constructor_id,
                    "season": result.season,
                    "round": result.round_num,
                    "circuit_id": result.circuit_id,
                    "quali_pos": quali_pos,
                    "grid_pos": result.grid_position,
                    "avg_fp_longrun_delta": 0.0,  # Placeholder for live timing data
                    "constructor_form": round(constructor_form, 4),
                    "driver_form": round(driver_form, 4),
                    "circuit_effect": round(circuit_effect, 4),
                    "driver_consistency": round(driver_consistency, 4),
                    "constructor_reliability": round(constructor_reliability, 4),
                    "driver_momentum": round(driver_momentum, 4),
                    "weather_risk": 0.0,  # Placeholder for weather data integration
                    "points": result.points,
                    "finish_position": result.finish_position,
                    "points_scored": 1 if result.points > 0 else 0,  # Target variable
                    "podium_finish": 1 if result.finish_position <= 3 else 0,  # Additional target
                    "top_10_finish": 1 if result.finish_position <= 10 else 0  # Additional target
                }

                all_rows.append(row)

                # Update historical data for future calculations
                feature_engineer.driver_points_history[result.driver_id].append(result.points)
                feature_engineer.constructor_points_history[result.constructor_id].append(result.points)
                feature_engineer.circuit_points_history[circuit_key].append(result.points)
                feature_engineer.driver_positions_history[result.constructor_id].append(result.finish_position)

        except Exception as e:
            logger.error(f"Failed to process season {season}: {e}")
            continue

    if not all_rows:
        logger.error("No data collected. Exiting.")
        return

    # Save enhanced dataset
    config.output_dir.mkdir(parents=True, exist_ok=True)
    output_file = config.output_dir / "historical_features.csv"

    with open(output_file, "w", newline="", encoding="utf-8") as f:
        fieldnames = list(all_rows[0].keys())
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(all_rows)

    logger.info(f"Dataset saved to {output_file} with {len(all_rows)} rows and {len(fieldnames)} features")

    # Save metadata
    metadata = {
        "total_rows": len(all_rows),
        "seasons": config.seasons,
        "features": fieldnames,
        "build_timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    }

    metadata_file = config.output_dir / "dataset_metadata.json"
    with open(metadata_file, "w") as f:
        json.dump(metadata, f, indent=2)

    logger.info(f"Metadata saved to {metadata_file}")

def main():
    """Main execution function."""
    config = Config()
    build_enhanced_dataset(config)

if __name__ == "__main__":
    main()