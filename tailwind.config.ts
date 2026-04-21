import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Neo-Mumbai palette
        asphalt:   "#0B0B0F",
        monsoon:   "#0F1726",
        ink: {
          950: "#060710",
          900: "#0B0B0F",
          800: "#131521",
          700: "#1C1F30",
          600: "#242840",
        },
        navy: {
          950: "#050C1A",
          900: "#0F1726",
          800: "#122238",
          700: "#1A2F4A",
          600: "#24406A",
        },
        gold: {
          50:  "#FAF3DE",
          100: "#F2E3AC",
          200: "#E9CF7B",
          300: "#DFBB5F",
          400: "#C89B3C",  // deeper gold
          500: "#B88C34",
          600: "#8E6A22",
          700: "#6B4E16",
        },
        neon: {
          magenta: "#FF2F92",
          cyan:    "#00E5FF",
          violet:  "#A259FF",
          pink:    "#FF7AB6",
        },
        emerald: {
          400: "#00B894",
          500: "#008F72",
        },
        rust:   "#FF7A00",
        crimson:"#FF3D3D",
        blood:  "#C31818",
        zone: {
          wsn: "#2196F3",
          wsm: "#4CAF50",
          bb:  "#E91E63",
          slc: "#9C27B0",
          lpb: "#00BCD4",
          sm:  "#F44336",
          smp: "#FFD700",
        },
      },
      fontFamily: {
        display: ["Cormorant Garamond", "Playfair Display", "ui-serif", "Georgia", "serif"],
        heading: ["Cinzel", "Cormorant Garamond", "ui-serif", "Georgia", "serif"],
        sans:    ["Inter", "DM Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        grotesk: ["Space Grotesk", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono:    ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        gold:     "0 0 20px rgba(200, 155, 60, 0.35)",
        "gold-lg":"0 0 40px rgba(200, 155, 60, 0.55)",
        neon:     "0 0 20px rgba(255, 47, 146, 0.5)",
        "neon-cyan": "0 0 20px rgba(0, 229, 255, 0.5)",
        emerald:  "0 0 20px rgba(0, 184, 148, 0.45)",
        "inner-gold": "inset 0 0 30px rgba(200, 155, 60, 0.15)",
      },
      backgroundImage: {
        "gold-radial":   "radial-gradient(circle at 30% 20%, rgba(200,155,60,0.18), transparent 60%)",
        "monsoon-grad":  "linear-gradient(180deg, #05070F 0%, #0B0B0F 30%, #0F1726 70%, #131521 100%)",
        "city-haze":     "linear-gradient(180deg, transparent 0%, rgba(11,11,15,0.6) 50%, rgba(15,23,38,0.9) 100%)",
        "gold-shine":    "linear-gradient(90deg, transparent 0%, rgba(200,155,60,0.4) 50%, transparent 100%)",
        "magenta-glow":  "radial-gradient(circle at 50% 50%, rgba(255,47,146,0.25), transparent 70%)",
        "card-luxe":     "linear-gradient(135deg, rgba(200,155,60,0.06) 0%, rgba(255,47,146,0.03) 100%)",
      },
      animation: {
        "dice-roll": "dice-roll 0.6s ease-out",
        "float-up":  "float-up 1.5s ease-out forwards",
        "float-up-long": "float-up 2.5s ease-out forwards",
        "shimmer":   "shimmer 2.5s linear infinite",
        "breathe":   "breathe 3.5s ease-in-out infinite",
        "pulse-glow":"pulse-glow 2s ease-in-out infinite",
        "slide-in-right": "slide-in-right 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
        "slide-up":  "slide-up 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
        "spotlight": "spotlight 4s ease-in-out infinite",
        "drift":     "drift 30s linear infinite",
        "neon-flicker": "neon-flicker 4s infinite",
        "rain":      "rain 1.2s linear infinite",
        "heli-sweep":"heli-sweep 20s linear infinite",
      },
      keyframes: {
        "dice-roll": {
          "0%":   { transform: "rotate(0deg) scale(0.7)", opacity: "0" },
          "50%":  { transform: "rotate(540deg) scale(1.15)", opacity: "1" },
          "100%": { transform: "rotate(720deg) scale(1)", opacity: "1" },
        },
        "float-up": {
          "0%":   { transform: "translateY(0) scale(0.95)", opacity: "0" },
          "15%":  { opacity: "1" },
          "100%": { transform: "translateY(-70px) scale(1.1)", opacity: "0" },
        },
        "shimmer": {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "breathe": {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%":      { transform: "scale(1.015)", opacity: "0.95" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(200,155,60,0.35)" },
          "50%":      { boxShadow: "0 0 40px rgba(200,155,60,0.7)" },
        },
        "slide-in-right": {
          "0%":   { transform: "translateX(40px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "slide-up": {
          "0%":   { transform: "translateY(30px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "spotlight": {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%":      { opacity: "0.8", transform: "scale(1.08)" },
        },
        "drift": {
          "0%":   { transform: "translateX(0)" },
          "100%": { transform: "translateX(-200px)" },
        },
        "neon-flicker": {
          "0%, 18%, 22%, 25%, 53%, 57%, 100%": { opacity: "1" },
          "20%, 24%, 55%": { opacity: "0.4" },
        },
        "rain": {
          "0%":   { transform: "translateY(-100%)", opacity: "0.2" },
          "100%": { transform: "translateY(120vh)", opacity: "0.05" },
        },
        "heli-sweep": {
          "0%":   { transform: "translateX(-20vw) translateY(20vh)", opacity: "0" },
          "15%":  { opacity: "0.4" },
          "85%":  { opacity: "0.4" },
          "100%": { transform: "translateX(120vw) translateY(40vh)", opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
