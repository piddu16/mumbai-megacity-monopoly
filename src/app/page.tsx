"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/hooks/useSession";
import { generateRoomCode, MAX_PLAYERS } from "@/lib/constants";

export default function Home() {
  const router = useRouter();
  const { sessionId, name, setName } = useSession();
  const [mode, setMode] = useState<"main" | "create" | "join">("main");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => setErr(null), [mode, code]);

  async function createRoom() {
    if (!name.trim()) return setErr("Enter your name first.");
    if (!sessionId) return setErr("Session not ready.");
    setBusy(true);
    setErr(null);
    try {
      let roomCode = generateRoomCode();
      // Check uniqueness
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
      // Create host player
      await supabase.from("mm_players").insert({
        room_id: data.id,
        player_name: name.trim(),
        player_number: 0,
        role: "TYCOON",
        session_id: sessionId,
        connected: true,
      });
      router.push(`/game/${roomCode}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not create room.");
      setBusy(false);
    }
  }

  async function joinRoom() {
    if (!name.trim()) return setErr("Enter your name first.");
    const c = code.trim().toUpperCase();
    if (c.length !== 6) return setErr("Room code must be 6 characters.");
    if (!sessionId) return setErr("Session not ready.");
    setBusy(true);
    setErr(null);
    try {
      const { data: room, error } = await supabase
        .from("mm_rooms")
        .select("*")
        .eq("code", c)
        .maybeSingle();
      if (error) throw error;
      if (!room) {
        setBusy(false);
        return setErr("Room not found.");
      }
      if (room.status === "finished") {
        setBusy(false);
        return setErr("That game has ended.");
      }
      // Check if already joined
      const { data: existing } = await supabase
        .from("mm_players")
        .select("*")
        .eq("room_id", room.id)
        .eq("session_id", sessionId)
        .maybeSingle();
      if (existing) {
        router.push(`/game/${c}`);
        return;
      }
      // Count players
      const { data: players } = await supabase
        .from("mm_players")
        .select("player_number")
        .eq("room_id", room.id)
        .order("player_number", { ascending: false });
      const count = players?.length ?? 0;
      if (count >= room.max_players) {
        setBusy(false);
        return setErr("Room is full.");
      }
      const nextNumber = count;
      const { error: insErr } = await supabase.from("mm_players").insert({
        room_id: room.id,
        player_name: name.trim(),
        player_number: nextNumber,
        role: "TYCOON",
        session_id: sessionId,
        connected: true,
      });
      if (insErr) throw insErr;
      router.push(`/game/${c}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not join room.");
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative gold glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-gold-400/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-zone-slc/10 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-lg w-full">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-block px-3 py-1 rounded-full border border-gold-400/30 text-gold-200 text-xs tracking-widest uppercase mb-5">
            Online · 2–6 Players · Real Mumbai
          </div>
          <h1 className="heading text-5xl sm:text-6xl font-black leading-none mb-3">
            <span className="gold-shimmer">Mumbai</span>
            <br />
            <span className="text-gold-100">Megacity</span>
            <br />
            <span className="text-gold-400/70 text-3xl sm:text-4xl">Monopoly</span>
          </h1>
          <p className="text-gold-100/70 text-lg italic">Sab kuch milega. Guarantee nahi.</p>
        </div>

        {mode === "main" && (
          <div className="card p-6 space-y-4">
            <div>
              <label className="text-sm text-gold-200/80 mb-1 block">Your name</label>
              <input
                className="input"
                placeholder="Rustam, Oberoi, Lodha…"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 20))}
                maxLength={20}
              />
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                className="btn-gold"
                disabled={!name.trim() || busy}
                onClick={createRoom}
              >
                {busy ? "Creating…" : "Create Room"}
              </button>
              <button
                className="btn-outline"
                disabled={!name.trim() || busy}
                onClick={() => setMode("join")}
              >
                Join Room
              </button>
            </div>
            {err && <p className="text-red-400 text-sm text-center">{err}</p>}
            <div className="divider" />
            <Link href="/practice" className="btn-ghost w-full justify-center">
              🎯 Practice mode (solo, play all players) →
            </Link>
            <Link href="/rules" className="btn-ghost w-full justify-center">
              Read the rules →
            </Link>
          </div>
        )}

        {mode === "join" && (
          <div className="card p-6 space-y-4">
            <div>
              <label className="text-sm text-gold-200/80 mb-1 block">Room Code</label>
              <input
                className="input font-mono tracking-[0.4em] text-center text-2xl uppercase"
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
            {err && <p className="text-red-400 text-sm text-center">{err}</p>}
          </div>
        )}

        <div className="mt-8 text-center text-gold-100/40 text-xs">
          A community game. Play with friends. Paisa bolta hai.
        </div>
      </div>
    </main>
  );
}
