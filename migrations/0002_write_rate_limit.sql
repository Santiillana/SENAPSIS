CREATE TABLE IF NOT EXISTS api_rate_limits (
  email TEXT PRIMARY KEY NOT NULL,
  window_start INTEGER NOT NULL,
  request_count INTEGER NOT NULL CHECK (request_count >= 0)
);
