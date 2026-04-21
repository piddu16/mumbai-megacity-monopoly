"use client";
import { useEffect, useState } from "react";
import type { GameAction, GameState, Player } from "@/lib/types";
import { getTile } from "@/lib/tiles";
import { AUCTION_INCREMENT, PLAYER_COLORS, PLAYER_TOKENS, formatMoney, ROLE_INFO } from "@/lib/constants";

interface Props {
  state: GameState;
  me?: Player;
  dispatch: (a: GameAction) => void;
}

export function AuctionPanel({ state, me, dispatch }: Props) {
  const { auction } = state;
  const [bid, setBid] = useState(0);

  useEffect(() => {
    if (auction) setBid(Math.max(auction.currentBid + AUCTION_INCREMENT, auction.minBid));
  }, [auction?.currentBid, auction?.minBid]);

  if (!auction) return null;
  const tile = getTile(auction.tileId);
  const amIn = !!me && auction.biddersIn.includes(me.id) && !ROLE_INFO[me.role].cannotAuction;
  const currentBidder = state.players.find((p) => p.id === auction.currentBidderId);

  return (
    <div className="fixed inset-0 z-40 bg-navy-950/90 backdrop-blur flex items-end sm:items-center justify-center p-3">
      <div className="card-gold w-full max-w-md p-5">
        <div className="text-center mb-3">
          <div className="text-xs uppercase tracking-widest text-gold-200">Auction</div>
          <div className="heading text-2xl font-bold">{tile.name}</div>
          {tile.area && <div className="text-sm text-gold-100/60">{tile.area}</div>}
          <div className="text-xs text-gold-100/50 mt-1">Min bid: {formatMoney(auction.minBid)}</div>
        </div>

        <div className="bg-navy-950/70 border border-gold-400/30 rounded-lg p-4 text-center mb-3">
          <div className="text-[10px] uppercase tracking-widest text-gold-200/60">Current Bid</div>
          <div className="money text-3xl font-bold my-1">{formatMoney(auction.currentBid || 0)}</div>
          {currentBidder ? (
            <div className="text-xs flex items-center justify-center gap-1">
              <span className="w-4 h-4 rounded-full" style={{ background: PLAYER_COLORS[currentBidder.number] }} />
              by {currentBidder.name}
            </div>
          ) : (
            <div className="text-xs text-gold-100/50 italic">No bids yet</div>
          )}
        </div>

        <div className="mb-3">
          <div className="text-xs text-gold-200/80 mb-1">Bidders remaining</div>
          <div className="flex flex-wrap gap-1">
            {auction.biddersIn.map((id) => {
              const p = state.players.find((x) => x.id === id)!;
              return (
                <span key={id} className="chip bg-navy-900 border border-white/10 text-xs">
                  <span className="w-3 h-3 rounded-full inline-block mr-1" style={{ background: PLAYER_COLORS[p.number] }} />
                  {p.name}
                </span>
              );
            })}
          </div>
        </div>

        {amIn ? (
          <>
            <div className="flex gap-2 mb-2">
              <input
                type="number"
                className="input"
                value={bid}
                min={auction.currentBid + AUCTION_INCREMENT}
                step={AUCTION_INCREMENT}
                onChange={(e) => setBid(Math.max(0, Number(e.target.value) || 0))}
              />
              <button
                className="btn-gold"
                disabled={bid <= auction.currentBid || (me?.money ?? 0) < bid}
                onClick={() => dispatch({ type: "AUCTION_BID", playerId: me!.id, amount: bid })}
              >
                Bid
              </button>
            </div>
            <div className="flex gap-2">
              <button
                className="btn-outline flex-1"
                onClick={() => dispatch({ type: "AUCTION_PASS", playerId: me!.id })}
              >
                Pass
              </button>
              {me?.id === state.players[state.current].id && (
                <button
                  className="btn-outline flex-1"
                  onClick={() => dispatch({ type: "AUCTION_CLOSE" })}
                >
                  Close
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="text-center text-gold-100/60 italic">
            {me ? "You're out. Watch them bid it up." : "Spectating."}
          </div>
        )}
      </div>
    </div>
  );
}
