// Pokémon species, moves, items, and gyms — all static game data.
// This is the single source of truth for the game's content.

export type TypeName = "normal" | "fire" | "water" | "grass" | "electric";

export interface MoveData {
  name: string;
  power: number;
  accuracy: number;
  type: TypeName;
  pp: number;
  effect?: "paralyze" | "burn";
}

export interface SpeciesData {
  id: number;
  name: string;
  type: TypeName;
  baseHp: number;
  baseAtk: number;
  baseDef: number;
  baseSpd: number;
  moves: string[];
}

export interface ItemData {
  name: string;
  type: "heal" | "pokeball" | "status" | "stat";
  effect: string;
  description: string;
}

export interface GymData {
  id: string;
  name: string;
  leader: string;
  badge: string;
  pokemon: { species: string; level: number }[];
  rewards: { xp: number; items: string[] };
}

export const MOVES: Record<string, MoveData> = {
  tackle: { name: "Tackle", power: 40, accuracy: 100, type: "normal", pp: 35 },
  scratch: { name: "Scratch", power: 40, accuracy: 100, type: "normal", pp: 35 },
  ember: { name: "Ember", power: 40, accuracy: 100, type: "fire", pp: 25, effect: "burn" },
  flamethrower: { name: "Flamethrower", power: 90, accuracy: 100, type: "fire", pp: 15, effect: "burn" },
  water_gun: { name: "Water Gun", power: 40, accuracy: 100, type: "water", pp: 25 },
  hydro_pump: { name: "Hydro Pump", power: 110, accuracy: 80, type: "water", pp: 5 },
  vine_whip: { name: "Vine Whip", power: 45, accuracy: 100, type: "grass", pp: 25 },
  solar_beam: { name: "Solar Beam", power: 120, accuracy: 100, type: "grass", pp: 10 },
  thunder_shock: { name: "Thunder Shock", power: 40, accuracy: 100, type: "electric", pp: 30, effect: "paralyze" },
  thunderbolt: { name: "Thunderbolt", power: 90, accuracy: 100, type: "electric", pp: 15, effect: "paralyze" },
  quick_attack: { name: "Quick Attack", power: 40, accuracy: 100, type: "normal", pp: 30 },
  headbutt: { name: "Headbutt", power: 70, accuracy: 100, type: "normal", pp: 15 },
  razor_leaf: { name: "Razor Leaf", power: 55, accuracy: 95, type: "grass", pp: 25 },
  bite: { name: "Bite", power: 60, accuracy: 100, type: "normal", pp: 25 },
  fury_swipes: { name: "Fury Swipes", power: 18, accuracy: 80, type: "normal", pp: 15 },
  mega_punch: { name: "Mega Punch", power: 80, accuracy: 85, type: "normal", pp: 20 },
  iron_tail: { name: "Iron Tail", power: 100, accuracy: 75, type: "normal", pp: 15 },
  slam: { name: "Slam", power: 80, accuracy: 75, type: "normal", pp: 20 },
  thunder: { name: "Thunder", power: 110, accuracy: 70, type: "electric", pp: 10, effect: "paralyze" },
  surf: { name: "Surf", power: 90, accuracy: 100, type: "water", pp: 15 },
  ice_beam: { name: "Ice Beam", power: 90, accuracy: 100, type: "normal", pp: 10 },
  dragon_rage: { name: "Dragon Rage", power: 60, accuracy: 100, type: "normal", pp: 10 },
  earthquake: { name: "Earthquake", power: 100, accuracy: 100, type: "normal", pp: 10 },
  shadow_ball: { name: "Shadow Ball", power: 80, accuracy: 100, type: "normal", pp: 15 },
  psybeam: { name: "Psybeam", power: 65, accuracy: 100, type: "normal", pp: 20 },
  body_slam: { name: "Body Slam", power: 85, accuracy: 100, type: "normal", pp: 15 },
};

