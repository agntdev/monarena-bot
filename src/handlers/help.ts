import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";

const composer = new Composer<Ctx>();

const HELP =
  "ℹ️ Pokémon Battle RPG — How to Play\n\n" +
  "• Tap /start to open the main menu\n" +
  "• 📖 Pokédex — Browse all Pokémon species\n" +
  "• ⚔️ Challenge Gym — Battle gym leaders for XP & rewards\n" +
  "• 👥 Manage Team — Check your Pokémon, heal, rename\n" +
  "• 🎯 Issue Duel — Challenge another trainer\n" +
  "• ✅ Accept Duel — Accept a pending challenge\n\n" +
  "Everything is button-driven — just tap!";

const backToMenu = inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]);

composer.command("help", async (ctx) => {
  await ctx.reply(HELP);
});

composer.callbackQuery("menu:help", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(HELP, { reply_markup: backToMenu });
});

export default composer;
