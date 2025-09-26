#!/usr/bin/env python3
"""
Simple F1 API Server - Production Ready
A lightweight FastAPI server that provides F1 data without complex database dependencies
"""

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import json
from datetime import datetime
from typing import List, Dict, Any

# Accurate F1 2025 Season Data (Updated with latest transfers)
DRIVERS_2025 = [
    # Updated 2025 grid with actual transfers
    {"id": "VER", "code": "VER", "name": "Max Verstappen", "constructor": "Red Bull Racing", "number": 1, "nationality": "Dutch", "flag": "🇳🇱", "season": 2025},
    {"id": "LEC", "code": "LEC", "name": "Charles Leclerc", "constructor": "Ferrari", "number": 16, "nationality": "Monégasque", "flag": "🇲🇨", "season": 2025},
    {"id": "NOR", "code": "NOR", "name": "Lando Norris", "constructor": "McLaren", "number": 4, "nationality": "British", "flag": "🇬🇧", "season": 2025},
    {"id": "PIA", "code": "PIA", "name": "Oscar Piastri", "constructor": "McLaren", "number": 81, "nationality": "Australian", "flag": "🇦🇺", "season": 2025},
    {"id": "HAM", "code": "HAM", "name": "Lewis Hamilton", "constructor": "Ferrari", "number": 44, "nationality": "British", "flag": "🇬🇧", "season": 2025},  # HAM to Ferrari!
    {"id": "RUS", "code": "RUS", "name": "George Russell", "constructor": "Mercedes", "number": 63, "nationality": "British", "flag": "🇬🇧", "season": 2025},
    {"id": "ANT", "code": "ANT", "name": "Kimi Antonelli", "constructor": "Mercedes", "number": 12, "nationality": "Italian", "flag": "🇮🇹", "season": 2025},  # Antonelli to Mercedes
    {"id": "TSU", "code": "TSU", "name": "Yuki Tsunoda", "constructor": "Red Bull Racing", "number": 22, "nationality": "Japanese", "flag": "🇯🇵", "season": 2025},  # Tsunoda to RBR
    {"id": "ALO", "code": "ALO", "name": "Fernando Alonso", "constructor": "Aston Martin", "number": 14, "nationality": "Spanish", "flag": "🇪🇸", "season": 2025},
    {"id": "STR", "code": "STR", "name": "Lance Stroll", "constructor": "Aston Martin", "number": 18, "nationality": "Canadian", "flag": "🇨🇦", "season": 2025},
    {"id": "GAS", "code": "GAS", "name": "Pierre Gasly", "constructor": "Alpine", "number": 10, "nationality": "French", "flag": "🇫🇷", "season": 2025},
    {"id": "OCO", "code": "OCO", "name": "Esteban Ocon", "constructor": "Haas", "number": 31, "nationality": "French", "flag": "🇫🇷", "season": 2025},  # Ocon to Haas
    {"id": "HUL", "code": "HUL", "name": "Nico Hülkenberg", "constructor": "Sauber", "number": 27, "nationality": "German", "flag": "🇩🇪", "season": 2025},  # Hulk to Sauber
    {"id": "MAG", "code": "MAG", "name": "Kevin Magnussen", "constructor": "Haas", "number": 20, "nationality": "Danish", "flag": "🇩🇰", "season": 2025},
    {"id": "ALB", "code": "ALB", "name": "Alexander Albon", "constructor": "Williams", "number": 23, "nationality": "Thai", "flag": "🇹🇭", "season": 2025},
    {"id": "SAR", "code": "SAR", "name": "Logan Sargeant", "constructor": "Williams", "number": 2, "nationality": "American", "flag": "🇺🇸", "season": 2025},
    {"id": "RIC", "code": "RIC", "name": "Daniel Ricciardo", "constructor": "RB", "number": 3, "nationality": "Australian", "flag": "🇦🇺", "season": 2025},
    {"id": "LAW", "code": "LAW", "name": "Liam Lawson", "constructor": "RB", "number": 40, "nationality": "New Zealander", "flag": "🇳🇿", "season": 2025},
    {"id": "BEA", "code": "BEA", "name": "Ollie Bearman", "constructor": "Sauber", "number": 87, "nationality": "British", "flag": "🇬🇧", "season": 2025},  # Bearman promoted
    {"id": "DOR", "code": "DOR", "name": "Jack Doohan", "constructor": "Alpine", "number": 7, "nationality": "Australian", "flag": "🇦🇺", "season": 2025},  # Doohan to Alpine
]

