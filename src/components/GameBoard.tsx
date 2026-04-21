"use client";
import { useMemo, useState } from "react";
import type { GameAction, GameState } from "@/lib/types";
import { findPlayer } from "@/lib/game-engine";
import { PlayerBar } from "./PlayerBar";
import { Board } from "./Board";
import { ActionPanel } from "./ActionPanel";
import { TileInfoSheet } from "./TileInfoSheet";
import { TransportPicker } from "./TransportPicker";
import { DiceRoll } from "./DiceRoll";
import { ChatPanel } from "./ChatPanel";
import { SideDealPanel } from "./SideDealPanel";
import { GameLog } from "./GameLog";
import { AuctionPanel } from "./AuctionPanel";
import { StandoffPanel } from "./StandoffPanel";
import { CommitteeVote } from "./CommitteeVote";
import { WinnerOverlay } from "./WinnerOverlay";
import { RolePowers } from "./RolePowers";
import { formatMoney } from "@/lib/constants";

interface Props {
  state: GameState;
  dispatch: (action: GameAction) => void;
  mySessionId: string;
  roomCode: string;
}

type Tab = "game" | "chat" | "deals" | "log";

export function GameBoard(props: Props) {
  const { state, dispatch, mySessionId, roomCode } = props;
  const [selectedTile, setSelectedTile] = useState<number | null>(null);
  const [tab, setTab] = useState<Tab>("game");

  const me = findPlayer(state, mySessionId);
  const isMyTurn = state.players[state.current]?.id === mySessionId;
  const myIndex = state.players.findIndex((p) => p.id === mySessionId);
  const isSpectator = !me;

  const activeDeals = useMemo(
    () => state.sideDeals.filter((d) => d.status === "proposed"),
    [state.sideDeals],
  );
  const unreadDeals = activeDeals.filter((d) => d.toId === mySessionId).length;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top player bar */}
      <PlayerBar state={state} mySessionId={mySessionId} />

      {/* Split layout: mobile tabs / desktop side-by-side */}
      <div className="flex-1 lg:grid lg:grid-cols-[1fr_380px] lg:gap-0">
        {/* ========== LEFT / MAIN — BOARD ========== */}
        <section
          className={`${tab === "game" ? "block" : "hidden"} lg:block relative flex flex-col`}
        >
          <div className="flex-1 p-3 overflow-auto">
            <Board
              state={state}
              selectedTile={selectedTile}
              onSelectTile={setSelectedTile}
            />
          </div>

          {/* Current turn action area */}
          <div className="border-t border-gold-400/20 bg-navy-950/80 backdrop-blur p-3 space-y-2">
            <TurnHeader state={state} mySessionId={mySessionId} />

            {state.phase === "turn_start" && isMyTurn && (
              <TransportPicker
                player={state.players[state.current]}
                state={state}
                onChoose={(mode) => dispatch({ type: "CHOOSE_TRANSPORT", mode })}
              />
            )}

            {state.phase === "rolling" && isMyTurn && (
              <DiceRoll
                mode={state.lastDice?.mode ?? "walk"}
                stations={state.lastDice?.mode === "train" ? stationOptions(state) : undefined}
                onRoll={(values) => dispatch({ type: "ROLL_DICE", values })}
              />
            )}

            {state.phase === "landed" && isMyTurn && (
              <ActionPanel state={state} me={me!} dispatch={dispatch} />
            )}

            {state.phase === "action" && isMyTurn && (
              <ActionPanel state={state} me={me!} dispatch={dispatch} />
            )}

            {!isMyTurn && state.phase !== "ended" && !isSpectator && (
              <div className="text-center text-gold-100/60 text-sm py-2">
                <span className="gold-shimmer font-semibold">{state.players[state.current]?.name}</span>&apos;s turn
              </div>
            )}

            {/* Role powers always accessible */}
            {me && <RolePowers state={state} me={me} dispatch={dispatch} />}
          </div>

          {/* Overlays */}
          {state.phase === "auction" && state.auction && (
            <AuctionPanel state={state} me={me} dispatch={dispatch} />
          )}
          {state.phase === "standoff" && state.standoff && (
            <StandoffPanel state={state} me={me} dispatch={dispatch} />
          )}
          {state.phase === "committee" && state.committee && (
            <CommitteeVote state={state} me={me} dispatch={dispatch} />
          )}
          {state.phase === "ended" && state.winnerId && (
            <WinnerOverlay state={state} />
          )}

          {/* Tile info */}
          {selectedTile != null && (
            <TileInfoSheet
              tileId={selectedTile}
              state={state}
              me={me}
              onClose={() => setSelectedTile(null)}
              dispatch={dispatch}
            />
          )}
        </section>

        {/* ========== RIGHT / SIDEBAR — CHAT + DEALS + LOG ========== */}
        <aside className="lg:border-l lg:border-gold-400/20 lg:bg-navy-950/30 flex flex-col">
          <div className={`${tab === "chat" ? "flex" : "hidden"} lg:flex flex-col h-full min-h-0 ${tab === "chat" ? "flex-1" : ""}`}>
            <Panel tabLabel="Chat" visible={tab === "chat"}>
              <ChatPanel state={state} mySessionId={mySessionId} dispatch={dispatch} />
            </Panel>
          </div>
        </aside>
      </div>

      {/* Mobile tab bar */}
      <nav className="lg:hidden sticky bottom-0 bg-navy-950/95 backdrop-blur border-t border-gold-400/30 flex items-stretch z-30">
        {[
          { id: "game", label: "Board", emoji: "🎲", badge: 0 },
          { id: "chat", label: "Chat", emoji: "💬", badge: 0 },
          { id: "deals", label: "Deals", emoji: "🤝", badge: unreadDeals },
          { id: "log", label: "Log", emoji: "📜", badge: 0 },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as Tab)}
            className={`flex-1 flex flex-col items-center justify-center py-2 relative ${
              tab === t.id ? "text-gold-300" : "text-gold-100/50"
            }`}
          >
            <span className="text-xl">{t.emoji}</span>
            <span className="text-[10px] tracking-wider">{t.label}</span>
            {t.badge > 0 && (
              <span className="absolute top-1 right-[calc(50%-20px)] bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {t.badge}
              </span>
            )}
            {tab === t.id && <span className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-gold-400" />}
          </button>
        ))}
      </nav>

      {/* Mobile-only content for deals & log (the 'aside' handles chat on mobile via tab) */}
      {tab === "deals" && (
        <div className="lg:hidden flex-1 overflow-auto border-t border-gold-400/20">
          <SideDealPanel state={state} me={me} dispatch={dispatch} />
        </div>
      )}
      {tab === "log" && (
        <div className="lg:hidden flex-1 overflow-auto border-t border-gold-400/20">
          <GameLog state={state} />
        </div>
      )}

      {/* Desktop: side deals + log always in right sidebar below chat */}
      <div className="hidden lg:block fixed right-0 top-[88px] w-[380px] h-[calc(100vh-88px)] border-l border-gold-400/20 bg-navy-950/30 flex flex-col pointer-events-none">
        <div className="flex-1 pointer-events-auto flex flex-col min-h-0">
          <DesktopRightRail state={state} mySessionId={mySessionId} dispatch={dispatch} me={me} />
        </div>
      </div>
    </div>
  );
}

