import type { Card, HandRank, Suit } from "./types";

const SUITS: Suit[] = ["♠", "♥", "♦", "♣"];

export function newDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (let rank = 2; rank <= 14; rank++) {
      deck.push({ rank, suit });
    }
  }
  return deck;
}

export function shuffle<T>(arr: T[], rng: () => number = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function deal3(deck: Card[]): { cards: Card[]; rest: Card[] } {
  return { cards: deck.slice(0, 3), rest: deck.slice(3) };
}

/** Rank a 3-card Teen Patti hand. Higher tier = stronger. */
export function rankHand(cards: Card[]): HandRank {
  if (cards.length !== 3) throw new Error("Teen Patti needs exactly 3 cards");
  const sorted = [...cards].sort((a, b) => b.rank - a.rank);
  const [c1, c2, c3] = sorted;
  const sameSuit = c1.suit === c2.suit && c2.suit === c3.suit;
  const ranksDesc = sorted.map((c) => c.rank);
  // Trail
  if (c1.rank === c2.rank && c2.rank === c3.rank) {
    return { tier: 5, name: "Trail", rank: c1.rank };
  }
  // Sequence check
  const isSeq = (c1.rank - c2.rank === 1 && c2.rank - c3.rank === 1)
    || (c1.rank === 14 && c2.rank === 3 && c3.rank === 2); // A-2-3 treated as low-straight
  if (isSeq && sameSuit) {
    return { tier: 4, name: "Pure Sequence", high: c1.rank };
  }
  if (isSeq) {
    return { tier: 3, name: "Sequence", high: c1.rank };
  }
  if (sameSuit) {
    return { tier: 2, name: "Flush", kicker: ranksDesc };
  }
  // Pair
  if (c1.rank === c2.rank) return { tier: 1, name: "Pair", pairRank: c1.rank, kicker: c3.rank };
  if (c2.rank === c3.rank) return { tier: 1, name: "Pair", pairRank: c2.rank, kicker: c1.rank };
  return { tier: 0, name: "High Card", kicker: ranksDesc };
}

/** Returns 1 if A beats B, -1 if B beats A, 0 for tie. */
export function compareHands(a: HandRank, b: HandRank): number {
  if (a.tier !== b.tier) return a.tier > b.tier ? 1 : -1;
  if (a.tier === 5 && b.tier === 5) return a.rank - b.rank || 0;
  if (a.tier === 4 && b.tier === 4) return a.high - b.high || 0;
  if (a.tier === 3 && b.tier === 3) return a.high - b.high || 0;
  if (a.tier === 2 && b.tier === 2) return compareKickers(a.kicker, b.kicker);
  if (a.tier === 1 && b.tier === 1) {
    if (a.pairRank !== b.pairRank) return a.pairRank > b.pairRank ? 1 : -1;
    return a.kicker - b.kicker || 0;
  }
  if (a.tier === 0 && b.tier === 0) return compareKickers(a.kicker, b.kicker);
  return 0;
}

function compareKickers(a: number[], b: number[]): number {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (x !== y) return x > y ? 1 : -1;
  }
  return 0;
}

export function cardLabel(c: Card): string {
  const r =
    c.rank === 14 ? "A" :
    c.rank === 13 ? "K" :
    c.rank === 12 ? "Q" :
    c.rank === 11 ? "J" :
    String(c.rank);
  return `${r}${c.suit}`;
}

export function suitIsRed(s: Suit): boolean {
  return s === "♥" || s === "♦";
}
