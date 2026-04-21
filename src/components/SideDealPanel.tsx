"use client";
import { useState } from "react";
import type { GameAction, GameState, Player, SideDeal, SideDealAsset } from "@/lib/types";
import { PLAYER_COLORS, PLAYER_TOKENS, SIDE_DEAL_LIMITS, formatMoney } from "@/lib/constants";
import { idgen } from "@/lib/game-engine";
import { getTile } from "@/lib/tiles";

interface Props {
  state: GameState;
  me?: Player;
  dispatch: (a: GameAction) => void;
}

export function SideDealPanel({ state, me, dispatch }: Props) {
  const [building, setBuilding] = useState(false);

  const myDeals = state.sideDeals.filter(
    (d) => d.status === "proposed" && (d.fromId === me?.id || d.toId === me?.id),
  );
  const publicDeals = state.sideDeals.filter((d) => d.isPublic && d.status !== "rejected");

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gold-200/80 uppercase tracking-widest">Active Deals</div>
          {me && (
            <button onClick={() => setBuilding(true)} className="btn-gold text-xs !py-1 !px-2">+ New</button>
          )}
        </div>

        {myDeals.length === 0 && publicDeals.length === 0 && (
          <div className="text-center text-gold-100/40 text-sm py-6 italic">
            No active deals yet. Mumbai chalta hai side deals se.
          </div>
        )}

        {myDeals.map((d) => (
          <DealCard key={d.id} deal={d} state={state} me={me} dispatch={dispatch} />
        ))}

        {publicDeals.length > 0 && (
          <>
            <div className="divider my-4" />
            <div className="text-xs text-gold-200/80 uppercase tracking-widest mb-2">📜 Public Ledger</div>
            {publicDeals.map((d) => (
              <DealCard key={d.id} deal={d} state={state} me={me} dispatch={dispatch} readonly />
            ))}
          </>
        )}
      </div>

      {building && me && (
        <DealBuilder state={state} me={me} onClose={() => setBuilding(false)} dispatch={dispatch} />
      )}
    </div>
  );
}