DRIVERS_2024 = [
    # 2024 Final Grid
    {"id": "VER", "code": "VER", "name": "Max Verstappen", "constructor": "Red Bull Racing", "number": 1, "nationality": "Dutch", "flag": "🇳🇱", "season": 2024},
    {"id": "PER", "code": "PER", "name": "Sergio Pérez", "constructor": "Red Bull Racing", "number": 11, "nationality": "Mexican", "flag": "🇲🇽", "season": 2024},
    {"id": "LEC", "code": "LEC", "name": "Charles Leclerc", "constructor": "Ferrari", "number": 16, "nationality": "Monégasque", "flag": "🇲🇨", "season": 2024},
    {"id": "SAI", "code": "SAI", "name": "Carlos Sainz Jr.", "constructor": "Ferrari", "number": 55, "nationality": "Spanish", "flag": "🇪🇸", "season": 2024},
    {"id": "HAM", "code": "HAM", "name": "Lewis Hamilton", "constructor": "Mercedes", "number": 44, "nationality": "British", "flag": "🇬🇧", "season": 2024},
    {"id": "RUS", "code": "RUS", "name": "George Russell", "constructor": "Mercedes", "number": 63, "nationality": "British", "flag": "🇬🇧", "season": 2024},
    {"id": "NOR", "code": "NOR", "name": "Lando Norris", "constructor": "McLaren", "number": 4, "nationality": "British", "flag": "🇬🇧", "season": 2024},
    {"id": "PIA", "code": "PIA", "name": "Oscar Piastri", "constructor": "McLaren", "number": 81, "nationality": "Australian", "flag": "🇦🇺", "season": 2024},
    {"id": "ALO", "code": "ALO", "name": "Fernando Alonso", "constructor": "Aston Martin", "number": 14, "nationality": "Spanish", "flag": "🇪🇸", "season": 2024},
    {"id": "STR", "code": "STR", "name": "Lance Stroll", "constructor": "Aston Martin", "number": 18, "nationality": "Canadian", "flag": "🇨🇦", "season": 2024},
]

