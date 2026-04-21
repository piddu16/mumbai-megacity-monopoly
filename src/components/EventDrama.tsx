"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { playSfx } from "@/lib/sound";

export type DramaTone = "money_in" | "money_out" | "tax" | "stay" | "card" | "rent" | "win";

export interface DramaEvent {
  id: string;
  tone: DramaTone;
  title: string;
  body?: string;
  icon?: string;
}

interface Props {
  event: DramaEvent | null;
  onDone?: () => void;
  duration?: number;
}

const TONE_STYLES: Record<DramaTone, { accent: string; bg: string; shadow: string; sfx: Parameters<typeof playSfx>[0] }> = {
  money_in:  { accent: "#5EE5BF", bg: "rgba(0,184,148,0.18)", shadow: "rgba(0,184,148,0.5)", sfx: "cash-in" },
  money_out: { accent: "#FF6666", bg: "rgba(255,61,61,0.18)", shadow: "rgba(255,61,61,0.5)", sfx: "cash-out" },
  tax:       { accent: "#FF7A00", bg: "rgba(255,122,0,0.18)",  shadow: "rgba(255,122,0,0.5)",  sfx: "stamp" },
  stay:      { accent: "#A259FF", bg: "rgba(162,89,255,0.18)", shadow: "rgba(162,89,255,0.5)", sfx: "gavel" },
  card:      { accent: "#00E5FF", bg: "rgba(0,229,255,0.15)",  shadow: "rgba(0,229,255,0.45)", sfx: "card-flip" },
  rent:      { accent: "#E9CF7B", bg: "rgba(200,155,60,0.15)", shadow: "rgba(200,155,60,0.4)", sfx: "cash-out" },
  win:       { accent: "#FAF3DE", bg: "rgba(200,155,60,0.2)",  shadow: "rgba(200,155,60,0.6)", sfx: "win" },
};

export function EventDrama({ event, onDone, duration = 2500 }: Props) {
  const [current, setCurrent] = useState<DramaEvent | null>(null);

  useEffect(() => {
    if (!event) return;
    setCurrent(event);
    const s = TONE_STYLES[event.tone];
    playSfx(s.sfx);
    const t = setTimeout(() => {
      setCurrent(null);
      onDone?.();
    }, duration);
    return () => clearTimeout(t);
  }, [event, duration, onDone]);

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key={current.id}
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -30, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
        >
          <div
            className="card-luxe px-5 py-3 flex items-center gap-3 min-w-[280px] max-w-[420px]"
            style={{
              borderColor: TONE_STYLES[current.tone].accent,
              boxShadow: `0 0 40px ${TONE_STYLES[current.tone].shadow}, inset 0 1px 0 rgba(255,255,255,0.1)`,
            }}
          >
            {current.icon && (
              <motion.span
                initial={{ scale: 0.5, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="text-3xl shrink-0"
              >
                {current.icon}
              </motion.span>
            )}
            <div className="min-w-0 flex-1">
              <div
                className="cinzel text-[10px] tracking-widest mb-0.5"
                style={{ color: TONE_STYLES[current.tone].accent }}
              >
                {current.tone.replace("_", " ")}
              </div>
              <div className="heading text-lg font-bold text-gold-50 leading-tight">
                {current.title}
              </div>
              {current.body && (
                <div className="text-xs text-gold-100/70 mt-0.5">{current.body}</div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
