import type {
  GameAction,
  GameState,
  Player,
  PropertyState,
  SideDeal,
  StandoffState,
  TransportMode,
  WinCondition,
  ZoneId,
  DevLevel,
  DiceRoll,
  LogEntry,
  ChatMessage,
  CommitteeVote,
  CardDef,
} from "./types";
import { TILES, TILE_COUNT, getTile, isNorthOfBandra, tilesInZone } from "./tiles";
import { CHANCE_CARDS, COMMUNITY_CARDS, shuffleDeck, getCard } from "./cards";
import {
  CRORE,
  LAKH,
  DEV_LEVELS,
  MUMBAI_RAJA_TARGET,
  PENTHOUSE_BONUS,
  ROLE_INFO,
  RUSH_HOUR_SURCHARGE,
  SALARY_PER_LOOP,
  SIDE_DEAL_LIMITS,
  STARTING_CASH,
  STANDOFF_STAKES,
  TRANSPORT_COSTS,
  TYCOON_DEV_DISCOUNT,
  ZONE_MONOPOLY_MULTIPLIER,
  BANKRUPTCY_TURNS_TO_RECOVER,
  BEST_DEPOT_BONUS,
  COASTAL_ROAD_TOLL,
} from "./constants";
import { compareHands, deal3, newDeck, rankHand, shuffle } from "./teen-patti";

// ═══════════════════════════════════════════════════════════════
// INITIAL STATE
// ═══════════════════════════════════════════════════════════════

export function initialState(opts: {
  roomCode: string;
  players: Player[];
  winCondition: WinCondition;
  maxRounds: number;
}): GameState {
  const properties: Record<number, PropertyState> = {};
  for (const t of TILES) {
    if (t.type === "property" || t.type === "utility" || t.type === "station") {
      properties[t.id] = {
        tileId: t.id,
        ownerId: null,
        devLevel: 0,
      };
    }
  }
  return {
    roomCode: opts.roomCode,
    phase: "turn_start",
    players: opts.players,
    current: 0,
    round: 1,
    turnNumber: 1,
    properties,
    fsiOverride: { WSN: 0, WSM: 0, BB: 0, SLC: 0, LPB: 0, SM: 0, SMP: 0 },
    winCondition: opts.winCondition,
    maxRounds: opts.maxRounds,
    sideDeals: [],
    chat: [],
    log: [
      {
        id: idgen(),
        at: Date.now(),
        kind: "game_start",
        message: `Game begins. Ab khel shuru. ${opts.players.length} players rolling.`,
      },
    ],
    chanceDeck: shuffleDeck(CHANCE_CARDS).map((c) => c.id),
    communityDeck: shuffleDeck(COMMUNITY_CARDS).map((c) => c.id),
    chanceDiscard: [],
    communityDiscard: [],
    rushHour: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    seq: 0,
  };
}

export function makePlayer(
  sessionId: string,
  name: string,
  number: number,
  role: Player["role"],
): Player {
  return {
    id: sessionId,
    name,
    number,
    role,
    money: STARTING_CASH,
    position: 0,
    connected: true,
    joinedAt: Date.now(),
    powerUses: {},
    propertyCount: 0,
    standoffsWon: 0,
    standoffsLost: 0,
    streak: 0,
    favorTokensOwed: {},
  };
}

// ═══════════════════════════════════════════════════════════════
// CORE REDUCER
// ═══════════════════════════════════════════════════════════════

export function reducer(state: GameState, action: GameAction): GameState {
  let s = bump(state);
  switch (action.type) {
    case "INIT":
      return initialState(action.payload);

    case "START_GAME":
      return { ...s, phase: "turn_start", round: 1, turnNumber: 1 };

    case "CHOOSE_TRANSPORT":
      return chooseTransport(s, action.mode);

    case "ROLL_DICE":
      return rollAndMove(s, action.values);

    case "BUY_PROPERTY":
      return buyProperty(s, action.tileId);

    case "DECLINE_BUY":
      return pushLog(s, { kind: "decline", message: `${curName(s)} passed on ${getTile(action.tileId).name}.` });

    case "DEVELOP":
      return develop(s, action.tileId);

    case "REDEVELOP":
      return redevelop(s, action.tileId);

    case "PAY_RENT":
      return applyRent(s);

    case "PAY_TAX":
      return applyTax(s);

    case "DRAW_CARD":
      return drawCard(s, action.deck, action.cardId);

    case "RESOLVE_CARD":
      return { ...s, pendingChanceCardId: undefined, pendingCommunityCardId: undefined };

    case "END_TURN":
      return endTurn(s);

    case "START_AUCTION":
      return {
        ...s,
        phase: "auction",
        auction: {
          tileId: action.tileId,
          minBid: action.minBid,
          currentBid: 0,
          currentBidderId: null,
          biddersIn: eligibleBidders(s).map((p) => p.id),
          endsAt: Date.now() + 30_000,
          closed: false,
        },
      };

    case "AUCTION_BID": {
      if (!s.auction) return s;
      return {
        ...s,
        auction: {
          ...s.auction,
          currentBid: action.amount,
          currentBidderId: action.playerId,
          endsAt: Date.now() + 10_000,
        },
      };
    }
    case "AUCTION_PASS": {
      if (!s.auction) return s;
      return {
        ...s,
        auction: {
          ...s.auction,
          biddersIn: s.auction.biddersIn.filter((id) => id !== action.playerId),
        },
      };
    }
    case "AUCTION_CLOSE":
      return closeAuction(s);

    case "PROPOSE_SIDE_DEAL":
      return proposeSideDeal(s, action.deal);
    case "ACCEPT_SIDE_DEAL":
      return acceptSideDeal(s, action.dealId);
    case "REJECT_SIDE_DEAL":
      return {
        ...s,
        sideDeals: s.sideDeals.map((d) =>
          d.id === action.dealId ? { ...d, status: "rejected" as const } : d,
        ),
      };
    case "FLAG_SIDE_DEAL":
      return {
        ...s,
        sideDeals: s.sideDeals.map((d) =>
          d.id === action.dealId
            ? { ...d, status: "flagged" as const, flaggedByJudge: action.judgeId, flagReason: action.reason }
            : d,
        ),
      };

    case "SEND_CHAT":
      return { ...s, chat: [...s.chat, action.message].slice(-200) };

    case "USE_POWER":
      return applyPower(s, action.power, action.payload ?? {});

    case "START_STANDOFF":
      return startStandoff(s, action.trigger, action.p2, action.disputedTileId, action.pot);

    case "STANDOFF_DEAL":
      if (!s.standoff) return s;
      return {
        ...s,
        standoff: { ...s.standoff, p1Cards: action.p1Cards, p2Cards: action.p2Cards },
      };

    case "STANDOFF_CHOOSE_BLIND":
      if (!s.standoff) return s;
      return {
        ...s,
        standoff: {
          ...s.standoff,
          p1Blind: action.playerId === s.standoff.p1 ? action.blind : s.standoff.p1Blind,
          p2Blind: action.playerId === s.standoff.p2 ? action.blind : s.standoff.p2Blind,
        },
      };

    case "STANDOFF_BET":
      return standoffBet(s, action.playerId, action.action, action.amount ?? 0);

    case "STANDOFF_REVEAL":
      return standoffReveal(s);

    case "START_COMMITTEE":
      return { ...s, phase: "committee", committee: action.vote };

    case "COMMITTEE_VOTE": {
      if (!s.committee) return s;
      return {
        ...s,
        committee: {
          ...s.committee,
          votes: { ...s.committee.votes, [action.voterId]: action.vote },
        },
      };
    }
    case "COMMITTEE_RESOLVE":
      return resolveCommittee(s);

    case "LOG":
      return pushLog(s, action.entry);

    default:
      return s;
  }
}

