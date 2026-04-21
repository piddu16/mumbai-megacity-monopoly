"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import { useGameSync } from "@/hooks/useGameSync";
import { supabase } from "@/lib/supabase";
import type { GameAction, Player, RoleId, WinCondition } from "@/lib/types";
import { initialState, makePlayer, reducer } from "@/lib/game-engine";
import { Lobby } from "@/components/Lobby";
import { GameBoard } from "@/components/GameBoard";

export default function GamePage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const code = (params.code ?? "").toUpperCase();
  const { sessionId, name, setName } = useSession();
  const { room, players, state, connected, loadError, writeState } = useGameSync(code, sessionId);

  const [joinName, setJoinName] = useState("");
  const [joinBusy, setJoinBusy] = useState(false);
  const [joinErr, setJoinErr] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    if (!code) router.replace("/");
  }, [code, sessionId, router]);

  useEffect(() => {
    if (name) setJoinName(name);
  }, [name]);

  const isHost = !!room && room.hostId === sessionId;
  const me = players.find((p) => p.session_id === sessionId);

  const dispatch = useCallback(
    (action: GameAction) => {
      if (!state) return;
      // Client-side turn guard: only the current player can dispatch turn-gated actions.
      // Multi-player actions (auctions, chat, side deals, committee votes, standoff bets)
      // are always allowed. Server-authoritative enforcement lives in the Edge Function.
      const UNIVERSAL = new Set<GameAction["type"]>([
        "AUCTION_BID", "AUCTION_PASS", "AUCTION_CLOSE",
        "SEND_CHAT",
        "PROPOSE_SIDE_DEAL", "ACCEPT_SIDE_DEAL", "REJECT_SIDE_DEAL", "FLAG_SIDE_DEAL",
        "COMMITTEE_VOTE", "COMMITTEE_RESOLVE",
        "STANDOFF_BET", "STANDOFF_CHOOSE_BLIND", "STANDOFF_REVEAL",
        "LOG",
      ]);
      if (!UNIVERSAL.has(action.type) && state.players[state.current]?.id !== sessionId) {
        return; // not your turn
      }
      const next = reducer(state, action);
      writeState(next);
    },
    [state, writeState, sessionId],
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

  async function joinNow() {
    if (!room || !sessionId) return;
    const trimmed = joinName.trim();
    if (!trimmed) return setJoinErr("Enter a name.");
    setJoinBusy(true);
    setJoinErr(null);
    setName(trimmed);
    try {
      const numbers = players.map((p) => p.player_number).sort((a, b) => a - b);
      let next = 0;
      while (numbers.includes(next)) next++;
      if (next >= room.maxPlayers) {
        setJoinErr("Room is full.");
        setJoinBusy(false);
        return;
      }
      const { error } = await supabase.from("mm_players").insert({
        room_id: room.id,
        player_name: trimmed,
        player_number: next,
        role: "TYCOON",
        session_id: sessionId,
        connected: true,
      });
      if (error) throw error;
    } catch (e) {
      setJoinErr(e instanceof Error ? e.message : "Could not join.");
      setJoinBusy(false);
    }
  }

  if (loadError) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-3">{loadError}</p>
          <p className="text-gold-100/60 text-sm mb-5">Room code: <span className="font-mono">{code}</span></p>
          <Link className="btn-outline" href="/">Back home</Link>
        </div>
      </main>
    );
  }
  // Waiting on session + initial room fetch. `connected` is a soft indicator, not a gate.
  if (!sessionId || !room) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gold-100/60">Connecting to {code}…</p>
          <p className="text-gold-100/30 text-xs mt-4">
            Taking a while? <Link className="underline hover:text-gold-200" href="/">Go back</Link>
          </p>
        </div>
      </main>
    );
  }
  void connected;

  // Connected but we're not a player in this room → join flow (if waiting) or spectate (if playing)
  if (!me) {
    if (room.status === "waiting") {
      const seatsLeft = room.maxPlayers - players.length;
      const canJoin = seatsLeft > 0;
      return (
        <main className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-sm w-full card p-5">
            <div className="text-center mb-4">
              <div className="text-xs uppercase tracking-widest text-gold-200/70">Room</div>
              <div className="font-mono text-2xl tracking-[0.3em] gold-shimmer font-bold">{code}</div>
              <div className="text-sm text-gold-100/60 mt-1">
                Host: {room.hostName} · {players.length}/{room.maxPlayers} players
              </div>
            </div>
            {canJoin ? (
              <>
                <label className="text-xs text-gold-200/80 mb-1 block">Your name</label>
                <input
                  className="input mb-3"
                  value={joinName}
                  onChange={(e) => setJoinName(e.target.value.slice(0, 20))}
                  placeholder="Enter your name"
                  maxLength={20}
                  autoFocus
                />
                <button className="btn-gold w-full" disabled={joinBusy || !joinName.trim()} onClick={joinNow}>
                  {joinBusy ? "Joining…" : "Join Room"}
                </button>
                {joinErr && <p className="text-red-400 text-xs mt-2 text-center">{joinErr}</p>}
              </>
            ) : (
              <div className="text-center text-gold-100/60">
                Room is full. <Link className="underline" href="/">Go back</Link>
              </div>
            )}
            <Link href="/" className="btn-ghost w-full mt-3 justify-center text-xs">Back to home</Link>
          </div>
        </main>
      );
    }
    // Playing but not a member → spectate
    if (room.status === "playing" && state) {
      return (
        <div className="relative">
          <div className="fixed top-2 left-1/2 -translate-x-1/2 z-30 chip bg-gold-400/20 border border-gold-400/40 text-gold-200 text-[10px] uppercase tracking-widest">
            👁️ Spectating
          </div>
          <GameBoard state={state} dispatch={dispatch} mySessionId={sessionId} roomCode={code} />
        </div>
      );
    }
    // finished or unknown
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gold-100/60 mb-3">This game isn&apos;t joinable.</p>
          <Link className="btn-outline" href="/">Back home</Link>
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