function TurnHeader({ state, mySessionId }: { state: GameState; mySessionId: string }) {
  const cur = state.players[state.current];
  const me = findPlayer(state, mySessionId);
  const isMine = cur?.id === mySessionId;
  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-2">
        <span className="chip bg-gold-400/15 border border-gold-400/30 text-gold-200">
          Round {state.round}
        </span>
        {isMine ? (
          <span className="chip bg-gold-400 text-navy-950 font-semibold">Your turn</span>
        ) : (
          <span className="chip border border-gold-400/30 text-gold-100/70">
            {cur?.name}&apos;s turn
          </span>
        )}
      </div>
      {me && (
        <div className="money text-sm">{formatMoney(me.money)}</div>
      )}
    </div>
  );
}

function Panel(props: { children: React.ReactNode; tabLabel: string; visible: boolean }) {
  return (
    <div className={`flex-1 min-h-0 ${props.visible ? "block" : "hidden"} lg:block lg:flex-1`}>
      {props.children}
    </div>
  );
}

function DesktopRightRail(props: { state: GameState; mySessionId: string; dispatch: (a: GameAction) => void; me?: any }) {
  const [tab, setTab] = useState<"chat" | "deals" | "log">("chat");
  const activeDeals = props.state.sideDeals.filter((d) => d.status === "proposed");
  const badge = activeDeals.filter((d) => d.toId === props.mySessionId).length;
  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-gold-400/20">
        {[
          { id: "chat", label: "Chat" },
          { id: "deals", label: `Deals${badge > 0 ? ` (${badge})` : ""}` },
          { id: "log", label: "Log" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={`flex-1 py-2 text-xs font-semibold tracking-wider uppercase ${
              tab === t.id
                ? "text-gold-300 border-b-2 border-gold-400"
                : "text-gold-100/60 hover:text-gold-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        {tab === "chat" && <ChatPanel state={props.state} mySessionId={props.mySessionId} dispatch={props.dispatch} />}
        {tab === "deals" && <SideDealPanel state={props.state} me={props.me} dispatch={props.dispatch} />}
        {tab === "log" && <GameLog state={props.state} />}
      </div>
    </div>
  );
}

function stationOptions(state: GameState) {
  return [0, 18, 33, 40].filter((id) => id !== state.players[state.current].position);
}