export const SPECIES: Record<string, SpeciesData> = {
  bulbasaur: { id: 1, name: "Bulbasaur", type: "grass", baseHp: 45, baseAtk: 49, baseDef: 49, baseSpd: 45, moves: ["vine_whip", "tackle", "razor_leaf", "solar_beam"] },
  charmander: { id: 4, name: "Charmander", type: "fire", baseHp: 39, baseAtk: 52, baseDef: 43, baseSpd: 65, moves: ["ember", "scratch", "flamethrower", "quick_attack"] },
  squirtle: { id: 7, name: "Squirtle", type: "water", baseHp: 44, baseAtk: 48, baseDef: 65, baseSpd: 43, moves: ["water_gun", "tackle", "hydro_pump", "bite"] },
  pikachu: { id: 25, name: "Pikachu", type: "electric", baseHp: 35, baseAtk: 55, baseDef: 40, baseSpd: 90, moves: ["thunder_shock", "quick_attack", "thunderbolt", "slam"] },
  jigglypuff: { id: 39, name: "Jigglypuff", type: "normal", baseHp: 115, baseAtk: 45, baseDef: 20, baseSpd: 20, moves: ["body_slam", "headbutt", "slam", "fury_swipes"] },
  psyduck: { id: 54, name: "Psyduck", type: "water", baseHp: 50, baseAtk: 52, baseDef: 48, baseSpd: 55, moves: ["water_gun", "scratch", "psybeam", "hydro_pump"] },
  growlithe: { id: 58, name: "Growlithe", type: "fire", baseHp: 55, baseAtk: 70, baseDef: 45, baseSpd: 60, moves: ["ember", "bite", "flamethrower", "headbutt"] },
  abra: { id: 63, name: "Abra", type: "electric", baseHp: 25, baseAtk: 20, baseDef: 15, baseSpd: 90, moves: ["psybeam", "shadow_ball", "thunder_shock", "quick_attack"] },
  machop: { id: 66, name: "Machop", type: "normal", baseHp: 70, baseAtk: 80, baseDef: 50, baseSpd: 35, moves: ["mega_punch", "headbutt", "body_slam", "earthquake"] },
  eevee: { id: 133, name: "Eevee", type: "normal", baseHp: 55, baseAtk: 55, baseDef: 50, baseSpd: 55, moves: ["tackle", "bite", "quick_attack", "body_slam"] },
  gastly: { id: 92, name: "Gastly", type: "normal", baseHp: 30, baseAtk: 35, baseDef: 30, baseSpd: 80, moves: ["shadow_ball", "psybeam", "bite", "thunder_shock"] },
  geodude: { id: 74, name: "Geodude", type: "normal", baseHp: 40, baseAtk: 80, baseDef: 100, baseSpd: 20, moves: ["tackle", "headbutt", "earthquake", "mega_punch"] },
  zubat: { id: 41, name: "Zubat", type: "normal", baseHp: 40, baseAtk: 45, baseDef: 35, baseSpd: 55, moves: ["bite", "quick_attack", "slam", "fury_swipes"] },
  oddish: { id: 43, name: "Oddish", type: "grass", baseHp: 45, baseAtk: 50, baseDef: 55, baseSpd: 30, moves: ["vine_whip", "razor_leaf", "solar_beam", "tackle"] },
  meowth: { id: 52, name: "Meowth", type: "normal", baseHp: 40, baseAtk: 45, baseDef: 35, baseSpd: 90, moves: ["scratch", "bite", "fury_swipes", "quick_attack"] },
  clefairy: { id: 35, name: "Clefairy", type: "normal", baseHp: 70, baseAtk: 45, baseDef: 48, baseSpd: 35, moves: ["body_slam", "psybeam", "slam", "moonblast"] },
  rattata: { id: 19, name: "Rattata", type: "normal", baseHp: 30, baseAtk: 56, baseDef: 35, baseSpd: 72, moves: ["tackle", "bite", "quick_attack", "headbutt"] },
  spearow: { id: 21, name: "Spearow", type: "normal", baseHp: 40, baseAtk: 60, baseDef: 30, baseSpd: 70, moves: ["quick_attack", "fury_swipes", "headbutt", "tackle"] },
  nidoran: { id: 32, name: "Nidoran♂", type: "normal", baseHp: 46, baseAtk: 57, baseDef: 40, baseSpd: 50, moves: ["tackle", "headbutt", "body_slam", "fury_swipes"] },
  voltorb: { id: 100, name: "Voltorb", type: "electric", baseHp: 40, baseAtk: 30, baseDef: 50, baseSpd: 100, moves: ["thunder_shock", "tackle", "thunderbolt", "slam"] },
};

