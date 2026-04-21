"use client";
import { useEffect, useRef, useState } from "react";
import type { ChatMessage, GameAction, GameState } from "@/lib/types";
import { PLAYER_COLORS, PLAYER_TOKENS } from "@/lib/constants";
import { idgen } from "@/lib/game-engine";

interface Props {
  state: GameState;
  mySessionId: string;
  dispatch: (a: GameAction) => void;
}

export function ChatPanel({ state, mySessionId, dispatch }: Props) {
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const me = state.players.find((p) => p.id === mySessionId);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.chat.length]);

  function send() {
    const body = text.trim();
    if (!body || !me) return;
    const msg: ChatMessage = {
      id: idgen(),
      senderId: me.id,
      senderName: me.name,
      text: body.slice(0, 300),
      at: Date.now(),
    };
    dispatch({ type: "SEND_CHAT", message: msg });
    setText("");
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
        {state.chat.length === 0 && (
          <div className="text-center text-gold-100/40 text-sm py-6 italic">
            No chat yet. <br />
            Say hi, negotiate a deal, or just trash-talk.
          </div>
        )}
        {state.chat.map((m) => {
          const sender = state.players.find((p) => p.id === m.senderId);
          const mine = m.senderId === mySessionId;
          const color = sender ? PLAYER_COLORS[sender.number] : "#888";
          const token = sender ? PLAYER_TOKENS[sender.number] : "•";
          if (m.system) {
            return (
              <div key={m.id} className="text-center text-[10px] text-gold-100/40 italic">
                {m.text}
              </div>
            );
          }
          return (
            <div key={m.id} className={`flex gap-2 ${mine ? "justify-end" : ""}`}>
              {!mine && (
                <span
                  className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px]"
                  style={{ background: color }}
                >
                  {token}
                </span>
              )}
              <div
                className={`max-w-[85%] rounded-lg px-3 py-1.5 text-sm ${
                  mine ? "bg-gold-400/20 text-gold-50 border border-gold-400/40" : "bg-navy-800/80"
                }`}
              >
                {!mine && <div className="text-[10px] font-semibold" style={{ color }}>{m.senderName}</div>}
                <div className="break-words whitespace-pre-wrap">{m.text}</div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <div className="border-t border-gold-400/20 p-2 flex gap-2">
        <input
          value={text}
          maxLength={300}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={me ? "Message the room…" : "Spectator — can't chat"}
          disabled={!me}
          className="input !py-2 text-sm"
        />
        <button onClick={send} disabled={!me || !text.trim()} className="btn-gold !py-2 !px-3 text-sm">
          ↑
        </button>
      </div>
    </div>
  );
}
