"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/hooks/useSession";
import { generateRoomCode, MAX_PLAYERS } from "@/lib/constants";
import { CityBackground } from "@/components/CityBackground";
import { playSfx } from "@/lib/sound";

export default function Home() {
  const router = useRouter();
  const { sessionId, name, setName } = useSession();
  const [mode, setMode] = useState<"main" | "join">("main");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => setErr(null), [mode, code]);

  async function createRoom() {
    if (!name.trim()) return setErr("Your name is required.");
    if (!sessionId) return setErr("Session not ready.");
    setBusy(true);
    setErr(null);
    playSfx("tap");
    try {
      let roomCode = generateRoomCode();
      for (let i = 0; i < 5; i++) {
        const { data: existing } = await supabase.from("mm_rooms").select("id").eq("code", roomCode).maybeSingle();
        if (!existing) break;
        roomCode = generateRoomCode();
      }
      const { data, error } = await supabase
        .from("mm_rooms")
        .insert({
          code: roomCode,
          host_id: sessionId,
          host_name: name.trim(),
          status: "waiting",
          max_players: MAX_PLAYERS,
          game_state: {},
        })
        .select()
        .single();
      if (error) throw error;
      await supabase.from("mm_players").insert({
        room_id: data.id,
        player_name: name.trim(),
        player_number: 0,
        role: "TYCOON",
        session_id: sessionId,
        connected: true,
      });
      playSfx("chime");
      router.push(`/game/${roomCode}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not create room.");
      setBusy(false);
    }
  }

  async function joinRoom() {
    if (!name.trim()) return setErr("Your name is required.");
    const c = code.trim().toUpperCase();
    if (c.length !== 6) return setErr("Room code must be 6 characters.");
    if (!sessionId) return setErr("Session not ready.");
    setBusy(true);
    setErr(null);
    playSfx("tap");
    try {
      const { data: room, error } = await supabase
        .from("mm_rooms")
        .select("*")
        .eq("code", c)
        .maybeSingle();
      if (error) throw error;
      if (!room) { setBusy(false); return setErr("Room not found."); }
      if (room.status === "finished") { setBusy(false); return setErr("That game has ended."); }
      const { data: existing } = await supabase
        .from("mm_players")
        .select("*")
        .eq("room_id", room.id)
        .eq("session_id", sessionId)
        .maybeSingle();
      if (existing) { router.push(`/game/${c}`); return; }
      const { data: playersList } = await supabase
        .from("mm_players")
        .select("player_number")
        .eq("room_id", room.id);
      const count = playersList?.length ?? 0;
      if (count >= room.max_players) { setBusy(false); return setErr("Room is full."); }
      const { error: insErr } = await supabase.from("mm_players").insert({
        room_id: room.id,
        player_name: name.trim(),
        player_number: count,
        role: "TYCOON",
        session_id: sessionId,
        connected: true,
      });
      if (insErr) throw insErr;
      playSfx("chime");
      router.push(`/game/${c}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not join room.");
      setBusy(false);
    }
  }

  return (
    <>
      <CityBackground mood="night" intensity="normal" />
      <main className="min-h-screen flex flex-col items-center justify-center p-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 max-w-lg w-full"
        >
          {/* Hero */}
          <div className="text-center mb-10">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-block px-3 py-1 rounded-full border border-gold-400/40 text-gold-200/90 cinzel text-[10px] tracking-[0.3em] mb-6 glass"
            >
              2–6 Players · Real Mumbai · Real Stakes
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="heading text-5xl sm:text-7xl font-black leading-[0.95] mb-4 text-shadow-luxe"
            >
              <span className="gold-shimmer">Mumbai</span>
              <br />
              <span className="text-gold-100">Megacity</span>
              <br />
              <span className="cinzel text-2xl sm:text-3xl tracking-[0.2em] text-gold-400/80">MONOPOLY</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="text-gold-100/70 text-lg italic heading"
            >
              Sab kuch milega. Guarantee nahi.
            </motion.p>
          </div>

          {mode === "main" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="card-luxe p-6 space-y-4"
            >
              <div>
                <label className="cinzel text-[10px] tracking-widest text-gold-200/90 mb-2 block">YOUR NAME</label>
                <input
                  className="input text-lg"
                  placeholder="Rustam, Oberoi, Lodha…"
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 20))}
                  maxLength={20}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button className="btn-gold" disabled={!name.trim() || busy} onClick={createRoom}>
                  {busy ? "Creating…" : "Create Room"}
                </button>
                <button className="btn-outline" disabled={!name.trim() || busy} onClick={() => setMode("join")}>
                  Join Room
                </button>
              </div>
              {err && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-crimson text-sm text-center"
                >
                  {err}
                </motion.p>
              )}
              <div className="divider" />
              <Link href="/practice" className="btn-ghost w-full justify-center group">
                <span className="group-hover:scale-110 transition-transform">🎯</span>
                Practice Mode · play all players solo
              </Link>
              <Link href="/rules" className="btn-ghost w-full justify-center text-gold-100/60">
                Read the rules →
              </Link>
            </motion.div>
          )}

          {mode === "join" && (
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="card-luxe p-6 space-y-4"
            >
              <div>
                <label className="cinzel text-[10px] tracking-widest text-gold-200/90 mb-2 block">ROOM CODE</label>
                <input
                  className="input font-mono tracking-[0.5em] text-center text-3xl uppercase cinzel"
                  placeholder="ABC123"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
                  maxLength={6}
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button className="btn-outline" onClick={() => setMode("main")}>Back</button>
                <button className="btn-gold" disabled={code.length !== 6 || busy} onClick={joinRoom}>
                  {busy ? "Joining…" : "Join"}
                </button>
              </div>
              {err && <p className="text-crimson text-sm text-center">{err}</p>}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="mt-8 text-center text-gold-100/40 text-xs cinzel tracking-widest"
          >
            PAISA · POWER · PALITIKI
          </motion.div>
        </motion.div>
      </main>
    </>
  );
}
