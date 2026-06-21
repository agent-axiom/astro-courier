ALTER TABLE player_progress ADD COLUMN cloud_code TEXT;
ALTER TABLE player_progress ADD COLUMN display_name TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_player_progress_cloud_code ON player_progress(cloud_code) WHERE cloud_code IS NOT NULL;
