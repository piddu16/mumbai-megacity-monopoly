import type { DevLevel, RoleId, ZoneId } from "./types";

// ==================== MONEY ====================
// Internal unit: LAKHS. ₹1Cr = 100L. ₹1L = 1 in the integer representation.
export const LAKH = 1;
export const CRORE = 100;

export const STARTING_CASH = 30 * CRORE;       // ₹30Cr
export const SALARY_PER_LOOP = 2 * CRORE;      // ₹2Cr
export const PENTHOUSE_BONUS = 10 * CRORE;     // tile 42 bonus

// ==================== TRANSPORT COSTS ====================
export const TRANSPORT_COSTS = {
  walk: 0,
  auto: 10 * LAKH,          // ₹10L
  bus: 20 * LAKH,           // ₹20L
  metro: 50 * LAKH,         // ₹50L
  train: 30 * LAKH,         // ₹30L
  coastal: 2 * CRORE,       // ₹2Cr
} as const;

export const RUSH_HOUR_SURCHARGE = 20 * LAKH;
export const COASTAL_ROAD_TOLL = 50 * LAKH;
export const BEST_DEPOT_BONUS = 10 * LAKH;

// ==================== DEVELOPMENT ====================
export const DEV_LEVELS: {
  level: DevLevel;
  name: string;
  emoji: string;
  costMultiplier: number;
  rentMultiplier: number;
  requiresBmc: boolean;
  requiresMinister: boolean;
  requiresCommittee: boolean;
  minFsi: number;
}[] = [
  { level: 0, name: "Empty Plot",     emoji: "🏚️", costMultiplier: 0,   rentMultiplier: 1,   requiresBmc: false, requiresMinister: false, requiresCommittee: false, minFsi: 0 },
  { level: 1, name: "Chawl",          emoji: "🏘️", costMultiplier: 0.3, rentMultiplier: 1.5, requiresBmc: false, requiresMinister: false, requiresCommittee: false, minFsi: 0 },
  { level: 2, name: "Apartment",      emoji: "🏢", costMultiplier: 0.5, rentMultiplier: 2.5, requiresBmc: false, requiresMinister: false, requiresCommittee: false, minFsi: 1.0 },
  { level: 3, name: "High-Rise",      emoji: "🏙️", costMultiplier: 0.8, rentMultiplier: 4,   requiresBmc: true,  requiresMinister: false, requiresCommittee: false, minFsi: 2.0 },
  { level: 4, name: "Skyscraper",     emoji: "🌆", costMultiplier: 1.2, rentMultiplier: 7,   requiresBmc: true,  requiresMinister: false, requiresCommittee: false, minFsi: 3.0 },
  { level: 5, name: "Landmark",       emoji: "✨", costMultiplier: 2,   rentMultiplier: 12,  requiresBmc: true,  requiresMinister: true,  requiresCommittee: true,  minFsi: 4.0 },
];

export const TYCOON_DEV_DISCOUNT = 0.1;
export const ZONE_MONOPOLY_MULTIPLIER = 2;

// ==================== ZONES ====================
export const ZONE_INFO: Record<ZoneId, { name: string; color: string; tag: string }> = {
  WSN: { name: "Western Suburbs North",  color: "#2196F3", tag: "Starter Belt" },
  WSM: { name: "Western Suburbs Mid",    color: "#4CAF50", tag: "Engine Room" },
  BB:  { name: "Bandra Belt",            color: "#E91E63", tag: "Crown Jewels" },
  SLC: { name: "Sea Link Corridor",      color: "#9C27B0", tag: "Power Alley" },
  LPB: { name: "Lower Parel Belt",       color: "#00BCD4", tag: "Mill Land Reborn" },
  SM:  { name: "South Mumbai",           color: "#F44336", tag: "Old Money" },
  SMP: { name: "South Mumbai Prime",     color: "#FFD700", tag: "The Final Frontier" },
};

// ==================== PLAYERS ====================
export const PLAYER_COLORS = [
  "#E63946",
  "#3A86FF",
  "#2D936C",
  "#FF8C42",
  "#9C27B0",
  "#00BCD4",
] as const;

export const PLAYER_TOKENS = ["🚗", "🛺", "🏍️", "🚐", "🚁", "🚢"] as const;

export const MAX_PLAYERS = 6;
export const MIN_PLAYERS = 2;

