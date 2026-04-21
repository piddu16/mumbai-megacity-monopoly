"use client";
import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import type { GameAction, GameState, Player, RoleId, WinCondition } from "@/lib/types";
import { initialState, makePlayer, reducer } from "@/lib/game-engine";
import { GameBoard } from "@/components/GameBoard";
import { ROLE_INFO, MAX_PLAYERS, DEFAULT_MAX_ROUNDS } from "@/lib/constants";
import { ROLE_POWERS } from "@/lib/roles";

type Seat = { name: string; role: RoleId };

const DEFAULT_SEATS: Seat[] = [
  { name: "Rustam",  role: "TYCOON" },
  { name: "Priya",   role: "JUDGE" },
  { name: "Aarav",   role: "MINISTER" },
  { name: "Sunita",  role: "BMC" },
  { name: "Vikram",  role: "MHADA" },
  { name: "Sneha",   role: "TYCOON" },
];

export default function PracticePage() {
  const [seats, setSeats] = useState<Seat[]>(DEFAULT_SEATS.slice(0, 4));
  const [winCondition, setWinCondition] = useState<WinCondition>("last_standing");
  const [maxRounds, setMaxRounds] = useState(DEFAULT_MAX_ROUNDS);
  const [state, setState] = useState<GameState | null>(null);

  // In practice mode, "me" is whichever player's turn it is — so the board UI always
  // renders actions for the current player. Host plays all of them.
  const mySessionId = state?.players[state.current]?.id ?? "";

  const dispatch = useCallback(
    (action: GameAction) => {
      setState((prev) => (prev ? reducer(prev, action) : prev));
    },
    [],
  );

  function start() {
    const players: Player[] = seats.map((s, i) =>
      makePlayer(`practice-${i}`, s.name, i, s.role),
    );
    setState(initialState({
      roomCode: "PRACTICE",
      players,
      winCondition,
      maxRounds,
    }));
  }

  function reset() {
    setState(null);
  }

  function updateSeat(idx: number, patch: Partial<Seat>) {
    setSeats((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }

  function addSeat() {
    if (seats.length >= MAX_PLAYERS) return;
    const next = DEFAULT_SEATS[seats.length] ?? { name: `Player ${seats.length + 1}`, role: "TYCOON" as RoleId };
    setSeats((prev) => [...prev, next]);
  }

  function removeSeat(idx: number) {
    if (seats.length <= 2) return;
    setSeats((prev) => prev.filter((_, i) => i !== idx));
  }

  // Set up — no game started yet
  if (!state) {
    return (
      <main className="min-h-screen p-4 max-w-2xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <Link className="btn-ghost" href="/">← Back</Link>
          <div className="text-center">
            <div className="text-xs uppercase tracking-widest text-gold-200/70">Practice Mode</div>
            <div className="heading text-xl gold-shimmer font-bold">Solo / Hot-Seat</div>
          </div>
          <div className="w-16" />
        </header>

        <div className="card p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="heading text-lg text-gold-200">Players ({seats.length})</h2>
            <button
              className="btn-outline !py-1 !px-3 text-xs"
              onClick={addSeat}
              disabled={seats.length >= MAX_PLAYERS}
            >
              + Add
            </button>
          </div>
          <div className="space-y-2">
            {seats.map((s, i) => (
              <div key={i} className="flex items-center gap-2 bg-navy-950/50 border border-white/5 rounded-lg p-2">
                <input
                  value={s.name}
                  onChange={(e) => updateSeat(i, { name: e.target.value.slice(0, 20) })}
                  className="input !py-1 !px-2 text-sm flex-1"
                  maxLength={20}
                />
                <select
                  value={s.role}
                  onChange={(e) => updateSeat(i, { role: e.target.value as RoleId })}
                  className="input !py-1 !px-2 text-sm w-auto"
                >
                  {Object.values(ROLE_INFO).map((r) => (
                    <option key={r.id} value={r.id}>{r.emoji} {r.name}</option>
                  ))}
                </select>
                {seats.length > 2 && (
                  <button
                    onClick={() => removeSeat(i)}
                    className="text-gold-100/40 hover:text-red-400 px-2"
                    title="Remove"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5 mb-4">
          <h3 className="heading text-lg text-gold-200 mb-3">Win Condition</h3>
          <div className="grid gap-2">
            {[
              { id: "last_standing", label: "Last Tycoon Standing", desc: "All others bankrupt" },
              { id: "mumbai_raja", label: "Mumbai Ka Raja", desc: "First to ₹200Cr net worth" },
              { id: "fixed_rounds", label: "Fixed Rounds", desc: `After ${maxRounds} rounds, highest wins` },
            ].map((w) => (
              <label
                key={w.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${
                  winCondition === w.id ? "border-gold-400 bg-gold-400/10" : "border-white/10 hover:bg-white/5"
                }`}
              >
                <input
                  type="radio"
                  checked={winCondition === w.id}
                  onChange={() => setWinCondition(w.id as WinCondition)}
                  className="accent-gold-400"
                />
                <div>
                  <div className="font-semibold text-sm">{w.label}</div>
                  <div className="text-xs text-gold-100/60">{w.desc}</div>
                </div>
              </label>
            ))}
          </div>
          {winCondition === "fixed_rounds" && (
            <div className="mt-3 flex items-center gap-2">
              <label className="text-sm text-gold-100/70">Rounds:</label>
              <input
                type="number"
                value={maxRounds}
                onChange={(e) => setMaxRounds(Math.max(5, Math.min(100, Number(e.target.value) || 30)))}
                className="input w-24 text-center"
              />
            </div>
          )}
        </div>

        <button className="btn-gold w-full py-4 text-lg" onClick={start}>
          Start Practice Game
        </button>

        <div className="mt-4 text-xs text-gold-100/50 text-center">
          Practice mode runs entirely in your browser. No room, no friends needed.
          <br />You play every player. All actions are allowed.
        </div>
      </main>
    );
  }

  // Game running
  return (
    <div className="relative">
      <div className="fixed top-2 left-1/2 -translate-x-1/2 z-30 chip bg-gold-400/20 border border-gold-400/40 text-gold-200 text-[10px] uppercase tracking-widest flex items-center gap-2">
        🎯 Practice Mode · Playing as <b className="text-gold-300">{state.players[state.current]?.name}</b>
        <button onClick={reset} className="text-gold-100/60 hover:text-gold-200 ml-2 underline">Exit</button>
      </div>
      <GameBoard state={state} dispatch={dispatch} mySessionId={mySessionId} roomCode="PRACTICE" />
    </div>
  );
}
