"use client";
import { useMemo } from "react";
import type { GameState } from "@/lib/types";
import { TILES, TILE_COUNT } from "@/lib/tiles";
import { Tile } from "./Tile";

interface Props {
  state: GameState;
  selectedTile: number | null;
  onSelectTile: (id: number | null) => void;
}

const COLS = 7;

export function Board({ state, selectedTile, onSelectTile }: Props) {
  const rows = useMemo(() => {
    const out: number[][] = [];
    let i = 0;
    let dir: "lr" | "rl" = "lr";
    while (i < TILE_COUNT) {
      const row: number[] = [];
      for (let c = 0; c < COLS && i < TILE_COUNT; c++) {
        row.push(i);
        i++;
      }
      if (dir === "rl") row.reverse();
      out.push(row);
      dir = dir === "lr" ? "rl" : "lr";
    }
    return out;
  }, []);

  const playersByTile = useMemo(() => {
    const map: Record<number, typeof state.players> = {};
    for (const p of state.players) {
      (map[p.position] ??= []).push(p);
    }
    return map;
  }, [state.players]);

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="relative rounded-2xl p-3 sm:p-4 card-luxe scan-lines"
           style={{ boxShadow: "0 0 60px rgba(200,155,60,0.15), inset 0 1px 0 rgba(255,255,255,0.05)" }}>
        {/* Title ribbon */}
        <div className="flex items-center justify-between px-2 pb-2.5 border-b border-gold-400/15 mb-2.5">
          <div className="cinzel text-[9px] tracking-[0.3em] text-gold-200/80">
            BORIVALI &nbsp;→&nbsp; CUFFE PARADE
          </div>
          <div className="cinzel text-[9px] tracking-[0.3em] text-gold-200/80">
            ROUND {state.round}
          </div>
        </div>

        <div
          className="grid gap-1 sm:gap-1.5"
          style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
        >
          {rows.flat().map((tileId) => {
            const tile = TILES[tileId];
            const prop = state.properties[tileId];
            const playersHere = playersByTile[tileId] ?? [];
            return (
              <Tile
                key={tileId}
                tile={tile}
                prop={prop}
                players={playersHere}
                selected={selectedTile === tileId}
                onClick={() => onSelectTile(tileId === selectedTile ? null : tileId)}
              />
            );
          })}
        </div>

        {/* Corner ornaments */}
        <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-gold-400/40 pointer-events-none" />
        <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-gold-400/40 pointer-events-none" />
        <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-gold-400/40 pointer-events-none" />
        <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-gold-400/40 pointer-events-none" />
      </div>
    </div>
  );
}