// ═══════════════════════════════════════════════════════════════
// MOVEMENT & LANDING
// ═══════════════════════════════════════════════════════════════

export function chooseTransport(s: GameState, mode: TransportMode): GameState {
  const p = s.players[s.current];
  const cost = TRANSPORT_COSTS[mode];
  const tile = getTile(p.position);

  // Metro breakdown check happens at dice roll; here just deduct fare + mark mode
  if (cost > p.money) {
    return pushLog(s, { kind: "transport_fail", message: `${p.name} can't afford ${mode}.` });
  }

  let s2 = payPlayer(s, p.id, -cost);
  s2 = pushLog(s2, {
    kind: "transport",
    actorId: p.id,
    message: `${p.name} chose ${transportLabel(mode)}${cost > 0 ? ` (₹${cost / LAKH}L)` : ""}.`,
  });

  // Station-teleport / coastal are handled immediately (no dice)
  if (mode === "train" && tile.station) {
    // Player picks destination — for now just leave in 'rolling' with hint, UI calls ROLL with dest via chance
    // We encode train teleport as: UI must call ROLL_DICE with [0, destTileId] and mode 'train'
    return { ...s2, phase: "rolling", lastDice: { a: 0, b: 0, total: 0, mode: "train" } };
  }
  if (mode === "coastal") {
    const dest = tile.coastal ? (p.position === 26 ? 38 : 26) : null;
    if (dest == null) return s2;
    const stateAtDest = movePlayerTo(s2, p.id, dest);
    // Coastal toll owner
    let s3 = stateAtDest;
    if (s.coastalRoadOwnerId && s.coastalRoadOwnerId !== p.id) {
      s3 = payPlayer(s3, p.id, -COASTAL_ROAD_TOLL);
      s3 = payPlayer(s3, s.coastalRoadOwnerId, COASTAL_ROAD_TOLL);
      s3 = pushLog(s3, {
        kind: "coastal_toll",
        message: `₹50L toll paid to Coastal Road owner.`,
      });
    }
    return resolveLanding(s3);
  }
  if (mode === "metro" && tile.metro) {
    return { ...s2, phase: "rolling", lastDice: { a: 0, b: 0, total: 0, mode: "metro" } };
  }

  return { ...s2, phase: "rolling", lastDice: { a: 0, b: 0, total: 0, mode } };
}

export function rollAndMove(s: GameState, values: [number, number]): GameState {
  const p = s.players[s.current];
  const mode = s.lastDice?.mode ?? "walk";

  // Special modes first
  if (mode === "metro") {
    const [breakdown] = values;
    if (breakdown === 1) {
      const s2 = pushLog(s, {
        kind: "metro_breakdown",
        message: `${p.name}'s Metro broke down. Stay put. Lose next turn.`,
      });
      return markSkipNext({ ...s2, lastDice: { a: values[0], b: values[1], total: values[0] + values[1], mode } });
    }
    // find next metro station forward
    let dest = p.position;
    for (let i = 1; i <= TILE_COUNT; i++) {
      const id = (p.position + i) % TILE_COUNT;
      if (TILES[id].metro) {
        dest = id;
        break;
      }
    }
    const passedStart = dest < p.position;
    let s2 = movePlayerTo(s, p.id, dest);
    if (passedStart) s2 = paySalaryIfLoop(s2, p.id, p.position, dest);
    return resolveLanding({ ...s2, lastDice: { a: values[0], b: values[1], total: values[0] + values[1], mode } });
  }

  if (mode === "train") {
    // For train, values[1] is the destination tile id picked by the UI
    const dest = values[1];
    const passedStart = dest < p.position;
    let s2 = movePlayerTo(s, p.id, dest);
    if (passedStart) s2 = paySalaryIfLoop(s2, p.id, p.position, dest);
    return resolveLanding({ ...s2, lastDice: { a: 0, b: 0, total: 0, mode } });
  }

  // Standard dice
  const total = values[0] + values[1];
  let bonus = 0;
  if (mode === "auto") {
    const doubles = values[0] === values[1];
    if (!doubles && isNorthOfBandra(p.position)) bonus = 1;
  } else if (mode === "bus") {
    bonus = 2;
  }
  const steps = total + bonus;
  const newPos = (p.position + steps) % TILE_COUNT;
  const passedStart = newPos < p.position || steps >= TILE_COUNT;

  let s2 = movePlayerTo(s, p.id, newPos);
  if (passedStart) s2 = paySalaryIfLoop(s2, p.id, p.position, newPos);
  s2 = {
    ...s2,
    lastDice: { a: values[0], b: values[1], total, bonus, mode },
  };
  s2 = pushLog(s2, {
    kind: "roll",
    actorId: p.id,
    message: `${p.name} rolled ${values[0]}+${values[1]}${bonus ? ` +${bonus}` : ""} → ${getTile(newPos).name}.`,
  });
  return resolveLanding(s2);
}

