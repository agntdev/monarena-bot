import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { getSpeciesData } from "../game/data.js";
import { newBattleId } from "../game/battle.js";
import type { Pokemon } from "../game/types.js";

// Pending duels stored in a module-level map (harness is single-process)
// In production this would use Redis-backed persistent store.
const pendingDuels = new Map<string, {
  battleId: string;
  challengerId: number;
  challengerName: string;
  challengerTeam: string[];
  targetId: number;
  stake?: string;
  createdAt: number;
  expiresAt: number;
}>();

export function getPendingDuels() {
  return pendingDuels;
}

const composer = new Composer<Ctx>();

function ensurePlayer(ctx: Ctx): Record<string, unknown> | null {
  return ((ctx.session as Record<string, unknown>).player as Record<string, unknown>) ?? null;
}

function getAllPokemon(ctx: Ctx): Record<string, Pokemon> {
  return ((ctx.session as Record<string, unknown>).allPokemon as Record<string, Pokemon>) ?? {};
}

composer.callbackQuery("pvp:challenge", async (ctx) => {
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

  (ctx.session as Record<string, unknown>).step = "awaiting_duel_target";
  await ctx.editMessageText(
    "🎯 Send a duel challenge!\n\n" +
    "Another player needs to have started the bot first. " +
    "Share your invite link so they can join:\n\n" +
    `Your trainer ID: <code>${ctx.from?.id ?? 0}</code>\n\n` +
    "Tell your opponent to tap /start, then come back and enter their trainer ID.",
  );
});

composer.on("message:text", async (ctx, next) => {
  const session = ctx.session as Record<string, unknown>;
  if (session.step !== "awaiting_duel_target") return next();

  const text = ctx.message.text.trim();
  const targetId = parseInt(text);
  if (isNaN(targetId) || targetId <= 0) {
    await ctx.reply("Please enter a valid trainer ID (a number).");
    return;
  }

  if (targetId === ctx.from?.id) {
    await ctx.reply("You can't challenge yourself! Enter another trainer's ID.");
    return;
  }

  const player = ensurePlayer(ctx);
  const allPokemon = getAllPokemon(ctx);
  const party = (player?.party as string[]) ?? [];
  const battleTeam = party
    .filter((id) => { const p = allPokemon[id]; return p && p.hp > 0; })
    .slice(0, 6);

  if (battleTeam.length === 0) {
    await ctx.reply("None of your Pokémon can battle!");
    session.step = undefined;
    return;
  }

  const battleId = newBattleId();
  pendingDuels.set(battleId, {
    battleId,
    challengerId: ctx.from?.id ?? 0,
    challengerName: player?.trainerName as string ?? "Unknown",
    challengerTeam: battleTeam,
    targetId,
    createdAt: Date.now(),
    expiresAt: Date.now() + 72 * 3600000,
  });

  session.step = undefined;
  session.pendingDuel = { challengerId: ctx.from?.id ?? 0, battleId };

  const teamList = battleTeam.map((id) => {
    const p = allPokemon[id];
    return p ? `${p.nickname} Lv.${p.level}` : "???";
  }).join(", ");

  await ctx.editMessageText(
    `🎯 Duel challenge sent!\n\n` +
    `Battle ID: ${battleId}\n` +
    `Your team: ${teamList}\n\n` +
    `Share the Battle ID with your opponent so they can accept!`,
    {
      reply_markup: inlineKeyboard([
        [inlineButton("⬅️ Back to menu", "menu:main")],
      ]),
    },
  );
});

export default composer;
