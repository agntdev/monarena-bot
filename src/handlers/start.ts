import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { mainMenuKeyboard, registerMainMenuItem, inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { SPECIES, STARTER_ITEMS } from "../game/data.js";
import { getPlayer, createPlayer } from "../game/storage.js";

const WELCOME = "👋 Welcome! Tap a button below to get started.";

const composer = new Composer<Ctx>();

// Register main menu items
registerMainMenuItem({ label: "📖 Pokédex", data: "pokedex:view", order: 10 });
registerMainMenuItem({ label: "⚔️ Gym", data: "gym:challenge", order: 20 });
registerMainMenuItem({ label: "👥 Team", data: "team:manage", order: 30 });
registerMainMenuItem({ label: "🏟️ Duel", data: "pvp:challenge", order: 40 });
registerMainMenuItem({ label: "✅ Accept Duel", data: "pvp:accept", order: 50 });

composer.command("start", async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  const player = getPlayer(userId);
  if (!player) {
    // New player — start onboarding
    ctx.session.step = "onboarding_name";
    const starterList = ["bulbasaur", "charmander", "squirtle"];
    const buttons = starterList.map(s => {
      const sp = SPECIES[s];
      return [inlineButton(`${sp.name} (${sp.type})`, `starter:${s}`)];
    });
    await ctx.reply("👋 Welcome, new Trainer! First, pick your starter Pokémon:", {
      reply_markup: inlineKeyboard(buttons),
    });
    return;
  }

  await ctx.reply(WELCOME, { reply_markup: mainMenuKeyboard() });
});

// Starter selection
composer.callbackQuery(/^starter:(.+)$/, async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;
  await ctx.answerCallbackQuery();

  const species = ctx.match?.[1];
  if (!species || !SPECIES[species]) return;

  ctx.session.data = { ...(ctx.session.data ?? {}), starter: species };
  ctx.session.step = "onboarding_name";

  const sp = SPECIES[species];
  await ctx.reply(`Great choice! ${sp.name} will be your partner.\n\nNow, what's your trainer name?`, {
    reply_markup: { force_reply: true, input_field_placeholder: "Type your trainer name…" },
  });
});

// Trainer name input
composer.on("message:text", async (ctx, next) => {
  if (ctx.session.step !== "onboarding_name") return next();

  const name = ctx.message.text.trim();
  if (name.length < 2 || name.length > 20) {
    await ctx.reply("Name should be 2–20 characters. Try again:");
    return;
  }

  const starter = (ctx.session.data as Record<string, unknown>)?.starter as string | undefined;
  if (!starter) {
    await ctx.reply("Something went wrong. Tap /start to try again.");
    ctx.session.step = undefined;
    return;
  }

  const userId = ctx.from?.id;
  if (!userId) return;

  const player = createPlayer(userId, name, starter);
  ctx.session.step = undefined;
  ctx.session.data = undefined;

  const sp = SPECIES[starter];
  await ctx.reply(
    `🎉 Welcome, ${name}!\n\n${sp.name} is now in your party. Here's what you got:\n` +
    STARTER_ITEMS.map(i => `• ${i.replace(/_/g, " ")}`).join("\n") +
    "\n\nTap a button below to begin your adventure!",
    { reply_markup: mainMenuKeyboard() },
  );
});

// Back to menu
composer.callbackQuery("menu:main", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(WELCOME, { reply_markup: mainMenuKeyboard() });
});

export default composer;
