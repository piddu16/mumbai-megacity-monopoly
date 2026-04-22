"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import CountUp from "react-countup";
import { useGameSync } from "@/hooks/useGameSync";
import { Board } from "@/components/Board";
import { CityBackground } from "@/components/CityBackground";
import { ZoneMeter } from "@/components/ZoneMeter";
import { PLAYER_COLORS, PLAYER_TOKENS, ROLE_INFO, CRORE, formatMoneyShort } from "@/lib/constants";
import type { GameState, LogEntry } from "@/lib/types";

/**
 * /tv/[code] — the big-screen view. Built for a TV or projector with players'
 * phones used as controllers elsewhere. Read-only, public info only.
 * Big board, giant player leaderboard, auction/standoff takeovers, live log ticker.
 */
export default function TvView() {
  const params = useParams<{ code: string }>();
  const code = (params.code ?? "").toUpperCase();
  // Use a stable spectator-ish sessionId
  const [sessionId] = useState(() =>
    typeof window !== "undefined"
      ? (localStorage.getItem("mm_tv_session") ??
          (() => {
            const id = "tv-" + crypto.randomUUID();
            localStorage.setItem("mm_tv_session", id);
            return id;
          })())
      : "tv-ssr",
  );

  const { room, state } = useGameSync(code, sessionId);

  const mood: "night" | "dusk" | "monsoon" | "crisis" =
    state?.phase === "ended" ? "dusk" :
    state && state.round >= 20 ? "crisis" :
    state && state.round >= 10 ? "monsoon" :
    "night";

  const joinUrl = typeof window !== "undefined"
    ? `${window.location.origin}/game/${code}`
    : "";

  if (!room || !state) {
    return (
      <>
        <CityBackground mood="night" />
        <main className="min-h-screen flex items-center justify-center p-10">
          <div className="text-center space-y-6">
            <div className="cinzel text-sm tracking-[0.5em] text-gold-200/60">ROOM</div>
            <div className="cinzel text-6xl sm:text-9xl tracking-[0.3em] gold-shimmer font-black">{code}</div>
            <div className="text-gold-100/50 text-xl">Waiting to connect…</div>
            {room && (
              <div className="text-gold-100/40">
                Hosted by <span className="gold-shimmer font-bold">{room.hostName}</span>
              </div>
            )}
            <div className="mt-10 card-luxe px-6 py-4 inline-block">
              <div className="cinzel text-[10px] tracking-widest text-gold-200/70 mb-2">JOIN ON YOUR PHONE</div>
              <div className="font-mono text-2xl break-all">{joinUrl}</div>
            </div>
          </div>
        </main>
      </>
    );
  }

  const lastLog = state.log.slice(-5).reverse();

  return (
    <>
      <CityBackground mood={mood} intensity="hot" />
      <main className="min-h-screen p-4 sm:p-6 grid grid-rows-[auto_1fr_auto] gap-4">
        {/* ─── TOP ─── Round + zone meter + clock */}
        <header className="grid grid-cols-[1fr_auto] items-center gap-4">
          <div>
            <div className="cinzel text-[10px] tracking-[0.5em] text-gold-200/60">ROOM</div>
            <div className="heading text-5xl gold-shimmer font-black tracking-widest">{code}</div>
          </div>
          <div className="text-right">
            <div className="cinzel text-[10px] tracking-[0.5em] text-gold-200/60">ROUND</div>
            <div className="heading text-5xl gold-shimmer font-black tabular-nums">{state.round}</div>
          </div>
          <div className="col-span-2 glass-gold rounded-xl">
            <ZoneMeter state={state} />
          </div>
        </header>

        {/* ─── CENTER ─── Big board */}
        <section className="flex items-center justify-center px-2">
          <div className="w-full max-w-6xl">
            <Board state={state} selectedTile={null} onSelectTile={() => {}} />
          </div>
        </section>

        {/* ─── BOTTOM ─── Leaderboard + event ticker */}
        <footer className="grid grid-cols-[1fr_auto] gap-4">
          <Leaderboard state={state} />
          <Ticker log={lastLog} />
        </footer>

        {/* Current player spotlight */}
        <CurrentSpotlight state={state} />

        {/* Fullscreen takeovers */}
        {state.phase === "auction" && state.auction && <AuctionTakeover state={state} />}
        {state.phase === "standoff" && state.standoff && <StandoffTakeover state={state} />}
        {state.phase === "ended" && state.winnerId && <WinnerTakeover state={state} />}
      </main>
    </>
  );
}

