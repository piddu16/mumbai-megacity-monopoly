"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { playSfx } from "@/lib/sound";

interface Props {
  seconds: number;
  turnKey: string;
  onExpire?: () => void;
}

/**
 * Visual countdown bar that resets whenever turnKey changes (new turn).
 * Audible tick in the last 5s. At 0 calls onExpire.
 */
export function TurnTimer({ seconds, turnKey, onExpire }: Props) {
  const [left, setLeft] = useState(seconds);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    setLeft(seconds);
    setRunning(true);
  }, [turnKey, seconds]);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          clearInterval(t);
          playSfx("buzz");
          onExpire?.();
          return 0;
        }
        if (l <= 6) playSfx("tap");
        return l - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, turnKey]);

  const pct = Math.max(0, (left / seconds) * 100);
  const critical = left <= 10;

  return (
    <div className="h-1 w-full rounded-full bg-ink-900/80 overflow-hidden relative">
      <motion.div
        className="absolute inset-y-0 left-0"
        style={{
          width: `${pct}%`,
          background: critical
            ? "linear-gradient(90deg, #FF3D3D, #FF7A00)"
            : "linear-gradient(90deg, #C89B3C, #E9CF7B)",
          boxShadow: critical
            ? "0 0 8px rgba(255, 61, 61, 0.8)"
            : "0 0 8px rgba(200, 155, 60, 0.6)",
        }}
        animate={critical ? { opacity: [1, 0.6, 1] } : { opacity: 1 }}
        transition={{ duration: 0.5, repeat: critical ? Infinity : 0 }}
      />
      <div className="absolute inset-0 flex items-center justify-center text-[9px] font-mono cinzel tracking-widest"
           style={{ color: critical ? "#FFB3B3" : "#E9CF7B" }}>
        {left}s
      </div>
    </div>
  );
}
