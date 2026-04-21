"use client";
import { useState } from "react";
import type { DbPlayer } from "@/lib/supabase";
import type { RoleId, WinCondition } from "@/lib/types";
import { MIN_PLAYERS, PLAYER_COLORS, PLAYER_TOKENS, ROLE_INFO, DEFAULT_MAX_ROUNDS } from "@/lib/constants";
import { ROLE_POWERS } from "@/lib/roles";

interface Props {
  roomCode: string;
  isHost: boolean;
  players: DbPlayer[];
  me: DbPlayer;
  onRoleChange: (role: RoleId) => void;
  onStart: (winCondition: WinCondition, maxRounds: number) => void;
  onLeave: () => void;
}

export function Lobby(props: Props) {
  const { roomCode, isHost, players, me, onRoleChange, onStart, onLeave } = props;
  const [winCondition, setWinCondition] = useState<WinCondition>("last_standing");
  const [maxRounds, setMaxRounds] = useState(DEFAULT_MAX_ROUNDS);
  const [copied, setCopied] = useState(false);
  const [detail, setDetail] = useState<RoleId | null>(null);

  const canStart = isHost && players.length >= MIN_PLAYERS;

  async function copyLink() {
    const url = `${window.location.origin}/game/${roomCode}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // fallthrough
    }
  }

  const myRole = (me.role as RoleId) ?? "TYCOON";

  return (
    <main className="min-h-screen py-6 px-4 max-w-3xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <button className="btn-ghost" onClick={onLeave}>← Leave</button>
        <div className="text-right">
          <div className="text-gold-100/60 text-xs uppercase tracking-widest">Room</div>
          <div className="font-mono text-3xl tracking-[0.3em] gold-shimmer font-bold">{roomCode}</div>
        </div>
      </header>

      <div className="card p-5 mb-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="heading text-lg text-gold-200">Waiting for players</div>
            <div className="text-sm text-gold-100/60">
              {players.length}/6 joined · Min {MIN_PLAYERS}
            </div>
          </div>
          <button className="btn-outline text-sm" onClick={copyLink}>{copied ? "Copied!" : "Copy invite link"}</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const p = players.find((x) => x.player_number === i);
            if (!p) {
              return (
                <div key={i} className="rounded-lg border border-white/5 border-dashed p-3 text-center text-gold-100/30 text-sm">
                  Slot {i + 1}
                </div>
              );
            }
            const color = PLAYER_COLORS[p.player_number];
            const token = PLAYER_TOKENS[p.player_number];
            const role = ROLE_INFO[p.role as RoleId] ?? ROLE_INFO.TYCOON;
            return (
              <div key={i} className="rounded-lg p-3 border border-white/10 bg-navy-950/50">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-xs" style={{ background: color }}>{token}</span>
                  <span className="font-semibold text-sm truncate">{p.player_name}</span>
                </div>
                <div className="mt-1 text-xs text-gold-100/60 truncate">{role.emoji} {role.name}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Role picker */}
      <section className="card p-5 mb-5">
        <h3 className="heading text-lg text-gold-200 mb-3">Your Role</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {Object.values(ROLE_INFO).map((r) => {
            const isMe = myRole === r.id;
            // Uniqueness check: only one player per governance role. Tycoon can be picked by many.
            const takenBy = r.id !== "TYCOON"
              ? players.find((pl) => pl.session_id !== me.session_id && (pl.role as RoleId) === r.id)
              : undefined;
            const locked = !!takenBy;
            return (
              <button
                key={r.id}
                onClick={() => !locked && onRoleChange(r.id)}
                onDoubleClick={() => setDetail(r.id)}
                disabled={locked && !isMe}
                title={takenBy ? `Taken by ${takenBy.player_name}` : undefined}
                className={`p-3 rounded-lg border text-center transition-all ${
                  isMe
                    ? "border-gold-400 bg-gold-400/10 shadow-gold"
                    : locked
                    ? "border-white/5 opacity-40 cursor-not-allowed"
                    : "border-white/10 hover:border-gold-400/60 hover:bg-white/5"
                }`}
              >
                <div className="text-2xl mb-1">{r.emoji}</div>
                <div className="text-xs font-semibold">{r.name}</div>
                {takenBy && <div className="text-[9px] text-gold-100/40 mt-0.5 truncate">— {takenBy.player_name}</div>}
              </button>
            );
          })}
        </div>
        <button
          className="text-xs text-gold-200/70 underline mt-3"
          onClick={() => setDetail(myRole)}
        >
          See {ROLE_INFO[myRole].name} powers →
        </button>
      </section>

      {/* Win condition */}
      {isHost && (
        <section className="card p-5 mb-5">
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
        </section>
      )}

      {/* Start button */}
      <div className="flex gap-3">
        {isHost && (
          <button
            className="btn-gold flex-1 text-lg py-4"
            disabled={!canStart}
            onClick={() => onStart(winCondition, maxRounds)}
          >
            {canStart ? "Start Game" : `Need ${MIN_PLAYERS - players.length} more`}
          </button>
        )}
        {!isHost && (
          <div className="flex-1 text-center text-gold-100/60 italic py-4">
            Waiting for host to start…
          </div>
        )}
      </div>

      {/* Role detail modal */}
      {detail && (
        <div className="fixed inset-0 z-40 bg-navy-950/90 flex items-end sm:items-center justify-center p-4" onClick={() => setDetail(null)}>
          <div className="card-gold max-w-md w-full p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{ROLE_INFO[detail].emoji}</span>
              <div>
                <div className="heading text-xl">{ROLE_INFO[detail].name}</div>
                <div className="text-xs text-gold-100/60">{ROLE_INFO[detail].theme}</div>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              {ROLE_POWERS[detail].map((p) => (
                <div key={p.id}>
                  <div className="font-semibold text-gold-200">{p.name}</div>
                  <div className="text-gold-100/75">{p.description}</div>
                </div>
              ))}
            </div>
            <button className="btn-outline w-full mt-4" onClick={() => setDetail(null)}>Close</button>
          </div>
        </div>
      )}
    </main>
  );
}
