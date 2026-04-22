"use client";
import { motion } from "framer-motion";
import type { GameState } from "@/lib/types";
import { TILES } from "@/lib/tiles";
import { PLAYER_COLORS, ZONE_INFO } from "@/lib/constants";

interface Props {
  state: GameState;
}

/**
 * Horizontal row showing zone completion progress per player.
 * Reads each zone (WSN, WSM, BB, SLC, LPB, SM, SMP) and counts
 * how many tiles each player owns. If any player owns all, show
 * a flaming "MONOPOLY" indicator. Creates racing pressure.
 */
export function ZoneMeter({ state }: Props) {
  const zones = Object.entries(ZONE_INFO);

  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar px-3 py-1.5 text-[9px]">
      {zones.map(([zoneId, info]) => {
        const zoneTiles = TILES.filter((t) => t.zone === zoneId);
        const total = zoneTiles.length;
        // Tally ownership
        const ownership: Record<string, number> = {};
        for (const t of zoneTiles) {
          const owner = state.properties[t.id]?.ownerId;
          if (owner) ownership[owner] = (ownership[owner] ?? 0) + 1;
        }
        // Find leader
        let leaderId: string | null = null;
        let leaderCount = 0;
        for (const [id, count] of Object.entries(ownership)) {
          if (count > leaderCount) { leaderId = id; leaderCount = count; }
        }
        const leader = leaderId ? state.players.find((p) => p.id === leaderId) : null;
        const locked = leaderCount === total;
        const color = leader ? PLAYER_COLORS[leader.number] : "#888";

        return (
          <div
            key={zoneId}
            className="shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-full border"
            style={{
              borderColor: locked ? color : "rgba(255,255,255,0.08)",
              background: locked ? `${color}22` : "rgba(11,11,15,0.6)",
              boxShadow: locked ? `0 0 12px ${color}88` : undefined,
            }}
          >
            <span className="w-2 h-2 rounded-full" style={{ background: info.color }} />
            <span className="cinzel tracking-widest text-gold-100/80">{zoneId}</span>
            {locked ? (
              <motion.span
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 1.4, repeat: Infinity }}
                className="cinzel tracking-widest font-bold"
                style={{ color }}
              >
                🔥 MONOPOLY
              </motion.span>
            ) : (
              <span className="font-mono text-gold-100/60">
                {leader ? <span style={{ color }}>{leaderCount}</span> : 0}/{total}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
