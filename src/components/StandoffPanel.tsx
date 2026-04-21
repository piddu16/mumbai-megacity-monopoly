"use client";
import { useState } from "react";
import type { GameAction, GameState, Player } from "@/lib/types";
import { cardLabel, suitIsRed } from "@/lib/teen-patti";
import { PLAYER_COLORS, PLAYER_TOKENS, formatMoney } from "@/lib/constants";
import { getTile } from "@/lib/tiles";

interface Props {
  state: GameState;
  me?: Player;
  dispatch: (a: GameAction) => void;
}

export function StandoffPanel({ state, me, dispatch }: Props) {
  const st = state.standoff!;
  const p1 = state.players.find((p) => p.id === st.p1)!;
  const p2 = state.players.find((p) => p.id === st.p2)!;
  const iAmP1 = me?.id === st.p1;
  const iAmP2 = me?.id === st.p2;
  const isMyTurn = me?.id === st.currentActor;
  const myBlind = iAmP1 ? st.p1Blind : iAmP2 ? st.p2Blind : false;
  const myCards = iAmP1 ? st.p1Cards : iAmP2 ? st.p2Cards : [];
  const [raise, setRaise] = useState(50);

  return (
    <div className="fixed inset-0 z-40 bg-gradient-to-br from-navy-950/98 to-navy-900/98 backdrop-blur flex items-center justify-center p-3">
      <div className="card-gold max-w-lg w-full p-5">
        <div className="text-center mb-3">
          <div className="text-xs uppercase tracking-widest text-gold-200">Teen Patti Standoff</div>
          <div className="heading text-2xl gold-shimmer font-bold">{triggerLabel(st.trigger)}</div>
          {st.disputedTileId != null && (
            <div className="text-sm text-gold-100/60">for {getTile(st.disputedTileId).name}</div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <PlayerHand player={p1} cards={st.reveal || iAmP1 ? st.p1Cards : undefined} blind={st.p1Blind} active={st.currentActor === p1.id} />
          <PlayerHand player={p2} cards={st.reveal || iAmP2 ? st.p2Cards : undefined} blind={st.p2Blind} active={st.currentActor === p2.id} />
        </div>

        <div className="bg-navy-950/70 border border-gold-400/30 rounded-lg p-3 text-center mb-3">
          <div className="text-[10px] uppercase tracking-widest text-gold-200/60">Pot</div>
          <div className="money text-3xl font-bold">{formatMoney(st.pot)}</div>
          <div className="text-xs text-gold-100/50 mt-1">Round {st.round}/3 · Max raise {formatMoney(st.maxRaise)}</div>
        </div>

        {!st.reveal && (iAmP1 || iAmP2) && (
          <>
            <div className="mb-3 text-center">
              <button
                onClick={() => dispatch({ type: "STANDOFF_CHOOSE_BLIND", playerId: me!.id, blind: !myBlind })}
                className={`btn-outline !py-1 !px-4 text-xs ${myBlind ? "border-red-400 text-red-300" : ""}`}
              >
                {myBlind ? "Playing Blind (1.5× bluff)" : "Play Blind?"}
              </button>
            </div>

            {isMyTurn && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="number"
                    className="input"
                    value={raise}
                    min={50}
                    step={50}
                    onChange={(e) => setRaise(Math.max(50, Math.min(st.maxRaise, Number(e.target.value) || 50)))}
                  />
                  <span className="self-center text-xs text-gold-100/60">lakh</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    className="btn-gold text-xs !py-2"
                    onClick={() => dispatch({ type: "STANDOFF_BET", playerId: me!.id, action: "raise", amount: raise })}
                  >
                    Raise
                  </button>
                  <button
                    className="btn-outline text-xs !py-2"
                    onClick={() => dispatch({ type: "STANDOFF_BET", playerId: me!.id, action: "call" })}
                  >
                    Call
                  </button>
                  <button
                    className="btn-outline text-xs !py-2 border-red-400/60 text-red-300 hover:bg-red-500/10"
                    onClick={() => dispatch({ type: "STANDOFF_BET", playerId: me!.id, action: "fold" })}
                  >
                    Fold
                  </button>
                </div>
              </div>
            )}
            {!isMyTurn && (
              <div className="text-center text-gold-100/60 italic text-sm">
                Waiting for {st.currentActor === p1.id ? p1.name : p2.name}…
              </div>
            )}
          </>
        )}

        {st.reveal && st.winnerId && (
          <div className="text-center">
            <div className="heading text-2xl gold-shimmer font-bold">
              {state.players.find((p) => p.id === st.winnerId)?.name} wins!
            </div>
            {st.winnerHand && <div className="text-sm text-gold-200 mt-1">{st.winnerHand.name}</div>}
          </div>
        )}

        {!iAmP1 && !iAmP2 && !st.reveal && (
          <div className="text-center text-gold-100/60 italic text-sm">Spectating the standoff.</div>
        )}
      </div>
    </div>
  );
}

function PlayerHand({ player, cards, blind, active }: { player: Player; cards?: { rank: number; suit: "♠" | "♥" | "♦" | "♣" }[]; blind: boolean; active: boolean }) {
  return (
    <div className={`p-3 rounded-lg border ${active ? "border-gold-400 bg-gold-400/10" : "border-white/10"}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="w-5 h-5 rounded-full" style={{ background: PLAYER_COLORS[player.number] }}>{PLAYER_TOKENS[player.number]}</span>
        <span className="font-semibold text-sm">{player.name}</span>
        {blind && <span className="chip bg-red-500/20 text-red-300 text-[9px]">Blind</span>}
      </div>
      <div className="flex gap-1">
        {cards
          ? cards.map((c, i) => (
              <div key={i} className={`w-10 h-14 rounded bg-gold-50 flex items-center justify-center font-mono font-bold ${suitIsRed(c.suit) ? "text-red-600" : "text-navy-950"}`}>
                {cardLabel(c)}
              </div>
            ))
          : [0, 1, 2].map((i) => (
              <div key={i} className="w-10 h-14 rounded bg-gradient-to-br from-navy-700 to-navy-900 border border-gold-400/30" />
            ))}
      </div>
    </div>
  );
}

function triggerLabel(t: string): string {
  switch (t) {
    case "stay_appeal": return "Stay Order Appeal";
    case "auction_tie": return "Auction Tiebreaker";
    case "trade_impasse": return "Trade Impasse";
    case "bankruptcy": return "Bankruptcy Challenge";
    case "hostile_takeover": return "Hostile Takeover";
    case "zone_control": return "Zone Control";
    case "voluntary": return "Voluntary Challenge";
    default: return "Standoff";
  }
}