function paySalaryIfLoop(s: GameState, pid: string, from: number, to: number): GameState {
  // If wrapped around through tile 0
  if (to < from) {
    return pushLog(payPlayer(s, pid, SALARY_PER_LOOP), {
      kind: "salary",
      actorId: pid,
      amount: SALARY_PER_LOOP,
      message: `${findPlayer(s, pid)?.name ?? ""} collected ₹2Cr salary.`,
    });
  }
  return s;
}

function movePlayerTo(s: GameState, pid: string, tileId: number): GameState {
  return {
    ...s,
    players: s.players.map((p) => (p.id === pid ? { ...p, position: tileId } : p)),
  };
}

// ═══════════════════════════════════════════════════════════════
// LANDING
// ═══════════════════════════════════════════════════════════════

export function resolveLanding(s: GameState): GameState {
  const p = s.players[s.current];
  const tile = getTile(p.position);
  let s2 = s;

  switch (tile.type) {
    case "property":
    case "utility":
    case "station": {
      const prop = s.properties[tile.id];
      if (!prop) return s2;
      if (prop.ownerId && prop.ownerId !== p.id) {
        const rent = computeRent(s, tile.id);
        if (rent > 0 && !prop.stayUntil) {
          s2 = payPlayer(s2, p.id, -rent);
          s2 = payPlayer(s2, prop.ownerId, rent);
          s2 = pushLog(s2, {
            kind: "rent",
            actorId: p.id,
            amount: rent,
            message: `${p.name} paid ${findPlayer(s2, prop.ownerId)?.name ?? "owner"} rent of ₹${(rent / CRORE).toFixed(1)}Cr at ${tile.name}.`,
          });
        }
      }
      return { ...s2, phase: "landed" };
    }
    case "tax": {
      if (tile.taxAmount) {
        s2 = payPlayer(s2, p.id, -tile.taxAmount);
        s2 = pushLog(s2, {
          kind: "tax",
          actorId: p.id,
          amount: tile.taxAmount,
          message: `${p.name} paid ${tile.name} ₹${(tile.taxAmount / CRORE).toFixed(1)}Cr.`,
        });
      }
      return { ...s2, phase: "landed" };
    }
    case "chance": {
      const [cardId, ...rest] = s.chanceDeck;
      if (!cardId) return { ...s2, phase: "landed" };
      return drawCard({ ...s2, chanceDeck: rest }, "chance", cardId);
    }
    case "community": {
      const [cardId, ...rest] = s.communityDeck;
      if (!cardId) return { ...s2, phase: "landed" };
      return drawCard({ ...s2, communityDeck: rest }, "community", cardId);
    }
    case "finish": {
      s2 = payPlayer(s2, p.id, PENTHOUSE_BONUS);
      s2 = pushLog(s2, {
        kind: "penthouse",
        actorId: p.id,
        amount: PENTHOUSE_BONUS,
        message: `${p.name} reached Cuffe Parade Penthouse! +₹10Cr bonus.`,
      });
      return { ...s2, phase: "landed" };
    }
    case "start":
      return { ...s2, phase: "landed" };
    default:
      return { ...s2, phase: "landed" };
  }
}

// ═══════════════════════════════════════════════════════════════
// RENT CALCULATION
// ═══════════════════════════════════════════════════════════════

export function computeRent(s: GameState, tileId: number): number {
  const tile = getTile(tileId);
  const prop = s.properties[tileId];
  if (!prop || !prop.ownerId) return 0;

  const owner = findPlayer(s, prop.ownerId);
  if (!owner) return 0;

  // Stay order freezes rent
  if (prop.stayUntil && prop.stayUntil > s.round) return 0;
  // IOD delay: no rent while under construction
  if (prop.iodDelayUntil && prop.iodDelayUntil > s.round) return 0;
  // Heritage → doubled base rent, capped at Apartment rent multiplier
  const heritage = prop.heritage ?? false;

  if (tile.type === "utility") {
    const ownedUtil = countOwnedUtils(s, owner.id);
    return (s.lastDice?.total ?? 7) * (ownedUtil === 2 ? 10 * LAKH : 4 * LAKH);
  }
  if (tile.type === "station" || tile.id === 10) {
    // Station rent based on stations owned (capped at 4), BEST Depot separate
    if (tile.id === 10) {
      return (s.lastDice?.total ?? 7) * 10 * LAKH;
    }
    const stationsOwned = countOwnedStations(s, owner.id);
    return (tile.baseRent ?? 100 * LAKH) * stationsOwned;
  }
  if (tile.type !== "property") return 0;

  const base = tile.baseRent ?? 0;
  let level = prop.devLevel;
  let mult = DEV_LEVELS[level].rentMultiplier;
  if (heritage && level >= 2) mult = DEV_LEVELS[2].rentMultiplier * 2;

  let rent = base * mult;

  // OC withheld
  if (prop.ocWithheld && level >= 3) rent = base * 1;

  // Zone monopoly
  if (tile.zone && ownsWholeZone(s, owner.id, tile.zone)) {
    rent *= ZONE_MONOPOLY_MULTIPLIER;
  }
  // Affordable housing mandate
  if (prop.affordableUntil && prop.affordableUntil > s.round) {
    rent *= 0.7;
  }
  // SEZ boost
  if (prop.isSEZ) rent *= 1.5;

  return Math.round(rent);
}

export function ownsWholeZone(s: GameState, pid: string, zone: ZoneId): boolean {
  const zoneTiles = tilesInZone(zone);
  return zoneTiles.every((t) => s.properties[t.id]?.ownerId === pid);
}

function countOwnedUtils(s: GameState, pid: string): number {
  return [10, 27].filter((id) => s.properties[id]?.ownerId === pid).length;
}

function countOwnedStations(s: GameState, pid: string): number {
  return [0, 18, 33, 40].filter((id) => s.properties[id]?.ownerId === pid).length;
}

// ═══════════════════════════════════════════════════════════════
// BUY / DEVELOP / REDEVELOP
// ═══════════════════════════════════════════════════════════════

