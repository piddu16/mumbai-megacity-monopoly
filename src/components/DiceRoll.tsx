"use client";
import { useEffect, useState } from "react";
import type { TransportMode } from "@/lib/types";
import { TILES } from "@/lib/tiles";

interface Props {
  mode: TransportMode;
  stations?: number[]; // for train
  onRoll: (values: [number, number]) => void;
}

const DICE_FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

export function DiceRoll({ mode, stations, onRoll }: Props) {
  const [rolling, setRolling] = useState(false);
  const [dice, setDice] = useState<[number, number]>([1, 1]);

  function roll() {
    if (rolling) return;
    setRolling(true);
    const interval = setInterval(() => {
      setDice([rand(), rand()]);
    }, 75);
    setTimeout(() => {
      clearInterval(interval);
      const final: [number, number] = [rand(), rand()];
      setDice(final);
      setRolling(false);
      setTimeout(() => onRoll(final), 400);
    }, 900);
  }

  useEffect(() => {
    if (mode === "train") return; // user picks station instead
    if (mode === "metro") return; // separate button
  }, [mode]);

  if (mode === "train" && stations) {
    return (
      <div>
        <div className="text-xs text-gold-200/80 mb-2">Pick a station to teleport to</div>
        <div className="grid grid-cols-4 gap-2">
          {stations.map((id) => (
            <button
              key={id}
              onClick={() => onRoll([0, id])}
              className="btn-outline text-xs py-2"
            >
              🚂 {TILES[id].name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="text-xs text-gold-200/80 mb-2">
        {mode === "metro" ? "Roll 1 die (1 = breakdown, else jump to next station)" : "Roll the dice"}
      </div>
      <div className="flex items-center justify-center gap-3 mb-3">
        <Die face={dice[0]} rolling={rolling} />
        {mode !== "metro" && <Die face={dice[1]} rolling={rolling} />}
      </div>
      <button className="btn-gold" disabled={rolling} onClick={roll}>
        {rolling ? "Rolling…" : "Roll"}
      </button>
    </div>
  );
}

function Die({ face, rolling }: { face: number; rolling: boolean }) {
  return (
    <div
      className={`w-14 h-14 rounded-lg bg-gradient-to-b from-gold-100 to-gold-300 text-navy-950 flex items-center justify-center text-4xl font-bold shadow-gold ${
        rolling ? "animate-dice-roll" : ""
      }`}
    >
      {DICE_FACES[face - 1]}
    </div>
  );
}

function rand() {
  return 1 + Math.floor(Math.random() * 6);
}
