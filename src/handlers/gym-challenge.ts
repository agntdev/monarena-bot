import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, confirmKeyboard } from "../toolkit/index.js";
import { GYMS, SPECIES, calcHp, calcStat, xpToNextLevel } from "../game/data.js";
import { getPlayer, savePlayer, type PlayerData } from "../game/storage.js";
import { resolvePveBattle } from "../game/battle.js";

const composer = new Composer<Ctx>();

composer.callbackQuery("gym:challenge", async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;
  await ctx.answerCallbackQuery();

  const player = getPlayer(userId);
  if (!player) {
    await ctx.reply("Tap /start to begin your adventure first.");
    return;
  }

  const now = Date.now();
  const available = GYMS.filter(g => {
    const cooldown = player.gymCooldowns[g.id] ?? 0;
    return now >= cooldown;
  });

  if (available.length === 0) {
    const nextGym = GYMS.find(g => (player.gymCooldowns[g.id] ?? 0) > now);
    const nextTime = nextGym ? new Date((player.gymCooldowns[nextGym.id] ?? 0)).toLocaleString() : "later";
    await ctx.reply(`All gyms are on cooldown. Try again ${nextTime}.`, {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    return;
  }

  const buttons = available.map(g => {
    const cleared = player.badges.includes(g.badge);
    return [inlineButton(`${cleared ? "✓ " : ""}${g.leader} (${g.name})`, `gym:select:${g.id}`)];
  });
  buttons.push([inlineButton("⬅️ Back to menu", "menu:main")]);

  await ctx.reply("⚔️ Which gym do you want to challenge?", {
    reply_markup: inlineKeyboard(buttons),
  });
});

composer.callbackQuery(/^gym:select:(.+)$/, async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;
  await ctx.answerCallbackQuery();

  const gymId = ctx.match?.[1];
  const gym = GYMS.find(g => g.id === gymId);
  if (!gym) return;

  const player = getPlayer(userId);
  if (!player) return;

  const pokemonInfo = gym.pokemon.map(p => {
    const sp = SPECIES[p.species];
    return `${sp?.name ?? p.species} (Lv.${p.level})`;
  }).join(", ");

  const myInfo = player.party.map(pid => {
    const p = player.pokemon[pid];
    if (!p) return null;
    const sp = SPECIES[p.species];
    return `${p.nickname} Lv.${p.level}`;
  }).filter(Boolean).join(", ");

  await ctx.reply(
    `⚔️ ${gym.leader}'s ${gym.name}\n\n` +
    `Leader's team: ${pokemonInfo}\n\n` +
    `Your team: ${myInfo || "No team! Manage your team first."}`,
    {
      reply_markup: confirmKeyboard(`gym:fight:${gymId}`, { yes: "⚔️ Fight!", no: "⬅️ Back" }),
    },
  );
});

composer.callbackQuery(/^gym:fight:(.+):yes$/, async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;
  await ctx.answerCallbackQuery();

  const gymId = ctx.match?.[1];
  const gym = GYMS.find(g => g.id === gymId);
  if (!gym) return;

  const player = getPlayer(userId);
  if (!player || player.party.length === 0) {
    await ctx.reply("You need Pokémon in your party! Tap 👥 Team to manage.");
    return;
  }

  // Get player team with current HP
  const team = player.party.map(pid => player.pokemon[pid]).filter(Boolean);
  if (team.length === 0) {
    await ctx.reply("Your team is empty! Tap 👥 Team to manage.");
    return;
  }

  const { winner, log, xpReward } = resolvePveBattle(team, gym.pokemon, player.trainerName, gym.leader);

  // Apply results
  if (winner === "player") {
    if (!player.badges.includes(gym.badge)) {
      player.badges.push(gym.badge);
    }
    player.gymCooldowns[gym.id] = Date.now() + 60 * 60 * 1000; // 1 hour cooldown

    // Distribute XP and check for level ups
    for (const pid of player.party) {
      const p = player.pokemon[pid];
      if (!p || p.hp <= 0) continue;
      p.xp += xpReward;
      const needed = xpToNextLevel(p.level);
      if (p.xp >= needed) {
        p.level++;
        p.xp -= needed;
        const sp = SPECIES[p.species];
        if (sp) {
          const oldMaxHp = p.maxHp;
          p.maxHp = calcHp(p.level, sp.baseHp);
          p.hp += p.maxHp - oldMaxHp;
          log.push(`📈 ${p.nickname} grew to level ${p.level}!`);
        }
      }
    }

    // Give reward items
    for (const item of gym.rewards.items) {
      player.inventory[item] = (player.inventory[item] ?? 0) + 1;
    }

    // Heal team after battle
    for (const pid of player.party) {
      const p = player.pokemon[pid];
      if (p) p.hp = p.maxHp;
    }
  } else {
    // On loss, partially heal
    for (const pid of player.party) {
      const p = player.pokemon[pid];
      if (p) p.hp = Math.max(1, Math.floor(p.maxHp / 2));
    }
  }

  savePlayer(player);

  // Show result
  const maxLen = 3000;
  let resultText = log.join("\n");
  if (resultText.length > maxLen) {
    resultText = resultText.slice(0, maxLen - 20) + "\n... (truncated)";
  }

  if (winner === "player") {
    resultText += `\n\n🏆 +${xpReward} XP | Items: ${gym.rewards.items.map(i => i.replace(/_/g, " ")).join(", ")}`;
  }

  await ctx.reply(resultText, {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
  });
});

composer.callbackQuery(/^gym:fight:(.+):no$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText("Maybe next time!", {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
  });
});

export default composer;