function Leaderboard({ state }: { state: GameState }) {
  const ranked = useMemo(
    () => [...state.players].sort((a, b) => b.money - a.money),
    [state.players],
  );
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
      {ranked.map((p, rank) => {
        const color = PLAYER_COLORS[p.number];
        const token = PLAYER_TOKENS[p.number];
        const role = ROLE_INFO[p.role];
        const isCurrent = state.players[state.current]?.id === p.id;
        return (
          <motion.div
            key={p.id}
            layout
            animate={isCurrent ? { scale: 1.05, y: -4 } : { scale: 1, y: 0 }}
            className="card-luxe p-3 relative"
            style={{
              borderColor: isCurrent ? color : undefined,
              boxShadow: isCurrent ? `0 0 30px ${color}88` : undefined,
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center text-base"
                style={{
                  background: `radial-gradient(circle at 30% 30%, ${color}, ${color}cc)`,
                  boxShadow: `0 0 12px ${color}`,
                }}
              >
                {token}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold truncate" style={{ color: isCurrent ? color : "#F5EAD1" }}>
                  {p.name}
                </div>
                <div className="text-[9px] text-gold-100/60 truncate tracking-wider uppercase">
                  {role.emoji} {role.name}
                </div>
              </div>
              <span className="cinzel text-[9px] text-gold-300/60">#{rank + 1}</span>
            </div>
            <div className="money-big text-lg">
              ₹<CountUp end={p.money / CRORE} decimals={1} duration={0.6} preserveValue />Cr
            </div>
            <div className="text-[10px] text-gold-100/50 flex justify-between mt-0.5">
              <span>🏘️ {p.propertyCount}</span>
              <span>⚔️ {p.standoffsWon}W</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function Ticker({ log }: { log: LogEntry[] }) {
  return (
    <div className="card-luxe p-3 w-[280px] max-w-[320px] hidden sm:block">
      <div className="cinzel text-[10px] tracking-widest text-gold-200/70 mb-2">🗞️ NEWS TICKER</div>
      <div className="space-y-1 text-xs text-gold-100/85">
        <AnimatePresence initial={false}>
          {log.map((e) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="line-clamp-2"
            >
              {e.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function CurrentSpotlight({ state }: { state: GameState }) {
  const cur = state.players[state.current];
  if (!cur) return null;
  const color = PLAYER_COLORS[cur.number];
  return (
    <motion.div
      key={cur.id + state.turnNumber}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-30 glass-gold rounded-full px-5 py-2 flex items-center gap-3"
      style={{ borderColor: color, boxShadow: `0 0 20px ${color}88` }}
    >
      <span className="cinzel text-[9px] tracking-widest" style={{ color }}>
        NOW PLAYING
      </span>
      <span className="text-xl">{PLAYER_TOKENS[cur.number]}</span>
      <span className="heading font-bold text-lg" style={{ color }}>
        {cur.name}
      </span>
    </motion.div>
  );
}

function AuctionTakeover({ state }: { state: GameState }) {
  const a = state.auction;
  if (!a) return null;
  const bidder = a.currentBidderId ? state.players.find((p) => p.id === a.currentBidderId) : null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-40 bg-ink-950/85 backdrop-blur flex items-center justify-center p-10"
    >
      <div className="text-center space-y-6">
        <div className="cinzel text-sm tracking-[0.5em] text-neon-pink">LIVE AUCTION</div>
        <div className="heading text-8xl gold-shimmer font-black">Tile #{a.tileId}</div>
        <div className="money-big text-9xl">
          ₹<CountUp end={a.currentBid / CRORE} decimals={1} duration={0.3} preserveValue />Cr
        </div>
        {bidder && (
          <div className="text-3xl" style={{ color: PLAYER_COLORS[bidder.number] }}>
            {PLAYER_TOKENS[bidder.number]} {bidder.name} leads
          </div>
        )}
      </div>
    </motion.div>
  );
}

function StandoffTakeover({ state }: { state: GameState }) {
  const s = state.standoff;
  if (!s) return null;
  const p1 = state.players.find((p) => p.id === s.p1);
  const p2 = state.players.find((p) => p.id === s.p2);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-40 bg-gradient-to-br from-ink-950/95 via-ink-900/95 to-ink-950/95 backdrop-blur flex items-center justify-center p-10"
    >
      <div className="text-center space-y-6 max-w-4xl">
        <div className="cinzel text-sm tracking-[0.5em] neon-magenta">TEEN PATTI STANDOFF</div>
        <div className="grid grid-cols-2 gap-16 items-center">
          {[p1, p2].map((p) => p && (
            <div key={p.id} className="text-center">
              <span
                className="w-24 h-24 rounded-full inline-flex items-center justify-center text-5xl mb-3"
                style={{
                  background: `radial-gradient(circle at 30% 30%, ${PLAYER_COLORS[p.number]}, ${PLAYER_COLORS[p.number]}cc)`,
                  boxShadow: `0 0 40px ${PLAYER_COLORS[p.number]}`,
                }}
              >
                {PLAYER_TOKENS[p.number]}
              </span>
              <div className="heading text-4xl" style={{ color: PLAYER_COLORS[p.number] }}>
                {p.name}
              </div>
            </div>
          ))}
        </div>
        <div className="text-3xl cinzel tracking-widest text-gold-200/80">
          POT · <span className="money-big">₹{(s.pot / CRORE).toFixed(1)}Cr</span>
        </div>
        <div className="text-gold-100/60 text-xl">Round {s.round}/3</div>
      </div>
    </motion.div>
  );
}

function WinnerTakeover({ state }: { state: GameState }) {
  const winner = state.players.find((p) => p.id === state.winnerId);
  if (!winner) return null;
  const color = PLAYER_COLORS[winner.number];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-40 bg-ink-950/95 backdrop-blur flex items-center justify-center p-10"
    >
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
          transition={{ duration: 1 }}
          className="text-[200px] leading-none"
        >
          🏆
        </motion.div>
        <div className="cinzel text-lg tracking-[0.5em] text-gold-200 mt-4">MUMBAI KA RAJA</div>
        <div className="heading text-9xl font-black mt-2" style={{ color, textShadow: `0 0 60px ${color}` }}>
          {winner.name}
        </div>
      </div>
    </motion.div>
  );
}
