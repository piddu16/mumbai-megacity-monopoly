-- Mumbai Megacity Monopoly — Schema
-- All tables prefixed mm_ to avoid conflicts.

CREATE TABLE IF NOT EXISTS mm_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  host_id TEXT NOT NULL,
  host_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting',
  game_state JSONB DEFAULT '{}'::jsonb,
  max_players INT DEFAULT 6,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mm_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES mm_rooms(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  player_number INT NOT NULL,
  role TEXT DEFAULT 'TYCOON',
  session_id TEXT NOT NULL,
  connected BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(room_id, player_number),
  UNIQUE(room_id, session_id)
);

CREATE TABLE IF NOT EXISTS mm_actions (
  id BIGSERIAL PRIMARY KEY,
  room_id uuid REFERENCES mm_rooms(id) ON DELETE CASCADE,
  player_session TEXT NOT NULL,
  action_type TEXT NOT NULL,
  action_data JSONB DEFAULT '{}'::jsonb,
  seq INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE mm_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE mm_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE mm_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mm_rooms_all" ON mm_rooms;
DROP POLICY IF EXISTS "mm_players_all" ON mm_players;
DROP POLICY IF EXISTS "mm_actions_all" ON mm_actions;

CREATE POLICY "mm_rooms_all" ON mm_rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "mm_players_all" ON mm_players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "mm_actions_all" ON mm_actions FOR ALL USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE mm_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE mm_players;
ALTER PUBLICATION supabase_realtime ADD TABLE mm_actions;

CREATE INDEX IF NOT EXISTS idx_mm_rooms_code ON mm_rooms(code);
CREATE INDEX IF NOT EXISTS idx_mm_players_room ON mm_players(room_id);
CREATE INDEX IF NOT EXISTS idx_mm_actions_room_seq ON mm_actions(room_id, seq);
