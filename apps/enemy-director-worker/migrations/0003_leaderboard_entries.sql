CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  elapsed_seconds REAL NOT NULL,
  medal TEXT NOT NULL,
  replay_seed TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_contract_score
  ON leaderboard_entries(contract_id, score DESC, elapsed_seconds ASC);
