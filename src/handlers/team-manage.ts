import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { SPECIES, MOVES, calcHp, calcStat } from "../game/data.js";
import { getPlayer, savePlayer, type PlayerData, type PokemonData } from "../game/storage.js";

const composer = new Composer<Ctx>();

composer.callbackQuery("team:manage", async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;
  await ctx.answerCallbackQuery();

  const player = getPlayer(userId);
  if (!player) {
    await ctx.reply("Tap /start to begin your adventure first.");
    return;
  }

  if (player.party.length === 0) {
    await ctx.reply("Your party is empty! Tap /start to choose a starter.", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    return;
  }

  await showTeam(ctx, player);
});

composer.callbackQuery(/^team:view:(.+)$/, async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;
  await ctx.answerCallbackQuery();

  const pokemonId = ctx.match?.[1];
  const player = getPlayer(userId);
  if (!player || !pokemonId) return;

  const pokemon = player.pokemon[pokemonId];
  if (!pokemon) return;

  const sp = SPECIES[pokemon.species];
  const atk = sp ? calcStat(sp.baseAtk, pokemon.level) : 0;
  const def = sp ? calcStat(sp.baseDef, pokemon.level) : 0;
  const spd = sp ? calcStat(sp.baseSpd, pokemon.level) : 0;

  const lines = [
    `⭐ ${pokemon.nickname} (Lv.${pokemon.level})`,
    `HP: ${pokemon.hp}/${pokemon.maxHp}`,
    `ATK: ${atk}  DEF: ${def}  SPD: ${spd}`,
    `Type: ${sp?.type ?? "???"}`,
    `Moves: ${pokemon.moves.map(m => MOVES[m]?.name ?? m).join(", ")}`,
    pokemon.status ? `Status: ${pokemon.status}` : "",
  ].filter(Boolean);

  const buttons = [
    [inlineButton("📜 Rename", `team:rename:${pokemonId}`)],
    [inlineButton("📚 Change moves", `team:moves:${pokemonId}`)],
    [inlineButton("⬅️ Back to team", "team:manage")],
  ];

  await ctx.reply(lines.join("\n"), {
    reply_markup: inlineKeyboard(buttons),
  });
});

composer.callbackQuery(/^team:rename:(.+)$/, async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;
  await ctx.answerCallbackQuery();

  const pokemonId = ctx.match?.[1];
  ctx.session.step = "team_rename";
  ctx.session.data = { pokemonId };

  await ctx.reply("What should this Pokémon be called?", {
    reply_markup: { force_reply: true, input_field_placeholder: "New nickname…" },
  });
});

composer.on("message:text", async (ctx, next) => {
  if (ctx.session.step !== "team_rename") return next();

  const name = ctx.message.text.trim();
  if (name.length < 1 || name.length > 20) {
    await ctx.reply("Nickname should be 1–20 characters. Try again:");
    return;
  }

  const userId = ctx.from?.id;
  if (!userId) return;
  const pokemonId = (ctx.session.data as Record<string, unknown>)?.pokemonId as string;
  const player = getPlayer(userId);
  if (!player || !pokemonId) {
    ctx.session.step = undefined;
    return;
  }

  const pokemon = player.pokemon[pokemonId];
  if (pokemon) {
    pokemon.nickname = name;
    savePlayer(player);
  }

  ctx.session.step = undefined;
  ctx.session.data = undefined;

  await ctx.reply(`✅ ${name} is a great name!`, {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to team", "team:manage")]]),
  });
});

composer.callbackQuery(/^team:moves:(.+)$/, async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;
  await ctx.answerCallbackQuery();

  const pokemonId = ctx.match?.[1];
  const player = getPlayer(userId);
  if (!player || !pokemonId) return;

  const pokemon = player.pokemon[pokemonId];
  if (!pokemon) return;

  const sp = SPECIES[pokemon.species];
  if (!sp) return;

  const allMoves = sp.moves;
  const buttons = allMoves.map(m => {
    const move = MOVES[m];
    const inTeam = pokemon.moves.includes(m);
    return [inlineButton(`${inTeam ? "✓ " : ""}${move?.name ?? m} (${move?.type ?? "?"})`, `team:toggle:${pokemonId}:${m}`)];
  });

  buttons.push([inlineButton("⬅️ Back", `team:view:${pokemonId}`)]);

  await ctx.reply(`📚 Select moves for ${pokemon.nickname} (tap to toggle, max 4):`, {
    reply_markup: inlineKeyboard(buttons),
  });
});

composer.callbackQuery(/^team:toggle:([^:]+):(.+)$/, async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;
  await ctx.answerCallbackQuery();

  const pokemonId = ctx.match?.[1];
  const moveName = ctx.match?.[2];
  const player = getPlayer(userId);
  if (!player || !pokemonId || !moveName) return;

  const pokemon = player.pokemon[pokemonId];
  if (!pokemon) return;

  const idx = pokemon.moves.indexOf(moveName);
  if (idx >= 0) {
    pokemon.moves.splice(idx, 1);
  } else if (pokemon.moves.length < 4) {
    pokemon.moves.push(moveName);
  } else {
    await ctx.answerCallbackQuery({ text: "Max 4 moves!" });
    return;
  }

  savePlayer(player);

  // Re-show moves list
  const sp = SPECIES[pokemon.species];
  if (!sp) return;
  const allMoves = sp.moves;
  const buttons = allMoves.map(m => {
    const move = MOVES[m];
    const inTeam = pokemon.moves.includes(m);
    return [inlineButton(`${inTeam ? "✓ " : ""}${move?.name ?? m} (${move?.type ?? "?"})`, `team:toggle:${pokemonId}:${m}`)];
  });
  buttons.push([inlineButton("⬅️ Back", `team:view:${pokemonId}`)]);

  await ctx.editMessageText(`📚 Select moves for ${pokemon.nickname} (tap to toggle, max 4):`, {
    reply_markup: inlineKeyboard(buttons),
  });
});

async function showTeam(ctx: Ctx, player: PlayerData) {
  const lines = [`👥 ${player.trainerName}'s team:`];
  const buttons: ReturnType<typeof inlineButton>[][] = [];

  for (const pid of player.party) {
    const pokemon = player.pokemon[pid];
    if (!pokemon) continue;
    const sp = SPECIES[pokemon.species];
    lines.push(`• ${pokemon.nickname} (Lv.${pokemon.level} ${sp?.type ?? "?"}) — HP ${pokemon.hp}/${pokemon.maxHp}`);
    buttons.push([inlineButton(`${pokemon.nickname} (Lv.${pokemon.level})`, `team:view:${pid}`)]);
  }

  if (player.badges.length > 0) {
    lines.push(`\n🏅 Badges: ${player.badges.join(", ")}`);
  }

  buttons.push([inlineButton("⬅️ Back to menu", "menu:main")]);

  await ctx.reply(lines.join("\n"), {
    reply_markup: inlineKeyboard(buttons),
  });
}

export default composer;
