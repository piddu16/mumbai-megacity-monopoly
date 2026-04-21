"use client";
import type { GameState, Player, TransportMode } from "@/lib/types";
import { availableTransport } from "@/lib/transport";
import { formatMoney } from "@/lib/constants";

const MODES: { id: TransportMode; emoji: string; label: string }[] = [
  { id: "walk",    emoji: "🚶", label: "Walk" },
  { id: "auto",    emoji: "🛺", label: "Auto" },
  { id: "bus",     emoji: "🚌", label: "BEST" },
  { id: "metro",   emoji: "🚇", label: "Metro" },
  { id: "train",   emoji: "🚂", label: "Train" },
  { id: "coastal", emoji: "🛣️", label: "Coastal" },
];

interface Props {
  player: Player;
  state: GameState;
  onChoose: (mode: TransportMode) => void;
}

export function TransportPicker({ player, state, onChoose }: Props) {
  const options = availableTransport(player);
  const byId = Object.fromEntries(options.map((o) => [o.mode, o]));

  return (
    <div>
      <div className="text-xs text-gold-200/80 mb-2">Choose transport</div>
      <div className="grid grid-cols-3 gap-2">
        {MODES.map((m) => {
          const opt = byId[m.id];
          const available = opt?.available;
          const affordable = player.money >= (opt?.cost ?? 0);
          const ok = available && affordable;
          return (
            <button
              key={m.id}
              disabled={!ok}
              onClick={() => onChoose(m.id)}
              title={opt?.reason}
              className={`p-2 rounded-lg border text-center transition-all ${
                ok
                  ? "border-gold-400/40 bg-navy-900 hover:bg-gold-400/10 hover:border-gold-400"
                  : "border-white/5 opacity-40 cursor-not-allowed"
              }`}
            >
              <div className="text-2xl">{m.emoji}</div>
              <div className="text-[10px] font-semibold">{m.label}</div>
              <div className="text-[9px] money">{opt && opt.cost > 0 ? formatMoney(opt.cost) : "Free"}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
