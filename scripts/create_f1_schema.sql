-- F1 Dynamic Database Schema for Neon PostgreSQL
-- This schema replaces static JSON files with dynamic tables

-- Enable UUID extension for unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Seasons table - Track F1 seasons
CREATE TABLE IF NOT EXISTS seasons (
    id SERIAL PRIMARY KEY,
    year INTEGER UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Countries table - Track race locations
CREATE TABLE IF NOT EXISTS countries (
    id SERIAL PRIMARY KEY,
    country_key VARCHAR(10) UNIQUE NOT NULL, -- e.g., 'gbr', 'usa'
    country_name VARCHAR(100) NOT NULL,     -- e.g., 'Great Britain', 'United States'
    flag_emoji VARCHAR(10),                 -- e.g., '🇬🇧', '🇺🇸'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Circuits table - F1 race tracks
CREATE TABLE IF NOT EXISTS circuits (
    id SERIAL PRIMARY KEY,
    circuit_key VARCHAR(20) UNIQUE NOT NULL, -- e.g., 'silverstone', 'monaco'
    circuit_name VARCHAR(100) NOT NULL,      -- e.g., 'Silverstone Circuit'
    country_id INTEGER REFERENCES countries(id),
    location VARCHAR(100),                   -- e.g., 'Silverstone, England'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teams/Constructors table
CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    team_key VARCHAR(20) UNIQUE NOT NULL,    -- e.g., 'red_bull_racing', 'mclaren'
    team_name VARCHAR(100) NOT NULL,         -- e.g., 'Red Bull Racing', 'McLaren'
    full_name VARCHAR(150),                  -- e.g., 'Red Bull Racing Honda RBPT'
    color_main VARCHAR(7),                   -- Hex color for team branding
    color_light VARCHAR(7),                  -- Light variant
    color_dark VARCHAR(7),                   -- Dark variant
    logo_emoji VARCHAR(10),                  -- Team emoji representation
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Drivers table
CREATE TABLE IF NOT EXISTS drivers (
    id SERIAL PRIMARY KEY,
    driver_number INTEGER,                   -- Race number (e.g., 1, 44, 81)
    driver_code VARCHAR(3) UNIQUE NOT NULL,  -- Three-letter code (e.g., VER, HAM, NOR)
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    full_name VARCHAR(100) NOT NULL,         -- e.g., 'Max Verstappen'
    nationality VARCHAR(50),                 -- e.g., 'Dutch', 'British'
    flag_emoji VARCHAR(10),                  -- Country flag emoji
    date_of_birth DATE,
    team_id INTEGER REFERENCES teams(id),
    active BOOLEAN DEFAULT true,             -- Is driver currently active
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Meetings/Races table - Individual race weekends
CREATE TABLE IF NOT EXISTS meetings (
    id SERIAL PRIMARY KEY,
    meeting_key VARCHAR(20) UNIQUE NOT NULL, -- e.g., '2025_gbr', '2025_aus'
    year INTEGER NOT NULL,
    round_number INTEGER NOT NULL,           -- Race round in season (1-24)
    meeting_name VARCHAR(100) NOT NULL,      -- e.g., 'British Grand Prix'
    official_name VARCHAR(150),              -- Full official name
    circuit_id INTEGER REFERENCES circuits(id),
    country_id INTEGER REFERENCES countries(id),
    date_start DATE NOT NULL,                -- Race weekend start date
    date_end DATE NOT NULL,                  -- Race weekend end date
    gmt_offset VARCHAR(10),                  -- e.g., '+01:00'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(year, round_number)
);

-- Sessions table - Individual sessions within a race weekend
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    session_key VARCHAR(30) UNIQUE NOT NULL, -- e.g., '2025_gbr_fp1', '2025_gbr_race'
    meeting_id INTEGER REFERENCES meetings(id),
    session_name VARCHAR(50) NOT NULL,       -- e.g., 'Practice 1', 'Race'
    session_type VARCHAR(20) NOT NULL,       -- e.g., 'practice', 'qualifying', 'race'
    date_start TIMESTAMP NOT NULL,
    date_end TIMESTAMP,
    gmt_offset VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Constructor standings table
CREATE TABLE IF NOT EXISTS constructor_standings (
    id SERIAL PRIMARY KEY,
    year INTEGER NOT NULL,
    team_id INTEGER REFERENCES teams(id),
    position INTEGER NOT NULL,
    points DECIMAL(8,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(year, team_id)
);

-- Driver standings table
CREATE TABLE IF NOT EXISTS driver_standings (
    id SERIAL PRIMARY KEY,
    year INTEGER NOT NULL,
    driver_id INTEGER REFERENCES drivers(id),
    team_id INTEGER REFERENCES teams(id),
    position INTEGER NOT NULL,
    points DECIMAL(8,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(year, driver_id)
);

-- Race results table
CREATE TABLE IF NOT EXISTS race_results (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES sessions(id),
    driver_id INTEGER REFERENCES drivers(id),
    team_id INTEGER REFERENCES teams(id),
    position INTEGER,                        -- Final position (1-20, or null if DNF)
    grid_position INTEGER,                   -- Starting position
    points DECIMAL(4,2) DEFAULT 0,           -- Points earned
    status VARCHAR(50),                      -- e.g., 'Finished', 'DNF', 'DSQ'
    fastest_lap BOOLEAN DEFAULT false,       -- Did driver get fastest lap
    fastest_lap_time VARCHAR(20),            -- e.g., '1:27.097'
    laps_completed INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(session_id, driver_id)
);

-- Predictions table - Store AI predictions
CREATE TABLE IF NOT EXISTS predictions (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES sessions(id),
    driver_id INTEGER REFERENCES drivers(id),
    predicted_position INTEGER,              -- Predicted finishing position
    probability_points DECIMAL(6,4),         -- Probability of scoring points
    confidence_score DECIMAL(6,4),           -- Model confidence (0-1)
    model_version VARCHAR(20),               -- Track model version used
    prediction_factors JSONB,                -- Store feature contributions as JSON
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(session_id, driver_id, model_version)
);

-- Data sync tracking - Monitor API sync status
CREATE TABLE IF NOT EXISTS sync_status (
    id SERIAL PRIMARY KEY,
    data_source VARCHAR(50) NOT NULL,        -- e.g., 'openf1_meetings', 'openf1_drivers'
    endpoint VARCHAR(100) NOT NULL,          -- API endpoint synced
    last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sync_status VARCHAR(20) DEFAULT 'pending', -- 'success', 'error', 'pending'
    records_synced INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial 2025 season
INSERT INTO seasons (year) VALUES (2025) ON CONFLICT (year) DO NOTHING;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_meetings_year ON meetings(year);
CREATE INDEX IF NOT EXISTS idx_meetings_date_start ON meetings(date_start);
CREATE INDEX IF NOT EXISTS idx_sessions_meeting_id ON sessions(meeting_id);
CREATE INDEX IF NOT EXISTS idx_race_results_session_id ON race_results(session_id);
CREATE INDEX IF NOT EXISTS idx_race_results_driver_id ON race_results(driver_id);
CREATE INDEX IF NOT EXISTS idx_predictions_session_id ON predictions(session_id);
CREATE INDEX IF NOT EXISTS idx_driver_standings_year ON driver_standings(year);
CREATE INDEX IF NOT EXISTS idx_constructor_standings_year ON constructor_standings(year);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to relevant tables
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_driver_standings_updated_at BEFORE UPDATE ON driver_standings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_constructor_standings_updated_at BEFORE UPDATE ON constructor_standings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();