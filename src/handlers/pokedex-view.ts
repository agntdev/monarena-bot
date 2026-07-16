import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, paginate } from "../toolkit/index.js";
import { SPECIES, getSpeciesData, MOVES } from "../game/data.js";

const PAGE_SIZE = 5;

const composer = new Composer<Ctx>();

composer.callbackQuery("pokedex:view", async (ctx) => {
  await ctx.answerCallbackQuery();
  await showPokedex(ctx, 0);
});

composer.callbackQuery(/^pokedex:prev:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  await showPokedex(ctx, parseInt(ctx.match![1]));
});

composer.callbackQuery(/^pokedex:next:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  await showPokedex(ctx, parseInt(ctx.match![1]));
});

composer.callbackQuery(/^pokedex:detail:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const speciesId = ctx.match![1];
  const species = getSpeciesData(speciesId);
  if (!species) {
    await ctx.editMessageText("Pokémon not found.", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to Pokédex", "pokedex:view")]]),
    });
    return;
  }

  const type = species.type.charAt(0).toUpperCase() + species.type.slice(1);
  const moves = species.moves.map((m) => {
    const move = MOVES[m];
    return move ? move.name : m;
  }).join(", ");

  const text =
    `📖 ${species.name}\n\n` +
    `Type: ${type}\n` +
    `HP: ${species.baseHp}  Atk: ${species.baseAtk}  Def: ${species.baseDef}  Spd: ${species.baseSpd}\n` +
    `Moves: ${moves}` +
    (species.evolvesTo ? `\nEvolves: ${getSpeciesData(species.evolvesTo)?.name ?? species.evolvesTo} (Lv.${species.evolveLevel})` : "");

  await ctx.editMessageText(text, {
    reply_markup: inlineKeyboard([
      [inlineButton("⬅️ Back to Pokédex", "pokedex:view")],
      [inlineButton("⬅️ Back to menu", "menu:main")],
    ]),
  });
});

async function showPokedex(ctx: Ctx, page: number) {
  const allSpecies = Object.values(SPECIES);
  const { pageItems, controls, totalPages } = paginate(allSpecies, {
    page,
    perPage: PAGE_SIZE,
    callbackPrefix: "pokedex",
  });

  const lines = pageItems.map((sp) => {
    const type = sp.type.charAt(0).toUpperCase() + sp.type.slice(1);
    return `${sp.name} — ${type} (HP:${sp.baseHp} Atk:${sp.baseAtk})`;
  });

  const rows = pageItems.map((sp) => [
    inlineButton(`${sp.name}`, `pokedex:detail:${sp.id}`),
  ]);

  const keyboard = inlineKeyboard([
    ...rows,
    ...controls.inline_keyboard,
    [inlineButton("⬅️ Back to menu", "menu:main")],
  ]);

  const text = `📖 Pokédex — Page ${page + 1}/${totalPages}\n\n${lines.join("\n")}`;
  await ctx.editMessageText(text, { reply_markup: keyboard });
}

export default composer;
