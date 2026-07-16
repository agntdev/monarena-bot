import type { Pokemon, Battle, StatusEffect } from "./types.js";
import { MOVES, TYPE_CHART, getSpeciesData, calcMaxHp, calcStat, xpToNextLevel, SPECIES } from "./data.js";

let battleCounter = 0;

export function newBattleId(): string {
  return `b_${++battleCounter}_${Date.now()}`;
}

export function getTypeEffectiveness(attackType: string, defenderType: string): number {
  return TYPE_CHART[attackType]?.[defenderType] ?? 1;
}

export function applyStatus(pokemon: Pokemon, status: StatusEffect): string | null {
  if (pokemon.status) return null;
  if (status === null) return null;
  pokemon.status = status;
  const names: Record<string, string> = {
    burn: "burned", poison: "poisoned", paralyze: "paralyzed",
    freeze: "frozen", sleep: "asleep",
  };
  return `${pokemon.nickname} is ${names[status] ?? status}!`;
}

export function tickStatus(pokemon: Pokemon): string | null {
  if (!pokemon.status) return null;
  if (pokemon.status === "burn" || pokemon.status === "poison") {
    const dmg = Math.max(1, Math.floor(pokemon.maxHp / 16));
    pokemon.hp = Math.max(0, pokemon.hp - dmg);
    return `${pokemon.nickname} is hurt by its ${pokemon.status}! (${pokemon.hp}/${pokemon.maxHp} HP)`;
  }
  if (pokemon.status === "sleep") {
    if (Math.random() < 0.33) {
      pokemon.status = null;
      return `${pokemon.nickname} woke up!`;
    }
    return `${pokemon.nickname} is still asleep!`;
  }
  if (pokemon.status === "freeze") {
    if (Math.random() < 0.2) {
      pokemon.status = null;
      return `${pokemon.nickname} thawed out!`;
    }
    return `${pokemon.nickname} is frozen solid!`;
  }
  return null;
}

export function calcDamage(attacker: Pokemon, defender: Pokemon, moveId: string): { damage: number; effectiveness: number; missed: boolean; crit: boolean } {
  const move = MOVES[moveId];
  if (!move) return { damage: 0, effectiveness: 1, missed: false, crit: false };

  if (Math.random() * 100 > move.accuracy) {
    return { damage: 0, effectiveness: 1, missed: true, crit: false };
  }

  const species = getSpeciesData(defender.species);
  const defenderType = species?.type ?? "normal";
  const effectiveness = getTypeEffectiveness(move.type, defenderType);

  if (effectiveness === 0) return { damage: 0, effectiveness: 0, missed: false, crit: false };

  const level = attacker.level;
  const crit = Math.random() < 0.0625;
  const critMult = crit ? 1.5 : 1;
  const stab = move.type === (getSpeciesData(attacker.species)?.type ?? "") ? 1.5 : 1;

  const baseDmg = ((2 * level / 5 + 2) * move.power * (attacker.atk / defender.def)) / 50 + 2;
  const damage = Math.max(1, Math.floor(baseDmg * effectiveness * critMult * stab * (0.85 + Math.random() * 0.15)));

  return { damage, effectiveness, missed: false, crit };
}

export function applyMove(attacker: Pokemon, defender: Pokemon, moveId: string): string[] {
  const log: string[] = [];
  const move = MOVES[moveId];
  if (!move) {
    log.push(`${attacker.nickname} used an unknown move!`);
    return log;
  }

  if (attacker.status === "paralyze" && Math.random() < 0.25) {
    log.push(`${attacker.nickname} is paralyzed and can't move!`);
    return log;
  }
  if (attacker.status === "sleep") {
    const woke = Math.random() < 0.33;
    if (!woke) {
      log.push(`${attacker.nickname} is asleep and can't move!`);
      return log;
    }
    attacker.status = null;
    log.push(`${attacker.nickname} woke up!`);
  }
  if (attacker.status === "freeze") {
    if (Math.random() < 0.2) {
      attacker.status = null;
      log.push(`${attacker.nickname} thawed out!`);
    } else {
      log.push(`${attacker.nickname} is frozen solid!`);
      return log;
    }
  }

  log.push(`${attacker.nickname} used ${move.name}!`);
  const result = calcDamage(attacker, defender, moveId);

  if (result.missed) {
    log.push("It missed!");
    return log;
  }

  if (result.effectiveness === 0) {
    log.push("It doesn't affect the foe…");
    return log;
  }

  defender.hp = Math.max(0, defender.hp - result.damage);

  if (result.effectiveness > 1) log.push("It's super effective!");
  else if (result.effectiveness < 1) log.push("It's not very effective…");
  if (result.crit) log.push("A critical hit!");

  log.push(`${defender.nickname} took ${result.damage} damage! (${defender.hp}/${defender.maxHp} HP)`);

  if (move.effect && defender.hp > 0 && Math.random() < 0.3) {
    const statusMsg = applyStatus(defender, move.effect);
    if (statusMsg) log.push(statusMsg);
  }

  return log;
}

