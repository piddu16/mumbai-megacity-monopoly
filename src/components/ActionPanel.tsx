"use client";
import type { GameAction, GameState, Player } from "@/lib/types";
import { canBuy, canDevelop } from "@/lib/game-engine";
import { getTile } from "@/lib/tiles";
import { formatMoney, DEV_LEVELS } from "@/lib/constants";

interface Props {
  state: GameState;
  me: Player;
  dispatch: (action: GameAction) => void;
}

export function ActionPanel({ state, me, dispatch }: Props) {
  const tile = getTile(me.position);
  const prop = state.properties[tile.id];
  const canBuyHere = canBuy(state, tile.id, me.id);
  const buildable = prop?.ownerId === me.id ? canDevelop(state, tile.id, me.id) : null;

  return (
    <div className="flex flex-wrap gap-2 items-center justify-end">
      {canBuyHere && tile.price && (
        <>
          <button
            className="btn-gold text-sm"
            onClick={() => dispatch({ type: "BUY_PROPERTY", tileId: tile.id })}
          >
            Buy {tile.name} — {formatMoney(tile.price)}
          </button>
          <button
            className="btn-outline text-sm"
            onClick={() => {
              // One dispatch: start auction directly. The decline is implicit — the auction system
              // handles the outcome. Doing two back-to-back dispatches would clobber state.
              dispatch({ type: "START_AUCTION", tileId: tile.id, minBid: 50 });
            }}
          >
            Auction
          </button>
        </>
      )}
      {buildable?.ok && buildable.nextLevel != null && buildable.cost != null && (
        <button
          className="btn-outline text-sm"
          onClick={() => dispatch({ type: "DEVELOP", tileId: tile.id })}
        >
          Develop {DEV_LEVELS[buildable.nextLevel].emoji} {DEV_LEVELS[buildable.nextLevel].name} · {formatMoney(buildable.cost)}
        </button>
      )}
      <button
        className="btn-ghost text-sm"
        onClick={() => dispatch({ type: "END_TURN" })}
      >
        End Turn →
      </button>
    </div>
  );
}