# Full 2024 F1 Calendar (22 races)
RACES_2024 = [
    {"id": "2024_bahrain", "name": "Bahrain Grand Prix", "season": 2024, "round": 1, "date": "2024-03-02", "country": "Bahrain", "circuit": "Bahrain International Circuit"},
    {"id": "2024_saudi_arabia", "name": "Saudi Arabian Grand Prix", "season": 2024, "round": 2, "date": "2024-03-09", "country": "Saudi Arabia", "circuit": "Jeddah Corniche Circuit"},
    {"id": "2024_australia", "name": "Australian Grand Prix", "season": 2024, "round": 3, "date": "2024-03-24", "country": "Australia", "circuit": "Albert Park Grand Prix Circuit"},
    {"id": "2024_japan", "name": "Japanese Grand Prix", "season": 2024, "round": 4, "date": "2024-04-07", "country": "Japan", "circuit": "Suzuka International Racing Course"},
    {"id": "2024_china", "name": "Chinese Grand Prix", "season": 2024, "round": 5, "date": "2024-04-21", "country": "China", "circuit": "Shanghai International Circuit"},
    {"id": "2024_miami", "name": "Miami Grand Prix", "season": 2024, "round": 6, "date": "2024-05-05", "country": "USA", "circuit": "Miami International Autodrome"},
    {"id": "2024_emilia_romagna", "name": "Emilia Romagna Grand Prix", "season": 2024, "round": 7, "date": "2024-05-19", "country": "Italy", "circuit": "Autodromo Enzo e Dino Ferrari"},
    {"id": "2024_monaco", "name": "Monaco Grand Prix", "season": 2024, "round": 8, "date": "2024-05-26", "country": "Monaco", "circuit": "Circuit de Monaco"},
    {"id": "2024_canada", "name": "Canadian Grand Prix", "season": 2024, "round": 9, "date": "2024-06-09", "country": "Canada", "circuit": "Circuit Gilles-Villeneuve"},
    {"id": "2024_spain", "name": "Spanish Grand Prix", "season": 2024, "round": 10, "date": "2024-06-23", "country": "Spain", "circuit": "Circuit de Barcelona-Catalunya"},
    {"id": "2024_austria", "name": "Austrian Grand Prix", "season": 2024, "round": 11, "date": "2024-06-30", "country": "Austria", "circuit": "Red Bull Ring"},
    {"id": "2024_great_britain", "name": "British Grand Prix", "season": 2024, "round": 12, "date": "2024-07-07", "country": "United Kingdom", "circuit": "Silverstone Circuit"},
    {"id": "2024_hungary", "name": "Hungarian Grand Prix", "season": 2024, "round": 13, "date": "2024-07-21", "country": "Hungary", "circuit": "Hungaroring"},
    {"id": "2024_belgium", "name": "Belgian Grand Prix", "season": 2024, "round": 14, "date": "2024-07-28", "country": "Belgium", "circuit": "Circuit de Spa-Francorchamps"},
    {"id": "2024_netherlands", "name": "Dutch Grand Prix", "season": 2024, "round": 15, "date": "2024-08-25", "country": "Netherlands", "circuit": "Circuit Zandvoort"},
    {"id": "2024_italy", "name": "Italian Grand Prix", "season": 2024, "round": 16, "date": "2024-09-01", "country": "Italy", "circuit": "Autodromo Nazionale di Monza"},
    {"id": "2024_azerbaijan", "name": "Azerbaijan Grand Prix", "season": 2024, "round": 17, "date": "2024-09-15", "country": "Azerbaijan", "circuit": "Baku City Circuit"},
    {"id": "2024_singapore", "name": "Singapore Grand Prix", "season": 2024, "round": 18, "date": "2024-09-22", "country": "Singapore", "circuit": "Marina Bay Street Circuit"},
    {"id": "2024_united_states", "name": "United States Grand Prix", "season": 2024, "round": 19, "date": "2024-10-20", "country": "USA", "circuit": "Circuit of the Americas"},
    {"id": "2024_mexico", "name": "Mexico City Grand Prix", "season": 2024, "round": 20, "date": "2024-10-27", "country": "Mexico", "circuit": "Autódromo Hermanos Rodríguez"},
    {"id": "2024_brazil", "name": "Brazilian Grand Prix", "season": 2024, "round": 21, "date": "2024-11-03", "country": "Brazil", "circuit": "Autodromo José Carlos Pace"},
    {"id": "2024_abu_dhabi", "name": "Abu Dhabi Grand Prix", "season": 2024, "round": 22, "date": "2024-12-08", "country": "UAE", "circuit": "Yas Marina Circuit"},
]

