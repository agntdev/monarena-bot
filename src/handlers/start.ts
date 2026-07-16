import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { mainMenuKeyboard, registerMainMenuItem, inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { STARTERS, ITEMS, SPECIES, createPokemon, getSpeciesData } from "../game/data.js";

// Register main menu buttons
registerMainMenuItem({ label: "📖 Pokédex", data: "pokedex:view", order: 10 });
registerMainMenuItem({ label: "⚔️ Challenge Gym", data: "gym:challenge", order: 20 });
registerMainMenuItem({ label: "👥 Manage Team", data: "team:manage", order: 30 });
registerMainMenuItem({ label: "🎯 Issue Duel", data: "pvp:challenge", order: 40 });
registerMainMenuItem({ label: "✅ Accept Duel", data: "pvp:accept", order: 50 });

const WELCOME = "👋 Welcome to Pokémon Battle RPG!\n\nTap a button below to get started.";

function ensurePlayer(ctx: Ctx): boolean {
  const session = ctx.session as Record<string, unknown>;
  return !!session.player;
}

function savePlayer(ctx: Ctx, player: Record<string, unknown>): void {
  (ctx.session as Record<string, unknown>).player = player;
}

function getPlayer(ctx: Ctx): Record<string, unknown> | null {
  return ((ctx.session as Record<string, unknown>).player as Record<string, unknown>) ?? null;
}

const composer = new Composer<Ctx>();

composer.command("start", async (ctx) => {
  const player = getPlayer(ctx);
  if (player) {
    await ctx.reply(WELCOME, { reply_markup: mainMenuKeyboard() });
    return;
  }

  // Start onboarding
  (ctx.session as Record<string, unknown>).step = "awaiting_starter";
  const starterRows = STARTERS.map((id) => {
    const sp = getSpeciesData(id)!;
    const types = sp.type.charAt(0).toUpperCase() + sp.type.slice(1);
    return [inlineButton(`${sp.name} (${types})`, `starter:${id}`)];
  });

  await ctx.reply(
    "🎒 Hey there, Trainer!\n\n" +
    "Pick your starter Pokémon — this one will begin your journey!",
    { reply_markup: inlineKeyboard(starterRows) },
  );
});

composer.callbackQuery(/^starter:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  if (ensurePlayer(ctx)) {
    await ctx.editMessageText("You already have a starter! Check your team.", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    return;
  }

  const speciesId = ctx.match![1];
  const species = getSpeciesData(speciesId);
  if (!species) {
    await ctx.editMessageText("Hmm, that Pokémon isn't available. Try again!", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    return;
  }

  (ctx.session as Record<string, unknown>).pendingStarter = speciesId;
  (ctx.session as Record<string, unknown>).step = "awaiting_name";

  const types = species.type.charAt(0).toUpperCase() + species.type.slice(1);
  await ctx.editMessageText(
    `Great choice — ${species.name} the ${types} type!\n\n` +
    `Now, what's your trainer name? (2-20 characters)`,
  );
});

composer.on("message:text", async (ctx, next) => {
  const session = ctx.session as Record<string, unknown>;
  if (session.step !== "awaiting_name") return next();

  const name = ctx.message.text.trim();
  if (name.length < 2 || name.length > 20) {
    await ctx.reply("Name needs 2–20 characters. Try again!");
    return;
  }

  const speciesId = session.pendingStarter as string;
  const starter = createPokemon(speciesId, 5);

  const player = {
    telegramId: ctx.from?.id ?? 0,
    trainerName: name,
    rank: "Rookie",
    inventory: { potion: 3, pokeball: 5 } as Record<string, number>,
    party: [starter.id],
    allPokemon: [starter.id],
  };

  const allPokemon: Record<string, import("../game/types.js").Pokemon> = {};
  allPokemon[starter.id] = starter;

  savePlayer(ctx, player);
  (ctx.session as Record<string, unknown>).allPokemon = allPokemon;
  (ctx.session as Record<string, unknown>).step = undefined;
  (ctx.session as Record<string, unknown>).pendingStarter = undefined;

  const species = getSpeciesData(speciesId)!;
  await ctx.reply(
    `🎉 Welcome, ${name}! You received ${species.name} as your starter!\n\n` +
    `Here's what you got:\n` +
    `• 3 Potions\n` +
    `• 5 Poké Balls\n\n` +
    `Tap a button below to start your adventure!`,
    { reply_markup: mainMenuKeyboard() },
  );
});

composer.callbackQuery("menu:main", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(WELCOME, { reply_markup: mainMenuKeyboard() });
});

export default composer;
