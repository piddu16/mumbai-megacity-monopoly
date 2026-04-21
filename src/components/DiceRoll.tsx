"use client";
import { useEffect, useRef, useState } from "react";
import type { TransportMode } from "@/lib/types";
import { TILES } from "@/lib/tiles";

interface Props {
  mode: TransportMode;
  stations?: number[];
  onRoll: (values: [number, number]) => void;
}

const DICE_FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

export function DiceRoll({ mode, stations, onRoll }: Props) {
  const [rolling, setRolling] = useState(false);
  const [dice, setDice] = useState<[number, number]>([1, 1]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      for (const t of timeoutsRef.current) clearTimeout(t);
    };
  }, []);

  function roll() {
    if (rolling) return;
    setRolling(true);
    intervalRef.current = setInterval(() => {
      if (!mountedRef.current) return;
      setDice([rand(), rand()]);
    }, 75);
    timeoutsRef.current.push(
      setTimeout(() => {
        if (!mountedRef.current) return;
        if (intervalRef.current) clearInterval(intervalRef.current);
        const final: [number, number] = [rand(), rand()];
        setDice(final);
        setRolling(false);
        timeoutsRef.current.push(
          setTimeout(() => {
            if (!mountedRef.current) return;
            onRoll(final);
          }, 400),
        );
      }, 900),
    );
  }

  if (mode === "train" && stations) {
    return (
      <div>
        <div className="text-xs text-gold-200/80 mb-2">Pick a station to teleport to</div>
        <div className="grid grid-cols-4 gap-2">
          {stations.map((id) => (
            <button key={id} onClick={() => onRoll([0, id])} className="btn-outline text-xs py-2">
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
        {mode === "metro" ? "Roll 1 die. 1 = breakdown. Anything else = jump." : "Roll the dice"}
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
