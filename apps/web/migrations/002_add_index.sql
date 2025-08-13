CREATE INDEX IF NOT EXISTS idx_features_current_race ON features_current(race_id);
CREATE INDEX IF NOT EXISTS idx_results_race_driver ON results(race_id, driver_id);