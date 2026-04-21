"use client";
import { useState } from "react";
import type { GameAction, GameState, Player, RoleId, ZoneId } from "@/lib/types";
import { ROLE_INFO, ZONE_INFO } from "@/lib/constants";
import { ROLE_POWERS } from "@/lib/roles";
import { getTile, TILES } from "@/lib/tiles";

interface Props {
  state: GameState;
  me: Player;
  dispatch: (a: GameAction) => void;
}

export function RolePowers({ state, me, dispatch }: Props) {
  const [open, setOpen] = useState(false);
  const role = ROLE_INFO[me.role];
  const powers = ROLE_POWERS[me.role].filter((p) => !p.id.includes("dev_discount") && !p.id.includes("land_bank") && !p.id.includes("legal_fees") && !p.id.includes("ministerial_salary") && !p.id.includes("prop_tax") && !p.id.includes("rehab_rev") && !p.id.includes("double_dev"));

  if (powers.length === 0) return null;

  return (
    <div className="relative">
      <button className="btn-ghost text-xs w-full justify-start" onClick={() => setOpen((x) => !x)}>
        <span className="text-lg">{role.emoji}</span>
        <span className="font-semibold">{role.name} Powers</span>
        <span className="ml-auto text-gold-100/40">{open ? "▴" : "▾"}</span>
      </button>
      {open && (
        <div className="mt-2 p-3 bg-navy-950/80 border border-gold-400/20 rounded-lg space-y-2">
          {powers.map((p) => (
            <PowerButton key={p.id} me={me} state={state} power={p.id} name={p.name} desc={p.description} dispatch={dispatch} onUsed={() => setOpen(false)} />
          ))}
        </div>
      )}
    </div>
  );
}

function PowerButton({ me, state, power, name, desc, dispatch, onUsed }: { me: Player; state: GameState; power: string; name: string; desc: string; dispatch: (a: GameAction) => void; onUsed: () => void }) {
  const [expanded, setExpanded] = useState(false);

  function handle(payload: Record<string, unknown>) {
    dispatch({ type: "USE_POWER", power, payload });
    setExpanded(false);
    onUsed();
  }

  return (
    <div className="border border-white/5 rounded">
      <button className="w-full text-left p-2 hover:bg-white/5" onClick={() => setExpanded((x) => !x)}>
        <div className="text-sm font-semibold text-gold-200">{name}</div>
        <div className="text-[11px] text-gold-100/60">{desc}</div>
      </button>
      {expanded && (
        <div className="p-2 border-t border-white/5 space-y-1">
          {power === "stay_order" && <PickTile state={state} onPick={(tileId) => handle({ tileId })} />}
          {power === "topping_out" && <PickTile state={state} onPick={(tileId) => handle({ tileId })} ownedBy={me.id} />}
          {power === "demolition" && <PickTile state={state} onPick={(tileId) => handle({ tileId })} />}
          {power === "sra_scheme" && <PickTile state={state} onPick={(tileId) => handle({ tileId })} />}
          {power === "sez" && <PickTile state={state} onPick={(tileId) => handle({ tileId })} />}
          {(power === "fsi_change" || power === "affordable_housing") && <PickZone onPick={(zone, delta) => handle({ zone, delta })} allowDelta={power === "fsi_change"} />}
        </div>
      )}
    </div>
  );
}

function PickTile({ state, onPick, ownedBy }: { state: GameState; onPick: (tileId: number) => void; ownedBy?: string }) {
  const tiles = TILES.filter((t) => (t.type === "property" || t.type === "utility" || t.type === "station") && (!ownedBy || state.properties[t.id]?.ownerId === ownedBy));
  return (
    <div className="max-h-40 overflow-y-auto space-y-0.5">
      {tiles.map((t) => (
        <button key={t.id} onClick={() => onPick(t.id)} className="w-full text-left text-xs px-2 py-1 hover:bg-gold-400/10 rounded">
          {t.name}
        </button>
      ))}
    </div>
  );
}

function PickZone({ onPick, allowDelta }: { onPick: (zone: ZoneId, delta: number) => void; allowDelta: boolean }) {
  const [zone, setZone] = useState<ZoneId>("WSN");
  const [delta, setDelta] = useState(0.5);
  return (
    <div className="space-y-2">
      <select value={zone} onChange={(e) => setZone(e.target.value as ZoneId)} className="input !py-1 text-xs">
        {Object.entries(ZONE_INFO).map(([id, z]) => (
          <option key={id} value={id}>{z.name}</option>
        ))}
      </select>
      {allowDelta && (
        <div className="flex gap-1">
          <button className={`btn-outline !py-1 text-xs flex-1 ${delta === 0.5 ? "bg-gold-400/20" : ""}`} onClick={() => setDelta(0.5)}>+0.5</button>
          <button className={`btn-outline !py-1 text-xs flex-1 ${delta === -0.5 ? "bg-gold-400/20" : ""}`} onClick={() => setDelta(-0.5)}>−0.5</button>
        </div>
      )}
      <button className="btn-gold !py-1 text-xs w-full" onClick={() => onPick(zone, delta)}>
        Apply
      </button>
    </div>
  );
}
