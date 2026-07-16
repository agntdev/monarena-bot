import { SPECIES, calcHp, STARTER_ITEMS } from "./data.js";

export interface PlayerData {
  id: number;
  trainerName: string;
  rank: number;
  inventory: Record<string, number>;
  party: string[];
  pokemon: Record<string, PokemonData>;
  badges: string[];
  gymCooldowns: Record<string, number>;
}

export interface PokemonData {
  species: string;
  nickname: string;
  level: number;
  xp: number;
  hp: number;
  maxHp: number;
  moves: string[];
  heldItem?: string;
  status?: "paralyzed" | "burned";
}

export interface BattleData {
  id: string;
  type: "pve" | "pvp";
  participants: number[];
  teams: Record<number, string[]>;
  currentTurn: number;
  turnOrder: number[];
  actionLog: string[];
  status: "pending" | "active" | "completed";
  challengerTeam?: string[];
  defenderTeam?: string[];
  pvpState?: PvpState;
}

export interface PvpState {
  challengerHp: Record<string, number>;
  defenderHp: Record<string, number>;
  challengerCurrentIndex: number;
  defenderCurrentIndex: number;
  turn: "challenger" | "defender";
  turnCount: number;
}

// In-memory stores. Production would use Redis.
let players = new Map<number, PlayerData>();
let battles = new Map<string, BattleData>();
let battleCounter = 0;
const pendingChallenges = new Map<number, string>();

/** Reset all game storage. Test-only; never call from bot code. */
export function _resetGameStorage(): void {
  players = new Map();
  battles = new Map();
  battleCounter = 0;
  pendingChallenges.clear();
}

function genBattleId(): string {
  return `b${++battleCounter}`;
}

// Player operations
export function getPlayer(id: number): PlayerData | undefined {
  return players.get(id);
}

export function savePlayer(player: PlayerData): void {
  players.set(player.id, player);
}

export function createPlayer(id: number, trainerName: string, starterSpecies: string, starterLevel: number = 5): PlayerData {
  const speciesData = SPECIES[starterSpecies];
  const maxHp = calcHp(starterLevel, speciesData.baseHp);
  const pokemonId = `${id}_1`;
  const pokemon: PokemonData = {
    species: starterSpecies,
    nickname: speciesData.name,
    level: starterLevel,
    xp: 0,
    hp: maxHp,
    maxHp,
    moves: [...speciesData.moves.slice(0, 2)],
  };
  const inventory: Record<string, number> = {};
  for (const item of STARTER_ITEMS) {
    inventory[item] = (inventory[item] ?? 0) + 1;
  }
  const player: PlayerData = {
    id,
    trainerName,
    rank: 1,
    inventory,
    party: [pokemonId],
    pokemon: { [pokemonId]: pokemon },
    badges: [],
    gymCooldowns: {},
  };
  savePlayer(player);
  return player;
}

export function getAllPlayers(): PlayerData[] {
  return [...players.values()];
}

// Battle operations
export function createBattle(data: Omit<BattleData, "id">): BattleData {
  const id = genBattleId();
  const battle: BattleData = { ...data, id };
  battles.set(id, battle);
  return battle;
}

export function getBattle(id: string): BattleData | undefined {
  return battles.get(id);
}

export function saveBattle(battle: BattleData): void {
  battles.set(battle.id, battle);
}

// Index: pending PvP challenges per player (declared above with other stores)

export function setPendingChallenge(defenderId: number, battleId: string): void {
  pendingChallenges.set(defenderId, battleId);
}

export function getPendingChallenge(defenderId: number): string | undefined {
  return pendingChallenges.get(defenderId);
}

export function clearPendingChallenge(defenderId: number): void {
  pendingChallenges.delete(defenderId);
}

// Find battles involving a player
export function findPlayerBattle(playerId: number): BattleData | undefined {
  for (const battle of battles.values()) {
    if (battle.participants.includes(playerId) && battle.status === "active") {
      return battle;
    }
  }
  return undefined;
}