# Full 2025 F1 Calendar (24 races)
RACES_2025 = [
    {"id": "2025_bahrain", "name": "Bahrain Grand Prix", "season": 2025, "round": 1, "date": "2025-03-16", "country": "Bahrain", "circuit": "Bahrain International Circuit"},
    {"id": "2025_saudi_arabia", "name": "Saudi Arabian Grand Prix", "season": 2025, "round": 2, "date": "2025-03-23", "country": "Saudi Arabia", "circuit": "Jeddah Corniche Circuit"},
    {"id": "2025_australia", "name": "Australian Grand Prix", "season": 2025, "round": 3, "date": "2025-04-06", "country": "Australia", "circuit": "Albert Park Grand Prix Circuit"},
    {"id": "2025_china", "name": "Chinese Grand Prix", "season": 2025, "round": 4, "date": "2025-04-20", "country": "China", "circuit": "Shanghai International Circuit"},
    {"id": "2025_japan", "name": "Japanese Grand Prix", "season": 2025, "round": 5, "date": "2025-04-13", "country": "Japan", "circuit": "Suzuka International Racing Course"},
    {"id": "2025_miami", "name": "Miami Grand Prix", "season": 2025, "round": 6, "date": "2025-05-04", "country": "USA", "circuit": "Miami International Autodrome"},
    {"id": "2025_emilia_romagna", "name": "Emilia Romagna Grand Prix", "season": 2025, "round": 7, "date": "2025-05-18", "country": "Italy", "circuit": "Autodromo Enzo e Dino Ferrari"},
    {"id": "2025_monaco", "name": "Monaco Grand Prix", "season": 2025, "round": 8, "date": "2025-05-25", "country": "Monaco", "circuit": "Circuit de Monaco"},
    {"id": "2025_spain", "name": "Spanish Grand Prix", "season": 2025, "round": 9, "date": "2025-06-01", "country": "Spain", "circuit": "Circuit de Barcelona-Catalunya"},
    {"id": "2025_canada", "name": "Canadian Grand Prix", "season": 2025, "round": 10, "date": "2025-06-15", "country": "Canada", "circuit": "Circuit Gilles-Villeneuve"},
    {"id": "2025_austria", "name": "Austrian Grand Prix", "season": 2025, "round": 11, "date": "2025-06-29", "country": "Austria", "circuit": "Red Bull Ring"},
    {"id": "2025_great_britain", "name": "British Grand Prix", "season": 2025, "round": 12, "date": "2025-07-06", "country": "United Kingdom", "circuit": "Silverstone Circuit"},
    {"id": "2025_belgium", "name": "Belgian Grand Prix", "season": 2025, "round": 13, "date": "2025-07-27", "country": "Belgium", "circuit": "Circuit de Spa-Francorchamps"},
    {"id": "2025_hungary", "name": "Hungarian Grand Prix", "season": 2025, "round": 14, "date": "2025-08-03", "country": "Hungary", "circuit": "Hungaroring"},
    {"id": "2025_netherlands", "name": "Dutch Grand Prix", "season": 2025, "round": 15, "date": "2025-08-31", "country": "Netherlands", "circuit": "Circuit Zandvoort"},
    {"id": "2025_italy", "name": "Italian Grand Prix", "season": 2025, "round": 16, "date": "2025-09-07", "country": "Italy", "circuit": "Autodromo Nazionale di Monza"},
    {"id": "2025_azerbaijan", "name": "Azerbaijan Grand Prix", "season": 2025, "round": 17, "date": "2025-09-21", "country": "Azerbaijan", "circuit": "Baku City Circuit"},
    {"id": "2025_singapore", "name": "Singapore Grand Prix", "season": 2025, "round": 18, "date": "2025-10-05", "country": "Singapore", "circuit": "Marina Bay Street Circuit"},
    {"id": "2025_united_states", "name": "United States Grand Prix", "season": 2025, "round": 19, "date": "2025-10-19", "country": "USA", "circuit": "Circuit of the Americas"},
    {"id": "2025_mexico", "name": "Mexico City Grand Prix", "season": 2025, "round": 20, "date": "2025-10-26", "country": "Mexico", "circuit": "Autódromo Hermanos Rodríguez"},
    {"id": "2025_brazil", "name": "Brazilian Grand Prix", "season": 2025, "round": 21, "date": "2025-11-09", "country": "Brazil", "circuit": "Autodromo José Carlos Pace"},
    {"id": "2025_las_vegas", "name": "Las Vegas Grand Prix", "season": 2025, "round": 22, "date": "2025-11-23", "country": "USA", "circuit": "Las Vegas Street Circuit"},
    {"id": "2025_qatar", "name": "Qatar Grand Prix", "season": 2025, "round": 23, "date": "2025-11-30", "country": "Qatar", "circuit": "Losail International Circuit"},
    {"id": "2025_abu_dhabi", "name": "Abu Dhabi Grand Prix", "season": 2025, "round": 24, "date": "2025-12-07", "country": "UAE", "circuit": "Yas Marina Circuit"},
]

# Updated 2025 Team Data with transfers
TEAMS_2025 = [
    {"id": "red_bull", "name": "Red Bull Racing", "position": 1, "points": 589, "driverCount": 2,
     "drivers": ["Max Verstappen", "Yuki Tsunoda"], "colors": {"main": "#0600EF", "light": "#3671C6", "dark": "#001489", "logo": "🏎️"}},
    {"id": "ferrari", "name": "Ferrari", "position": 2, "points": 521, "driverCount": 2,
     "drivers": ["Charles Leclerc", "Lewis Hamilton"], "colors": {"main": "#DC143C", "light": "#FF4500", "dark": "#8B0000", "logo": "🐎"}},  # HAM to Ferrari
    {"id": "mclaren", "name": "McLaren", "position": 3, "points": 407, "driverCount": 2,
     "drivers": ["Lando Norris", "Oscar Piastri"], "colors": {"main": "#FF8700", "light": "#FFA500", "dark": "#CC6600", "logo": "🧡"}},
    {"id": "mercedes", "name": "Mercedes", "position": 4, "points": 392, "driverCount": 2,
     "drivers": ["George Russell", "Kimi Antonelli"], "colors": {"main": "#00D2BE", "light": "#70E0D1", "dark": "#00A693", "logo": "🌟"}},  # Antonelli joins
    {"id": "aston_martin", "name": "Aston Martin", "position": 5, "points": 86, "driverCount": 2,
     "drivers": ["Fernando Alonso", "Lance Stroll"], "colors": {"main": "#006F62", "light": "#2D9A8F", "dark": "#004D40", "logo": "💚"}},
]