export function buyProperty(s: GameState, tileId: number): GameState {
  const tile = getTile(tileId);
  const p = s.players[s.current];
  const prop = s.properties[tileId];
  if (!prop || prop.ownerId || !tile.price) return s;
  if (p.money < tile.price) return s;

  // Role restrictions
  const role = ROLE_INFO[p.role];
  if (role.cannotOwnPremium && tile.premium) return s;
  if (role.maxProperties && p.propertyCount >= role.maxProperties) return s;

  const s1 = payPlayer(s, p.id, -tile.price);
  const s2 = {
    ...s1,
    properties: { ...s1.properties, [tileId]: { ...prop, ownerId: p.id } },
    players: s1.players.map((pl) =>
      pl.id === p.id ? { ...pl, propertyCount: pl.propertyCount + 1 } : pl,
    ),
  };
  return pushLog(s2, {
    kind: "buy",
    actorId: p.id,
    amount: tile.price,
    message: `${p.name} bought ${tile.name} for ₹${(tile.price / CRORE).toFixed(1)}Cr.`,
  });
}

export function develop(s: GameState, tileId: number): GameState {
  const tile = getTile(tileId);
  const p = s.players[s.current];
  const prop = s.properties[tileId];
  if (!prop || prop.ownerId !== p.id || !tile.price) return s;
  if (prop.stayUntil && prop.stayUntil > s.round) return s;

  const nextLevel = (prop.devLevel + 1) as DevLevel;
  if (nextLevel > 5) return s;
  const lvl = DEV_LEVELS[nextLevel];

  // FSI ceiling
  const effectiveFsi = (tile.fsi ?? 1) + (prop.fsiOverride ?? 0) + (tile.zone ? s.fsiOverride[tile.zone] : 0);
  if (effectiveFsi < lvl.minFsi) return s;

  let cost = tile.price * lvl.costMultiplier;
  // Tycoon discount
  if (p.role === "TYCOON") cost *= 1 - TYCOON_DEV_DISCOUNT;
  if (p.role === "TYCOON" && tile.zone) {
    const zoneOwned = tilesInZone(tile.zone).filter((t) => s.properties[t.id]?.ownerId === p.id).length;
    if (zoneOwned >= 3) cost *= 0.8;
  }
  cost = Math.round(cost);

  if (p.money < cost) return s;

  // BMC approval required at level 3+ → trigger committee (unless skipped)
  // For simplicity in Phase 1, auto-approve but log the requirement
  // In Phase 3, this creates a CommitteeVote
  const s1 = payPlayer(s, p.id, -cost);
  const s2 = {
    ...s1,
    properties: { ...s1.properties, [tileId]: { ...prop, devLevel: nextLevel } },
  };
  return pushLog(s2, {
    kind: "develop",
    actorId: p.id,
    amount: cost,
    message: `${p.name} developed ${tile.name} to ${lvl.emoji} ${lvl.name} (₹${(cost / CRORE).toFixed(1)}Cr).`,
  });
}

export function redevelop(s: GameState, tileId: number): GameState {
  const tile = getTile(tileId);
  const p = s.players[s.current];
  const prop = s.properties[tileId];
  if (!prop || prop.ownerId !== p.id || !tile.price || !tile.redev) return s;
  if (prop.devLevel < 2) return s;

  const compensation = Math.round(tile.price * 0.3);
  const s1 = payPlayer(s, p.id, compensation);
  // MHADA cut
  const mhada = s.players.find((pl) => pl.role === "MHADA");
  let s2 = s1;
  if (mhada) s2 = payPlayer(s2, mhada.id, 20 * LAKH);

  const s3 = {
    ...s2,
    properties: {
      ...s2.properties,
      [tileId]: {
        ...prop,
        devLevel: 0 as DevLevel,
        fsiOverride: (prop.fsiOverride ?? 0) + 1.0,
      },
    },
  };
  return pushLog(s3, {
    kind: "redevelop",
    actorId: p.id,
    amount: compensation,
    message: `${p.name} redeveloped ${tile.name}. Reset to Empty Plot, FSI +1.0, compensation ₹${(compensation / CRORE).toFixed(1)}Cr.`,
  });
}

// ═══════════════════════════════════════════════════════════════
// CARDS
// ═══════════════════════════════════════════════════════════════

export function drawCard(s: GameState, deck: "chance" | "community", cardId: string): GameState {
  const card = getCard(cardId);
  const p = s.players[s.current];
  let s1 = pushLog(s, {
    kind: "card",
    actorId: p.id,
    message: `${p.name} drew "${card.title}": ${card.description}`,
  });
  s1 = {
    ...s1,
    [deck === "chance" ? "chanceDiscard" : "communityDiscard"]: [
      ...(deck === "chance" ? s.chanceDiscard : s.communityDiscard),
      cardId,
    ],
    [deck === "chance" ? "pendingChanceCardId" : "pendingCommunityCardId"]: cardId,
  } as GameState;
  // Refill deck if empty
  const deckKey = deck === "chance" ? "chanceDeck" : "communityDeck";
  if ((s1 as unknown as Record<string, string[]>)[deckKey].length === 0) {
    s1 = {
      ...s1,
      [deckKey]: shuffleDeck(
        deck === "chance" ? s1.chanceDiscard : s1.communityDiscard,
      ),
      [deck === "chance" ? "chanceDiscard" : "communityDiscard"]: [],
    } as GameState;
  }
  return applyCardEffect(s1, card);
}

