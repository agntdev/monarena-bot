// Turn-based battle engine for PvE and PvP.
import { SPECIES, MOVES, calcHp, calcStat, type TypeName } from "./data.js";
import type { PokemonData, BattleData, PlayerData, PvpState } from "./storage.js";

// Type effectiveness chart
const EFFECTIVENESS: Record<TypeName, Record<TypeName, number>> = {
  normal: { normal: 1, fire: 1, water: 1, grass: 1, electric: 1 },
  fire:   { normal: 1, fire: 0.5, water: 0.5, grass: 2, electric: 1 },
  water:  { normal: 1, fire: 2, water: 0.5, grass: 0.5, electric: 1 },
  grass:  { normal: 1, fire: 0.5, water: 2, grass: 0.5, electric: 1 },
  electric: { normal: 1, fire: 1, water: 2, grass: 0.5, electric: 0.5 },
};

export function typeEffectiveness(attackType: TypeName, defenderType: TypeName): number {
  return EFFECTIVENESS[attackType]?.[defenderType] ?? 1;
}

export function calcDamage(attacker: PokemonData, defender: PokemonData, moveName: string): { damage: number; effectiveness: number; critical: boolean; message: string } {
  const move = MOVES[moveName];
  if (!move) return { damage: 0, effectiveness: 1, critical: false, message: `${attacker.nickname} used an unknown move!` };

  const species = SPECIES[attacker.species];
  const defSpecies = SPECIES[defender.species];
  if (!species || !defSpecies) return { damage: 0, effectiveness: 1, critical: false, message: "Unknown Pokémon!" };

  const level = attacker.level;
  const atk = calcStat(species.baseAtk, level);
  const def = calcStat(defSpecies.baseDef, defender.level);
  const accuracy = move.accuracy / 100;

  // Random factor: 85-100%
  const random = 0.85 + Math.random() * 0.15;
  const critical = Math.random() < 0.0625;
  const critMult = critical ? 1.5 : 1;
  const eff = typeEffectiveness(move.type, defSpecies.type);

  let damage = Math.floor(((2 * level / 5 + 2) * move.power * atk / def / 50 + 2) * critMult * eff * random * accuracy);
  damage = Math.max(1, damage);

  const effText = eff > 1 ? " It's super effective!" : eff < 1 ? " It's not very effective..." : "";
  const critText = critical ? " Critical hit!" : "";

  return { damage, effectiveness: eff, critical, message: `${effText}${critText}` };
}

export function getStatusEffectMessage(moveName: string, defender: PokemonData): string | null {
  const move = MOVES[moveName];
  if (!move?.effect) return null;
  if (Math.random() > 0.2) return null; // 20% chance
  if (move.effect === "paralyze" && !defender.status) {
    defender.status = "paralyzed";
    return `${defender.nickname} was paralyzed!`;
  }
  if (move.effect === "burn" && !defender.status) {
    defender.status = "burned";
    return `${defender.nickname} was burned!`;
  }
  return null;
}

export function getAvailableMoves(pokemon: PokemonData): string[] {
  return pokemon.moves.filter(m => MOVES[m]);
}

export function calculateBattleDamage(attacker: PokemonData, defender: PokemonData, moveName: string): { damage: number; messages: string[] } {
  const messages: string[] = [];
  const move = MOVES[moveName];
  if (!move) {
    messages.push(`${attacker.nickname} can't use that move!`);
    return { damage: 0, messages };
  }

  messages.push(`${attacker.nickname} used ${move.name}!`);

  const { damage, message } = calcDamage(attacker, defender, moveName);
  messages.push(message);

  const statusMsg = getStatusEffectMessage(moveName, defender);
  if (statusMsg) messages.push(statusMsg);

  return { damage: Math.max(1, damage), messages };
}