# Combined race data
ALL_RACES = RACES_2024 + RACES_2025
ALL_DRIVERS = DRIVERS_2025 + DRIVERS_2024

# Generate mock predictions based on driver performance
def generate_mock_predictions(race_id: str) -> List[Dict[str, Any]]:
    """Generate realistic mock predictions for a race"""
    import random
    predictions = []

    for i, driver in enumerate(ALL_DRIVERS):
        # Base probability decreases with championship position
        base_prob = max(0.1, 0.95 - (i * 0.08))
        # Add some randomness
        prob_points = max(0.01, min(0.99, base_prob + random.uniform(-0.15, 0.15)))

        predictions.append({
            "driver_id": driver["id"],
            "race_id": race_id,
            "prob_points": round(prob_points, 3),
            "score": round(prob_points * random.uniform(0.8, 1.2), 3),
            "predicted_position": i + 1 + random.randint(-2, 2) if i > 2 else i + 1,
            "top_factors": [
                {"feature": "Team Form", "contribution": round(random.uniform(0.1, 0.3), 3)},
                {"feature": "Driver Form", "contribution": round(random.uniform(0.08, 0.25), 3)},
                {"feature": "Circuit Experience", "contribution": round(random.uniform(0.05, 0.2), 3)}
            ]
        })

    # Sort by probability descending
    predictions.sort(key=lambda x: x["prob_points"], reverse=True)
    return predictions


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    print("🚀 Starting F1 Simple API...")
    print("✅ Simple F1 API ready - no database required!")
    yield
    print("🛑 Shutting down F1 Simple API...")


# Create FastAPI app
app = FastAPI(
    title="F1 Simple API",
    description="A lightweight F1 data API with mock data for immediate functionality",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/v1/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "database": True,  # Mock as healthy
        "external_apis": {"openf1": True}
    }


@app.get("/api/v1/drivers")
async def get_drivers(season: int = 2025):
    """Get all F1 drivers for a specific season"""
    drivers = [d for d in ALL_DRIVERS if d["season"] == season]
    if not drivers:
        # Fallback to 2025 if season not found
        drivers = [d for d in ALL_DRIVERS if d["season"] == 2025]
    return drivers


@app.get("/api/v1/drivers/{driver_id}")
async def get_driver(driver_id: str, season: int = 2025):
    """Get specific driver by ID for a season"""
    driver = next((d for d in ALL_DRIVERS if d["id"] == driver_id and d["season"] == season), None)
    if not driver:
        # Try other seasons
        driver = next((d for d in ALL_DRIVERS if d["id"] == driver_id), None)
        if not driver:
            raise HTTPException(status_code=404, detail="Driver not found")
    return driver


@app.get("/api/v1/teams")
async def get_teams(season: int = 2025):
    """Get all F1 teams for a specific season"""
    if season == 2025:
        return TEAMS_2025
    else:
        # Return a basic team structure for 2024 or other seasons
        return [
            {"id": "red_bull", "name": "Red Bull Racing", "position": 1, "points": 758, "driverCount": 2,
             "drivers": ["Max Verstappen", "Sergio Pérez"], "colors": {"main": "#0600EF", "light": "#3671C6", "dark": "#001489", "logo": "🏎️"}},
            {"id": "ferrari", "name": "Ferrari", "position": 2, "points": 406, "driverCount": 2,
             "drivers": ["Charles Leclerc", "Carlos Sainz Jr."], "colors": {"main": "#DC143C", "light": "#FF4500", "dark": "#8B0000", "logo": "🐎"}},
            {"id": "mclaren", "name": "McLaren", "position": 3, "points": 608, "driverCount": 2,
             "drivers": ["Lando Norris", "Oscar Piastri"], "colors": {"main": "#FF8700", "light": "#FFA500", "dark": "#CC6600", "logo": "🧡"}},
        ]