function applyCardEffect(s: GameState, card: CardDef): GameState {
  const p = s.players[s.current];
  switch (card.effect) {
    case "BANK_LOAN":
      return payPlayer(s, p.id, 4 * CRORE);
    case "GST":
      return payPlayer(s, p.id, 1.5 * CRORE);
    case "CORPUS":
      return payPlayer(s, p.id, 5 * CRORE);
    case "FESTIVAL":
      return payPlayer(s, p.id, 20 * LAKH * p.propertyCount);
    case "PMC":
      return payPlayer(s, p.id, -2 * CRORE);
    case "FIRE_NOC": {
      const devCount = Object.values(s.properties).filter(
        (pr) => pr.ownerId === p.id && pr.devLevel > 0,
      ).length;
      return payPlayer(s, p.id, -1 * CRORE * devCount);
    }
    case "WATER_CUT":
      // flag: next rent collection halved — we encode as affordable mandate on all their props for 1 round
      return s;
    case "TAX_RAID": {
      const total = Object.values(s.properties)
        .filter((pr) => pr.ownerId === p.id)
        .reduce((sum, pr) => sum + (getTile(pr.tileId).price ?? 0), 0);
      return payPlayer(s, p.id, -Math.round(total * 0.15));
    }
    case "SECRETARY": {
      let s1 = s;
      for (const other of s.players) {
        if (other.id === p.id) continue;
        s1 = payPlayer(s1, other.id, -50 * LAKH);
        s1 = payPlayer(s1, p.id, 50 * LAKH);
      }
      return s1;
    }
    case "NRI_BOOM":
    case "SEA_LEVEL":
    case "MONSOON":
    case "BOLLYWOOD":
    case "RERA_FAST":
    case "DCPR":
    case "METRO_EXT":
    case "HERITAGE":
    case "ABSCONDED":
    case "SRA_SCAM":
    case "SLUM":
    case "SOCIETY_REDEV":
    case "PARKING":
      // complex side-effects handled via log + pending flags
      return s;
    default:
      return s;
  }
}

// ═══════════════════════════════════════════════════════════════
// TAX
// ═══════════════════════════════════════════════════════════════

export function applyTax(s: GameState): GameState {
  const p = s.players[s.current];
  const tile = getTile(p.position);
  if (tile.type !== "tax" || !tile.taxAmount) return s;
  return payPlayer(s, p.id, -tile.taxAmount);
}

export function applyRent(s: GameState): GameState {
  // handled in resolveLanding already
  return s;
}

// ═══════════════════════════════════════════════════════════════
// AUCTION
// ═══════════════════════════════════════════════════════════════

function eligibleBidders(s: GameState): Player[] {
  return s.players.filter((p) => {
    const role = ROLE_INFO[p.role];
    return !role.cannotAuction;
  });
}

function closeAuction(s: GameState): GameState {
  if (!s.auction) return s;
  const { tileId, currentBid, currentBidderId } = s.auction;
  if (!currentBidderId || currentBid === 0) {
    return { ...s, auction: undefined, phase: "action" };
  }
  let s1 = payPlayer(s, currentBidderId, -currentBid);
  s1 = {
    ...s1,
    properties: {
      ...s1.properties,
      [tileId]: { ...s1.properties[tileId], ownerId: currentBidderId },
    },
    players: s1.players.map((pl) =>
      pl.id === currentBidderId ? { ...pl, propertyCount: pl.propertyCount + 1 } : pl,
    ),
  };
  const winner = findPlayer(s1, currentBidderId);
  s1 = pushLog(s1, {
    kind: "auction",
    actorId: currentBidderId,
    amount: currentBid,
    message: `${winner?.name ?? "Winner"} won ${getTile(tileId).name} at auction for ₹${(currentBid / CRORE).toFixed(1)}Cr.`,
  });
  return { ...s1, auction: undefined, phase: "action" };
}

// ═══════════════════════════════════════════════════════════════
// SIDE DEALS
// ═══════════════════════════════════════════════════════════════

function proposeSideDeal(s: GameState, deal: SideDeal): GameState {
  // Validate
  const totalCashOffered = deal.offered.reduce((sum, a) => sum + (a.kind === "cash" ? a.amount ?? 0 : 0), 0);
  const totalCashRequested = deal.requested.reduce(
    (sum, a) => sum + (a.kind === "cash" ? a.amount ?? 0 : 0),
    0,
  );
  const cashOk = totalCashOffered <= SIDE_DEAL_LIMITS.MAX_CASH_PER_DEAL
    && totalCashRequested <= SIDE_DEAL_LIMITS.MAX_CASH_PER_DEAL;
  const propsOffered = deal.offered.filter((a) => a.kind === "property").length;
  const propsRequested = deal.requested.filter((a) => a.kind === "property").length;
  const propsOk = propsOffered <= SIDE_DEAL_LIMITS.MAX_PROPERTIES_PER_SIDE
    && propsRequested <= SIDE_DEAL_LIMITS.MAX_PROPERTIES_PER_SIDE;
  if (!cashOk || !propsOk) return s;

  const active = s.sideDeals.filter((d) => d.status === "proposed" && (d.fromId === deal.fromId || d.toId === deal.fromId));
  if (active.length >= SIDE_DEAL_LIMITS.MAX_ACTIVE_PER_PLAYER) return s;

  const value = totalCashOffered + totalCashRequested;
  const isPublic = value >= SIDE_DEAL_LIMITS.PUBLIC_THRESHOLD;
  const full: SideDeal = {
    ...deal,
    isPublic,
    expiresAtRound: s.round + SIDE_DEAL_LIMITS.DURATION_ROUNDS,
    status: "proposed",
  };
  return pushLog(
    { ...s, sideDeals: [...s.sideDeals, full] },
    {
      kind: "side_deal_proposed",
      actorId: deal.fromId,
      message: isPublic
        ? `📜 Public deal proposed: ${findPlayer(s, deal.fromId)?.name} ⇄ ${findPlayer(s, deal.toId)?.name}`
        : `🤝 Side deal proposed privately.`,
    },
  );
}

function acceptSideDeal(s: GameState, dealId: string): GameState {
  const deal = s.sideDeals.find((d) => d.id === dealId);
  if (!deal || deal.status !== "proposed") return s;

  let s1 = s;
  // Transfer each asset
  for (const a of deal.offered) {
    s1 = transferAsset(s1, deal.fromId, deal.toId, a);
  }
  for (const a of deal.requested) {
    s1 = transferAsset(s1, deal.toId, deal.fromId, a);
  }
  s1 = {
    ...s1,
    sideDeals: s1.sideDeals.map((d) => (d.id === dealId ? { ...d, status: "accepted" as const } : d)),
  };
  return pushLog(s1, {
    kind: "side_deal_accepted",
    message: `Deal accepted.`,
  });
}

