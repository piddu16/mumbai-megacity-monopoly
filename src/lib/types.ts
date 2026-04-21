// Mumbai Megacity Monopoly — Type definitions
// All game state types. Reducer consumes and produces GameState.

export type RoleId = "TYCOON" | "JUDGE" | "MINISTER" | "BMC" | "MHADA";

export type ZoneId = "WSN" | "WSM" | "BB" | "SLC" | "LPB" | "SM" | "SMP";

export type TileType =
  | "start"
  | "property"
  | "chance"
  | "community"
  | "tax"
  | "utility"
  | "station"
  | "finish";

export interface TileDef {
  id: number;
  name: string;
  area?: string;
  builder?: string;
  type: TileType;
  zone?: ZoneId;
  price?: number;          // in lakhs (₹1Cr = 100L)
  baseRent?: number;       // in lakhs
  fsi?: number;            // floor-space index (development ceiling)
  taxAmount?: number;      // in lakhs
  premium?: boolean;       // ⭐ premium property (limited FSI, high demand)
  bus?: boolean;           // BEST bus stop
  metro?: boolean;         // Metro station
  station?: boolean;       // Railway station
  coastal?: boolean;       // Coastal road entry point
  redev?: boolean;         // Can be redeveloped
  description?: string;
}

export type DevLevel = 0 | 1 | 2 | 3 | 4 | 5;

export interface PropertyState {
  tileId: number;
  ownerId: string | null;   // player sessionId
  devLevel: DevLevel;
  fsiOverride?: number;     // minister FSI changes, redev +1
  stayUntil?: number;       // roundNumber stay expires
  stayById?: string;        // Judge sessionId
  iodDelayUntil?: number;   // BMC delay expires
  ocWithheld?: boolean;
  isSEZ?: boolean;
  affordableUntil?: number;
  isMhadaFlat?: boolean;
  mhadaLockUntil?: number;  // turn count until can be traded
  reservedUntil?: number;   // MHADA reservation expires
  reservedBy?: string;
  heritage?: boolean;
}

export interface Player {
  id: string;               // sessionId
  name: string;
  number: number;           // 0..5
  role: RoleId;
  money: number;            // in lakhs
  position: number;         // tile id 0..42
  inJail?: boolean;
  jailTurns?: number;
  bankruptTurnsLeft?: number;
  skipNextTurn?: boolean;
  connected: boolean;
  joinedAt: number;
  // Role power tracking
  powerUses: {
    tycoonToppingOutUsed?: boolean;
    judgeReviewUsedThisRound?: boolean;
    judgeStays?: number[];          // tile ids currently stayed
    ministerFsiUsedThisRound?: boolean;
    ministerSezUsed?: boolean;
    ministerImpeachedUntil?: number;
    bmcDemolitionUsed?: boolean;
    mhadaLotteryUsedThisRound?: boolean;
  };
  // Stats
  propertyCount: number;
  standoffsWon: number;
  standoffsLost: number;
  streak: number;           // for Mumbai Ka Raja bonus
  streakBonusUntil?: number;
  // Favor tokens owed
  favorTokensOwed: Record<string, number>; // key: playerId, value: count
}

export interface DiceRoll {
  a: number;
  b: number;
  total: number;
  bonus?: number;
  mode?: TransportMode;
}

export type TransportMode = "walk" | "auto" | "bus" | "metro" | "train" | "coastal";

export type GamePhase =
  | "waiting"       // lobby
  | "turn_start"    // transport choice
  | "rolling"       // mid-animation
  | "landed"        // action phase (buy/rent paid/card drawn)
  | "action"        // developing, trading, using powers
  | "auction"       // live auction
  | "standoff"      // Teen Patti
  | "committee"     // vote
  | "redeveloping"
  | "bankrupt"
  | "ended";

export type WinCondition = "last_standing" | "mumbai_raja" | "fixed_rounds";

export type CardType = "chance" | "community";

export interface CardDef {
  id: string;
  type: CardType;
  title: string;
  description: string;
  effect: string; // serialized effect id
}

// Auction
export interface AuctionState {
  tileId: number;
  minBid: number;           // lakhs
  currentBid: number;
  currentBidderId: string | null;
  biddersIn: string[];      // session ids still in
  endsAt: number;           // timestamp ms
  closed: boolean;
}

// Side deals
export interface SideDealAsset {
  kind: "cash" | "property" | "favor";
  amount?: number;          // lakhs (for cash)
  tileId?: number;          // for property
  count?: number;           // for favor tokens
  note?: string;
}

export interface SideDeal {
  id: string;
  fromId: string;
  toId: string;
  offered: SideDealAsset[];
  requested: SideDealAsset[];
  message?: string;
  status: "proposed" | "accepted" | "rejected" | "expired" | "flagged";
  expiresAtRound: number;
  createdAtTurn: number;
  isPublic: boolean;        // >10Cr auto-public
  flaggedByJudge?: string;
  flagReason?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  at: number;               // timestamp ms
  dmToId?: string;          // private DM; if unset, broadcast
  system?: boolean;         // system announcements
}

