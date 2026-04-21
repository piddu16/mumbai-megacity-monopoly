import type { CardDef } from "./types";
import { CRORE, LAKH } from "./constants";

export const CHANCE_CARDS: CardDef[] = [
  {
    id: "rera_fast",
    type: "chance",
    title: "RERA Fast-Track",
    description: "Your next development skips BMC approval. Bureaucrats in a good mood.",
    effect: "RERA_FAST",
  },
  {
    id: "monsoon",
    type: "chance",
    title: "Monsoon Flooding",
    description: "Western Suburbs waterlogged. All your WSN/WSM properties drop 1 dev level.",
    effect: "MONSOON",
  },
  {
    id: "bollywood",
    type: "chance",
    title: "Bollywood Shoot",
    description: "If you own Bandra/Versova/Bandra-adj property, collect ₹3Cr location fee.",
    effect: "BOLLYWOOD",
  },
  {
    id: "sea_level",
    type: "chance",
    title: "Sea Level Warning",
    description: "Coastal rents (Worli, Marine Drive, Colaba) drop 20% for 2 turns.",
    effect: "SEA_LEVEL",
  },
  {
    id: "tax_raid",
    type: "chance",
    title: "BMC Tax Raid",
    description: "Pay 15% of your total property value as penalty.",
    effect: "TAX_RAID",
  },
  {
    id: "nri_boom",
    type: "chance",
    title: "NRI Investment Boom",
    description: "Your rents +25% for 2 turns.",
    effect: "NRI_BOOM",
  },
  {
    id: "absconded",
    type: "chance",
    title: "Builder Absconded",
    description: "A random one of your properties resets to Empty Plot. Paisa kidhar gaya?",
    effect: "ABSCONDED",
  },
  {
    id: "dcpr",
    type: "chance",
    title: "DCPR Amendment",
    description: "Your current zone gets +0.5 FSI, permanently.",
    effect: "DCPR",
  },
  {
    id: "loan",
    type: "chance",
    title: "Bank Loan Approved",
    description: "Collect ₹4Cr. Repayment? We'll worry later.",
    effect: "BANK_LOAN",
  },
  {
    id: "gst",
    type: "chance",
    title: "GST Refund",
    description: "Collect ₹1.5Cr from the Finance Ministry.",
    effect: "GST",
  },
  {
    id: "heritage",
    type: "chance",
    title: "Heritage Tag",
    description: "One of your properties becomes Heritage — can never go above Apartment, but rent doubles.",
    effect: "HERITAGE",
  },
  {
    id: "metro_ext",
    type: "chance",
    title: "Metro Line Extension",
    description: "A metro station is added at your current tile. Property value jumps.",
    effect: "METRO_EXT",
  },
];

export const COMMUNITY_CARDS: CardDef[] = [
  {
    id: "society_redev",
    type: "community",
    title: "Society Redevelopment Vote",
    description: "Your cheapest property gets +1 dev level, free.",
    effect: "SOCIETY_REDEV",
  },
  {
    id: "fire_noc",
    type: "community",
    title: "Fire NOC Lapsed",
    description: "Pay ₹1Cr per developed property you own.",
    effect: "FIRE_NOC",
  },
  {
    id: "festival",
    type: "community",
    title: "Festival Bonus",
    description: "Diwali/Ganpati rental boom. Collect ₹20L per property.",
    effect: "FESTIVAL",
  },
  {
    id: "water_cut",
    type: "community",
    title: "Water Cut",
    description: "All your properties collect 50% rent this turn.",
    effect: "WATER_CUT",
  },
  {
    id: "corpus",
    type: "community",
    title: "Redevelopment Corpus",
    description: "Collect ₹5Cr from the fund.",
    effect: "CORPUS",
  },
  {
    id: "pmc_bank",
    type: "community",
    title: "PMC Bank Crisis",
    description: "Lose ₹2Cr. Cooperative banking ka risk.",
    effect: "PMC",
  },
  {
    id: "secretary",
    type: "community",
    title: "Society Secretary Elected",
    description: "Collect ₹50L from every other player.",
    effect: "SECRETARY",
  },
  {
    id: "parking",
    type: "community",
    title: "Parking Dispute",
    description: "Lose a turn. Society politics hai yaar.",
    effect: "PARKING",
  },
  {
    id: "slum_encroach",
    type: "community",
    title: "Slum Encroachment",
    description: "One of your empty properties can't be developed for 2 turns.",
    effect: "SLUM",
  },
  {
    id: "sra_scam",
    type: "community",
    title: "SRA Scam Exposed",
    description: "MHADA Chief loses powers for 2 turns.",
    effect: "SRA_SCAM",
  },
];

export const ALL_CARDS: Record<string, CardDef> = Object.fromEntries(
  [...CHANCE_CARDS, ...COMMUNITY_CARDS].map((c) => [c.id, c]),
);

export function shuffleDeck<T>(arr: T[], rng: () => number = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getCard(cardId: string): CardDef {
  const c = ALL_CARDS[cardId];
  if (!c) throw new Error(`Unknown card ${cardId}`);
  return c;
}