function transferAsset(s: GameState, fromId: string, toId: string, a: { kind: "cash" | "property" | "favor"; amount?: number; tileId?: number; count?: number }): GameState {
  if (a.kind === "cash" && a.amount) {
    let s1 = payPlayer(s, fromId, -a.amount);
    s1 = payPlayer(s1, toId, a.amount);
    return s1;
  }
  if (a.kind === "property" && a.tileId != null) {
    const prop = s.properties[a.tileId];
    if (!prop || prop.ownerId !== fromId) return s;
    return {
      ...s,
      properties: { ...s.properties, [a.tileId]: { ...prop, ownerId: toId } },
      players: s.players.map((p) => {
        if (p.id === fromId) return { ...p, propertyCount: Math.max(0, p.propertyCount - 1) };
        if (p.id === toId) return { ...p, propertyCount: p.propertyCount + 1 };
        return p;
      }),
    };
  }
  if (a.kind === "favor" && a.count) {
    return {
      ...s,
      players: s.players.map((p) => {
        if (p.id !== toId) return p;
        return {
          ...p,
          favorTokensOwed: {
            ...p.favorTokensOwed,
            [fromId]: (p.favorTokensOwed[fromId] ?? 0) + (a.count ?? 0),
          },
        };
      }),
    };
  }
  return s;
}

// ═══════════════════════════════════════════════════════════════
// ROLE POWERS
// ═══════════════════════════════════════════════════════════════

function applyPower(s: GameState, power: string, payload: Record<string, unknown>): GameState {
  const p = s.players[s.current];
  switch (power) {
    case "stay_order": {
      if (p.role !== "JUDGE") return s;
      const tileId = payload.tileId as number;
      const prop = s.properties[tileId];
      if (!prop) return s;
      const current = p.powerUses.judgeStays ?? [];
      if (current.length >= 2) return s;
      return {
        ...s,
        properties: {
          ...s.properties,
          [tileId]: { ...prop, stayUntil: s.round + 3, stayById: p.id },
        },
        players: s.players.map((pl) =>
          pl.id === p.id
            ? { ...pl, powerUses: { ...pl.powerUses, judgeStays: [...current, tileId] } }
            : pl,
        ),
      };
    }
    case "fsi_change": {
      if (p.role !== "MINISTER") return s;
      if (p.powerUses.ministerFsiUsedThisRound) return s;
      const zone = payload.zone as ZoneId;
      const delta = payload.delta as number;
      return {
        ...s,
        fsiOverride: { ...s.fsiOverride, [zone]: s.fsiOverride[zone] + delta },
        players: s.players.map((pl) =>
          pl.id === p.id
            ? { ...pl, powerUses: { ...pl.powerUses, ministerFsiUsedThisRound: true } }
            : pl,
        ),
      };
    }
    case "topping_out": {
      if (p.role !== "TYCOON") return s;
      if (p.powerUses.tycoonToppingOutUsed) return s;
      const tileId = payload.tileId as number;
      const prop = s.properties[tileId];
      if (!prop || prop.ownerId !== p.id) return s;
      const newLevel = Math.min(5, prop.devLevel + 2) as DevLevel;
      return {
        ...s,
        properties: { ...s.properties, [tileId]: { ...prop, devLevel: newLevel } },
        players: s.players.map((pl) =>
          pl.id === p.id
            ? { ...pl, powerUses: { ...pl.powerUses, tycoonToppingOutUsed: true } }
            : pl,
        ),
      };
    }
    case "sez": {
      if (p.role !== "MINISTER") return s;
      if (p.powerUses.ministerSezUsed) return s;
      const tileId = payload.tileId as number;
      const prop = s.properties[tileId];
      if (!prop) return s;
      return {
        ...s,
        properties: { ...s.properties, [tileId]: { ...prop, isSEZ: true } },
        players: s.players.map((pl) =>
          pl.id === p.id
            ? { ...pl, powerUses: { ...pl.powerUses, ministerSezUsed: true } }
            : pl,
        ),
      };
    }
    case "demolition": {
      if (p.role !== "BMC") return s;
      if (p.powerUses.bmcDemolitionUsed) return s;
      const tileId = payload.tileId as number;
      const prop = s.properties[tileId];
      if (!prop) return s;
      const owner = prop.ownerId ? findPlayer(s, prop.ownerId) : null;
      let s1 = {
        ...s,
        properties: {
          ...s.properties,
          [tileId]: { ...prop, devLevel: Math.max(0, prop.devLevel - 1) as DevLevel },
        },
      };
      if (owner) s1 = payPlayer(s1, owner.id, -1 * CRORE);
      return {
        ...s1,
        players: s1.players.map((pl) =>
          pl.id === p.id
            ? { ...pl, powerUses: { ...pl.powerUses, bmcDemolitionUsed: true } }
            : pl,
        ),
      };
    }
    case "affordable_housing": {
      if (p.role !== "MINISTER") return s;
      const zone = payload.zone as ZoneId;
      const affectedTiles = tilesInZone(zone).map((t) => t.id);
      const updated = { ...s.properties };
      for (const id of affectedTiles) {
        if (updated[id]) {
          updated[id] = { ...updated[id], affordableUntil: s.round + 3 };
        }
      }
      const s1 = payPlayer({ ...s, properties: updated }, p.id, 50 * LAKH);
      return s1;
    }
    case "sra_scheme": {
      if (p.role !== "MHADA") return s;
      const tileId = payload.tileId as number;
      const prop = s.properties[tileId];
      if (!prop || prop.devLevel > 1) return s;
      return {
        ...s,
        properties: {
          ...s.properties,
          [tileId]: { ...prop, fsiOverride: (prop.fsiOverride ?? 0) + ((getTile(tileId).fsi ?? 2) * 1) },
        },
      };
    }
    default:
      return s;
  }
}

// ═══════════════════════════════════════════════════════════════
// STANDOFF (Teen Patti)
// ═══════════════════════════════════════════════════════════════

function startStandoff(
  s: GameState,
  trigger: StandoffState["trigger"],
  p2: string,
  disputedTileId: number | undefined,
  pot: number,
): GameState {
  const p1 = s.players[s.current].id;
  const deck = shuffle(newDeck());
  const { cards: p1Cards, rest: rest1 } = deal3(deck);
  const { cards: p2Cards } = deal3(rest1);
  const stakes = STANDOFF_STAKES[trigger];
  const ante = Math.round(pot / 2);
  let s1 = payPlayer(s, p1, -ante);
  s1 = payPlayer(s1, p2, -ante);
  return {
    ...s1,
    phase: "standoff",
    standoff: {
      trigger,
      p1,
      p2,
      p1Cards,
      p2Cards,
      p1Blind: false,
      p2Blind: false,
      p1Ante: ante,
      p2Ante: ante,
      pot,
      round: 1,
      currentActor: p1,
      currentBet: 0,
      p1In: true,
      p2In: true,
      reveal: false,
      disputedTileId,
      maxRaise: stakes.maxRaise,
      log: [{ at: Date.now(), actor: "dealer", action: "Cards dealt. Ante up." }],
    },
  };
}

