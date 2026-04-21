"use client";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import type { GameState } from "@/lib/types";
import { PLAYER_COLORS, PLAYER_TOKENS, ROLE_INFO, CRORE } from "@/lib/constants";
import { MoneyDelta } from "./MoneyDelta";

interface Props {
  state: GameState;
  mySessionId: string;
}

export function PlayerBar({ state, mySessionId }: Props) {
  return (
    <div className="sticky top-0 z-20 glass border-b border-gold-400/20">
      <div className="flex items-stretch overflow-x-auto no-scrollbar px-2 py-2 gap-2">
        {state.players.map((p, i) => {
          const isCurrent = i === state.current;
          const isMe = p.id === mySessionId;
          const color = PLAYER_COLORS[p.number];
          const token = PLAYER_TOKENS[p.number];
          const role = ROLE_INFO[p.role];
          const offline = p.connected === false;
          const moneyCr = p.money / CRORE;

          return (
            <motion.div
              key={p.id}
              layout
              animate={isCurrent ? { scale: 1.02, y: -2 } : { scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative shrink-0 min-w-[148px] px-3 py-2 rounded-xl"
              style={{
                background: isCurrent
                  ? `linear-gradient(180deg, ${color}22 0%, rgba(11,11,15,0.9) 100%)`
                  : "linear-gradient(180deg, rgba(19,21,33,0.7) 0%, rgba(11,11,15,0.7) 100%)",
                border: isCurrent
                  ? `1px solid ${color}`
                  : "1px solid rgba(255,255,255,0.08)",
                boxShadow: isCurrent
                  ? `0 0 24px ${color}66, inset 0 1px 0 rgba(255,255,255,0.08)`
                  : "inset 0 1px 0 rgba(255,255,255,0.03)",
                opacity: offline ? 0.55 : 1,
              }}
            >
              {/* Current-player spotlight */}
              {isCurrent && (
                <motion.div
                  className="absolute inset-0 rounded-xl pointer-events-none"
                  animate={{ opacity: [0.4, 0.8, 0.4] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  style={{ boxShadow: `inset 0 0 20px ${color}44` }}
                />
              )}

              {/* "Me" marker */}
              {isMe && (
                <span
                  className="absolute -top-1.5 left-3 px-1.5 py-px rounded cinzel text-[8px] tracking-widest"
                  style={{ background: color, color: "#0B0B0F" }}
                >
                  YOU
                </span>
              )}

              <div className="flex items-center gap-2 relative">
                <MoneyDelta value={p.money} />
                <div className="relative shrink-0">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
                    style={{
                      background: `radial-gradient(circle at 30% 30%, ${color}, ${color}cc)`,
                      boxShadow: isCurrent ? `0 0 12px ${color}` : `0 0 6px ${color}66`,
                    }}
                    title={role.name}
                  >
                    {token}
                  </span>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-ink-950 ${
                      offline ? "bg-gray-500" : "bg-emerald-400"
                    }`}
                    style={offline ? {} : { boxShadow: "0 0 6px rgba(0,184,148,0.8)" }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-semibold truncate leading-tight" style={{ color: isCurrent ? color : "#F5EAD1" }}>
                    {p.name}
                  </div>
                  <div className="text-[9px] text-gold-100/60 truncate tracking-wider uppercase">
                    {role.emoji} {role.name}
                  </div>
                </div>
              </div>

              <div className="mt-1.5 flex items-center justify-between">
                <div className="money text-[11px] font-bold">
                  ₹<CountUp
                    end={moneyCr}
                    duration={0.8}
                    decimals={moneyCr < 10 ? 1 : 0}
                    preserveValue
                  />Cr
                </div>
                <div className="flex items-center gap-0.5 text-[10px] text-gold-100/60">
                  <span>🏘️</span>
                  <span className="font-mono">{p.propertyCount}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
