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

// Serpentine layout: 7 tiles per row, direction flips each row
const COLS = 7;

export function Board({ state, selectedTile, onSelectTile }: Props) {
  // We need rows of tile ids, alternating direction
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
      <div className="relative rounded-2xl border border-gold-400/30 bg-navy-900/40 p-2 sm:p-3 shadow-gold">
        {/* Title ribbon */}
        <div className="flex items-center justify-between px-2 pb-2">
          <div className="text-[10px] tracking-[0.3em] uppercase text-gold-200/70">Borivali → Cuffe Parade</div>
          <div className="text-[10px] tracking-[0.3em] uppercase text-gold-200/70">Round {state.round}</div>
        </div>
        <div
          className="grid gap-1 sm:gap-1.5"
          style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
        >
          {rows.flat().map((tileId, idx) => {
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
      </div>
    </div>
  );
}
