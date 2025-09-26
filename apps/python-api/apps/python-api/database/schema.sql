-- F1 Prediction Engine Database Schema
-- Comprehensive schema for sophisticated F1 race prediction system

-- Core F1 Data Tables
CREATE TABLE IF NOT EXISTS seasons (
    id SERIAL PRIMARY KEY,
    year INTEGER UNIQUE NOT NULL,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS circuits (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    country VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    altitude INTEGER,
    circuit_type VARCHAR(50), -- street, permanent, hybrid
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS teams (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    base VARCHAR(255),
    team_chief VARCHAR(255),
    technical_chief VARCHAR(255),
    chassis VARCHAR(100),
    power_unit VARCHAR(100),
    first_entry INTEGER,
    world_championships INTEGER DEFAULT 0,
    highest_finish INTEGER,
    pole_positions INTEGER DEFAULT 0,
    fastest_laps INTEGER DEFAULT 0,
    color_primary VARCHAR(7),
    color_secondary VARCHAR(7),
    logo_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS drivers (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(3) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    full_name VARCHAR(255),
    date_of_birth DATE,
    nationality VARCHAR(100),
    place_of_birth VARCHAR(255),
    number INTEGER,
    permanent_number INTEGER,
    biography TEXT,
    height_cm INTEGER,
    weight_kg INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS races (
    id VARCHAR(100) PRIMARY KEY,
    season INTEGER NOT NULL,
    round INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    circuit_id VARCHAR(50) REFERENCES circuits(id),
    race_date DATE,
    race_time TIME,
    fp1_date DATE,
    fp1_time TIME,
    fp2_date DATE,
    fp2_time TIME,
    fp3_date DATE,
    fp3_time TIME,
    qualifying_date DATE,
    qualifying_time TIME,
    sprint_date DATE,
    sprint_time TIME,
    race_completed BOOLEAN DEFAULT FALSE,
    weather_conditions TEXT,
    track_temperature DECIMAL(5,2),
    air_temperature DECIMAL(5,2),
    humidity DECIMAL(5,2),
    wind_speed DECIMAL(5,2),
    wind_direction INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(season, round)
);

-- Driver-Team Associations (changes over time)
CREATE TABLE IF NOT EXISTS driver_team_associations (
    id SERIAL PRIMARY KEY,
    driver_id VARCHAR(50) REFERENCES drivers(id),
    team_id VARCHAR(50) REFERENCES teams(id),
    season INTEGER NOT NULL,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(driver_id, season)
);

-- Results and Performance Data
CREATE TABLE IF NOT EXISTS qualifying_results (
    id SERIAL PRIMARY KEY,
    race_id VARCHAR(100) REFERENCES races(id),
    driver_id VARCHAR(50) REFERENCES drivers(id),
    team_id VARCHAR(50) REFERENCES teams(id),
    position INTEGER,
    q1_time VARCHAR(20),
    q1_time_ms INTEGER,
    q2_time VARCHAR(20),
    q2_time_ms INTEGER,
    q3_time VARCHAR(20),
    q3_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS race_results (
    id SERIAL PRIMARY KEY,
    race_id VARCHAR(100) REFERENCES races(id),
    driver_id VARCHAR(50) REFERENCES drivers(id),
    team_id VARCHAR(50) REFERENCES teams(id),
    position INTEGER,
    grid_position INTEGER,
    points DECIMAL(4,2),
    laps INTEGER,
    race_time VARCHAR(20),
    race_time_ms BIGINT,
    fastest_lap VARCHAR(20),
    fastest_lap_ms INTEGER,
    fastest_lap_rank INTEGER,
    status VARCHAR(100), -- finished, retired, disqualified, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS practice_results (
    id SERIAL PRIMARY KEY,
    race_id VARCHAR(100) REFERENCES races(id),
    driver_id VARCHAR(50) REFERENCES drivers(id),
    team_id VARCHAR(50) REFERENCES teams(id),
    session VARCHAR(10), -- FP1, FP2, FP3
    position INTEGER,
    best_time VARCHAR(20),
    best_time_ms INTEGER,
    laps INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Advanced Performance Analytics
CREATE TABLE IF NOT EXISTS driver_performance_metrics (
    id SERIAL PRIMARY KEY,
    driver_id VARCHAR(50) REFERENCES drivers(id),
    season INTEGER,
    race_id VARCHAR(100) REFERENCES races(id),
    qualifying_performance DECIMAL(5,3), -- avg qualifying position vs team mate
    race_performance DECIMAL(5,3), -- avg race position vs team mate
    consistency_score DECIMAL(5,3), -- std dev of performances
    overtaking_ability DECIMAL(5,3), -- positions gained on average
    defensive_ability DECIMAL(5,3), -- positions lost on average
    wet_weather_skill DECIMAL(5,3), -- performance in wet conditions
    tire_management DECIMAL(5,3), -- stint length vs optimal
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS team_performance_metrics (
    id SERIAL PRIMARY KEY,
    team_id VARCHAR(50) REFERENCES teams(id),
    season INTEGER,
    race_id VARCHAR(100) REFERENCES races(id),
    car_performance DECIMAL(5,3), -- relative to field
    strategy_effectiveness DECIMAL(5,3), -- pit stop timing score
    reliability_score DECIMAL(5,3), -- DNF rate inverse
    development_rate DECIMAL(5,3), -- performance improvement over season
    qualifying_pace DECIMAL(5,3), -- average qualifying gap to pole
    race_pace DECIMAL(5,3), -- average race pace vs field
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Weather and Track Conditions
CREATE TABLE IF NOT EXISTS weather_forecasts (
    id SERIAL PRIMARY KEY,
    race_id VARCHAR(100) REFERENCES races(id),
    forecast_date TIMESTAMP,
    session_type VARCHAR(20), -- practice, qualifying, race
    temperature_air DECIMAL(5,2),
    temperature_track DECIMAL(5,2),
    humidity DECIMAL(5,2),
    wind_speed DECIMAL(5,2),
    wind_direction INTEGER,
    precipitation_probability DECIMAL(5,2),
    precipitation_amount DECIMAL(5,2),
    visibility INTEGER,
    conditions VARCHAR(50), -- sunny, cloudy, rain, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Predictions and ML Model Data
CREATE TABLE IF NOT EXISTS ml_models (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    version VARCHAR(50) NOT NULL,
    model_type VARCHAR(50), -- regression, classification, ensemble
    training_data_from DATE,
    training_data_to DATE,
    features JSONB, -- list of features used
    hyperparameters JSONB,
    performance_metrics JSONB, -- accuracy, precision, recall, etc.
    model_path VARCHAR(500), -- path to serialized model
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, version)
);

CREATE TABLE IF NOT EXISTS race_predictions (
    id SERIAL PRIMARY KEY,
    race_id VARCHAR(100) REFERENCES races(id),
    driver_id VARCHAR(50) REFERENCES drivers(id),
    team_id VARCHAR(50) REFERENCES teams(id),
    model_id INTEGER REFERENCES ml_models(id),
    predicted_position DECIMAL(5,2),
    confidence_score DECIMAL(5,3),
    points_probability DECIMAL(5,3),
    podium_probability DECIMAL(5,3),
    win_probability DECIMAL(5,3),
    dnf_probability DECIMAL(5,3),
    feature_importance JSONB, -- which features contributed most
    prediction_factors JSONB, -- human-readable explanation
    actual_position INTEGER, -- filled after race
    prediction_accuracy DECIMAL(5,3), -- calculated after race
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Historical Statistics and Trends
CREATE TABLE IF NOT EXISTS driver_circuit_stats (
    id SERIAL PRIMARY KEY,
    driver_id VARCHAR(50) REFERENCES drivers(id),
    circuit_id VARCHAR(50) REFERENCES circuits(id),
    races_entered INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    podiums INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    best_finish INTEGER,
    avg_finish DECIMAL(5,2),
    dnf_count INTEGER DEFAULT 0,
    avg_qualifying_position DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(driver_id, circuit_id)
);

CREATE TABLE IF NOT EXISTS team_circuit_stats (
    id SERIAL PRIMARY KEY,
    team_id VARCHAR(50) REFERENCES teams(id),
    circuit_id VARCHAR(50) REFERENCES circuits(id),
    races_entered INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    podiums INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    best_finish INTEGER,
    avg_finish DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, circuit_id)
);

-- Data Source Tracking and ETL
CREATE TABLE IF NOT EXISTS data_sources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    url VARCHAR(500),
    api_key_required BOOLEAN DEFAULT FALSE,
    rate_limit_per_hour INTEGER,
    last_successful_fetch TIMESTAMP,
    last_error TIMESTAMP,
    error_message TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS etl_jobs (
    id SERIAL PRIMARY KEY,
    job_name VARCHAR(100) NOT NULL,
    data_source_id INTEGER REFERENCES data_sources(id),
    job_type VARCHAR(50), -- full_sync, incremental, real_time
    schedule_cron VARCHAR(100),
    last_run TIMESTAMP,
    last_success TIMESTAMP,
    status VARCHAR(50), -- pending, running, completed, failed
    records_processed INTEGER,
    errors_count INTEGER,
    duration_seconds INTEGER,
    log_details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Caching and Performance
CREATE TABLE IF NOT EXISTS cache_invalidation (
    id SERIAL PRIMARY KEY,
    cache_key VARCHAR(255) UNIQUE NOT NULL,
    invalidated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason VARCHAR(255)
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_races_season_round ON races(season, round);
CREATE INDEX IF NOT EXISTS idx_race_results_race_position ON race_results(race_id, position);
CREATE INDEX IF NOT EXISTS idx_qualifying_results_race_position ON qualifying_results(race_id, position);
CREATE INDEX IF NOT EXISTS idx_predictions_race_driver ON race_predictions(race_id, driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_team_season ON driver_team_associations(driver_id, season);
CREATE INDEX IF NOT EXISTS idx_weather_race_session ON weather_forecasts(race_id, session_type);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_season ON driver_performance_metrics(season);
CREATE INDEX IF NOT EXISTS idx_etl_jobs_status ON etl_jobs(status, last_run);

-- Views for Common Queries
CREATE OR REPLACE VIEW current_driver_teams AS
SELECT
    d.id as driver_id,
    d.code,
    d.full_name as driver_name,
    t.id as team_id,
    t.name as team_name,
    dta.season
FROM drivers d
JOIN driver_team_associations dta ON d.id = dta.driver_id
JOIN teams t ON dta.team_id = t.id
WHERE dta.is_active = true;

CREATE OR REPLACE VIEW upcoming_races AS
SELECT
    r.*,
    c.name as circuit_name,
    c.country
FROM races r
JOIN circuits c ON r.circuit_id = c.id
WHERE r.race_date > CURRENT_DATE
ORDER BY r.race_date;

CREATE OR REPLACE VIEW race_prediction_summary AS
SELECT
    rp.race_id,
    r.name as race_name,
    r.race_date,
    COUNT(rp.id) as total_predictions,
    AVG(rp.confidence_score) as avg_confidence,
    AVG(rp.prediction_accuracy) as avg_accuracy
FROM race_predictions rp
JOIN races r ON rp.race_id = r.id
GROUP BY rp.race_id, r.name, r.race_date;