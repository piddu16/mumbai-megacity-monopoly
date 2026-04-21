"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase, type DbPlayer, type DbRoom } from "@/lib/supabase";
import type { GameState } from "@/lib/types";

export interface RoomMeta {
  id: string;
  code: string;
  hostId: string;
  hostName: string;
  status: "waiting" | "playing" | "finished";
  maxPlayers: number;
}

export function useGameSync(roomCode: string | null, sessionId: string) {
  const [room, setRoom] = useState<RoomMeta | null>(null);
  const [players, setPlayers] = useState<DbPlayer[]>([]);
  const [state, setState] = useState<GameState | null>(null);
  const [connected, setConnected] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const lastSeqRef = useRef<number>(-1);
  const roomIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!roomCode) return;
    let mounted = true;
    setLoadError(null);

    async function load() {
      const { data: r, error: roomErr } = await supabase
        .from("mm_rooms")
        .select("*")
        .eq("code", roomCode)
        .maybeSingle();
      if (!mounted) return;
      if (roomErr) {
        setLoadError(roomErr.message);
        return;
      }
      if (!r) {
        setLoadError("Room not found");
        return;
      }
      const dbRoom = r as DbRoom;
      roomIdRef.current = dbRoom.id;
      setRoom({
        id: dbRoom.id,
        code: dbRoom.code,
        hostId: dbRoom.host_id,
        hostName: dbRoom.host_name,
        status: dbRoom.status,
        maxPlayers: dbRoom.max_players,
      });
      if (dbRoom.game_state && Object.keys(dbRoom.game_state).length > 0) {
        setState(dbRoom.game_state as unknown as GameState);
        lastSeqRef.current = (dbRoom.game_state as { seq?: number }).seq ?? 0;
      }

      const { data: ps } = await supabase
        .from("mm_players")
        .select("*")
        .eq("room_id", dbRoom.id)
        .order("player_number");
      if (!mounted) return;
      setPlayers((ps ?? []) as DbPlayer[]);

      const me = (ps ?? []).find((p) => (p as DbPlayer).session_id === sessionId);
      if (me) {
        await supabase
          .from("mm_players")
          .update({ connected: true })
          .eq("id", (me as DbPlayer).id);
      }
    }

    load();

    async function refreshPlayers() {
      const rid = roomIdRef.current;
      if (!rid) return;
      const { data: ps } = await supabase
        .from("mm_players")
        .select("*")
        .eq("room_id", rid)
        .order("player_number");
      if (!mounted) return;
      setPlayers((ps ?? []) as DbPlayer[]);
    }

    const channel = supabase
      .channel(`mm-room-${roomCode}`, { config: { presence: { key: sessionId } } })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mm_rooms", filter: `code=eq.${roomCode}` },
        (payload) => {
          if (payload.eventType === "DELETE") return;
          const r = payload.new as DbRoom;
          roomIdRef.current = r.id;
          setRoom({
            id: r.id,
            code: r.code,
            hostId: r.host_id,
            hostName: r.host_name,
            status: r.status,
            maxPlayers: r.max_players,
          });
          const incomingSeq = (r.game_state as { seq?: number })?.seq ?? 0;
          if (incomingSeq >= lastSeqRef.current) {
            lastSeqRef.current = incomingSeq;
            setState(r.game_state as unknown as GameState);
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mm_players" },
        () => { refreshPlayers(); },
      )
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
      });

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode, sessionId]);

  const writeState = useCallback(
    async (next: GameState) => {
      const rid = roomIdRef.current;
      if (!rid) return;
      lastSeqRef.current = next.seq;
      setState(next);
      const { error } = await supabase
        .from("mm_rooms")
        .update({ game_state: next as unknown as Record<string, unknown>, updated_at: new Date().toISOString() })
        .eq("id", rid);
      if (error) {
        // eslint-disable-next-line no-console
        console.error("[mm] writeState error:", error);
      }
    },
    [],
  );

  const broadcast = useCallback(
    async (event: string, payload: Record<string, unknown>) => {
      if (!roomCode) return;
      const ch = supabase.channel(`mm-room-${roomCode}`);
      await ch.send({ type: "broadcast", event, payload });
    },
    [roomCode],
  );

  return {
    room,
    players,
    state,
    connected,
    loadError,
    writeState,
    broadcast,
  };
}
