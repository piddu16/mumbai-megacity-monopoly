import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!url || !anon) {
  // eslint-disable-next-line no-console
  console.warn("Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
}

export const supabase = createClient(url, anon, {
  realtime: {
    params: { eventsPerSecond: 20 },
  },
});

export type DbRoom = {
  id: string;
  code: string;
  host_id: string;
  host_name: string;
  status: "waiting" | "playing" | "finished";
  game_state: Record<string, unknown>;
  max_players: number;
  created_at: string;
  updated_at: string;
};

export type DbPlayer = {
  id: string;
  room_id: string;
  player_name: string;
  player_number: number;
  role: string;
  session_id: string;
  connected: boolean;
  created_at: string;
};

export type DbAction = {
  id: number;
  room_id: string;
  player_session: string;
  action_type: string;
  action_data: Record<string, unknown>;
  seq: number;
  created_at: string;
};