function standoffBet(s: GameState, playerId: string, action: "call" | "raise" | "fold", amount: number): GameState {
  if (!s.standoff) return s;
  const st = s.standoff;
  if (st.currentActor !== playerId) return s;

  let newSt: StandoffState = { ...st, log: [...st.log, { at: Date.now(), actor: playerId, action: `${action} ${amount || ""}` }] };

  if (action === "fold") {
    const winner = playerId === st.p1 ? st.p2 : st.p1;
    return resolveStandoffWinner({ ...s, standoff: { ...newSt, reveal: true, winnerId: winner } }, winner);
  }
  if (action === "call") {
    // Both called → next round or showdown
    newSt = { ...newSt, currentBet: 0, currentActor: playerId === st.p1 ? st.p2 : st.p1 };
    if (newSt.round >= 3) {
      return standoffReveal({ ...s, standoff: newSt });
    }
    newSt.round += 1;
  }
  if (action === "raise") {
    const pot = newSt.pot + amount;
    let s1 = payPlayer(s, playerId, -amount);
    newSt = { ...newSt, pot, currentBet: amount, currentActor: playerId === st.p1 ? st.p2 : st.p1 };
    return { ...s1, standoff: newSt };
  }
  return { ...s, standoff: newSt };
}

function standoffReveal(s: GameState): GameState {
  if (!s.standoff) return s;
  const p1Rank = rankHand(s.standoff.p1Cards);
  const p2Rank = rankHand(s.standoff.p2Cards);
  const cmp = compareHands(p1Rank, p2Rank);
  const winner = cmp > 0 ? s.standoff.p1 : s.standoff.p2;
  return resolveStandoffWinner(
    {
      ...s,
      standoff: {
        ...s.standoff,
        reveal: true,
        winnerId: winner,
        winnerHand: cmp > 0 ? p1Rank : p2Rank,
        loserHand: cmp > 0 ? p2Rank : p1Rank,
      },
    },
    winner,
  );
}

function resolveStandoffWinner(s: GameState, winnerId: string): GameState {
  if (!s.standoff) return s;
  const pot = s.standoff.pot;
  let s1 = payPlayer(s, winnerId, pot);
  // Stats
  s1 = {
    ...s1,
    players: s1.players.map((p) => {
      if (p.id === winnerId) return { ...p, standoffsWon: p.standoffsWon + 1, streak: p.streak + 1 };
      if (p.id === (s.standoff!.p1 === winnerId ? s.standoff!.p2 : s.standoff!.p1))
        return { ...p, standoffsLost: p.standoffsLost + 1, streak: 0 };
      return p;
    }),
  };
  // Disputed asset transfer
  if (s.standoff.disputedTileId != null) {
    const prop = s1.properties[s.standoff.disputedTileId];
    if (prop) {
      s1 = {
        ...s1,
        properties: { ...s1.properties, [s.standoff.disputedTileId]: { ...prop, ownerId: winnerId } },
      };
    }
  }
  // Judge passive legal fee
  const judge = s.players.find((p) => p.role === "JUDGE");
  if (judge && judge.id !== winnerId) s1 = payPlayer(s1, judge.id, 30 * LAKH);
  s1 = pushLog(s1, {
    kind: "standoff_end",
    message: `${findPlayer(s1, winnerId)?.name} won the standoff. Pot ₹${(pot / CRORE).toFixed(1)}Cr.`,
  });
  return { ...s1, phase: "action" };
}

// ═══════════════════════════════════════════════════════════════
// COMMITTEE
// ═══════════════════════════════════════════════════════════════

function resolveCommittee(s: GameState): GameState {
  if (!s.committee) return s;
  const v = s.committee;
  const yes = Object.values(v.votes).filter((x) => x === "yes").length;
  const no = Object.values(v.votes).filter((x) => x === "no").length;
  const outcome = yes > no ? "approved" : "rejected";
  let s1 = pushLog(s, {
    kind: "committee",
    message: `Committee ${outcome}: ${v.kind} (${yes}-${no}).`,
  });
  // Apply outcome
  if (outcome === "approved") {
    if (v.kind === "develop_approval" && v.tileId != null) {
      const prop = s1.properties[v.tileId];
      if (prop) s1 = {
        ...s1,
        properties: { ...s1.properties, [v.tileId]: { ...prop, iodDelayUntil: undefined } },
      };
    }
    if (v.kind === "impeach" && v.targetId) {
      s1 = {
        ...s1,
        players: s1.players.map((p) =>
          p.id === v.targetId
            ? { ...p, powerUses: { ...p.powerUses, ministerImpeachedUntil: s1.round + 2 } }
            : p,
        ),
      };
      s1 = payPlayer(s1, v.targetId, -2 * CRORE);
    }
  }
  return { ...s1, committee: undefined, phase: "action" };
}

// ═══════════════════════════════════════════════════════════════
// TURN MANAGEMENT
// ═══════════════════════════════════════════════════════════════

