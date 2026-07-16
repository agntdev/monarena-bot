export type TypeName = "fire" | "water" | "grass" | "electric" | "normal" | "psychic" | "ghost" | "dragon";

export type StatusEffect = "burn" | "poison" | "paralyze" | "freeze" | "sleep" | null;

export interface MoveData {
  name: string;
  power: number;
  accuracy: number;
  type: TypeName;
  pp: number;
  effect?: StatusEffect;
}

export interface PokemonSpecies {
  id: string;
  name: string;
  type: TypeName;
  baseHp: number;
  baseAtk: number;
  baseDef: number;
  baseSpd: number;
  moves: string[];
  evolvesTo?: string;
  evolveLevel?: number;
}

export interface Pokemon {
  id: string;
  species: string;
  nickname: string;
  level: number;
  xp: number;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  spd: number;
  moveset: string[];
  heldItem: string | null;
  status: StatusEffect;
}

export interface ItemData {
  id: string;
  name: string;
  type: "consumable" | "pokeball" | "medicine" | "battle";
  effect: string;
  quantity: number;
}

export interface GymData {
  id: string;
  name: string;
  leader: string;
  roster: { speciesId: string; level: number }[];
  rewards: { xp: number; items: { itemId: string; qty: number }[] };
  cooldownTimer: number;
}

export interface Player {
  telegramId: number;
  trainerName: string;
  rank: string;
  inventory: Record<string, number>;
  party: string[];
  allPokemon: string[];
}

export interface Battle {
  id: string;
  type: "pve" | "pvp";
  participants: number[];
  teams: Record<number, string[]>;
  currentTurn: number;
  turnOrder: number[];
  actionLog: string[];
  status: "active" | "completed" | "forfeited";
  winner: number | null;
  createdAt: number;
  expiresAt: number;
  gymId?: string;
}
