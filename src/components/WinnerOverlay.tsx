"use client";
import Link from "next/link";
import type { GameState } from "@/lib/types";
import { PLAYER_COLORS, PLAYER_TOKENS, formatMoney } from "@/lib/constants";
import { computeNetWorth } from "@/lib/game-engine";

interface Props {
  state: GameState;
}

export function WinnerOverlay({ state }: Props) {
  const winner = state.players.find((p) => p.id === state.winnerId);
  if (!winner) return null;

  const ranked = [...state.players]
    .map((p) => ({ p, worth: computeNetWorth(state, p.id) }))
    .sort((a, b) => b.worth - a.worth);

  return (
    <div className="fixed inset-0 z-50 bg-navy-950/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="text-7xl mb-2">🏆</div>
        <div className="text-xs uppercase tracking-widest text-gold-200/70">Mumbai Ka Raja</div>
        <div className="heading text-5xl gold-shimmer font-black mb-2">{winner.name}</div>
        <div className="text-sm text-gold-100/60 mb-6">wins the Megacity.</div>

        <div className="card-gold p-4 space-y-2">
          {ranked.map((r, i) => (
            <div key={r.p.id} className="flex items-center gap-3">
              <span className="font-mono w-6 text-gold-200/60">#{i + 1}</span>
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{ background: PLAYER_COLORS[r.p.number] }}>
                {PLAYER_TOKENS[r.p.number]}
              </span>
              <span className="flex-1 text-left font-semibold">{r.p.name}</span>
              <span className="money text-sm">{formatMoney(r.worth)}</span>
            </div>
          ))}
        </div>

        <Link href="/" className="btn-gold mt-6 inline-block">Play Again</Link>
      </div>
    </div>
  );
}
