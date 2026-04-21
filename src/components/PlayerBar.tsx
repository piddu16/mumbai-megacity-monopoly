"use client";
import type { GameState } from "@/lib/types";
import { PLAYER_COLORS, PLAYER_TOKENS, ROLE_INFO, formatMoneyShort } from "@/lib/constants";

interface Props {
  state: GameState;
  mySessionId: string;
}

export function PlayerBar({ state, mySessionId }: Props) {
  return (
    <div className="bg-navy-950/90 backdrop-blur sticky top-0 z-20 border-b border-gold-400/20">
      <div className="flex items-stretch overflow-x-auto no-scrollbar px-2 py-2 gap-2">
        {state.players.map((p, i) => {
          const isCurrent = i === state.current;
          const isMe = p.id === mySessionId;
          const color = PLAYER_COLORS[p.number];
          const token = PLAYER_TOKENS[p.number];
          const role = ROLE_INFO[p.role];
          return (
            <div
              key={p.id}
              className={`shrink-0 min-w-[130px] px-3 py-2 rounded-lg border transition-all ${
                isCurrent
                  ? "border-gold-400 bg-gold-400/10 shadow-gold"
                  : "border-white/10 bg-navy-900/50"
              } ${isMe ? "ring-1 ring-gold-400/40" : ""}`}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-xs"
                  style={{ background: color }}
                  title={role.name}
                >
                  {token}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold truncate flex items-center gap-1">
                    {p.name}
                    {isMe && <span className="text-gold-400">(you)</span>}
                  </div>
                  <div className="text-[10px] text-gold-100/60 truncate">{role.emoji} {role.name}</div>
                </div>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <div className="money text-xs">{formatMoneyShort(p.money)}</div>
                <div className="text-[10px] text-gold-100/50">🏘️ {p.propertyCount}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
