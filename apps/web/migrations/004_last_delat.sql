CREATE TABLE IF NOT EXISTS openf1_cache (
  session_uid text PRIMARY KEY,
  payload jsonb,
  fetched_at timestamptz default now()
);