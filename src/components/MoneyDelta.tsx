"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { formatMoneyShort } from "@/lib/constants";

interface Delta {
  id: number;
  amount: number;
}

/**
 * Detects money changes on a tracked number and spawns floating +/-
 * rupee labels. Place this absolutely positioned over a player's
 * avatar / HUD card. The parent passes the current money value.
 */
export function MoneyDelta({ value, className = "" }: { value: number; className?: string }) {
  const [deltas, setDeltas] = useState<Delta[]>([]);
  const lastRef = useRef<number | null>(null);
  const idRef = useRef(0);

  useEffect(() => {
    if (lastRef.current == null) {
      lastRef.current = value;
      return;
    }
    const diff = value - lastRef.current;
    lastRef.current = value;
    if (Math.abs(diff) < 10) return; // ignore sub-10L noise
    const id = ++idRef.current;
    setDeltas((prev) => [...prev, { id, amount: diff }]);
    setTimeout(() => {
      setDeltas((prev) => prev.filter((d) => d.id !== id));
    }, 2000);
  }, [value]);

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-visible ${className}`}>
      <AnimatePresence>
        {deltas.map((d) => {
          const positive = d.amount > 0;
          return (
            <motion.div
              key={d.id}
              initial={{ y: 0, opacity: 0, scale: 0.8 }}
              animate={{ y: -60, opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
              className={`absolute left-1/2 -translate-x-1/2 font-mono font-bold text-xs whitespace-nowrap px-2 py-0.5 rounded-full ${
                positive
                  ? "text-emerald-400 bg-emerald-400/15 border border-emerald-400/40"
                  : "text-crimson bg-crimson/15 border border-crimson/40"
              }`}
              style={{
                textShadow: positive
                  ? "0 0 8px rgba(0,184,148,0.7)"
                  : "0 0 8px rgba(255,61,61,0.7)",
              }}
            >
              {positive ? "+" : "−"}{formatMoneyShort(Math.abs(d.amount))}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