export const ITEMS: Record<string, ItemData> = {
  potion: { name: "Potion", type: "heal", effect: "Restores 20 HP", description: "A spray that heals one Pokémon's wounds." },
  super_potion: { name: "Super Potion", type: "heal", effect: "Restores 50 HP", description: "A spray that heals wounds more effectively." },
  revive: { name: "Revive", type: "heal", effect: "Revives fainted Pokémon to half HP", description: "Revives a fainted Pokémon." },
  pokeball: { name: "Poké Ball", type: "pokeball", effect: "Catches wild Pokémon", description: "A device for catching wild Pokémon." },
  great_ball: { name: "Great Ball", type: "pokeball", effect: "Higher catch rate", description: "A high-performance Poké Ball." },
  paralyze_heal: { name: "Paralyze Heal", type: "status", effect: "Cures paralysis", description: "Spray that heals paralysis." },
  burn_heal: { name: "Burn Heal", type: "status", effect: "Cures burns", description: "Spray that heals burns." },
  x_attack: { name: "X Attack", type: "stat", effect: "Raises Attack", description: "Raises a Pokémon's Attack." },
  x_defense: { name: "X Defense", type: "stat", effect: "Raises Defense", description: "Raises a Pokémon's Defense." },
};

export const STARTER_ITEMS = ["potion", "potion", "pokeball", "pokeball", "pokeball"];

export const GYMS: GymData[] = [
  {
    id: "pewter",
    name: "Pewter City Gym",
    leader: "Brock",
    badge: "Rock Badge",
    pokemon: [
      { species: "geodude", level: 12 },
      { species: "geodude", level: 12 },
      { species: "onix", level: 14 },
    ],
    rewards: { xp: 1500, items: ["super_potion", "x_defense"] },
  },
  {
    id: "cerulean",
    name: "Cerulean City Gym",
    leader: "Misty",
    badge: "Cascade Badge",
    pokemon: [
      { species: "starmie", level: 18 },
      { species: "starmie", level: 21 },
    ],
    rewards: { xp: 2500, items: ["super_potion", "great_ball"] },
  },
  {
    id: "vermillion",
    name: "Vermilion City Gym",
    leader: "Lt. Surge",
    badge: "Thunder Badge",
    pokemon: [
      { species: "voltorb", level: 20 },
      { species: "pikachu", level: 24 },
      { species: "raichu", level: 28 },
    ],
    rewards: { xp: 3500, items: ["super_potion", "x_attack"] },
  },
  {
    id: "celadon",
    name: "Celadon City Gym",
    leader: "Erika",
    badge: "Rainbow Badge",
    pokemon: [
      { species: "victreebel", level: 29 },
      { species: "tangela", level: 24 },
      { species: "vileplume", level: 29 },
    ],
    rewards: { xp: 4000, items: ["super_potion", "revive"] },
  },
  {
    id: "fuchsia",
    name: "Fuchsia City Gym",
    leader: "Koga",
    badge: "Soul Badge",
    pokemon: [
      { species: "koffing", level: 37 },
      { species: "muk", level: 39 },
      { species: "koffing", level: 37 },
      { species: "weezing", level: 43 },
    ],
    rewards: { xp: 5000, items: ["super_potion", "revive", "x_attack"] },
  },
  {
    id: "saffron",
    name: "Saffron City Gym",
    leader: "Sabrina",
    badge: "Marsh Badge",
    pokemon: [
      { species: "abra", level: 38 },
      { species: "kadabra", level: 38 },
      { species: "alakazam", level: 43 },
    ],
    rewards: { xp: 6000, items: ["super_potion", "revive", "x_defense"] },
  },
];

export const XP_PER_LEVEL = 50;
export const MAX_TEAM_SIZE = 6;

export function calcHp(level: number, baseHp: number): number {
  return Math.floor(2 * baseHp * level / 100) + level + 10;
}

export function calcStat(base: number, level: number): number {
  return Math.floor(2 * base * level / 100) + 5;
}

export function xpToNextLevel(level: number): number {
  return level * XP_PER_LEVEL;
}

export function levelUpXp(level: number): number {
  return level * XP_PER_LEVEL;
}
