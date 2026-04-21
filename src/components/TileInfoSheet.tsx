"use client";
import { useEffect } from "react";
import type { GameAction, GameState, Player } from "@/lib/types";
import { getTile } from "@/lib/tiles";
import { DEV_LEVELS, PLAYER_COLORS, PLAYER_TOKENS, ZONE_INFO, formatMoney } from "@/lib/constants";
import { canDevelop, computeRent } from "@/lib/game-engine";

interface Props {
  tileId: number;
  state: GameState;
  me?: Player;
  onClose: () => void;
  dispatch: (action: GameAction) => void;
}

export function TileInfoSheet({ tileId, state, me, onClose, dispatch }: Props) {
  const tile = getTile(tileId);
  const prop = state.properties[tileId];
  const owner = prop?.ownerId ? state.players.find((p) => p.id === prop.ownerId) : null;
  const rent = prop?.ownerId ? computeRent(state, tileId) : null;
  const canIDev = me && prop?.ownerId === me.id ? canDevelop(state, tileId, me.id) : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-x-0 bottom-0 lg:bottom-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:max-w-md z-40" onClick={onClose}>
      <div className="card-gold p-5 rounded-t-2xl lg:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <div className="heading text-xl font-bold">{tile.name}</div>
            {tile.area && <div className="text-sm text-gold-100/60">{tile.area}</div>}
            {tile.builder && <div className="text-xs text-gold-100/50">by {tile.builder}</div>}
            <div className="mt-1 flex flex-wrap gap-1">
              {tile.zone && (
                <span className="chip" style={{ background: `${ZONE_INFO[tile.zone].color}22`, color: ZONE_INFO[tile.zone].color }}>
                  {ZONE_INFO[tile.zone].name}
                </span>
              )}
              {tile.premium && <span className="chip bg-gold-400/20 text-gold-200">⭐ Premium</span>}
              {tile.bus && <span className="chip bg-white/5 text-gold-100/70">🚌 Bus</span>}
              {tile.metro && <span className="chip bg-white/5 text-gold-100/70">🚇 Metro</span>}
              {tile.station && <span className="chip bg-white/5 text-gold-100/70">🚂 Station</span>}
              {tile.coastal && <span className="chip bg-white/5 text-gold-100/70">🛣️ Coastal</span>}
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost !p-2">✕</button>
        </div>

        {tile.description && (
          <p className="text-sm text-gold-100/70 mb-3">{tile.description}</p>
        )}

        {/* Property stats */}
        {tile.price && (
          <div className="grid grid-cols-2 gap-2 text-sm mb-3">
            <Stat label="Price" value={formatMoney(tile.price)} />
            <Stat label="Base Rent" value={tile.baseRent ? formatMoney(tile.baseRent) : "—"} />
            <Stat label="FSI" value={tile.fsi?.toFixed(1) ?? "—"} />
            <Stat label="Current Level" value={prop ? `${DEV_LEVELS[prop.devLevel].emoji} ${DEV_LEVELS[prop.devLevel].name}` : "—"} />
            {rent != null && <Stat label="Rent Now" value={rent ? formatMoney(rent) : "Free (stayed)"} />}
            {owner && (
              <Stat
                label="Owner"
                value={
                  <span className="flex items-center gap-1.5">
                    <span
                      className="w-4 h-4 rounded-full inline-flex items-center justify-center text-[10px]"
                      style={{ background: PLAYER_COLORS[owner.number] }}
                    >
                      {PLAYER_TOKENS[owner.number]}
                    </span>
                    {owner.name}
                  </span>
                }
              />
            )}
          </div>
        )}

        {/* Dev ladder */}
        {tile.price && (
          <div className="mb-3">
            <div className="text-xs text-gold-200/80 mb-1">Development ladder</div>
            <div className="flex gap-1 overflow-x-auto no-scrollbar">
              {DEV_LEVELS.map((l) => {
                const reached = !!prop && prop.devLevel >= l.level;
                return (
                  <div
                    key={l.level}
                    className={`shrink-0 text-center px-2 py-1 rounded border text-[10px] ${
                      reached ? "bg-gold-400/15 border-gold-400/40" : "border-white/5 text-gold-100/40"
                    }`}
                  >
                    <div className="text-base">{l.emoji}</div>
                    <div>{l.name}</div>
                    <div className="money">{l.rentMultiplier}×</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 justify-end">
          {canIDev?.ok && canIDev.cost != null && canIDev.nextLevel != null && (
            <button
              className="btn-gold text-sm"
              onClick={() => {
                dispatch({ type: "DEVELOP", tileId });
                onClose();
              }}
            >
              Develop to {DEV_LEVELS[canIDev.nextLevel].name} · {formatMoney(canIDev.cost)}
            </button>
          )}
          {canIDev && !canIDev.ok && canIDev.reason && (
            <p className="text-xs text-gold-100/50 italic">{canIDev.reason}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-navy-950/70 border border-white/5 rounded p-2">
      <div className="text-[10px] text-gold-100/50 uppercase tracking-wider">{label}</div>
      <div className="mt-0.5">{value}</div>
    </div>
  );
}
