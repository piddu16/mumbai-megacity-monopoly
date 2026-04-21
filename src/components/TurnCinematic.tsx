"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { PLAYER_COLORS, PLAYER_TOKENS, ROLE_INFO } from "@/lib/constants";
import type { Player } from "@/lib/types";
import { playSfx } from "@/lib/sound";

interface Props {
  player: Player | null;
  isMyTurn: boolean;
  round: number;
}

/**
 * Cinematic "YOUR MOVE" overlay that fires for 1.5s when the current
 * player changes. Only triggers for the actual player's device, not spectators.
 */
export function TurnCinematic({ player, isMyTurn, round }: Props) {
  const [visible, setVisible] = useState(false);
  const [shown, setShown] = useState<string | null>(null);

  useEffect(() => {
    if (!player) return;
    if (shown === `${player.id}-${round}`) return;
    setShown(`${player.id}-${round}`);
    setVisible(true);
    playSfx(isMyTurn ? "chime" : "notify");
    const t = setTimeout(() => setVisible(false), 1600);
    return () => clearTimeout(t);
  }, [player?.id, round, isMyTurn, player, shown]);

  if (!player) return null;
  const color = PLAYER_COLORS[player.number];
  const token = PLAYER_TOKENS[player.number];
  const role = ROLE_INFO[player.role];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.65 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at center, ${color}44 0%, rgba(0,0,0,0.85) 60%)`,
              backdropFilter: "blur(4px)",
            }}
          />

          {/* Spotlight sweep */}
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 300, opacity: [0, 0.3, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute w-[600px] h-[200vh] rotate-12"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${color}66 50%, transparent 100%)`,
              filter: "blur(40px)",
            }}
          />

          <div className="relative text-center">
            <motion.div
              initial={{ scale: 0.5, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="text-[10px] tracking-[0.4em] cinzel mb-2"
              style={{ color: `${color}EE` }}
            >
              ROUND {round}
            </motion.div>
            <motion.div
              initial={{ scale: 0.7, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
              className="heading text-5xl sm:text-7xl font-black mb-1"
              style={{
                color,
                textShadow: `0 0 40px ${color}, 0 0 80px ${color}88`,
              }}
            >
              {isMyTurn ? "YOUR MOVE" : player.name}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-center gap-3 text-gold-100/90 text-sm"
            >
              <span className="text-2xl">{token}</span>
              <span className="font-semibold">{role.emoji} {role.name}</span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