export function endTurn(s: GameState): GameState {
  const p = s.players[s.current];

  // Check Mumbai Raja win condition
  const netWorth = computeNetWorth(s, p.id);
  if (s.winCondition === "mumbai_raja" && netWorth >= MUMBAI_RAJA_TARGET) {
    return { ...s, phase: "ended", winnerId: p.id };
  }

  // Check last standing
  const solvent = s.players.filter((pl) => pl.money >= 0 && (!pl.bankruptTurnsLeft || pl.bankruptTurnsLeft > 0));
  if (s.winCondition === "last_standing" && solvent.length === 1) {
    return { ...s, phase: "ended", winnerId: solvent[0].id };
  }

  let nextIdx = (s.current + 1) % s.players.length;
  let nextRound = s.round;
  let nextTurn = s.turnNumber + 1;

  // Skip bankrupt or skipping players
  let attempts = 0;
  while (attempts < s.players.length) {
    const np = s.players[nextIdx];
    if (np.skipNextTurn) {
      // consume skip
      s = {
        ...s,
        players: s.players.map((x) => (x.id === np.id ? { ...x, skipNextTurn: false } : x)),
      };
      nextIdx = (nextIdx + 1) % s.players.length;
      attempts++;
      continue;
    }
    break;
  }

  if (nextIdx <= s.current) nextRound++;

  // Fixed rounds win check
  if (s.winCondition === "fixed_rounds" && nextRound > s.maxRounds) {
    const ranked = [...s.players].sort((a, b) => computeNetWorth(s, b.id) - computeNetWorth(s, a.id));
    return { ...s, phase: "ended", winnerId: ranked[0].id };
  }

  // Reset per-round power uses
  const resetPlayers = s.players.map((pl) =>
    nextIdx <= s.current
      ? {
          ...pl,
          powerUses: {
            ...pl.powerUses,
            judgeReviewUsedThisRound: false,
            ministerFsiUsedThisRound: false,
            mhadaLotteryUsedThisRound: false,
          },
        }
      : pl,
  );

  // Start-of-round passives
  let s2: GameState = {
    ...s,
    players: resetPlayers,
    current: nextIdx,
    round: nextRound,
    turnNumber: nextTurn,
    phase: "turn_start",
  };

  if (nextIdx <= s.current) {
    // New round — apply passives
    s2 = applyRoundStartPassives(s2);
  }

  return s2;
}

function applyRoundStartPassives(s: GameState): GameState {
  let s1 = s;
  for (const p of s.players) {
    if (p.role === "MINISTER") s1 = payPlayer(s1, p.id, 50 * LAKH);
    if (p.role === "BMC") {
      const devCount = Object.values(s.properties).filter((pr) => pr.devLevel > 0).length;
      s1 = payPlayer(s1, p.id, 10 * LAKH * devCount);
    }
    if (p.role === "TYCOON") {
      const undeveloped = Object.values(s.properties).filter(
        (pr) => pr.ownerId === p.id && pr.devLevel === 0,
      ).length;
      s1 = payPlayer(s1, p.id, 10 * LAKH * undeveloped);
    }
  }
  return s1;
}

function markSkipNext(s: GameState): GameState {
  const p = s.players[s.current];
  return {
    ...s,
    players: s.players.map((pl) => (pl.id === p.id ? { ...pl, skipNextTurn: true } : pl)),
  };
}

// ═══════════════════════════════════════════════════════════════
// NET WORTH
// ═══════════════════════════════════════════════════════════════

export function computeNetWorth(s: GameState, pid: string): number {
  const p = findPlayer(s, pid);
  if (!p) return 0;
  let worth = p.money;
  for (const prop of Object.values(s.properties)) {
    if (prop.ownerId !== pid) continue;
    const tile = getTile(prop.tileId);
    worth += tile.price ?? 0;
    // dev investment
    for (let lvl = 1; lvl <= prop.devLevel; lvl++) {
      worth += Math.round((tile.price ?? 0) * DEV_LEVELS[lvl].costMultiplier);
    }
  }
  return worth;
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function payPlayer(s: GameState, pid: string, delta: number): GameState {
  return {
    ...s,
    players: s.players.map((p) => (p.id === pid ? { ...p, money: p.money + delta } : p)),
  };
}

export function findPlayer(s: GameState, pid: string): Player | undefined {
  return s.players.find((p) => p.id === pid);
}

function curName(s: GameState): string {
  return s.players[s.current]?.name ?? "?";
}

function pushLog(s: GameState, partial: Partial<LogEntry> & { message: string; kind: string }): GameState {
  const entry: LogEntry = {
    id: idgen(),
    at: Date.now(),
    actorId: partial.actorId,
    message: partial.message,
    kind: partial.kind,
    amount: partial.amount,
  };
  return { ...s, log: [...s.log, entry].slice(-300) };
}

function bump(s: GameState): GameState {
  return { ...s, updatedAt: Date.now(), seq: s.seq + 1 };
}

export function idgen(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function transportLabel(mode: TransportMode): string {
  return {
    walk: "Walk",
    auto: "Auto Rickshaw",
    bus: "BEST Bus",
    metro: "Metro",
    train: "Local Train",
    coastal: "Coastal Road",
  }[mode];
}

// ═══════════════════════════════════════════════════════════════
// QUERIES (used by UI)
// ═══════════════════════════════════════════════════════════════

export function canBuy(s: GameState, tileId: number, playerId: string): boolean {
  const tile = getTile(tileId);
  const prop = s.properties[tileId];
  const p = findPlayer(s, playerId);
  if (!p || !prop || prop.ownerId || !tile.price) return false;
  if (p.money < tile.price) return false;
  const role = ROLE_INFO[p.role];
  if (role.cannotOwnPremium && tile.premium) return false;
  if (role.maxProperties && p.propertyCount >= role.maxProperties) return false;
  return true;
}

export function canDevelop(s: GameState, tileId: number, playerId: string): { ok: boolean; reason?: string; cost?: number; nextLevel?: DevLevel } {
  const tile = getTile(tileId);
  const prop = s.properties[tileId];
  const p = findPlayer(s, playerId);
  if (!p || !prop || prop.ownerId !== playerId || !tile.price) return { ok: false, reason: "Not your property" };
  if (prop.stayUntil && prop.stayUntil > s.round) return { ok: false, reason: "Stayed by Judge" };
  const next = (prop.devLevel + 1) as DevLevel;
  if (next > 5) return { ok: false, reason: "Already max level" };
  const lvl = DEV_LEVELS[next];
  const fsi = (tile.fsi ?? 1) + (prop.fsiOverride ?? 0) + (tile.zone ? s.fsiOverride[tile.zone] : 0);
  if (fsi < lvl.minFsi) return { ok: false, reason: `FSI ${fsi.toFixed(1)} insufficient (need ${lvl.minFsi})` };
  let cost = tile.price * lvl.costMultiplier;
  if (p.role === "TYCOON") cost *= 1 - TYCOON_DEV_DISCOUNT;
  cost = Math.round(cost);
  if (p.money < cost) return { ok: false, reason: "Insufficient funds", cost, nextLevel: next };
  return { ok: true, cost, nextLevel: next };
}
