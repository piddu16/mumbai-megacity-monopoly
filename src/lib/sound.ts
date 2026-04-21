"use client";
import { Howl } from "howler";

/**
 * Central sound manager. All sounds are data-URI encoded short SFX generated
 * on-the-fly via WebAudio where sensible, so no asset hosting needed for MVP.
 * Real bundled SFX can replace these later.
 */

type SfxId =
  | "dice"
  | "cash-in"
  | "cash-out"
  | "tap"
  | "stamp"
  | "gavel"
  | "chime"
  | "buzz"
  | "whoosh"
  | "card-flip"
  | "notify"
  | "win";

const cache = new Map<SfxId, Howl>();
let muted = false;

// Procedural beeps — free, zero-latency, no hosting
function makeTone(freq: number, duration: number, type: OscillatorType = "sine", volume = 0.3): Howl {
  // Simple WebAudio wrapper disguised as a Howl-compatible interface
  return {
    play() {
      if (muted || typeof window === "undefined") return 0;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const AC: typeof AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (!AC) return 0;
        const ctx = new AC();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
        setTimeout(() => ctx.close(), (duration + 0.1) * 1000);
      } catch {
        // ignore
      }
      return 0;
    },
    stop() {},
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any as Howl;
}

function makeChord(freqs: number[], duration: number, type: OscillatorType = "triangle", volume = 0.2): Howl {
  return {
    play() {
      if (muted || typeof window === "undefined") return 0;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const AC: typeof AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (!AC) return 0;
        const ctx = new AC();
        freqs.forEach((f, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = type;
          osc.frequency.setValueAtTime(f, ctx.currentTime + i * 0.03);
          gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.03);
          gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.03 + i * 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration + i * 0.03);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + i * 0.03);
          osc.stop(ctx.currentTime + duration + i * 0.03);
        });
        setTimeout(() => ctx.close(), (duration + 0.3) * 1000);
      } catch {
        // ignore
      }
      return 0;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    },
    stop() {},
  } as any as Howl;
}

function makeNoise(duration: number, volume = 0.2, highpass = 400): Howl {
  return {
    play() {
      if (muted || typeof window === "undefined") return 0;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const AC: typeof AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (!AC) return 0;
        const ctx = new AC();
        const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.value = highpass;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        src.start();
        src.stop(ctx.currentTime + duration);
        setTimeout(() => ctx.close(), (duration + 0.1) * 1000);
      } catch {
        // ignore
      }
      return 0;
    },
    stop() {},
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any as Howl;
}

function getSfx(id: SfxId): Howl {
  if (cache.has(id)) return cache.get(id)!;
  let h: Howl;
  switch (id) {
    case "dice":     h = makeNoise(0.25, 0.15, 800); break;
    case "cash-in":  h = makeChord([880, 1175, 1568], 0.3, "triangle", 0.25); break;  // A5, D6, G6
    case "cash-out": h = makeChord([330, 262], 0.35, "sawtooth", 0.2); break;
    case "tap":      h = makeTone(880, 0.05, "sine", 0.2); break;
    case "stamp":    h = makeNoise(0.12, 0.3, 200); break;
    case "gavel":    h = makeNoise(0.2, 0.35, 120); break;
    case "chime":    h = makeChord([1319, 1760, 2093], 0.5, "sine", 0.2); break;  // E6, A6, C7
    case "buzz":     h = makeTone(200, 0.3, "sawtooth", 0.15); break;
    case "whoosh":   h = makeNoise(0.3, 0.15, 2000); break;
    case "card-flip":h = makeNoise(0.08, 0.2, 1500); break;
    case "notify":   h = makeChord([880, 1319], 0.2, "triangle", 0.2); break;
    case "win":      h = makeChord([523, 659, 784, 1047], 0.8, "triangle", 0.3); break;  // C-E-G-C fanfare
  }
  cache.set(id, h!);
  return h!;
}

export function playSfx(id: SfxId) {
  if (typeof window === "undefined") return;
  try { getSfx(id).play(); } catch { /* ignore */ }
}

export function setMuted(m: boolean) { muted = m; }
export function isMuted() { return muted; }

// ─── Persistent mute preference ────────────────────────────────
if (typeof window !== "undefined") {
  const stored = localStorage.getItem("mm_muted");
  if (stored === "1") muted = true;
}

export function toggleMute() {
  muted = !muted;
  if (typeof window !== "undefined") {
    localStorage.setItem("mm_muted", muted ? "1" : "0");
  }
  return muted;
}
