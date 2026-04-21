"use client";
import type { GameState } from "@/lib/types";

interface Props {
  state: GameState;
}

export function GameLog({ state }: Props) {
  const entries = [...state.log].reverse();
  return (
    <div className="h-full min-h-0 overflow-y-auto p-3 space-y-1.5 text-xs">
      {entries.length === 0 && (
        <div className="text-center text-gold-100/40 italic py-6">No events yet.</div>
      )}
      {entries.map((e) => (
        <div key={e.id} className="flex items-start gap-2 py-1 border-b border-white/5 last:border-0">
          <span className="text-[9px] text-gold-100/30 mt-0.5">{new Date(e.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          <span className="flex-1 text-gold-100/80">{e.message}</span>
        </div>
      ))}
    </div>
  );
}
