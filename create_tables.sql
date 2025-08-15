CREATE TABLE IF NOT EXISTS eval_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  created_at timestamptz DEFAULT now(),
  dataset text NOT NULL,
  brier float,
  logloss float,
  notes text
);

CREATE TABLE IF NOT EXISTS eval_samples (
  run_id uuid REFERENCES eval_runs(id) ON DELETE CASCADE,
  race_id text,
  driver_id text,
  y_true int,
  y_prob float,
  PRIMARY KEY (run_id, race_id, driver_id)
);
