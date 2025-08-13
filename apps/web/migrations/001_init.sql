CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE drivers(
  id text PRIMARY KEY,
  code text,
  name text,
  constructor text
);

CREATE TABLE races(
  id text PRIMARY KEY,
  season int,
  round int,
  name text,
  circuit text,
  date date,
  country text
);

CREATE TABLE results(
  race_id text,
  driver_id text,
  grid int,
  finish int,
  status text,
  points float,
  PRIMARY KEY (race_id, driver_id)
);

CREATE TABLE features_current(
  race_id text,
  driver_id text,
  quali_pos int,
  avg_fp_longrun_delta float,
  constructor_form float,
  driver_form float,
  circuit_effect float,
  weather_risk float,
  PRIMARY KEY (race_id, driver_id)
);

CREATE TABLE model_coeffs(
  model text,
  feature text,
  weight float,
  PRIMARY KEY (model, feature)
);