"use client";
import { motion } from "framer-motion";
import type { Player, PropertyState, TileDef } from "@/lib/types";
import { DEV_LEVELS, PLAYER_COLORS, PLAYER_TOKENS, ZONE_INFO } from "@/lib/constants";

interface Props {
  tile: TileDef;
  prop?: PropertyState;
  players: Player[];
  selected: boolean;
  onClick: () => void;
}

/**
 * Each tile gets a personality based on zone.
 * Bandra = neon pink luxury. Dharavi-equivalent (chawls) = warm amber.
 * Worli = sea-link blue shimmer. BKC = chrome-finance. SMP = gold elite.
 */
const ZONE_ARCHETYPES: Record<string, { tone: string; accent: string; texture?: string }> = {
  WSN: { tone: "from-[#0A1929]/90 to-[#050810]",             accent: "#2196F3", texture: "suburb" },
  WSM: { tone: "from-[#0A1F15]/90 to-[#050810]",             accent: "#4CAF50", texture: "engine" },
  BB:  { tone: "from-[#2A0A1F]/90 to-[#050810]",             accent: "#E91E63", texture: "luxury" },
  SLC: { tone: "from-[#1E0A2E]/90 to-[#050810]",             accent: "#9C27B0", texture: "sealink" },
  LPB: { tone: "from-[#0A1F24]/90 to-[#050810]",             accent: "#00BCD4", texture: "mill" },
  SM:  { tone: "from-[#2E0A0A]/90 to-[#050810]",             accent: "#F44336", texture: "heritage" },
  SMP: { tone: "from-[#2E220A]/90 to-[#050810]",             accent: "#FFD700", texture: "elite" },
};

export function Tile({ tile, prop, players, selected, onClick }: Props) {
  const zoneInfo = tile.zone ? ZONE_INFO[tile.zone] : null;
  const arch = tile.zone ? ZONE_ARCHETYPES[tile.zone] : null;
  const isOwned = !!prop?.ownerId;
  const ownerPlayer = prop?.ownerId ? players.find((p) => p.id === prop.ownerId) : null;
  const ownerColor = ownerPlayer ? PLAYER_COLORS[ownerPlayer.number] : undefined;

  const icon =
    tile.type === "start" ? "🏁" :
    tile.type === "finish" ? "✨" :
    tile.type === "tax" ? "💸" :
    tile.type === "chance" ? "🎲" :
    tile.type === "community" ? "📜" :
    tile.type === "utility" ? "⚡" :
    tile.type === "station" ? "🚂" :
    null;

  const devEmoji = prop && prop.devLevel > 0 ? DEV_LEVELS[prop.devLevel].emoji : null;

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -3, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`relative aspect-square rounded-lg overflow-hidden text-left group ${
        selected ? "z-10" : ""
      }`}
      style={{
        background: arch
          ? `linear-gradient(160deg, ${arch.accent}18 0%, rgba(11,11,15,0.92) 60%, rgba(6,7,16,0.98) 100%)`
          : "linear-gradient(160deg, rgba(19,21,33,0.8) 0%, rgba(11,11,15,0.95) 100%)",
        boxShadow: selected
          ? `0 0 0 2px ${arch?.accent ?? "#C89B3C"}, 0 0 24px ${arch?.accent ?? "#C89B3C"}88`
          : isOwned
          ? `inset 0 0 0 2px ${ownerColor}, 0 2px 8px rgba(0,0,0,0.4)`
          : "inset 0 0 0 1px rgba(255,255,255,0.06), 0 2px 6px rgba(0,0,0,0.3)",
      }}
    >
      {/* Zone color strip — top */}
      {zoneInfo && (
        <div className="zone-strip h-1" style={{ background: zoneInfo.color }} />
      )}

      {/* Stay order red pulsating overlay */}
      {prop?.stayUntil && (
        <motion.div
          className="absolute inset-0 bg-crimson/20 border-2 border-crimson/60 pointer-events-none z-10 rounded"
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      {/* Badges */}
      {prop?.iodDelayUntil && (
        <div className="absolute top-1 right-1 cinzel text-[8px] bg-rust text-ink-950 px-1 py-px rounded z-10 tracking-widest">
          IOD
        </div>
      )}
      {prop?.isSEZ && (
        <div className="absolute top-1 right-1 cinzel text-[8px] text-ink-950 px-1 py-px rounded z-10 tracking-widest"
             style={{ background: "linear-gradient(90deg, #E9CF7B, #C89B3C)" }}>
          SEZ
        </div>
      )}
      {prop?.heritage && (
        <div className="absolute top-1 left-1 text-[10px] z-10">🏛️</div>
      )}

      {/* Content */}
      <div className="p-1 flex flex-col h-full relative">
        <div className="flex items-start justify-between gap-0.5">
          <div className="text-[7px] font-mono text-gold-100/30">#{tile.id}</div>
          {icon && <div className="text-xs leading-none">{icon}</div>}
        </div>
        <div className="text-[9px] sm:text-[10px] font-semibold leading-[1.1] line-clamp-2 flex-1 mt-0.5 heading"
             style={{ color: zoneInfo ? "#F5EAD1" : "#E9CF7B" }}>
          {tile.name}
        </div>
        {tile.area && (
          <div className="text-[7px] text-gold-100/40 truncate italic">{tile.area}</div>
        )}
        {tile.price && (
          <div className="text-[8px] money font-bold">₹{(tile.price / 100).toFixed(0)}Cr</div>
        )}
      </div>

      {/* Dev level emoji (glowing if high) */}
      {devEmoji && (
        <motion.div
          animate={prop && prop.devLevel >= 4 ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-0.5 left-0.5 text-base z-10 drop-shadow-lg"
          style={{
            filter: prop && prop.devLevel >= 4 ? "drop-shadow(0 0 6px #E9CF7B)" : undefined,
          }}
        >
          {devEmoji}
        </motion.div>
      )}

      {/* Premium star */}
      {tile.premium && (
        <motion.div
          className="absolute bottom-0.5 right-0.5 text-[10px] z-10"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          ⭐
        </motion.div>
      )}

      {/* Players on tile */}
      {players.length > 0 && (
        <div className="absolute top-2.5 left-1 flex -space-x-1 z-10">
          {players.slice(0, 3).map((p) => (
            <motion.span
              key={p.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] border border-ink-950"
              style={{
                background: PLAYER_COLORS[p.number],
                boxShadow: `0 0 4px ${PLAYER_COLORS[p.number]}`,
              }}
              title={p.name}
            >
              {PLAYER_TOKENS[p.number]}
            </motion.span>
          ))}
          {players.length > 3 && (
            <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[8px] border border-ink-950">
              +{players.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Hover shimmer */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
           style={{
             background: `linear-gradient(135deg, transparent 40%, ${arch?.accent ?? "#C89B3C"}33 50%, transparent 60%)`,
           }} />
    </motion.button>
  );
}
