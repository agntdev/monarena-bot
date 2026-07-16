import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";

const composer = new Composer<Ctx>();

const HELP =
  "ℹ️ Pokémon Battle RPG Bot\n\n" +
  "Tap /start to open the menu, then pick what you want from the buttons.\n\n" +
  "• 📖 Pokédex — Browse all Pokémon species\n" +
  "• ⚔️ Gym — Challenge gym leaders for badges\n" +
  "• 👥 Team — Manage your party and moves\n" +
  "• 🏟️ Duel — Battle other trainers\n\n" +
  "Everything is button-driven — just tap to play!";

const backToMenu = inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]);

composer.command("help", async (ctx) => {
  await ctx.reply(HELP);
});

composer.callbackQuery("menu:help", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(HELP, { reply_markup: backToMenu });
});

export default composer;