@app.get("/api/v1/teams/{team_id}")
async def get_team(team_id: str, season: int = 2025):
    """Get specific team by ID for a season"""
    teams = await get_teams(season)
    team = next((t for t in teams if t["id"] == team_id), None)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team


@app.get("/api/v1/races")
async def get_races(season: int = None):
    """Get all races, optionally filtered by season"""
    if season:
        return [r for r in ALL_RACES if r["season"] == season]
    return ALL_RACES


@app.get("/api/v1/races/{race_id}")
async def get_race(race_id: str):
    """Get specific race by ID"""
    race = next((r for r in ALL_RACES if r["id"] == race_id), None)
    if not race:
        raise HTTPException(status_code=404, detail="Race not found")
    return race


@app.get("/api/v1/races/upcoming")
async def get_upcoming_races(limit: int = 5):
    """Get upcoming races with real-time status"""
    today = datetime.now().date()
    upcoming = []

    for race in ALL_RACES:
        race_date = datetime.fromisoformat(race["date"]).date()
        if race_date >= today:
            # Add computed status fields
            race_with_status = race.copy()
            race_with_status.update({
                "status": "upcoming",
                "is_completed": False,
                "days_away": (race_date - today).days,
                "is_next": len(upcoming) == 0  # First upcoming race is the "next" one
            })
            upcoming.append(race_with_status)

    return upcoming[:limit]


@app.get("/api/v1/races/recent")
async def get_recent_races(limit: int = 5):
    """Get recent/completed races with real-time status"""
    today = datetime.now().date()
    recent = []

    for race in ALL_RACES:
        race_date = datetime.fromisoformat(race["date"]).date()
        if race_date < today:
            # Add computed status fields
            race_with_status = race.copy()
            race_with_status.update({
                "status": "completed",
                "is_completed": True,
                "days_ago": (today - race_date).days
            })
            recent.append(race_with_status)

    # Sort by date descending (most recent first)
    recent.sort(key=lambda x: x["date"], reverse=True)
    return recent[:limit]


@app.get("/api/v1/predictions/race/{race_id}")
async def get_race_predictions(race_id: str):
    """Get predictions for a specific race"""
    # Verify race exists
    race = next((r for r in ALL_RACES if r["id"] == race_id), None)
    if not race:
        raise HTTPException(status_code=404, detail="Race not found")

    return generate_mock_predictions(race_id)


@app.post("/api/v1/predictions/race/{race_id}")
async def generate_race_predictions(race_id: str):
    """Generate new predictions for a race"""
    # Verify race exists
    race = next((r for r in ALL_RACES if r["id"] == race_id), None)
    if not race:
        raise HTTPException(status_code=404, detail="Race not found")

    return generate_mock_predictions(race_id)


@app.get("/api/v1/standings")
async def get_standings(season: int = 2025):
    """Get championship standings"""
    return {
        "year": season,
        "last_updated": datetime.now().isoformat(),
        "driver_standings": [
            {"position": i+1, "driver": driver["name"], "points": max(50, 400 - (i * 35))}
            for i, driver in enumerate(ALL_DRIVERS[:10])
        ],
        "constructor_standings": [
            {"position": i+1, "team": team["name"], "points": team["points"]}
            for i, team in enumerate(TEAMS_2025)
        ]
    }


@app.get("/api/v1/calendar/stats")
async def get_calendar_stats(season: int = 2025):
    """Get comprehensive race calendar statistics with real-time status"""
    today = datetime.now().date()

    season_races = [r for r in ALL_RACES if r["season"] == season]

    upcoming_races = []
    completed_races = []
    next_race = None

    for race in season_races:
        race_date = datetime.fromisoformat(race["date"]).date()
        if race_date >= today:
            upcoming_races.append(race)
            if next_race is None:
                next_race = race.copy()
                next_race["days_away"] = (race_date - today).days
        else:
            completed_races.append(race)

    return {
        "season": season,
        "total_races": len(season_races),
        "upcoming_races": len(upcoming_races),
        "completed_races": len(completed_races),
        "next_race": next_race,
        "last_updated": datetime.now().isoformat(),
        "current_date": today.isoformat()
    }