export function resolvePveBattle(
  playerTeam: PokemonData[],
  gymPokemon: { species: string; level: number }[],
  playerName: string,
  gymLeader: string,
): { winner: "player" | "gym"; log: string[]; xpReward: number } {
  const log: string[] = [`⚔️ ${playerName} challenged ${gymLeader}!`];

  const gymTeam = gymPokemon.map(g => {
    const sp = SPECIES[g.species];
    if (!sp) return null;
    const hp = calcHp(g.level, sp.baseHp);
    return {
      species: g.species,
      nickname: sp.name,
      level: g.level,
      xp: 0,
      hp,
      maxHp: hp,
      moves: [...sp.moves.slice(0, 2)],
    } as PokemonData;
  }).filter(Boolean) as PokemonData[];

  let playerIdx = 0;
  let gymIdx = 0;

  while (playerIdx < playerTeam.length && gymIdx < gymTeam.length) {
    const playerMon = playerTeam[playerIdx]!;
    const gymMon = gymTeam[gymIdx]!;

    log.push(`${playerMon.nickname} (HP ${playerMon.hp}/${playerMon.maxHp}) vs ${gymMon.nickname} (HP ${gymMon.hp}/${gymMon.maxHp})`);

    // Player goes first (speed tie broken by player)
    const playerMove = playerMon.moves[0]!;
    const { damage: pDmg, messages: pMsgs } = calculateBattleDamage(playerMon, gymMon, playerMove);
    log.push(...pMsgs);
    gymMon.hp = Math.max(0, gymMon.hp - pDmg);

    if (gymMon.hp <= 0) {
      log.push(`${gymMon.nickname} fainted!`);
      gymIdx++;
      continue;
    }

    // Gym Pokémon attacks back
    const gymMove = gymMon.moves[0]!;
    const { damage: gDmg, messages: gMsgs } = calculateBattleDamage(gymMon, playerMon, gymMove);
    log.push(...gMsgs);
    playerMon.hp = Math.max(0, playerMon.hp - gDmg);

    if (playerMon.hp <= 0) {
      log.push(`${playerMon.nickname} fainted!`);
      playerIdx++;
    }
  }

  const winner = playerIdx < playerTeam.length ? "player" : "gym";
  const xpReward = winner === "player" ? gymTeam.reduce((sum, m) => sum + m.level * 25, 0) : 0;

  if (winner === "player") {
    log.push(`🎉 You defeated ${gymLeader}!`);
  } else {
    log.push(`😢 You lost to ${gymLeader}...`);
  }

  return { winner, log, xpReward };
}

export function resolvePvpBattle(
  challengerTeam: PokemonData[],
  defenderTeam: PokemonData[],
): { winner: "challenger" | "defender"; log: string[] } {
  const log: string[] = ["⚔️ PvP Battle Start!"];

  const challenger = challengerTeam.map(p => ({ ...p }));
  const defender = defenderTeam.map(p => ({ ...p }));

  let ci = 0, di = 0;
  let turn = 0;

  while (ci < challenger.length && di < defender.length) {
    turn++;
    const cMon = challenger[ci]!;
    const dMon = defender[di]!;

    log.push(`Turn ${turn}: ${cMon.nickname} vs ${dMon.nickname}`);

    // Challenger goes first
    const cMove = cMon.moves[turn % cMon.moves.length]!;
    const { damage: cDmg, messages: cMsgs } = calculateBattleDamage(cMon, dMon, cMove);
    log.push(...cMsgs);
    dMon.hp = Math.max(0, dMon.hp - cDmg);

    if (dMon.hp <= 0) {
      log.push(`${dMon.nickname} fainted!`);
      di++;
      continue;
    }

    // Defender attacks
    const dMove = dMon.moves[turn % dMon.moves.length]!;
    const { damage: dDmg, messages: dMsgs } = calculateBattleDamage(dMon, cMon, dMove);
    log.push(...dMsgs);
    cMon.hp = Math.max(0, cMon.hp - dDmg);

    if (cMon.hp <= 0) {
      log.push(`${cMon.nickname} fainted!`);
      ci++;
    }
  }

  const winner = ci < challenger.length ? "challenger" : "defender";
  if (winner === "challenger") {
    log.push("🎉 The challenger wins!");
  } else {
    log.push("🎉 The defender wins!");
  }

  return { winner, log };
}
