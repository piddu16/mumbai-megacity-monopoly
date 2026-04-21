"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import { useGameSync } from "@/hooks/useGameSync";
import { supabase } from "@/lib/supabase";
import type { GameAction, GameState, Player, RoleId, WinCondition } from "@/lib/types";
import { initialState, makePlayer, reducer } from "@/lib/game-engine";
import { Lobby } from "@/components/Lobby";
import { GameBoard } from "@/components/GameBoard";
import { DEFAULT_MAX_ROUNDS } from "@/lib/constants";

export default function GamePage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const code = (params.code ?? "").toUpperCase();
  const { sessionId, name } = useSession();
  const { room, players, state, connected, writeState } = useGameSync(code, sessionId);

  useEffect(() => {
    if (!sessionId) return;
    if (!code) router.replace("/");
  }, [code, sessionId, router]);

  const isHost = !!room && room.hostId === sessionId;
  const me = players.find((p) => p.session_id === sessionId);

  const dispatch = useCallback(
    (action: GameAction) => {
      if (!state) return;
      const next = reducer(state, action);
      writeState(next);
    },
    [state, writeState],
  );

  const startGame = useCallback(
    async (winCondition: WinCondition, maxRounds: number) => {
      if (!room || !isHost) return;
      const enginePlayers: Player[] = players
        .sort((a, b) => a.player_number - b.player_number)
        .map((p) => makePlayer(p.session_id, p.player_name, p.player_number, p.role as RoleId));
      const fresh = initialState({
        roomCode: code,
        players: enginePlayers,
        winCondition,
        maxRounds,
      });
      await supabase
        .from("mm_rooms")
        .update({ status: "playing", game_state: fresh as unknown as Record<string, unknown> })
        .eq("id", room.id);
    },
    [room, isHost, players, code],
  );

  const updateRole = useCallback(
    async (role: RoleId) => {
      if (!me) return;
      await supabase.from("mm_players").update({ role }).eq("id", me.id);
    },
    [me],
  );

  const leaveRoom = useCallback(async () => {
    if (me) await supabase.from("mm_players").delete().eq("id", me.id);
    router.push("/");
  }, [me, router]);

  // Loading state
  if (!sessionId || !connected || !room || !me) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gold-100/60">Connecting to {code}…</p>
          {!name && <p className="text-red-400 mt-3 text-sm">You need a name. <Link className="underline" href="/">Go back</Link></p>}
        </div>
      </main>
    );
  }

  // Lobby
  if (room.status === "waiting" || !state || !state.players?.length) {
    return (
      <Lobby
        roomCode={code}
        isHost={isHost}
        players={players}
        me={me}
        onRoleChange={updateRole}
        onStart={startGame}
        onLeave={leaveRoom}
      />
    );
  }

  return <GameBoard state={state} dispatch={dispatch} mySessionId={sessionId} roomCode={code} />;
}