function DealCard({
  deal,
  state,
  me,
  dispatch,
  readonly,
}: {
  deal: SideDeal;
  state: GameState;
  me?: Player;
  dispatch: (a: GameAction) => void;
  readonly?: boolean;
}) {
  const from = state.players.find((p) => p.id === deal.fromId);
  const to = state.players.find((p) => p.id === deal.toId);
  const iAmTo = me?.id === deal.toId;
  const iAmFrom = me?.id === deal.fromId;
  const isJudge = me?.role === "JUDGE";

  return (
    <div className="bg-navy-900/70 border border-gold-400/20 rounded-lg p-3 text-sm">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 text-xs">
          <PlayerPill p={from} />
          <span className="text-gold-400">→</span>
          <PlayerPill p={to} />
        </div>
        <div className="flex gap-1">
          {deal.isPublic && <span className="chip bg-gold-400/20 text-gold-200 text-[9px]">📜 Public</span>}
          {deal.status === "flagged" && <span className="chip bg-red-500/20 text-red-300 text-[9px]">⚖️ Flagged</span>}
          {deal.status === "accepted" && <span className="chip bg-green-500/20 text-green-300 text-[9px]">✓ Done</span>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <AssetList label="Offers" items={deal.offered} state={state} />
        <AssetList label="Requests" items={deal.requested} state={state} />
      </div>

      {deal.message && (
        <div className="text-xs italic text-gold-100/60 mt-2 pl-2 border-l-2 border-gold-400/30">&ldquo;{deal.message}&rdquo;</div>
      )}

      {!readonly && deal.status === "proposed" && (
        <div className="flex flex-wrap gap-2 mt-3 justify-end">
          {iAmTo && (
            <>
              <button className="btn-gold text-xs !py-1 !px-3" onClick={() => dispatch({ type: "ACCEPT_SIDE_DEAL", dealId: deal.id })}>
                Accept
              </button>
              <button className="btn-ghost text-xs !py-1 !px-3" onClick={() => dispatch({ type: "REJECT_SIDE_DEAL", dealId: deal.id })}>
                Reject
              </button>
            </>
          )}
          {iAmFrom && (
            <button className="btn-ghost text-xs !py-1 !px-3" onClick={() => dispatch({ type: "REJECT_SIDE_DEAL", dealId: deal.id })}>
              Withdraw
            </button>
          )}
          {isJudge && !iAmFrom && !iAmTo && (
            <button
              className="btn-outline text-xs !py-1 !px-3 border-red-400/60 text-red-300 hover:bg-red-500/10"
              onClick={() => {
                const reason = prompt("Why flag this deal?") ?? "Suspected corruption";
                if (reason) dispatch({ type: "FLAG_SIDE_DEAL", dealId: deal.id, judgeId: me!.id, reason });
              }}
            >
              ⚖️ Flag
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function PlayerPill({ p }: { p: Player | undefined }) {
  if (!p) return <span className="text-gold-100/40">?</span>;
  return (
    <span className="flex items-center gap-1">
      <span className="w-4 h-4 rounded-full inline-flex items-center justify-center text-[9px]" style={{ background: PLAYER_COLORS[p.number] }}>
        {PLAYER_TOKENS[p.number]}
      </span>
      <span className="font-semibold truncate max-w-[80px]">{p.name}</span>
    </span>
  );
}

function AssetList({ label, items, state }: { label: string; items: SideDealAsset[]; state: GameState }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-widest text-gold-100/50 mb-1">{label}</div>
      <div className="space-y-1">
        {items.length === 0 && <div className="text-gold-100/40 italic">Nothing</div>}
        {items.map((a, i) => (
          <div key={i} className="text-gold-100/90">
            {a.kind === "cash" && `💰 ${formatMoney(a.amount ?? 0)}`}
            {a.kind === "property" && a.tileId != null && `🏘️ ${getTile(a.tileId).name}`}
            {a.kind === "favor" && `🤝 ${a.count}× favor token`}
          </div>
        ))}
      </div>
    </div>
  );
}

function DealBuilder({
  state,
  me,
  onClose,
  dispatch,
}: {
  state: GameState;
  me: Player;
  onClose: () => void;
  dispatch: (a: GameAction) => void;
}) {
  const others = state.players.filter((p) => p.id !== me.id);
  const [toId, setToId] = useState(others[0]?.id ?? "");
  const [offerCash, setOfferCash] = useState(0);
  const [requestCash, setRequestCash] = useState(0);
  const [offerTiles, setOfferTiles] = useState<number[]>([]);
  const [requestTiles, setRequestTiles] = useState<number[]>([]);
  const [offerFavors, setOfferFavors] = useState(0);
  const [requestFavors, setRequestFavors] = useState(0);
  const [message, setMessage] = useState("");

  const myProps = Object.values(state.properties).filter((p) => p.ownerId === me.id);
  const theirProps = Object.values(state.properties).filter((p) => p.ownerId === toId);
  const MAX_CASH_CR = SIDE_DEAL_LIMITS.MAX_CASH_PER_DEAL / 100;

  function submit() {
    if (!toId) return;
    const offered: SideDealAsset[] = [];
    const requested: SideDealAsset[] = [];
    if (offerCash > 0) offered.push({ kind: "cash", amount: offerCash * 100 });
    if (requestCash > 0) requested.push({ kind: "cash", amount: requestCash * 100 });
    for (const t of offerTiles) offered.push({ kind: "property", tileId: t });
    for (const t of requestTiles) requested.push({ kind: "property", tileId: t });
    if (offerFavors > 0) offered.push({ kind: "favor", count: offerFavors });
    if (requestFavors > 0) requested.push({ kind: "favor", count: requestFavors });
    if (offered.length === 0 && requested.length === 0) return;

    const deal: SideDeal = {
      id: idgen(),
      fromId: me.id,
      toId,
      offered,
      requested,
      message: message.trim() || undefined,
      status: "proposed",
      expiresAtRound: state.round + SIDE_DEAL_LIMITS.DURATION_ROUNDS,
      createdAtTurn: state.turnNumber,
      isPublic: false,
    };
    dispatch({ type: "PROPOSE_SIDE_DEAL", deal });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-navy-950/90 flex items-end justify-center sm:items-center p-3" onClick={onClose}>
      <div className="card-gold w-full max-w-lg p-4 overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <div className="heading text-lg">New Side Deal</div>
          <button onClick={onClose} className="btn-ghost !p-1">✕</button>
        </div>

        <label className="block text-xs text-gold-200/80 mb-1">To</label>
        <select value={toId} onChange={(e) => setToId(e.target.value)} className="input mb-3">
          {others.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <div className="grid grid-cols-2 gap-3">
          <DealSide
            title="I offer"
            cash={offerCash} onCash={setOfferCash}
            favors={offerFavors} onFavors={setOfferFavors}
            selected={offerTiles} onToggleTile={(id) => setOfferTiles((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id].slice(-SIDE_DEAL_LIMITS.MAX_PROPERTIES_PER_SIDE))}
            availableTiles={myProps.map((p) => p.tileId)}
            cashMax={Math.min(Math.floor(me.money / 100), MAX_CASH_CR)}
          />
          <DealSide
            title="I want"
            cash={requestCash} onCash={setRequestCash}
            favors={requestFavors} onFavors={setRequestFavors}
            selected={requestTiles} onToggleTile={(id) => setRequestTiles((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id].slice(-SIDE_DEAL_LIMITS.MAX_PROPERTIES_PER_SIDE))}
            availableTiles={theirProps.map((p) => p.tileId)}
            cashMax={MAX_CASH_CR}
          />
        </div>

        <label className="block text-xs text-gold-200/80 mt-3 mb-1">Note (optional)</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, 200))}
          className="input h-16 !py-2 text-sm resize-none"
          placeholder="Yaar paisa de de, abhi ki abhi…"
        />

        <div className="text-[10px] text-gold-100/50 mt-2 space-y-0.5">
          <div>• Deals ≥ ₹{(SIDE_DEAL_LIMITS.PUBLIC_THRESHOLD / 100).toFixed(0)}Cr become public (everyone sees).</div>
          <div>• Max ₹{MAX_CASH_CR}Cr cash, 2 properties per side, 3 favors.</div>
          <div>• Expires after {SIDE_DEAL_LIMITS.DURATION_ROUNDS} rounds.</div>
        </div>

        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="btn-outline flex-1">Cancel</button>
          <button onClick={submit} className="btn-gold flex-1">Send</button>
        </div>
      </div>
    </div>
  );
}

function DealSide(props: {
  title: string;
  cash: number;
  onCash: (n: number) => void;
  favors: number;
  onFavors: (n: number) => void;
  selected: number[];
  onToggleTile: (id: number) => void;
  availableTiles: number[];
  cashMax: number;
}) {
  return (
    <div className="bg-navy-950/60 border border-white/10 rounded-lg p-2">
      <div className="text-[10px] text-gold-200 uppercase tracking-widest mb-2">{props.title}</div>
      <label className="text-[10px] text-gold-100/60">Cash (₹Cr)</label>
      <input
        type="number"
        min={0}
        max={props.cashMax}
        value={props.cash}
        onChange={(e) => props.onCash(Math.max(0, Math.min(props.cashMax, Number(e.target.value) || 0)))}
        className="input !py-1 text-sm"
      />
      <label className="text-[10px] text-gold-100/60 mt-2 block">Favors (0–{SIDE_DEAL_LIMITS.MAX_FAVOR_TOKENS})</label>
      <input
        type="number"
        min={0}
        max={SIDE_DEAL_LIMITS.MAX_FAVOR_TOKENS}
        value={props.favors}
        onChange={(e) => props.onFavors(Math.max(0, Math.min(SIDE_DEAL_LIMITS.MAX_FAVOR_TOKENS, Number(e.target.value) || 0)))}
        className="input !py-1 text-sm"
      />
      <label className="text-[10px] text-gold-100/60 mt-2 block">Properties (≤2)</label>
      <div className="space-y-1 max-h-32 overflow-y-auto">
        {props.availableTiles.length === 0 && <div className="text-[10px] text-gold-100/40 italic">None available</div>}
        {props.availableTiles.map((id) => {
          const selected = props.selected.includes(id);
          return (
            <button
              key={id}
              onClick={() => props.onToggleTile(id)}
              className={`w-full text-left text-[10px] px-2 py-1 rounded border ${
                selected ? "border-gold-400 bg-gold-400/10" : "border-white/10 hover:bg-white/5"
              }`}
            >
              {getTile(id).name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
