import { TRANSPORT_COSTS } from "./constants";
import { TILES, TILE_COUNT, isNorthOfBandra, stationTiles } from "./tiles";
import type { GameState, Player, TransportMode } from "./types";
import { ROLE_INFO } from "./constants";

export interface TransportOption {
  mode: TransportMode;
  available: boolean;
  cost: number;
  reason?: string;
}

/** What transport modes are valid from the player's current tile. */
export function availableTransport(player: Player): TransportOption[] {
  const pos = player.position;
  const tile = TILES[pos];
  const role = ROLE_INFO[player.role];

  const out: TransportOption[] = [];

  out.push({ mode: "walk", available: true, cost: 0 });

  out.push({
    mode: "auto",
    available: isNorthOfBandra(pos),
    cost: TRANSPORT_COSTS.auto,
    reason: !isNorthOfBandra(pos) ? "Ricks don't go south of Bandra, sahab" : undefined,
  });

  out.push({
    mode: "bus",
    available: !!tile.bus,
    cost: TRANSPORT_COSTS.bus,
    reason: !tile.bus ? "No BEST bus stop at this tile" : undefined,
  });

  out.push({
    mode: "metro",
    available: !!tile.metro,
    cost: TRANSPORT_COSTS.metro,
    reason: !tile.metro ? "No Metro station here" : undefined,
  });

  out.push({
    mode: "train",
    available: !!tile.station,
    cost: TRANSPORT_COSTS.train,
    reason: !tile.station ? "No railway station here" : undefined,
  });

  const coastalOk = !!tile.coastal && !role.cannotCoastal;
  out.push({
    mode: "coastal",
    available: coastalOk,
    cost: TRANSPORT_COSTS.coastal,
    reason: !tile.coastal
      ? "Coastal Road only from Worli or Marine Drive"
      : role.cannotCoastal
      ? `${role.name} cannot use Coastal Road`
      : undefined,
  });

  return out;
}

/** For metro: find the next metro station at or after current position (going forward). */
export function nextMetroStation(fromTile: number): number {
  for (let i = 1; i <= TILE_COUNT; i++) {
    const id = (fromTile + i) % TILE_COUNT;
    if (TILES[id].metro) return id;
  }
  return fromTile;
}

/** Get all station tiles for the train teleport picker. */
export function trainStations(): number[] {
  return stationTiles();
}

/** Coastal road mapping — from tile 26, jump to 38; from 38, jump to 26. */
export function coastalDestination(fromTile: number): number | null {
  if (fromTile === 26) return 38;
  if (fromTile === 38) return 26;
  return null;
}

/** Count players at station tiles for rush hour detection. */
export function playersAtStations(state: GameState): number {
  const stations = new Set(stationTiles());
  let count = 0;
  for (const p of state.players) {
    if (stations.has(p.position)) count++;
  }
  return count;
}
