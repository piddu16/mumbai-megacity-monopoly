"use client";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { CityBackground } from "./CityBackground";
import { TurnCinematic } from "./TurnCinematic";
import { EventDrama, type DramaEvent } from "./EventDrama";
import { formatMoney } from "@/lib/constants";
import { playSfx, toggleMute, isMuted } from "@/lib/sound";

interface Props {
  state: GameState;
  dispatch: (action: GameAction) => void;
  mySessionId: string;
  roomCode: string;
}

type Tab = "game" | "chat" | "deals" | "log";
type SideTab = "chat" | "deals" | "log";

export function GameBoard(props: Props) {
  const { state, dispatch, mySessionId } = props;
  const [selectedTile, setSelectedTile] = useState<number | null>(null);
  const [mobileTab, setMobileTab] = useState<Tab>("game");
  const [sideTab, setSideTab] = useState<SideTab>("chat");
  const [muted, setMutedState] = useState(false);
  const [drama, setDrama] = useState<DramaEvent | null>(null);

  const me = findPlayer(state, mySessionId);
  const isMyTurn = state.players[state.current]?.id === mySessionId;
  const isSpectator = !me;

  useEffect(() => { setMutedState(isMuted()); }, []);

  // Day/night mood cycle — every 10 rounds
  const mood: "night" | "dusk" | "monsoon" | "crisis" =
    state.phase === "ended" ? "dusk" :
    state.round >= 20 ? "crisis" :
    state.round >= 10 ? "monsoon" :
    "night";

  // Watch game log for dramatic events and surface them as cinematic toasts
  const lastLogIdRef = useRef<string | null>(null);
  useEffect(() => {
    const last = state.log[state.log.length - 1];
    if (!last || last.id === lastLogIdRef.current) return;
    lastLogIdRef.current = last.id;

    // Only show drama for events that touch the current user or are dramatic enough
    const myEvent = last.actorId === mySessionId;
    if (last.kind === "buy" && myEvent) {
      setDrama({ id: last.id, tone: "money_out", title: "Acquired", body: last.message, icon: "🏘️" });
    } else if (last.kind === "rent" && myEvent) {
      setDrama({ id: last.id, tone: "rent", title: "Rent Paid", body: last.message, icon: "💸" });
    } else if (last.kind === "tax" && myEvent) {
      setDrama({ id: last.id, tone: "tax", title: "Tax", body: last.message, icon: "📜" });
    } else if (last.kind === "salary" && myEvent) {
      setDrama({ id: last.id, tone: "money_in", title: "Salary", body: last.message, icon: "💰" });
    } else if (last.kind === "penthouse" && myEvent) {
      setDrama({ id: last.id, tone: "win", title: "Penthouse Bonus!", body: "+₹10Cr", icon: "✨" });
    } else if (last.kind === "card") {
      setDrama({ id: last.id, tone: "card", title: "Card Drawn", body: last.message, icon: "🎴" });
    } else if (last.kind === "standoff_end") {
      setDrama({ id: last.id, tone: "win", title: "Standoff Settled", body: last.message, icon: "⚔️" });
    }
  }, [state.log, mySessionId]);

  const activeDeals = useMemo(
    () => state.sideDeals.filter((d) => d.status === "proposed"),
    [state.sideDeals],
  );
  const unreadDeals = activeDeals.filter((d) => d.toId === mySessionId).length;

  // Unified side content — renders on desktop (right sidebar) OR mobile (tab body)
  const renderSideContent = (tab: SideTab) => {
    if (tab === "chat") return <ChatPanel state={state} mySessionId={mySessionId} dispatch={dispatch} />;
    if (tab === "deals") return <SideDealPanel state={state} me={me} dispatch={dispatch} />;
    return <GameLog state={state} />;
  };

  return (
    <div className="h-screen flex flex-col relative">
      {/* Animated city atmosphere */}
      <CityBackground mood={mood} intensity={state.round < 5 ? "calm" : "normal"} />

      {/* Cinematic overlays */}
      <TurnCinematic
        player={state.players[state.current] ?? null}
        isMyTurn={isMyTurn}
        round={state.round}
      />
      <EventDrama event={drama} onDone={() => setDrama(null)} />

      {/* Top player bar */}
      <PlayerBar state={state} mySessionId={mySessionId} />

      {/* Mute toggle (top right, always visible) */}
      <button
        onClick={() => { setMutedState(toggleMute()); playSfx("tap"); }}
        className="fixed top-3 right-3 z-30 w-8 h-8 rounded-full glass-gold flex items-center justify-center text-sm hover:scale-110 transition-transform"
        title={muted ? "Unmute" : "Mute"}
      >
        {muted ? "🔇" : "🔊"}
      </button>

      {/* Split layout: mobile tabs / desktop side-by-side */}
      <div className="flex-1 min-h-0 lg:grid lg:grid-cols-[1fr_380px] lg:gap-0">
        {/* ========== MAIN — BOARD + TURN AREA ========== */}
        <section className={`${mobileTab === "game" ? "flex" : "hidden"} lg:flex relative flex-col min-h-0`}>
          <div className="flex-1 min-h-0 p-3 overflow-auto">
            <Board
              state={state}
              selectedTile={selectedTile}
              onSelectTile={setSelectedTile}
            />
          </div>

          {/* Current turn action area */}
          <div className="border-t border-gold-400/20 bg-navy-950/80 backdrop-blur p-3 space-y-2 shrink-0">
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

            {(state.phase === "landed" || state.phase === "action") && isMyTurn && me && (
              <ActionPanel state={state} me={me} dispatch={dispatch} />
            )}

            {!isMyTurn && state.phase !== "ended" && !isSpectator && (
              <div className="text-center text-gold-100/60 text-sm py-2">
                <span className="gold-shimmer font-semibold">{state.players[state.current]?.name}</span>&apos;s turn
              </div>
            )}

            {isSpectator && (
              <div className="text-center text-gold-100/50 text-xs py-1 italic">
                👁️ Spectating — you can still chat
              </div>
            )}

            {/* Role powers always accessible on your turn */}
            {me && isMyTurn && <RolePowers state={state} me={me} dispatch={dispatch} />}
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

        {/* ========== RIGHT SIDEBAR (DESKTOP ONLY) ========== */}
        <aside className="hidden lg:flex flex-col border-l border-gold-400/20 bg-navy-950/30 min-h-0">
          <SideTabBar current={sideTab} onChange={setSideTab} dealsBadge={unreadDeals} />
          <div className="flex-1 min-h-0 overflow-hidden">{renderSideContent(sideTab)}</div>
        </aside>

        {/* ========== MOBILE TAB CONTENT ========== */}
        {mobileTab !== "game" && (
          <section className="lg:hidden flex-1 min-h-0 overflow-hidden flex flex-col">
            {renderSideContent(mobileTab === "deals" ? "deals" : mobileTab === "log" ? "log" : "chat")}
          </section>
        )}
      </div>

      {/* Mobile tab bar */}
      <nav className="lg:hidden sticky bottom-0 bg-navy-950/95 backdrop-blur border-t border-gold-400/30 flex items-stretch z-30 shrink-0">
        {[
          { id: "game", label: "Board", emoji: "🎲", badge: 0 },
          { id: "chat", label: "Chat", emoji: "💬", badge: 0 },
          { id: "deals", label: "Deals", emoji: "🤝", badge: unreadDeals },
          { id: "log", label: "Log", emoji: "📜", badge: 0 },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setMobileTab(t.id as Tab)}
            className={`flex-1 flex flex-col items-center justify-center py-2 relative ${
              mobileTab === t.id ? "text-gold-300" : "text-gold-100/50"
            }`}
          >
            <span className="text-xl">{t.emoji}</span>
            <span className="text-[10px] tracking-wider">{t.label}</span>
            {t.badge > 0 && (
              <span className="absolute top-1 right-[calc(50%-20px)] bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {t.badge}
              </span>
            )}
            {mobileTab === t.id && <span className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-gold-400" />}
          </button>
        ))}
      </nav>
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

function SideTabBar(props: { current: SideTab; onChange: (t: SideTab) => void; dealsBadge: number }) {
  const tabs: { id: SideTab; label: string }[] = [
    { id: "chat", label: "Chat" },
    { id: "deals", label: `Deals${props.dealsBadge > 0 ? ` (${props.dealsBadge})` : ""}` },
    { id: "log", label: "Log" },
  ];
  return (
    <div className="flex border-b border-gold-400/20 shrink-0">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => props.onChange(t.id)}
          className={`flex-1 py-2 text-xs font-semibold tracking-wider uppercase ${
            props.current === t.id
              ? "text-gold-300 border-b-2 border-gold-400"
              : "text-gold-100/60 hover:text-gold-100"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function stationOptions(state: GameState) {
  return [0, 18, 33, 40].filter((id) => id !== state.players[state.current].position);
}
