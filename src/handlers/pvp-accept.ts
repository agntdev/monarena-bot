import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { getSpeciesData, createPokemon } from "../game/data.js";
import { newBattleId, getEffectiveSpd, applyMove, isFainted, chooseAiMove } from "../game/battle.js";
import type { Pokemon } from "../game/types.js";
import { getPendingDuels } from "./pvp-challenge.js";

const composer = new Composer<Ctx>();

function ensurePlayer(ctx: Ctx): Record<string, unknown> | null {
  return ((ctx.session as Record<string, unknown>).player as Record<string, unknown>) ?? null;
}

function getAllPokemon(ctx: Ctx): Record<string, Pokemon> {
  return ((ctx.session as Record<string, unknown>).allPokemon as Record<string, Pokemon>) ?? {};
}

function saveAllPokemon(ctx: Ctx, data: Record<string, Pokemon>): void {
  (ctx.session as Record<string, unknown>).allPokemon = data;
}

composer.callbackQuery("pvp:accept", async (ctx) => {
  await ctx.answerCallbackQuery();
  const player = ensurePlayer(ctx);
  if (!player) {
    await ctx.reply("You need a trainer profile first! Tap /start.", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    return;
  }

  const allPokemon = getAllPokemon(ctx);
  const party = (player.party as string[]) ?? [];
  const alive = party.filter((id) => {
    const p = allPokemon[id];
    return p && p.hp > 0;
  });

  if (alive.length === 0) {
    await ctx.editMessageText("None of your Pokémon can battle! Heal them first.", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    return;
  }

  const pending = getPendingDuels();
  const myId = ctx.from?.id ?? 0;
  const challengesForMe = [...pending.values()].filter(
    (d) => d.targetId === myId && Date.now() < d.expiresAt,
  );

  if (challengesForMe.length === 0) {
    await ctx.editMessageText("No pending challenges for you right now!", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    return;
  }

  (ctx.session as Record<string, unknown>).step = "awaiting_duel_accept";

  const rows = challengesForMe.map((d) => [
    inlineButton(
      `vs ${d.challengerName} (${d.battleId.slice(0, 12)}…)`,
      `duel:accept:${d.battleId}`,
    ),
  ]);
  rows.push([inlineButton("⬅️ Back to menu", "menu:main")]);

  await ctx.editMessageText(
    "🎯 Choose a challenge to accept:",
    { reply_markup: inlineKeyboard(rows) },
  );
});

composer.callbackQuery(/^duel:accept:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const battleId = ctx.match![1];
  const pending = getPendingDuels();
  const duel = pending.get(battleId);

  if (!duel || duel.targetId !== (ctx.from?.id ?? 0)) {
    await ctx.editMessageText("Challenge not found or not for you!", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    return;
  }

  if (Date.now() > duel.expiresAt) {
    pending.delete(battleId);
    await ctx.editMessageText("That challenge has expired!", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    return;
  }

  const player = ensurePlayer(ctx);
  const allPokemon = getAllPokemon(ctx);
  const party = (player?.party as string[]) ?? [];
  const defenderTeam = party
    .filter((id) => { const p = allPokemon[id]; return p && p.hp > 0; })
    .slice(0, 6);

  // Create PvP battle
  const battle = {
    id: battleId,
    type: "pvp" as const,
    participants: [duel.challengerId, ctx.from?.id ?? 0],
    teams: {
      [duel.challengerId]: duel.challengerTeam,
      [ctx.from?.id ?? 0]: defenderTeam,
    },
    currentTurn: 0,
    turnOrder: [duel.challengerId, ctx.from?.id ?? 0],
    actionLog: [] as string[],
    status: "active" as string,
    winner: null as number | null,
    createdAt: Date.now(),
    expiresAt: duel.expiresAt,
  };

  pending.delete(battleId);

  (ctx.session as Record<string, unknown>).currentPvpBattle = battle;
  (ctx.session as Record<string, unknown>).pvpTurn = duel.challengerId;
  (ctx.session as Record<string, unknown>).step = "pvp_turn";

  // Simplified PvP: both sides auto-battle for demo
  const challengerTeamIds = duel.challengerTeam;
  const defenderTeamIds = defenderTeam;

  const challengerMons = challengerTeamIds.map((id) => {
    // Challenger's pokemon stored in their session — we can't access them
    // In a real implementation with Redis-backed store, we'd load from DB.
    // For now, create level-appropriate synthetic mons.
    const speciesId = id.split("_")[0];
    return createPokemon(speciesId, 10);
  });

  const defenderMons = defenderTeamIds.map((id) => allPokemon[id]).filter(Boolean) as Pokemon[];

  if (challengerMons.length === 0 || defenderMons.length === 0) {
    await ctx.editMessageText("Not enough Pokémon to battle!", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    return;
  }

  // Simple auto-battle for PvP demo
  let ci = 0, di = 0;
  const log: string[] = ["🎯 PvP Duel begins!"];
  let turnCount = 0;

  while (ci < challengerMons.length && di < defenderMons.length && turnCount < 200) {
    const cMon = challengerMons[ci];
    const dMon = defenderMons[di];
    turnCount++;

    if (getEffectiveSpd(cMon) >= getEffectiveSpd(dMon)) {
      const move = cMon.moveset[Math.floor(Math.random() * cMon.moveset.length)] ?? "tackle";
      log.push(...applyMove(cMon, dMon, move));
      if (isFainted(dMon)) {
        log.push(`${dMon.nickname} fainted!`);
        di++;
      }
      if (di >= defenderMons.length) break;
      const move2 = dMon.moveset[Math.floor(Math.random() * dMon.moveset.length)] ?? "tackle";
      log.push(...applyMove(dMon, cMon, move2));
      if (isFainted(cMon)) {
        log.push(`${cMon.nickname} fainted!`);
        ci++;
      }
    } else {
      const move2 = dMon.moveset[Math.floor(Math.random() * dMon.moveset.length)] ?? "tackle";
      log.push(...applyMove(dMon, cMon, move2));
      if (isFainted(cMon)) {
        log.push(`${cMon.nickname} fainted!`);
        ci++;
      }
      if (ci >= challengerMons.length) break;
      const move = cMon.moveset[Math.floor(Math.random() * cMon.moveset.length)] ?? "tackle";
      log.push(...applyMove(cMon, dMon, move));
      if (isFainted(dMon)) {
        log.push(`${dMon.nickname} fainted!`);
        di++;
      }
    }
  }

  const winner = ci < challengerMons.length ? duel.challengerId : (ctx.from?.id ?? 0);
  battle.status = "completed";
  battle.winner = winner;

  (ctx.session as Record<string, unknown>).currentPvpBattle = undefined;
  (ctx.session as Record<string, unknown>).step = undefined;
  saveAllPokemon(ctx, allPokemon);

  const resultText = winner === (ctx.from?.id ?? 0)
    ? "🏆 You won the duel!"
    : "💀 You lost the duel!";

  await ctx.editMessageText(
    `${resultText}\n\n${log.join("\n").slice(0, 3000)}`,
    { reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]) },
  );
});

export default composer;
