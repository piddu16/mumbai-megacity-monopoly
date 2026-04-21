"use client";
import type { Player, PropertyState, TileDef } from "@/lib/types";
import { DEV_LEVELS, PLAYER_COLORS, PLAYER_TOKENS, ZONE_INFO } from "@/lib/constants";

interface Props {
  tile: TileDef;
  prop?: PropertyState;
  players: Player[];
  selected: boolean;
  onClick: () => void;
}

export function Tile({ tile, prop, players, selected, onClick }: Props) {
  const zoneColor = tile.zone ? ZONE_INFO[tile.zone].color : undefined;
  const isOwned = !!prop?.ownerId;
  const ownerColor = prop?.ownerId
    ? PLAYER_COLORS[players.find((p) => p.id === prop.ownerId)?.number ?? 0]
    : undefined;

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
    <button
      onClick={onClick}
      className={`relative aspect-square rounded-md overflow-hidden bg-navy-900/80 border text-left group transition-all ${
        selected ? "border-gold-400 shadow-gold z-10" : "border-white/10 hover:border-gold-400/60"
      }`}
    >
      {/* Zone color strip */}
      {zoneColor && (
        <div className="h-1.5" style={{ background: zoneColor }} />
      )}

      {/* Stay / IOD overlays */}
      {prop?.stayUntil && (
        <div className="absolute inset-0 bg-red-500/25 border-2 border-red-500/60 pointer-events-none z-10" />
      )}
      {prop?.iodDelayUntil && (
        <div className="absolute top-1 right-1 text-[10px] bg-yellow-500/80 text-navy-950 px-1 rounded z-10">IOD</div>
      )}
      {prop?.isSEZ && (
        <div className="absolute top-1 right-1 text-[10px] bg-gold-400 text-navy-950 px-1 rounded z-10">SEZ</div>
      )}

      {/* Owner border */}
      {isOwned && (
        <div
          className="absolute inset-0 pointer-events-none border-[3px] rounded-md"
          style={{ borderColor: ownerColor }}
        />
      )}

      {/* Content */}
      <div className="p-1 flex flex-col h-full">
        <div className="flex items-start justify-between gap-0.5 min-h-0">
          <div className="text-[8px] font-mono text-gold-100/40">#{tile.id}</div>
          {icon && <div className="text-xs">{icon}</div>}
        </div>
        <div className="text-[9px] sm:text-[10px] font-semibold leading-tight line-clamp-2 flex-1 mt-0.5">
          {tile.name}
        </div>
        {tile.area && (
          <div className="text-[8px] text-gold-100/50 truncate">{tile.area}</div>
        )}
        {tile.price && (
          <div className="text-[9px] money truncate">₹{(tile.price / 100).toFixed(0)}Cr</div>
        )}
      </div>

      {/* Dev level */}
      {devEmoji && (
        <div className="absolute bottom-0.5 left-0.5 text-sm z-10">{devEmoji}</div>
      )}

      {/* Premium star */}
      {tile.premium && (
        <div className="absolute bottom-0.5 right-0.5 text-[10px] z-10">⭐</div>
      )}

      {/* Players on tile */}
      {players.length > 0 && (
        <div className="absolute top-2 left-1 flex -space-x-1 z-10">
          {players.slice(0, 3).map((p) => (
            <span
              key={p.id}
              className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] border border-navy-950"
              style={{ background: PLAYER_COLORS[p.number] }}
              title={p.name}
            >
              {PLAYER_TOKENS[p.number]}
            </span>
          ))}
          {players.length > 3 && (
            <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[8px] border border-navy-950">
              +{players.length - 3}
            </span>
          )}
        </div>
      )}
    </button>
  );
}
