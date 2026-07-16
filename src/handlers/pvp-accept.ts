import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { SPECIES, xpToNextLevel, calcHp } from "../game/data.js";
import { getPlayer, savePlayer, getAllPlayers, type PokemonData } from "../game/storage.js";
import { resolvePvpBattle } from "../game/battle.js";

const composer = new Composer<Ctx>();

composer.callbackQuery("pvp:accept", async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;
  await ctx.answerCallbackQuery();

  const player = getPlayer(userId);
  if (!player || player.party.length === 0) {
    await ctx.reply("You need Pokémon in your party! Tap 👥 Team first.", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    return;
  }

  const others = getAllPlayers().filter(p => p.id !== userId && p.party.length > 0);

  if (others.length === 0) {
    await ctx.reply("No other trainers to battle right now. Try again later!", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    return;
  }

  const buttons = others.map(p => [
    inlineButton(`${p.trainerName} (Lv.${p.rank})`, `pvp:accept:${p.id}`),
  ]);
  buttons.push([inlineButton("⬅️ Back to menu", "menu:main")]);

  await ctx.reply("✅ Choose a trainer to battle:", {
    reply_markup: inlineKeyboard(buttons),
  });
});

function grantXp(pokemon: PokemonData, xpGain: number): string | null {
  pokemon.xp += xpGain;
  const needed = xpToNextLevel(pokemon.level);
  if (pokemon.xp >= needed) {
    pokemon.level++;
    pokemon.xp -= needed;
    const sp = SPECIES[pokemon.species];
    if (sp) {
      const oldMax = pokemon.maxHp;
      pokemon.maxHp = calcHp(pokemon.level, sp.baseHp);
      pokemon.hp += pokemon.maxHp - oldMax;
      return `📈 ${pokemon.nickname} grew to level ${pokemon.level}!`;
    }
  }
  return null;
}

composer.callbackQuery(/^pvp:accept:(\d+)$/, async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;
  await ctx.answerCallbackQuery();

  const targetId = parseInt(ctx.match?.[1] ?? "0", 10);
  const player = getPlayer(userId);
  const target = getPlayer(targetId);

  if (!player || !target) return;

  const challengerTeam = player.party
    .map(pid => player.pokemon[pid])
    .filter(Boolean);
  const defenderTeam = target.party
    .map(pid => target.pokemon[pid])
    .filter(Boolean);

  const { winner, log } = resolvePvpBattle(challengerTeam as any, defenderTeam as any);

  if (winner === "challenger") {
    for (const pid of player.party) {
      const p = player.pokemon[pid];
      if (p) {
        const msg = grantXp(p, 100);
        if (msg) log.push(msg);
      }
    }
    player.rank++;
  } else {
    for (const pid of target.party) {
      const p = target.pokemon[pid];
      if (p) {
        const msg = grantXp(p, 50);
        if (msg) log.push(msg);
      }
    }
    target.rank++;
  }

  savePlayer(player);
  savePlayer(target);

  const maxLen = 3000;
  let resultText = `🏟️ ${player.trainerName} vs ${target.trainerName}\n\n${log.join("\n")}`;
  if (resultText.length > maxLen) {
    resultText = resultText.slice(0, maxLen - 20) + "\n... (truncated)";
  }

  await ctx.reply(resultText, {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
  });
});

export default composer;
