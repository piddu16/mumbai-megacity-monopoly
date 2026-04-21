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
        navy: {
          950: "#050C1A",
          900: "#0B1729",
          800: "#122238",
          700: "#1A2F4A",
          600: "#24406A",
        },
        gold: {
          50:  "#FAF3DE",
          100: "#F2E3AC",
          200: "#E9CF7B",
          300: "#DFBB5F",
          400: "#D4A853",
          500: "#B88C34",
          600: "#8E6A22",
          700: "#6B4E16",
        },
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
        display: ["Playfair Display", "ui-serif", "Georgia", "serif"],
        sans: ["DM Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        gold: "0 0 20px rgba(212, 168, 83, 0.35)",
        "gold-lg": "0 0 40px rgba(212, 168, 83, 0.45)",
      },
      backgroundImage: {
        "gold-radial": "radial-gradient(circle at 30% 20%, rgba(212,168,83,0.18), transparent 60%)",
        "navy-gradient": "linear-gradient(135deg, #050C1A 0%, #0B1729 50%, #122238 100%)",
      },
      animation: {
        "dice-roll": "dice-roll 0.6s ease-out",
        "float-up": "float-up 1.5s ease-out forwards",
        "shimmer": "shimmer 2.5s linear infinite",
      },
      keyframes: {
        "dice-roll": {
          "0%":   { transform: "rotate(0deg) scale(0.7)", opacity: "0" },
          "50%":  { transform: "rotate(540deg) scale(1.15)", opacity: "1" },
          "100%": { transform: "rotate(720deg) scale(1)", opacity: "1" },
        },
        "float-up": {
          "0%":   { transform: "translateY(0)", opacity: "1" },
          "100%": { transform: "translateY(-40px)", opacity: "0" },
        },
        "shimmer": {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