export function isFainted(pokemon: Pokemon): boolean {
  return pokemon.hp <= 0;
}

export function gainXp(pokemon: Pokemon, amount: number): string[] {
  const log: string[] = [];
  pokemon.xp += amount;
  log.push(`${pokemon.nickname} gained ${amount} XP!`);

  while (pokemon.xp >= xpToNextLevel(pokemon.level) && pokemon.level < 100) {
    pokemon.level++;
    const species = getSpeciesData(pokemon.species);
    if (species) {
      pokemon.maxHp = calcMaxHp(pokemon.level, species.baseHp);
      pokemon.atk = calcStat(pokemon.level, species.baseAtk);
      pokemon.def = calcStat(pokemon.level, species.baseDef);
      pokemon.spd = calcStat(pokemon.level, species.baseSpd);
      pokemon.hp = Math.min(pokemon.hp + Math.floor((pokemon.maxHp - pokemon.hp) * 0.3), pokemon.maxHp);
    }
    log.push(`${pokemon.nickname} grew to level ${pokemon.level}!`);

    if (species?.evolvesTo && species.evolveLevel && pokemon.level >= species.evolveLevel) {
      const oldName = pokemon.nickname === species.name ? "" : ` (${pokemon.nickname})`;
      pokemon.species = species.evolvesTo;
      const newSpecies = getSpeciesData(species.evolvesTo);
      if (newSpecies) {
        pokemon.maxHp = calcMaxHp(pokemon.level, newSpecies.baseHp);
        pokemon.atk = calcStat(pokemon.level, newSpecies.baseAtk);
        pokemon.def = calcStat(pokemon.level, newSpecies.baseDef);
        pokemon.spd = calcStat(pokemon.level, newSpecies.baseSpd);
        pokemon.hp = pokemon.maxHp;
        if (!oldName) pokemon.nickname = newSpecies.name;
        log.push(`${species.name} evolved into ${newSpecies.name}!`);
      }
    }
  }
  return log;
}

export function useItem(pokemon: Pokemon, itemId: string): string | null {
  if (itemId === "potion") {
    if (pokemon.hp >= pokemon.maxHp) return `${pokemon.nickname} is already at full health!`;
    pokemon.hp = Math.min(pokemon.maxHp, pokemon.hp + 20);
    return `${pokemon.nickname} recovered 20 HP! (${pokemon.hp}/${pokemon.maxHp})`;
  }
  if (itemId === "superPotion") {
    if (pokemon.hp >= pokemon.maxHp) return `${pokemon.nickname} is already at full health!`;
    pokemon.hp = Math.min(pokemon.maxHp, pokemon.hp + 50);
    return `${pokemon.nickname} recovered 50 HP! (${pokemon.hp}/${pokemon.maxHp})`;
  }
  if (itemId === "antidote") {
    if (!pokemon.status) return `${pokemon.nickname} has no status problem!`;
    pokemon.status = null;
    return `${pokemon.nickname} was cured!`;
  }
  if (itemId === "revive") {
    if (pokemon.hp > 0) return `${pokemon.nickname} isn't fainted!`;
    pokemon.hp = Math.floor(pokemon.maxHp / 2);
    pokemon.status = null;
    return `${pokemon.nickname} was revived! (${pokemon.hp}/${pokemon.maxHp})`;
  }
  if (itemId === "rareCandy") {
    if (pokemon.level >= 100) return `${pokemon.nickname} is already max level!`;
    pokemon.level++;
    const species = getSpeciesData(pokemon.species);
    if (species) {
      pokemon.maxHp = calcMaxHp(pokemon.level, species.baseHp);
      pokemon.atk = calcStat(pokemon.level, species.baseAtk);
      pokemon.def = calcStat(pokemon.level, species.baseDef);
      pokemon.spd = calcStat(pokemon.level, species.baseSpd);
      pokemon.hp = pokemon.maxHp;
    }
    return `${pokemon.nickname} grew to level ${pokemon.level}!`;
  }
  return null;
}

export function getEffectiveSpd(pokemon: Pokemon): number {
  let spd = pokemon.spd;
  if (pokemon.status === "paralyze") spd = Math.floor(spd * 0.5);
  return spd;
}

export function chooseAiMove(attacker: Pokemon, defender: Pokemon): string {
  let bestMove = attacker.moveset[0] ?? "tackle";
  let bestScore = -1;

  for (const moveId of attacker.moveset) {
    const move = MOVES[moveId];
    if (!move) continue;
    const species = getSpeciesData(defender.species);
    const eff = getTypeEffectiveness(move.type, species?.type ?? "normal");
    const score = move.power * eff * (move.accuracy / 100);
    if (score > bestScore) {
      bestScore = score;
      bestMove = moveId;
    }
  }
  return bestMove;
}
