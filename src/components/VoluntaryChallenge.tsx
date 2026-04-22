"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GameAction, GameState, Player } from "@/lib/types";
import { PLAYER_COLORS, PLAYER_TOKENS, CRORE, formatMoney } from "@/lib/constants";
import { playSfx } from "@/lib/sound";

interface Props {
  state: GameState;
  me: Player;
  dispatch: (a: GameAction) => void;
}

/**
 * "⚔️ Challenge" button → modal to pick opponent + stakes → triggers
 * a voluntary Teen Patti standoff via START_STANDOFF action.
 */
export function VoluntaryChallenge({ state, me, dispatch }: Props) {
  const [open, setOpen] = useState(false);
  const [targetId, setTargetId] = useState<string>("");
  const [stakesCr, setStakesCr] = useState(5);

  const opponents = state.players.filter((p) => p.id !== me.id);

  function start() {
    if (!targetId) return;
    const pot = stakesCr * CRORE;
    const target = state.players.find((p) => p.id === targetId);
    if (!target) return;
    if (me.money < pot / 2 || target.money < pot / 2) return;
    playSfx("card-flip");
    dispatch({ type: "START_STANDOFF", trigger: "voluntary", p2: targetId, pot });
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); playSfx("tap"); }}
        disabled={state.phase !== "action" && state.phase !== "landed" && state.phase !== "turn_start"}
        className="btn-outline text-xs border-neon-magenta/60 text-neon-pink hover:bg-neon-magenta/10 disabled:opacity-40"
        title="Challenge another player to Teen Patti"
      >
        ⚔️ Challenge
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-ink-950/85 backdrop-blur flex items-end sm:items-center justify-center p-3"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="card-luxe max-w-sm w-full p-5"
              style={{ borderColor: "rgba(255, 47, 146, 0.5)", boxShadow: "0 0 40px rgba(255, 47, 146, 0.25)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="cinzel text-[10px] tracking-widest text-neon-pink mb-1">TEEN PATTI</div>
              <div className="heading text-2xl font-bold mb-4 gold-shimmer">Challenge</div>

              <label className="text-xs text-gold-200/70 mb-2 block">Opponent</label>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {opponents.map((p) => {
                  const sel = targetId === p.id;
                  const color = PLAYER_COLORS[p.number];
                  return (
                    <button
                      key={p.id}
                      onClick={() => setTargetId(p.id)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-left transition-all"
                      style={{
                        borderColor: sel ? color : "rgba(255,255,255,0.08)",
                        background: sel ? `${color}22` : "rgba(11,11,15,0.5)",
                      }}
                    >
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                            style={{ background: color }}>
                        {PLAYER_TOKENS[p.number]}
                      </span>
                      <span className="truncate">{p.name}</span>
                    </button>
                  );
                })}
              </div>

              <label className="text-xs text-gold-200/70 mb-2 block">Stakes (ante each)</label>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[2, 5, 10, 20].map((n) => (
                  <button
                    key={n}
                    onClick={() => setStakesCr(n)}
                    className={`py-2 rounded-lg border text-sm font-mono ${
                      stakesCr === n ? "border-neon-magenta bg-neon-magenta/10 text-neon-pink" : "border-white/10 hover:border-gold-400/40"
                    }`}
                  >
                    ₹{n}Cr
                  </button>
                ))}
              </div>

              <div className="text-[11px] text-gold-100/60 mb-4 text-center">
                Pot: {formatMoney(stakesCr * CRORE)} · Winner takes all.
              </div>

              <div className="flex gap-2">
                <button className="btn-outline flex-1" onClick={() => setOpen(false)}>Cancel</button>
                <button
                  className="flex-1 btn-gold"
                  style={{ background: "linear-gradient(180deg, #FF7AB6, #FF2F92)", boxShadow: "0 0 20px rgba(255,47,146,0.5)" }}
                  disabled={!targetId}
                  onClick={start}
                >
                  ⚔️ Fight
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