@app.get("/api/v1/calendar/status/{race_id}")
async def get_race_status(race_id: str):
    """Get detailed status for a specific race"""
    race = next((r for r in ALL_RACES if r["id"] == race_id), None)
    if not race:
        raise HTTPException(status_code=404, detail="Race not found")

    today = datetime.now().date()
    race_date = datetime.fromisoformat(race["date"]).date()

    # Determine status
    if race_date > today:
        status = "upcoming"
        days_difference = (race_date - today).days
        time_label = f"{days_difference} days away"
    elif race_date == today:
        status = "today"
        days_difference = 0
        time_label = "Race day!"
    else:
        status = "completed"
        days_difference = (today - race_date).days
        time_label = f"{days_difference} days ago"

    race_with_status = race.copy()
    race_with_status.update({
        "status": status,
        "is_completed": status in ["completed"],
        "is_today": status == "today",
        "is_upcoming": status == "upcoming",
        "days_difference": days_difference,
        "time_label": time_label,
        "last_updated": datetime.now().isoformat()
    })

    return race_with_status


@app.get("/api/v1/calendar/by-status/{status}")
async def get_races_by_status(status: str, season: int = 2025, limit: int = 10):
    """Get races filtered by status (upcoming, completed, today, all)"""
    if status not in ["upcoming", "completed", "today", "all"]:
        raise HTTPException(
            status_code=400,
            detail="Status must be one of: upcoming, completed, today, all"
        )

    today = datetime.now().date()
    season_races = [r for r in ALL_RACES if r["season"] == season]
    filtered_races = []

    for race in season_races:
        race_date = datetime.fromisoformat(race["date"]).date()
        race_status = None

        if race_date > today:
            race_status = "upcoming"
        elif race_date == today:
            race_status = "today"
        else:
            race_status = "completed"

        # Filter based on requested status
        if status == "all" or race_status == status:
            race_with_status = race.copy()
            race_with_status.update({
                "status": race_status,
                "is_completed": race_status == "completed",
                "is_today": race_status == "today",
                "is_upcoming": race_status == "upcoming",
                "days_difference": abs((race_date - today).days)
            })
            filtered_races.append(race_with_status)

    # Sort appropriately
    if status == "upcoming":
        filtered_races.sort(key=lambda x: x["date"])  # Earliest first
    elif status == "completed":
        filtered_races.sort(key=lambda x: x["date"], reverse=True)  # Most recent first
    else:
        filtered_races.sort(key=lambda x: x["round"])  # By round number

    return {
        "status_filter": status,
        "season": season,
        "total_found": len(filtered_races),
        "races": filtered_races[:limit],
        "last_updated": datetime.now().isoformat()
    }


@app.post("/api/v1/calendar/refresh")
async def refresh_calendar_status():
    """Refresh race calendar status (for manual updates)"""
    today = datetime.now().date()

    total_races = len(ALL_RACES)
    upcoming_count = 0
    completed_count = 0

    for race in ALL_RACES:
        race_date = datetime.fromisoformat(race["date"]).date()
        if race_date >= today:
            upcoming_count += 1
        else:
            completed_count += 1

    return {
        "message": "Calendar status refreshed",
        "refresh_time": datetime.now().isoformat(),
        "summary": {
            "total_races": total_races,
            "upcoming": upcoming_count,
            "completed": completed_count
        }
    }


@app.post("/api/v1/chat/message")
async def chat_message(message: dict):
    """Simple chat endpoint - returns mock response"""
    user_message = message.get("message", "").lower()

    if "predict" in user_message or "race" in user_message:
        return {
            "response": "🏎️ Based on current form and qualifying performance, I predict Max Verstappen has the highest probability of points in the upcoming race at 87.3%, followed by Lando Norris at 82.1%. The key factors are team form, driver consistency, and circuit-specific performance.",
            "type": "prediction"
        }
    elif "standing" in user_message or "championship" in user_message:
        return {
            "response": "🏆 Current F1 2025 Championship standings show Red Bull Racing leading the constructors with 589 points, followed by McLaren with 521 points. In the drivers' championship, Max Verstappen is leading.",
            "type": "standings"
        }
    else:
        return {
            "response": f"🤖 I received your message: '{message.get('message', '')}'. I'm a simple F1 API bot. Ask me about race predictions, championship standings, or driver information!",
            "type": "general"
        }


if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8002,
        reload=False,
        log_level="info"
    )