// Teen Patti
export type Suit = "♠" | "♥" | "♦" | "♣";
export interface Card {
  rank: number;             // 2..14 (14=Ace)
  suit: Suit;
}
export type HandRank =
  | { tier: 0; name: "High Card"; kicker: number[] }
  | { tier: 1; name: "Pair"; pairRank: number; kicker: number }
  | { tier: 2; name: "Flush"; kicker: number[] }
  | { tier: 3; name: "Sequence"; high: number }
  | { tier: 4; name: "Pure Sequence"; high: number }
  | { tier: 5; name: "Trail"; rank: number };

export interface StandoffState {
  trigger:
    | "stay_appeal"
    | "auction_tie"
    | "trade_impasse"
    | "bankruptcy"
    | "hostile_takeover"
    | "zone_control"
    | "voluntary";
  p1: string;
  p2: string;
  p1Cards: Card[];
  p2Cards: Card[];
  p1Blind: boolean;
  p2Blind: boolean;
  p1Ante: number;
  p2Ante: number;
  pot: number;
  round: number;            // 1..3
  currentActor: string;
  currentBet: number;
  p1In: boolean;
  p2In: boolean;
  reveal: boolean;
  winnerId?: string;
  loserHand?: HandRank;
  winnerHand?: HandRank;
  disputedTileId?: number;
  maxRaise: number;
  log: { at: number; actor: string; action: string }[];
}

// Committee vote
export interface CommitteeVote {
  id: string;
  kind: "develop_approval" | "redevelopment" | "impeach" | "sez";
  tileId?: number;
  proposerId: string;
  targetId?: string;
  votes: Record<string, "yes" | "no" | "abstain">;
  requiredRoles: RoleId[];
  deadlineAtTurn: number;
  resolved: boolean;
  outcome?: "approved" | "rejected";
  payload?: Record<string, unknown>;
}

// Log entry
export interface LogEntry {
  id: string;
  at: number;
  kind: string;
  actorId?: string;
  message: string;
  amount?: number;
}

export interface GameState {
  roomCode: string;
  phase: GamePhase;
  players: Player[];
  current: number;           // index into players
  round: number;
  turnNumber: number;
  properties: Record<number, PropertyState>;
  fsiOverride: Record<ZoneId, number>; // zone-wide FSI adjustments
  coastalRoadOwnerId?: string; // auctioned off
  winCondition: WinCondition;
  maxRounds: number;
  lastDice?: DiceRoll;
  pendingChanceCardId?: string;
  pendingCommunityCardId?: string;
  auction?: AuctionState;
  standoff?: StandoffState;
  committee?: CommitteeVote;
  sideDeals: SideDeal[];
  chat: ChatMessage[];
  log: LogEntry[];
  chanceDeck: string[];
  communityDeck: string[];
  // For drawing + avoiding repetition
  chanceDiscard: string[];
  communityDiscard: string[];
  // Rush hour bookkeeping
  rushHour: boolean;
  // Winner
  winnerId?: string;
  createdAt: number;
  updatedAt: number;
  seq: number;               // monotonic
}

// Actions the reducer handles
export type GameAction =
  | { type: "INIT"; payload: { roomCode: string; players: Player[]; winCondition: WinCondition; maxRounds: number } }
  | { type: "START_GAME" }
  | { type: "CHOOSE_TRANSPORT"; mode: TransportMode }
  | { type: "ROLL_DICE"; values: [number, number] }
  | { type: "BUY_PROPERTY"; tileId: number }
  | { type: "DECLINE_BUY"; tileId: number }
  | { type: "PAY_RENT" }
  | { type: "PAY_TAX" }
  | { type: "DRAW_CARD"; deck: CardType; cardId: string }
  | { type: "RESOLVE_CARD" }
  | { type: "DEVELOP"; tileId: number }
  | { type: "REDEVELOP"; tileId: number }
  | { type: "END_TURN" }
  | { type: "START_AUCTION"; tileId: number; minBid: number }
  | { type: "AUCTION_BID"; playerId: string; amount: number }
  | { type: "AUCTION_PASS"; playerId: string }
  | { type: "AUCTION_CLOSE" }
  | { type: "PROPOSE_SIDE_DEAL"; deal: SideDeal }
  | { type: "ACCEPT_SIDE_DEAL"; dealId: string }
  | { type: "REJECT_SIDE_DEAL"; dealId: string }
  | { type: "FLAG_SIDE_DEAL"; dealId: string; judgeId: string; reason: string }
  | { type: "SEND_CHAT"; message: ChatMessage }
  | { type: "USE_POWER"; power: string; payload?: Record<string, unknown> }
  | { type: "START_STANDOFF"; trigger: StandoffState["trigger"]; p2: string; disputedTileId?: number; pot: number }
  | { type: "STANDOFF_DEAL"; p1Cards: Card[]; p2Cards: Card[] }
  | { type: "STANDOFF_CHOOSE_BLIND"; playerId: string; blind: boolean }
  | { type: "STANDOFF_BET"; playerId: string; action: "call" | "raise" | "fold"; amount?: number }
  | { type: "STANDOFF_REVEAL" }
  | { type: "START_COMMITTEE"; vote: CommitteeVote }
  | { type: "COMMITTEE_VOTE"; voterId: string; vote: "yes" | "no" | "abstain" }
  | { type: "COMMITTEE_RESOLVE" }
  | { type: "LOG"; entry: LogEntry };
