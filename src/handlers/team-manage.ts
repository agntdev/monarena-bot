import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { getSpeciesData, MOVES } from "../game/data.js";
import type { Pokemon } from "../game/types.js";

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

composer.callbackQuery("team:manage", async (ctx) => {
  await ctx.answerCallbackQuery();
  const player = ensurePlayer(ctx);
  if (!player) {
    await ctx.editMessageText("You need a trainer profile first! Tap /start.", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    return;
  }

  await showTeam(ctx);
});

async function showTeam(ctx: Ctx) {
  const player = ensurePlayer(ctx)!;
  const allPokemon = getAllPokemon(ctx);
  const party = (player.party as string[]) ?? [];

  if (party.length === 0) {
    await ctx.editMessageText("👥 Your party is empty! Catch or receive Pokémon first.", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    return;
  }

  const lines = party.map((id, i) => {
    const p = allPokemon[id];
    if (!p) return `${i + 1}. ???`;
    const species = getSpeciesData(p.species);
    const type = species ? species.type.charAt(0).toUpperCase() + species.type.slice(1) : "???";
    return `${i + 1}. ${p.nickname} (${type}) Lv.${p.level} — HP: ${p.hp}/${p.maxHp}`;
  });

  const rows: import("../toolkit/ui/keyboard.js").InlineButton[][] = [];
  for (let i = 0; i < party.length; i++) {
    rows.push([inlineButton(`${i + 1}. ${allPokemon[party[i]]?.nickname ?? "???"}`, `team:detail:${i}`)]);
  }
  rows.push([inlineButton("⬅️ Back to menu", "menu:main")]);

  await ctx.editMessageText(
    `👥 Your Team\n\n${lines.join("\n")}\n\nTap a Pokémon to see details.`,
    { reply_markup: inlineKeyboard(rows) },
  );
}

composer.callbackQuery(/^team:detail:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const idx = parseInt(ctx.match![1]);
  const player = ensurePlayer(ctx);
  const allPokemon = getAllPokemon(ctx);
  if (!player) return;

  const party = (player.party as string[]) ?? [];
  const monId = party[idx];
  const mon = monId ? allPokemon[monId] : undefined;
  if (!mon) {
    await ctx.editMessageText("Pokémon not found!", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to team", "team:manage")]]),
    });
    return;
  }

  const species = getSpeciesData(mon.species);
  const type = species ? species.type.charAt(0).toUpperCase() + species.type.slice(1) : "???";
  const moves = mon.moveset.map((m) => {
    const move = MOVES[m];
    return move ? `${move.name} (${move.type})` : m;
  }).join("\n  ");

  const text =
    `📖 ${mon.nickname}\n\n` +
    `Species: ${species?.name ?? mon.species}\n` +
    `Type: ${type}\n` +
    `Level: ${mon.level}  XP: ${mon.xp}\n` +
    `HP: ${mon.hp}/${mon.maxHp}\n` +
    `Atk: ${mon.atk}  Def: ${mon.def}  Spd: ${mon.spd}\n` +
    `Status: ${mon.status ?? "None"}\n` +
    `Moves:\n  ${moves}`;

  const buttons: import("../toolkit/ui/keyboard.js").InlineButton[][] = [];
  if (mon.hp <= 0) {
    buttons.push([inlineButton("💊 Revive", `team:revive:${idx}`)]);
  }
  if (mon.hp < mon.maxHp) {
    buttons.push([inlineButton("💊 Heal", `team:heal:${idx}`)]);
  }
  buttons.push([inlineButton("🔄 Rename", `team:rename:${idx}`)]);
  buttons.push([inlineButton("⬅️ Back to team", "team:manage")]);

  await ctx.editMessageText(text, { reply_markup: inlineKeyboard(buttons) });
});

composer.callbackQuery(/^team:heal:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const idx = parseInt(ctx.match![1]);
  const player = ensurePlayer(ctx);
  const allPokemon = getAllPokemon(ctx);
  if (!player) return;

  const inv = player.inventory as Record<string, number>;
  const party = (player.party as string[]) ?? [];
  const monId = party[idx];
  const mon = monId ? allPokemon[monId] : undefined;
  if (!mon) return;

  if (mon.hp >= mon.maxHp) {
    await ctx.reply(`${mon.nickname} is already at full health!`);
    return;
  }

  if ((inv.potion ?? 0) > 0) {
    inv.potion--;
    mon.hp = Math.min(mon.maxHp, mon.hp + 20);
    saveAllPokemon(ctx, allPokemon);
    await ctx.reply(`Used a Potion on ${mon.nickname}! (${mon.hp}/${mon.maxHp} HP)`);
  } else if ((inv.superPotion ?? 0) > 0) {
    inv.superPotion--;
    mon.hp = Math.min(mon.maxHp, mon.hp + 50);
    saveAllPokemon(ctx, allPokemon);
    await ctx.reply(`Used a Super Potion on ${mon.nickname}! (${mon.hp}/${mon.maxHp} HP)`);
  } else {
    await ctx.reply("No potions left! Visit the shop.");
  }
});

composer.callbackQuery(/^team:revive:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const idx = parseInt(ctx.match![1]);
  const player = ensurePlayer(ctx);
  const allPokemon = getAllPokemon(ctx);
  if (!player) return;

  const inv = player.inventory as Record<string, number>;
  const party = (player.party as string[]) ?? [];
  const monId = party[idx];
  const mon = monId ? allPokemon[monId] : undefined;
  if (!mon || mon.hp > 0) return;

  if ((inv.revive ?? 0) > 0) {
    inv.revive--;
    mon.hp = Math.floor(mon.maxHp / 2);
    mon.status = null;
    saveAllPokemon(ctx, allPokemon);
    await ctx.reply(`Used a Revive on ${mon.nickname}! (${mon.hp}/${mon.maxHp} HP)`);
  } else {
    await ctx.reply("No Revives left!");
  }
});

composer.callbackQuery(/^team:rename:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const idx = parseInt(ctx.match![1]);
  (ctx.session as Record<string, unknown>).step = "awaiting_rename";
  (ctx.session as Record<string, unknown>).renameIdx = idx;
  await ctx.editMessageText("What nickname? (2-12 characters)");
});

composer.on("message:text", async (ctx, next) => {
  const session = ctx.session as Record<string, unknown>;
  if (session.step !== "awaiting_rename") return next();

  const name = ctx.message.text.trim();
  if (name.length < 2 || name.length > 12) {
    await ctx.reply("Name needs 2–12 characters. Try again!");
    return;
  }

  const idx = session.renameIdx as number;
  const player = ensurePlayer(ctx);
  if (!player) return next();

  const allPokemon = getAllPokemon(ctx);
  const party = (player.party as string[]) ?? [];
  const monId = party[idx];
  const mon = monId ? allPokemon[monId] : undefined;
  if (mon) {
    mon.nickname = name;
    saveAllPokemon(ctx, allPokemon);
  }

  session.step = undefined;
  session.renameIdx = undefined;
  await ctx.reply(`${mon?.nickname ?? "Pokémon"} renamed to ${name}!`);
});

export default composer;