// ==================== ROLES ====================
export const ROLE_INFO: Record<RoleId, {
  id: RoleId;
  name: string;
  emoji: string;
  theme: string;
  color: string;
  maxProperties?: number;
  cannotOwnPremium?: boolean;
  cannotAuction?: boolean;
  cannotCoastal?: boolean;
}> = {
  TYCOON: {
    id: "TYCOON",
    name: "Real Estate Tycoon",
    emoji: "🏗️",
    theme: "You build empires from empty plots.",
    color: "#D4A853",
  },
  JUDGE: {
    id: "JUDGE",
    name: "High Court Judge",
    emoji: "⚖️",
    theme: "Your word freezes cranes and halts demolitions.",
    color: "#9FA8DA",
    maxProperties: 5,
    cannotAuction: true,
  },
  MINISTER: {
    id: "MINISTER",
    name: "Housing Minister",
    emoji: "🏛️",
    theme: "You control FSI, mandates, and SEZ declarations.",
    color: "#FFB74D",
    cannotCoastal: true,
  },
  BMC: {
    id: "BMC",
    name: "BMC Commissioner",
    emoji: "🏢",
    theme: "Nothing gets built without your stamp.",
    color: "#81C784",
    maxProperties: 4,
  },
  MHADA: {
    id: "MHADA",
    name: "MHADA Chief",
    emoji: "🎟️",
    theme: "You control affordable housing and land reserves.",
    color: "#F48FB1",
    cannotOwnPremium: true,
    cannotCoastal: true,
  },
};

// ==================== AUCTION ====================
export const AUCTION_DURATION_MS = 30_000;
export const AUCTION_INCREMENT = 50 * LAKH;

// ==================== STANDOFF ====================
export const STANDOFF_STAKES: Record<string, { pot: number; maxRaise: number }> = {
  stay_appeal:      { pot: 5 * CRORE,   maxRaise: 2 * CRORE },
  auction_tie:      { pot: 5 * CRORE,   maxRaise: 3 * CRORE },
  trade_impasse:    { pot: 10 * CRORE,  maxRaise: 5 * CRORE },
  bankruptcy:       { pot: 20 * CRORE,  maxRaise: 10 * CRORE },
  hostile_takeover: { pot: 15 * CRORE,  maxRaise: 5 * CRORE },
  zone_control:     { pot: 20 * CRORE,  maxRaise: 5 * CRORE },
  voluntary:        { pot: 5 * CRORE,   maxRaise: 5 * CRORE },
};

// ==================== SIDE DEALS ====================
export const SIDE_DEAL_LIMITS = {
  MAX_CASH_PER_DEAL:        20 * CRORE,
  MAX_PROPERTIES_PER_SIDE:  2,
  MAX_FAVOR_TOKENS:         3,
  PUBLIC_THRESHOLD:         10 * CRORE,      // deals ≥ this are auto-public
  DURATION_ROUNDS:          3,
  MAX_ACTIVE_PER_PLAYER:    3,
  POWER_COOLDOWN_TURNS:     3,
};

// ==================== BANKRUPTCY ====================
export const BANKRUPTCY_TURNS_TO_RECOVER = 2;

// ==================== WIN CONDITIONS ====================
export const MUMBAI_RAJA_TARGET = 200 * CRORE; // ₹200Cr net worth
export const DEFAULT_MAX_ROUNDS = 30;

// ==================== MONEY FORMATTING ====================
export function formatMoney(amountInLakhs: number): string {
  if (amountInLakhs === 0) return "₹0";
  const sign = amountInLakhs < 0 ? "-" : "";
  const abs = Math.abs(amountInLakhs);
  if (abs >= CRORE) {
    const cr = abs / CRORE;
    const str = cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2).replace(/\.?0+$/, "");
    return `${sign}₹${str}Cr`;
  }
  const str = abs % 1 === 0 ? abs.toFixed(0) : abs.toFixed(2).replace(/\.?0+$/, "");
  return `${sign}₹${str}L`;
}

export function formatMoneyShort(amountInLakhs: number): string {
  if (Math.abs(amountInLakhs) >= CRORE) {
    return `${(amountInLakhs / CRORE).toFixed(1).replace(/\.0$/, "")}Cr`;
  }
  return `${amountInLakhs.toFixed(0)}L`;
}

// ==================== ROOM CODE ====================
export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no confusing 0/O/1/I
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}
