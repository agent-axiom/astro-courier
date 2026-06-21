CREATE TABLE IF NOT EXISTS player_progress (
  player_id TEXT PRIMARY KEY,
  progress_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_player_progress_updated_at ON player_progress(updated_at);
