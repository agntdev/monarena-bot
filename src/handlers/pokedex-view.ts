import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, paginate } from "../toolkit/index.js";
import { SPECIES } from "../game/data.js";

const composer = new Composer<Ctx>();

const speciesList = Object.entries(SPECIES).map(([key, sp]) => ({
  key,
  name: sp.name,
  type: sp.type,
  baseHp: sp.baseHp,
  baseAtk: sp.baseAtk,
  baseDef: sp.baseDef,
  baseSpd: sp.baseSpd,
  moves: sp.moves,
}));

composer.callbackQuery("pokedex:view", async (ctx) => {
  await ctx.answerCallbackQuery();
  await showPage(ctx, 0);
});

composer.callbackQuery(/^pokedex:page:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const page = parseInt(ctx.match?.[1] ?? "0", 10);
  await showPage(ctx, page);
});

composer.callbackQuery(/^pokedex:detail:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const key = ctx.match?.[1];
  const sp = SPECIES[key ?? ""];
  if (!sp) {
    await ctx.reply("That species not found.");
    return;
  }

  const text = [
    `📖 ${sp.name} (#${sp.id})`,
    `Type: ${sp.type}`,
    `HP: ${sp.baseHp}  ATK: ${sp.baseAtk}  DEF: ${sp.baseDef}  SPD: ${sp.baseSpd}`,
    `Moves: ${sp.moves.join(", ")}`,
  ].join("\n");

  await ctx.reply(text, {
    reply_markup: inlineKeyboard([
      [inlineButton("⬅️ Back to Pokédex", "pokedex:view")],
    ]),
  });
});

async function showPage(ctx: Ctx, page: number) {
  const { pageItems, page: actualPage, totalPages, controls } = paginate(speciesList, {
    page,
    perPage: 5,
    callbackPrefix: "pokedex:page",
    nextLabel: "Next »",
    prevLabel: "« Prev",
  });

  const rows = pageItems.map(sp => [
    inlineButton(`${sp.name} (${sp.type})`, `pokedex:detail:${sp.key}`),
  ]);

  const kb = inlineKeyboard([
    ...rows,
    ...controls.inline_keyboard,
    [inlineButton("⬅️ Back to menu", "menu:main")],
  ]);

  const text = `📖 Pokédex — page ${actualPage + 1}/${totalPages}\nTap a Pokémon to see details.`;

  if (ctx.callbackQuery?.message?.message_id) {
    await ctx.editMessageText(text, { reply_markup: kb });
  } else {
    await ctx.reply(text, { reply_markup: kb });
  }
}

export default composer;
