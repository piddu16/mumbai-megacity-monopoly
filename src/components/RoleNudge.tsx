"use client";
import { AnimatePresence, motion } from "framer-motion";
import type { GameState, Player } from "@/lib/types";
import { ROLE_INFO } from "@/lib/constants";
import { getTile } from "@/lib/tiles";

interface Props {
  state: GameState;
  me: Player;
  onUse?: () => void;
}

/**
 * Contextual role-power hint. Appears as a pulsing banner above the action
 * panel when the current situation matches what the player's role excels at.
 * Examples:
 * - Judge: another player just developed → "Stay it?"
 * - Minister: zone has gotten monopolized → "Nerf FSI?"
 * - BMC: someone wants to build high-rise → "Delay?"
 * - MHADA: an empty plot in play → "Launch SRA?"
 * - Tycoon: unused topping out + high-FSI property → "Top out?"
 */
export function RoleNudge({ state, me }: Props) {
  const nudge = computeNudge(state, me);
  return (
    <AnimatePresence>
      {nudge && (
        <motion.div
          key={nudge.key}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px]"
          style={{
            borderColor: `${ROLE_INFO[me.role].color}66`,
            background: `${ROLE_INFO[me.role].color}12`,
          }}
        >
          <motion.span
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 1.8, repeat: Infinity }}
            className="text-base"
          >
            {ROLE_INFO[me.role].emoji}
          </motion.span>
          <span className="cinzel tracking-widest text-[9px]" style={{ color: ROLE_INFO[me.role].color }}>
            {me.role} TIP
          </span>
          <span className="text-gold-100/85 truncate">{nudge.message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function computeNudge(state: GameState, me: Player): { key: string; message: string } | null {
  // Don't nudge if it's not even your round (governance can act anytime, but Tycoon only on turn)
  switch (me.role) {
    case "JUDGE": {
      // If any property has just been developed OR any opponent has dev level >= 3 and isn't stayed
      const staysActive = me.powerUses.judgeStays?.length ?? 0;
      if (staysActive >= 2) return null;
      const targets = Object.values(state.properties).filter(
        (p) => p.ownerId && p.ownerId !== me.id && p.devLevel >= 3 && !p.stayUntil,
      );
      if (targets.length > 0) {
        const t = targets[0];
        return { key: `judge-${t.tileId}-${state.round}`, message: `Opponents are building. Stay ${getTile(t.tileId).name}?` };
      }
      return null;
    }
    case "MINISTER": {
      if (me.powerUses.ministerFsiUsedThisRound) return null;
      // If any zone has been monopolized by a rival
      const developedByRivals = Object.values(state.properties).filter(
        (p) => p.ownerId && p.ownerId !== me.id && p.devLevel >= 2,
      );
      if (developedByRivals.length >= 3) {
        return { key: `minister-${state.round}`, message: "Rivals are consolidating. Nerf their zone FSI?" };
      }
      return null;
    }
    case "BMC": {
      // BMC is most relevant when high-level dev is pending — we don't have pending committee yet,
      // so show a general nudge if any dev ≥ 3 exists
      const highDev = Object.values(state.properties).filter(
        (p) => p.ownerId && p.ownerId !== me.id && p.devLevel >= 3,
      );
      if (highDev.length > 0) {
        return { key: `bmc-${state.round}`, message: "High-rises detected. Demolition notice in reserve." };
      }
      return null;
    }
    case "MHADA": {
      if (me.powerUses.mhadaLotteryUsedThisRound) return null;
      // If any Chawl-level or below owned by opponent
      const slumish = Object.values(state.properties).filter(
        (p) => p.ownerId && p.ownerId !== me.id && p.devLevel <= 1,
      );
      if (slumish.length > 0) {
        return { key: `mhada-${state.round}`, message: `${slumish.length} undeveloped plots. Deploy SRA for FSI doubling.` };
      }
      return null;
    }
    case "TYCOON": {
      if (me.powerUses.tycoonToppingOutUsed) return null;
      const myHigh = Object.values(state.properties).filter(
        (p) => p.ownerId === me.id && p.devLevel >= 2 && p.devLevel < 4,
      );
      if (myHigh.length > 0) {
        return { key: `tycoon-${state.round}`, message: "Topping Out ready: +2 levels, once per game." };
      }
      return null;
    }
  }
  return null;
}
