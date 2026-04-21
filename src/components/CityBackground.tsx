"use client";
import { useEffect, useMemo, useRef } from "react";

/**
 * Neo-Mumbai atmosphere layer.
 * Skyline silhouette + monsoon rain + traffic streaks + blinking tower lights
 * + helicopter spotlight sweep. Pure CSS + tiny canvas for rain — no heavy libs.
 * Day/night cycle tied to `mood` prop.
 */
interface Props {
  mood?: "day" | "dusk" | "night" | "monsoon" | "crisis";
  intensity?: "calm" | "normal" | "hot";
}

export function CityBackground({ mood = "night", intensity = "normal" }: Props) {
  const rainCanvasRef = useRef<HTMLCanvasElement>(null);

  // Monsoon rain on canvas
  useEffect(() => {
    if (mood !== "monsoon") return;
    const canvas = rainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let running = true;
    const drops: { x: number; y: number; l: number; s: number }[] = [];
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 180; i++) {
      drops.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        l: 8 + Math.random() * 14,
        s: 6 + Math.random() * 10,
      });
    }
    const draw = () => {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "rgba(180, 220, 255, 0.25)";
      ctx.lineWidth = 1;
      for (const d of drops) {
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - 2, d.y + d.l);
        ctx.stroke();
        d.y += d.s;
        d.x -= 1;
        if (d.y > canvas.height) {
          d.y = -20;
          d.x = Math.random() * canvas.width;
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [mood]);

  // Tower light positions — stable per mount
  const towerLights = useMemo(() => {
    const out: { x: number; y: number; delay: number; color: string }[] = [];
    for (let i = 0; i < 60; i++) {
      out.push({
        x: Math.random() * 100,
        y: 55 + Math.random() * 35,
        delay: Math.random() * 6,
        color: ["#C89B3C", "#FF2F92", "#00E5FF", "#FF7A00"][Math.floor(Math.random() * 4)],
      });
    }
    return out;
  }, []);

  const moodBg = {
    day:     "linear-gradient(180deg, #1C2B4A 0%, #2D3E5F 35%, #0F1726 100%)",
    dusk:    "linear-gradient(180deg, #5A2E3F 0%, #2D1E2E 40%, #0B0B0F 100%)",
    night:   "linear-gradient(180deg, #060710 0%, #0B0B0F 40%, #0F1726 100%)",
    monsoon: "linear-gradient(180deg, #14192A 0%, #0B0B0F 50%, #0F1726 100%)",
    crisis:  "linear-gradient(180deg, #2A0A0F 0%, #0B0B0F 40%, #0F1726 100%)",
  }[mood];

  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" style={{ background: moodBg }}>
      {/* Distant haze gradient */}
      <div className="absolute inset-0" style={{
        background: mood === "crisis"
          ? "radial-gradient(ellipse 60% 50% at 50% 100%, rgba(195, 24, 24, 0.35), transparent 70%)"
          : mood === "dusk"
          ? "radial-gradient(ellipse 60% 50% at 50% 100%, rgba(255, 122, 0, 0.25), transparent 70%)"
          : "radial-gradient(ellipse 60% 50% at 50% 100%, rgba(200, 155, 60, 0.18), transparent 70%)",
      }} />

      {/* Neon ambient glow patches */}
      <div className="absolute top-0 left-[10%] w-[40vw] h-[40vw] rounded-full blur-3xl opacity-25"
           style={{ background: "radial-gradient(circle, rgba(255, 47, 146, 0.5), transparent 70%)" }} />
      <div className="absolute bottom-[10%] right-[5%] w-[35vw] h-[35vw] rounded-full blur-3xl opacity-20"
           style={{ background: "radial-gradient(circle, rgba(0, 229, 255, 0.4), transparent 70%)" }} />
      <div className="absolute top-[30%] right-[20%] w-[25vw] h-[25vw] rounded-full blur-3xl opacity-15"
           style={{ background: "radial-gradient(circle, rgba(0, 184, 148, 0.4), transparent 70%)" }} />

      {/* Skyline silhouette — two parallax layers */}
      <Skyline layer="back" />
      <Skyline layer="front" />

      {/* Blinking tower lights */}
      {towerLights.map((l, i) => (
        <span
          key={i}
          className="absolute w-0.5 h-0.5 rounded-full animate-pulse"
          style={{
            left: `${l.x}%`,
            top: `${l.y}%`,
            background: l.color,
            boxShadow: `0 0 4px ${l.color}, 0 0 8px ${l.color}`,
            animationDelay: `${l.delay}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
          }}
        />
      ))}

      {/* Traffic streaks at horizon */}
      {intensity !== "calm" && (
        <div className="absolute bottom-0 left-0 right-0 h-[80px] overflow-hidden opacity-40">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="absolute h-0.5 bg-gradient-to-r from-transparent via-rust/80 to-transparent animate-drift"
              style={{
                top: `${12 + i * 12}px`,
                width: "260px",
                animationDelay: `${i * 2.5}s`,
                animationDuration: `${15 + i * 3}s`,
                left: "100%",
              }}
            />
          ))}
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={`white-${i}`}
              className="absolute h-0.5 bg-gradient-to-l from-transparent via-white/60 to-transparent animate-drift"
              style={{
                top: `${18 + i * 12}px`,
                width: "200px",
                animationDelay: `${i * 3}s`,
                animationDuration: `${18 + i * 2}s`,
                right: "100%",
                animationDirection: "reverse",
              }}
            />
          ))}
        </div>
      )}

      {/* Helicopter sweep (occasional) */}
      <div
        className="absolute top-[10%] -left-[10%] w-[200px] h-[200px] rounded-full opacity-0 animate-heli-sweep"
        style={{
          background: "radial-gradient(circle, rgba(255, 255, 255, 0.15), transparent 70%)",
          animationDelay: "10s",
          animationDuration: mood === "crisis" ? "15s" : "45s",
        }}
      />

      {/* Monsoon rain canvas */}
      {mood === "monsoon" && (
        <canvas ref={rainCanvasRef} className="absolute inset-0 opacity-60" />
      )}

      {/* Film grain */}
      <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay"
           style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />

      {/* Vignette */}
      <div className="absolute inset-0"
           style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, 0.7) 100%)" }} />
    </div>
  );
}

function Skyline({ layer }: { layer: "back" | "front" }) {
  // Procedurally build a skyline SVG. Two layers for parallax depth.
  const isFront = layer === "front";
  const height = isFront ? 120 : 180;
  const opacity = isFront ? 0.55 : 0.3;
  const y = isFront ? "bottom-0" : "bottom-12";

  // Generate building heights
  const buildings = useMemo(() => {
    const arr: { x: number; w: number; h: number; type: "tower" | "dome" | "box"; antenna: boolean }[] = [];
    let x = 0;
    while (x < 2400) {
      const w = 20 + Math.random() * 60;
      const h = (isFront ? 40 : 60) + Math.random() * (isFront ? 60 : 110);
      const type = Math.random() < 0.7 ? "tower" : Math.random() < 0.5 ? "dome" : "box";
      arr.push({ x, w, h, type, antenna: Math.random() < 0.3 });
      x += w + Math.random() * 6;
    }
    return arr;
  }, [isFront]);

  const fill = isFront ? "#050810" : "#0B0E1A";

  return (
    <svg
      className={`absolute ${y} left-0 w-[200%] pointer-events-none`}
      style={{ height: `${height}px`, opacity, animation: `drift ${isFront ? 90 : 140}s linear infinite` }}
      viewBox={`0 0 2400 ${height}`}
      preserveAspectRatio="none"
    >
      {buildings.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={height - b.h} width={b.w} height={b.h} fill={fill} />
          {b.type === "dome" && (
            <ellipse cx={b.x + b.w / 2} cy={height - b.h} rx={b.w / 2} ry={8} fill={fill} />
          )}
          {b.antenna && (
            <line x1={b.x + b.w / 2} y1={height - b.h} x2={b.x + b.w / 2} y2={height - b.h - 10} stroke={fill} strokeWidth="1" />
          )}
          {/* Random lit windows */}
          {Array.from({ length: Math.floor(b.h / 8) }).map((_, row) =>
            Array.from({ length: Math.floor(b.w / 6) }).map((_, col) => {
              if (Math.random() > 0.25) return null;
              return (
                <rect
                  key={`${row}-${col}`}
                  x={b.x + 2 + col * 6}
                  y={height - b.h + 4 + row * 8}
                  width={2}
                  height={3}
                  fill={Math.random() < 0.8 ? "#E9CF7B" : "#FF2F92"}
                  opacity={0.6 + Math.random() * 0.4}
                />
              );
            }),
          )}
        </g>
      ))}
    </svg>
  );
}
