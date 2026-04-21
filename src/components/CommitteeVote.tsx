"use client";
import type { GameAction, GameState, Player } from "@/lib/types";
import { PLAYER_COLORS, ROLE_INFO } from "@/lib/constants";
import { getTile } from "@/lib/tiles";

interface Props {
  state: GameState;
  me?: Player;
  dispatch: (a: GameAction) => void;
}

export function CommitteeVote({ state, me, dispatch }: Props) {
  const v = state.committee!;
  const myVote = me ? v.votes[me.id] : undefined;
  const canVote = me && v.requiredRoles.includes(me.role);

  const yes = Object.values(v.votes).filter((x) => x === "yes").length;
  const no = Object.values(v.votes).filter((x) => x === "no").length;
  const totalNeeded = v.requiredRoles.length;
  const totalCast = Object.keys(v.votes).length;
  const done = totalCast >= totalNeeded;

  return (
    <div className="fixed inset-0 z-40 bg-navy-950/90 backdrop-blur flex items-center justify-center p-3">
      <div className="card-gold max-w-md w-full p-5">
        <div className="text-center mb-3">
          <div className="text-xs uppercase tracking-widest text-gold-200">Committee Vote</div>
          <div className="heading text-xl font-bold">{voteTitle(v.kind)}</div>
          {v.tileId != null && <div className="text-sm text-gold-100/60">for {getTile(v.tileId).name}</div>}
        </div>

        <div className="flex items-center justify-around mb-3">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">{yes}</div>
            <div className="text-[10px] uppercase text-gold-100/60">Approve</div>
          </div>
          <div className="text-3xl text-gold-100/30">/</div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-400">{no}</div>
            <div className="text-[10px] uppercase text-gold-100/60">Reject</div>
          </div>
        </div>

        <div className="text-center text-xs text-gold-100/60 mb-3">
          {totalCast}/{totalNeeded} votes cast
        </div>

        {canVote && !myVote && (
          <div className="grid grid-cols-3 gap-2">
            <button className="btn-gold" onClick={() => dispatch({ type: "COMMITTEE_VOTE", voterId: me!.id, vote: "yes" })}>
              Approve
            </button>
            <button className="btn-outline" onClick={() => dispatch({ type: "COMMITTEE_VOTE", voterId: me!.id, vote: "abstain" })}>
              Abstain
            </button>
            <button
              className="btn-outline border-red-400/60 text-red-300"
              onClick={() => dispatch({ type: "COMMITTEE_VOTE", voterId: me!.id, vote: "no" })}
            >
              Reject
            </button>
          </div>
        )}

        {myVote && (
          <div className="text-center text-sm italic text-gold-100/60">
            You voted {myVote}.
          </div>
        )}

        {done && (
          <button className="btn-gold w-full mt-3" onClick={() => dispatch({ type: "COMMITTEE_RESOLVE" })}>
            Resolve
          </button>
        )}
      </div>
    </div>
  );
}

function voteTitle(k: string): string {
  switch (k) {
    case "develop_approval": return "Approve Development";
    case "redevelopment": return "Redevelopment Proposal";
    case "impeach": return "Impeach Minister";
    case "sez": return "Declare SEZ";
    default: return "Committee Decision";
  }
}
