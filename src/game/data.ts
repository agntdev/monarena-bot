import type { MoveData, PokemonSpecies, ItemData, GymData } from "./types.js";

export const TYPE_CHART: Record<string, Record<string, number>> = {
  fire:     { grass: 2, water: 0.5, fire: 0.5, dragon: 0.5, ice: 2, bug: 2, rock: 0.5 },
  water:    { fire: 2, grass: 0.5, water: 0.5, dragon: 0.5, ground: 2, rock: 2 },
  grass:    { water: 2, fire: 0.5, grass: 0.5, poison: 0.5, ground: 2, rock: 2, flying: 0.5, bug: 0.5 },
  electric: { water: 2, grass: 0.5, electric: 0.5, dragon: 0.5, ground: 0, flying: 2 },
  normal:   { ghost: 0 },
  psychic:  { poison: 2, fighting: 2, psychic: 0.5, dark: 0 },
  ghost:    { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon:   { dragon: 2 },
};

export const MOVES: Record<string, MoveData> = {
  tackle:      { name: "Tackle",      power: 40, accuracy: 100, type: "normal",   pp: 35 },
  scratch:     { name: "Scratch",     power: 40, accuracy: 100, type: "normal",   pp: 35 },
  ember:       { name: "Ember",       power: 40, accuracy: 100, type: "fire",     pp: 25, effect: "burn" },
  flameBurst:  { name: "Flame Burst", power: 70, accuracy: 100, type: "fire",     pp: 15 },
  waterGun:    { name: "Water Gun",   power: 40, accuracy: 100, type: "water",    pp: 25 },
  bubbleBeam:  { name: "Bubble Beam", power: 65, accuracy: 100, type: "water",    pp: 20 },
  vineWhip:    { name: "Vine Whip",   power: 45, accuracy: 100, type: "grass",    pp: 25 },
  razorLeaf:   { name: "Razor Leaf",  power: 55, accuracy: 95,  type: "grass",    pp: 25 },
  thunderShock:{ name: "ThunderShock",power: 40, accuracy: 100, type: "electric", pp: 30, effect: "paralyze" },
  thunderbolt: { name: "Thunderbolt", power: 90, accuracy: 100, type: "electric", pp: 15, effect: "paralyze" },
  confusion:   { name: "Confusion",   power: 50, accuracy: 100, type: "psychic",  pp: 25 },
  psychic:     { name: "Psychic",     power: 90, accuracy: 100, type: "psychic",  pp: 10 },
  shadowBall:  { name: "Shadow Ball", power: 80, accuracy: 100, type: "ghost",    pp: 15 },
  lick:        { name: "Lick",        power: 30, accuracy: 100, type: "ghost",    pp: 30, effect: "paralyze" },
  dragonBreath:{ name: "Dragon Breath",power:60, accuracy: 100, type: "dragon",   pp: 20, effect: "paralyze" },
  dragonClaw:  { name: "Dragon Claw", power: 80, accuracy: 100, type: "dragon",   pp: 15 },
  quickAttack: { name: "Quick Attack", power: 40, accuracy: 100, type: "normal",   pp: 30 },
  ironTail:    { name: "Iron Tail",   power: 100,accuracy: 75,  type: "normal",   pp: 15 },
  slash:       { name: "Slash",       power: 70, accuracy: 100, type: "normal",   pp: 20 },
  nightSlash:  { name: "Night Slash", power: 70, accuracy: 100, type: "ghost",    pp: 20 },
  bite:        { name: "Bite",        power: 60, accuracy: 100, type: "normal",   pp: 25 },
  fireFang:    { name: "Fire Fang",   power: 65, accuracy: 95,  type: "fire",     pp: 15, effect: "burn" },
  iceFang:     { name: "Ice Fang",    power: 65, accuracy: 95,  type: "water",    pp: 15 },
  leafBlade:   { name: "Leaf Blade",  power: 90, accuracy: 100, type: "grass",    pp: 15 },
  spark:       { name: "Spark",       power: 65, accuracy: 100, type: "electric", pp: 20, effect: "paralyze" },
};

export const SPECIES: Record<string, PokemonSpecies> = {
  bulbasaur:  { id: "bulbasaur",  name: "Bulbasaur",  type: "grass",    baseHp: 45, baseAtk: 49, baseDef: 49, baseSpd: 45, moves: ["tackle","vineWhip","razorLeaf","leafBlade"], evolvesTo: "ivysaur", evolveLevel: 16 },
  ivysaur:    { id: "ivysaur",    name: "Ivysaur",    type: "grass",    baseHp: 60, baseAtk: 62, baseDef: 63, baseSpd: 60, moves: ["vineWhip","razorLeaf","leafBlade","psychic"] },
  charmander: { id: "charmander", name: "Charmander", type: "fire",     baseHp: 39, baseAtk: 52, baseDef: 43, baseSpd: 65, moves: ["scratch","ember","flameBurst","fireFang"], evolvesTo: "charmeleon", evolveLevel: 16 },
  charmeleon: { id: "charmeleon", name: "Charmeleon", type: "fire",     baseHp: 58, baseAtk: 64, baseDef: 58, baseSpd: 80, moves: ["ember","flameBurst","fireFang","slash"] },
  squirtle:   { id: "squirtle",   name: "Squirtle",   type: "water",    baseHp: 44, baseAtk: 48, baseDef: 65, baseSpd: 43, moves: ["tackle","waterGun","bubbleBeam","iceFang"], evolvesTo: "wartortle", evolveLevel: 16 },
  wartortle:  { id: "wartortle",  name: "Wartortle",  type: "water",    baseHp: 59, baseAtk: 63, baseDef: 80, baseSpd: 58, moves: ["waterGun","bubbleBeam","iceFang","ironTail"] },
  pikachu:    { id: "pikachu",    name: "Pikachu",    type: "electric", baseHp: 35, baseAtk: 55, baseDef: 40, baseSpd: 90, moves: ["thunderShock","quickAttack","spark","thunderbolt"], evolvesTo: "raichu", evolveLevel: 20 },
  raichu:     { id: "raichu",     name: "Raichu",     type: "electric", baseHp: 60, baseAtk: 90, baseDef: 55, baseSpd: 110, moves: ["thunderShock","spark","thunderbolt","quickAttack"] },
  abra:       { id: "abra",       name: "Abra",       type: "psychic",  baseHp: 25, baseAtk: 20, baseDef: 15, baseSpd: 90, moves: ["confusion","psychic","shadowBall","nightSlash"], evolvesTo: "kadabra", evolveLevel: 16 },
  kadabra:    { id: "kadabra",    name: "Kadabra",    type: "psychic",  baseHp: 40, baseAtk: 35, baseDef: 30, baseSpd: 105, moves: ["confusion","psychic","shadowBall","nightSlash"] },
  gastly:     { id: "gastly",     name: "Gastly",     type: "ghost",    baseHp: 30, baseAtk: 35, baseDef: 30, baseSpd: 80, moves: ["lick","shadowBall","nightSlash","bite"], evolvesTo: "haunter", evolveLevel: 25 },
  haunter:    { id: "haunter",    name: "Haunter",    type: "ghost",    baseHp: 45, baseAtk: 50, baseDef: 45, baseSpd: 95, moves: ["lick","shadowBall","nightSlash","bite"] },
  dratini:    { id: "dratini",    name: "Dratini",    type: "dragon",   baseHp: 41, baseAtk: 64, baseDef: 45, baseSpd: 50, moves: ["tackle","dragonBreath","dragonClaw","slash"], evolvesTo: "dragonair", evolveLevel: 30 },
  dragonair:  { id: "dragonair",  name: "Dragonair",  type: "dragon",   baseHp: 61, baseAtk: 84, baseDef: 65, baseSpd: 70, moves: ["dragonBreath","dragonClaw","slash","ironTail"] },
  eevee:      { id: "eevee",      name: "Eevee",      type: "normal",   baseHp: 55, baseAtk: 55, baseDef: 50, baseSpd: 55, moves: ["tackle","bite","quickAttack","slash"] },
};

export const STARTERS = ["bulbasaur", "charmander", "squirtle"];

export const ITEMS: Record<string, ItemData> = {
  potion:       { id: "potion",       name: "Potion",       type: "medicine", effect: "heal_20",  quantity: 0 },
  superPotion:  { id: "superPotion",  name: "Super Potion",  type: "medicine", effect: "heal_50",  quantity: 0 },
  pokeball:     { id: "pokeball",     name: "Poké Ball",    type: "pokeball", effect: "catch",   quantity: 0 },
  greatBall:    { id: "greatBall",    name: "Great Ball",   type: "pokeball", effect: "catch_2", quantity: 0 },
  antidote:     { id: "antidote",     name: "Antidote",     type: "medicine", effect: "cure",    quantity: 0 },
  revive:       { id: "revive",       name: "Revive",       type: "medicine", effect: "revive",  quantity: 0 },
  rareCandy:    { id: "rareCandy",    name: "Rare Candy",   type: "medicine", effect: "levelup", quantity: 0 },
  xAttack:      { id: "xAttack",      name: "X Attack",     type: "battle",   effect: "atk_up",  quantity: 0 },
};

export const GYMS: Record<string, GymData> = {
  pewter: {
    id: "pewter", name: "Pewter Gym", leader: "Brock",
    roster: [
      { speciesId: "geodude", level: 12 },
      { speciesId: "onix", level: 14 },
    ],
    rewards: { xp: 150, items: [{ itemId: "potion", qty: 3 }] },
    cooldownTimer: 3600000,
  },
  cerulean: {
    id: "cerulean", name: "Cerulean Gym", leader: "Misty",
    roster: [
      { speciesId: "staryu", level: 18 },
      { speciesId: "starmie", level: 21 },
    ],
    rewards: { xp: 300, items: [{ itemId: "superPotion", qty: 2 }, { itemId: "pokeball", qty: 5 }] },
    cooldownTimer: 7200000,
  },
  vermilion: {
    id: "vermilion", name: "Vermilion Gym", leader: "Lt. Surge",
    roster: [
      { speciesId: "voltorb", level: 20 },
      { speciesId: "pikachu", level: 24 },
      { speciesId: "raichu", level: 28 },
    ],
    rewards: { xp: 500, items: [{ itemId: "superPotion", qty: 3 }, { itemId: "greatBall", qty: 3 }] },
    cooldownTimer: 10800000,
  },
};

// Off-species that gym leaders use (not in player-accessible SPECIES)
export const GYM_SPECIES: Record<string, PokemonSpecies> = {
  geodude:  { id: "geodude",  name: "Geodude",  type: "normal",   baseHp: 40, baseAtk: 80, baseDef: 100, baseSpd: 20, moves: ["tackle","rockThrow","ironTail","slash"] },
  onix:     { id: "onix",     name: "Onix",     type: "normal",   baseHp: 35, baseAtk: 45, baseDef: 160, baseSpd: 70, moves: ["tackle","ironTail","bite","rockThrow"] },
  staryu:   { id: "staryu",   name: "Staryu",   type: "water",    baseHp: 30, baseAtk: 45, baseDef: 55, baseSpd: 85, moves: ["waterGun","bubbleBeam","tackle","quickAttack"] },
  starmie:  { id: "starmie",  name: "Starmie",  type: "water",    baseHp: 60, baseAtk: 75, baseDef: 85, baseSpd: 115, moves: ["waterGun","bubbleBeam","psychic","thunderbolt"] },
  voltorb:  { id: "voltorb",  name: "Voltorb",  type: "electric", baseHp: 40, baseAtk: 30, baseDef: 50, baseSpd: 100, moves: ["thunderShock","spark","quickAttack","tackle"] },
};

// Add rockThrow to MOVES
MOVES.rockThrow = { name: "Rock Throw", power: 50, accuracy: 90, type: "normal", pp: 15 };

export function getSpeciesData(id: string): PokemonSpecies | undefined {
  return SPECIES[id] ?? GYM_SPECIES[id];
}

export function calcMaxHp(level: number, baseHp: number): number {
  return Math.floor((2 * baseHp * level) / 100) + level + 10;
}

export function calcStat(level: number, base: number): number {
  return Math.floor((2 * base * level) / 100) + 5;
}

export function createPokemon(speciesId: string, level: number, nickname?: string): import("./types.js").Pokemon {
  const species = getSpeciesData(speciesId)!;
  const maxHp = calcMaxHp(level, species.baseHp);
  return {
    id: `${speciesId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    species: speciesId,
    nickname: nickname ?? species.name,
    level,
    xp: 0,
    hp: maxHp,
    maxHp,
    atk: calcStat(level, species.baseAtk),
    def: calcStat(level, species.baseDef),
    spd: calcStat(level, species.baseSpd),
    moveset: species.moves.slice(0, 4),
    heldItem: null,
    status: null,
  };
}

export function xpToNextLevel(level: number): number {
  return Math.floor(level * level * 1.5);
}

export function speciesName(id: string): string {
  return getSpeciesData(id)?.name ?? id;
}
