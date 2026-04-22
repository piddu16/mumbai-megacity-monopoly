"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { GameAction, GameState, ChatMessage } from "@/lib/types";
import { idgen } from "@/lib/game-engine";
import { PLAYER_COLORS } from "@/lib/constants";
import { playSfx } from "@/lib/sound";

const REACTIONS = ["🔥", "💀", "🤣", "👎", "⚔️", "💸", "🎉", "👀"];

interface Props {
  state: GameState;
  mySessionId: string;
  dispatch: (a: GameAction) => void;
}

interface Floater {
  id: string;
  emoji: string;
  color: string;
  x: number;
  ts: number;
}

/**
 * Hides behind a small "😀" button at bottom-right. Tap to open a tray of 8
 * emoji. Tapping one broadcasts it as a system chat message AND spawns a big
 * animated floater over everyone's screen.
 */
export function ReactionLayer({ state, mySessionId, dispatch }: Props) {
  const [open, setOpen] = useState(false);
  const [floaters, setFloaters] = useState<Floater[]>([]);

  // Listen to chat messages tagged as reactions and spawn floaters.
  useEffect(() => {
    const last = state.chat[state.chat.length - 1];
    if (!last || !last.text.startsWith("::reaction::")) return;
    const emoji = last.text.replace("::reaction::", "");
    const sender = state.players.find((p) => p.id === last.senderId);
    const color = sender ? PLAYER_COLORS[sender.number] : "#C89B3C";
    const id = `${last.id}-${Date.now()}`;
    setFloaters((prev) => [...prev, { id, emoji, color, x: 20 + Math.random() * 60, ts: Date.now() }]);
    setTimeout(() => setFloaters((prev) => prev.filter((f) => f.id !== id)), 3000);
  }, [state.chat, state.players]);

  function send(emoji: string) {
    const me = state.players.find((p) => p.id === mySessionId);
    if (!me) return;
    const msg: ChatMessage = {
      id: idgen(),
      senderId: me.id,
      senderName: me.name,
      text: `::reaction::${emoji}`,
      at: Date.now(),
    };
    dispatch({ type: "SEND_CHAT", message: msg });
    playSfx("tap");
    setOpen(false);
  }

  return (
    <>
      {/* Floaters */}
      <div className="fixed inset-0 z-40 pointer-events-none overflow-hidden">
        <AnimatePresence>
          {floaters.map((f) => (
            <motion.div
              key={f.id}
              initial={{ y: "100vh", opacity: 0, scale: 0.5 }}
              animate={{ y: "10vh", opacity: [0, 1, 1, 0], scale: [0.5, 1.4, 1.2, 1] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.8, ease: [0.22, 1, 0.36, 1] }}
              className="absolute text-6xl"
              style={{
                left: `${f.x}%`,
                filter: `drop-shadow(0 0 20px ${f.color})`,
                textShadow: `0 0 30px ${f.color}`,
              }}
            >
              {f.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Reaction button + tray */}
      <div className="fixed bottom-[72px] lg:bottom-4 right-3 z-40">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ y: 20, opacity: 0, scale: 0.8 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.18 }}
              className="absolute bottom-12 right-0 glass-gold rounded-xl p-2 grid grid-cols-4 gap-1"
            >
              {REACTIONS.map((e) => (
                <button
                  key={e}
                  onClick={() => send(e)}
                  className="w-10 h-10 rounded-lg text-2xl hover:bg-gold-400/20 transition-colors"
                >
                  {e}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => { setOpen((o) => !o); playSfx("tap"); }}
          className="w-10 h-10 rounded-full glass-gold flex items-center justify-center text-lg hover:scale-110 transition-transform shadow-gold"
          title="React"
        >
          {open ? "✕" : "😀"}
        </button>
      </div>
    </>
  );
}
