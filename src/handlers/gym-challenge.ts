import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { GYMS, ITEMS, createPokemon, getSpeciesData, speciesName } from "../game/data.js";
import { applyMove, isFainted, gainXp, getEffectiveSpd, newBattleId, chooseAiMove, useItem } from "../game/battle.js";
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

composer.callbackQuery("gym:challenge", async (ctx) => {
  await ctx.answerCallbackQuery();
  const player = ensurePlayer(ctx);
  if (!player) {
    await ctx.editMessageText("You need a trainer profile first! Tap /start.", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    return;
  }

  const gymRows = Object.values(GYMS).map((g) => [
    inlineButton(`${g.name} (${g.leader})`, `gym:select:${g.id}`),
  ]);

  await ctx.editMessageText("⚔️ Choose a gym to challenge!", {
    reply_markup: inlineKeyboard([
      ...gymRows,
      [inlineButton("⬅️ Back to menu", "menu:main")],
    ]),
  });
});

composer.callbackQuery(/^gym:select:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const gymId = ctx.match![1];
  const gym = GYMS[gymId];
  if (!gym) {
    await ctx.editMessageText("Gym not found!", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    return;
  }

  const roster = gym.roster.map((r) => `${speciesName(r.speciesId)} Lv.${r.level}`).join(", ");
  await ctx.editMessageText(
    `🏟️ ${gym.name}\nLeader: ${gym.leader}\n\nRoster: ${roster}\n\nReady to battle?`,
    {
      reply_markup: inlineKeyboard([
        [inlineButton("⚔️ Start Battle!", `gym:fight:${gymId}`)],
        [inlineButton("⬅️ Back to gyms", "gym:challenge")],
      ]),
    },
  );
});

composer.callbackQuery(/^gym:fight:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const gymId = ctx.match![1];
  const gym = GYMS[gymId];
  const player = ensurePlayer(ctx);
  if (!gym || !player) {
    await ctx.editMessageText("Something went wrong.", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    return;
  }

  const allPokemon = getAllPokemon(ctx);
  const party = (player.party as string[]) ?? [];
  const aliveParty = party.filter((id) => {
    const p = allPokemon[id];
    return p && p.hp > 0;
  });

  if (aliveParty.length === 0) {
    await ctx.editMessageText("None of your Pokémon can battle! Heal them first.", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    return;
  }

  const gymTeam: Pokemon[] = gym.roster.map((r) => createPokemon(r.speciesId, r.level));

  const battleId = newBattleId();
  const playerTeamIds = [...aliveParty];
  const battle = {
    id: battleId,
    type: "pve",
    participants: [ctx.from?.id ?? 0],
    teams: { [ctx.from?.id ?? 0]: playerTeamIds },
    currentTurn: 0,
    turnOrder: [ctx.from?.id ?? 0],
    actionLog: [] as string[],
    status: "active",
    winner: null as number | null,
    createdAt: Date.now(),
    expiresAt: Date.now() + 3600000,
    gymId,
    gymTeam,
    playerTeamIdx: 0,
    gymTeamIdx: 0,
  };

  (ctx.session as Record<string, unknown>).battleId = battleId;
  (ctx.session as Record<string, unknown>).currentBattle = battle;
  (ctx.session as Record<string, unknown>).step = "battle_turn";

  const playerMon = allPokemon[playerTeamIds[0]];
  const gymMon = gymTeam[0];

  await ctx.editMessageText(
    `⚔️ Battle Start!\n\n` +
    `Your ${playerMon?.nickname ?? "Pokémon"} (${playerMon?.hp ?? 0}/${playerMon?.maxHp ?? 0} HP) vs ` +
    `${gymMon.nickname} (${gymMon.hp}/${gymMon.maxHp} HP)\n\n` +
    `Choose your action!`,
    { reply_markup: buildBattleKeyboard(playerMon, battle as any) },
  );
});

composer.callbackQuery(/^battle:move:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const moveId = ctx.match![1];
  const session = ctx.session as Record<string, unknown>;
  const battle = session.currentBattle as any;
  if (!battle || battle.status !== "active") {
    await ctx.editMessageText("No active battle!", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    return;
  }

  const allPokemon = getAllPokemon(ctx);
  const playerTeam = battle.teams[ctx.from?.id ?? 0] as string[];
  const playerMon = allPokemon[playerTeam[battle.playerTeamIdx]];
  const gymMon = battle.gymTeam[battle.gymTeamIdx] as Pokemon;

  if (!playerMon || !gymMon) {
    await ctx.editMessageText("Battle error!", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    return;
  }

  const log: string[] = [];
  const playerFirst = getEffectiveSpd(playerMon) >= getEffectiveSpd(gymMon);

  if (playerFirst) {
    log.push(...applyMove(playerMon, gymMon, moveId));
    if (!isFainted(gymMon)) {
      log.push(...applyMove(gymMon, playerMon, chooseAiMove(gymMon, playerMon)));
    }
  } else {
    log.push(...applyMove(gymMon, playerMon, chooseAiMove(gymMon, playerMon)));
    if (!isFainted(playerMon)) {
      log.push(...applyMove(playerMon, gymMon, moveId));
    }
  }

  if (isFainted(gymMon)) {
    log.push(`${gymMon.nickname} fainted!`);
    battle.gymTeamIdx++;
    if (battle.gymTeamIdx >= battle.gymTeam.length) {
      battle.status = "completed";
      battle.winner = ctx.from?.id ?? 0;
      const gym = GYMS[battle.gymId];
      if (gym) {
        for (const pid of playerTeam) {
          const mon = allPokemon[pid];
          if (mon && mon.hp > 0) log.push(...gainXp(mon, gym.rewards.xp));
        }
        const inv = (session.player as any).inventory as Record<string, number>;
        for (const r of gym.rewards.items) {
          inv[r.itemId] = (inv[r.itemId] ?? 0) + r.qty;
          log.push(`Got ${r.qty}× ${ITEMS[r.itemId]?.name ?? r.itemId}!`);
        }
      }
      session.currentBattle = undefined;
      session.step = undefined;
      saveAllPokemon(ctx, allPokemon);
      await ctx.editMessageText(
        `🏆 Victory!\n\n${log.join("\n")}\n\nWell done, Trainer!`,
        { reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]) },
      );
      return;
    }
    log.push(`Opponent sends out ${(battle.gymTeam[battle.gymTeamIdx] as Pokemon).nickname}!`);
  }

  if (isFainted(playerMon)) {
    log.push(`${playerMon.nickname} fainted!`);
    battle.playerTeamIdx++;
    if (battle.playerTeamIdx >= playerTeam.length) {
      battle.status = "completed";
      battle.winner = -1;
      session.currentBattle = undefined;
      session.step = undefined;
      saveAllPokemon(ctx, allPokemon);
      await ctx.editMessageText(
        `💀 Defeated!\n\n${log.join("\n")}\n\nTrain harder and try again!`,
        { reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]) },
      );
      return;
    }
    log.push(`Go, ${allPokemon[playerTeam[battle.playerTeamIdx]]?.nickname ?? "Pokémon"}!`);
  }

  saveAllPokemon(ctx, allPokemon);
  const updatedPlayerMon = allPokemon[playerTeam[battle.playerTeamIdx]];
  const updatedGymMon = battle.gymTeam[battle.gymTeamIdx] as Pokemon;

  await ctx.editMessageText(
    log.join("\n") + `\n\nYour ${updatedPlayerMon?.nickname} (${updatedPlayerMon?.hp}/${updatedPlayerMon?.maxHp} HP) vs ${updatedGymMon.nickname} (${updatedGymMon.hp}/${updatedGymMon.maxHp} HP)`,
    { reply_markup: buildBattleKeyboard(updatedPlayerMon, battle) },
  );
});

composer.callbackQuery(/^battle:item:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const itemId = ctx.match![1];
  const session = ctx.session as Record<string, unknown>;
  const battle = session.currentBattle as any;
  if (!battle || battle.status !== "active") {
    await ctx.editMessageText("No active battle!", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    return;
  }

  const allPokemon = getAllPokemon(ctx);
  const playerTeam = battle.teams[ctx.from?.id ?? 0] as string[];
  const playerMon = allPokemon[playerTeam[battle.playerTeamIdx]];
  const inv = (session.player as any).inventory as Record<string, number>;

  if (!playerMon || !inv || (inv[itemId] ?? 0) <= 0) {
    await ctx.reply("You don't have that item!");
    return;
  }

  const result = useItem(playerMon, itemId);
  if (!result) {
    await ctx.reply("Can't use that item right now!");
    return;
  }

  inv[itemId] = (inv[itemId] ?? 0) - 1;
  const gymMon = battle.gymTeam[battle.gymTeamIdx] as Pokemon;

  const counterLog = applyMove(gymMon, playerMon, chooseAiMove(gymMon, playerMon));

  saveAllPokemon(ctx, allPokemon);

  await ctx.editMessageText(
    `${result}\n${counterLog.join("\n")}\n\nYour ${playerMon.nickname} (${playerMon.hp}/${playerMon.maxHp} HP) vs ${gymMon.nickname} (${gymMon.hp}/${gymMon.maxHp} HP)`,
    { reply_markup: buildBattleKeyboard(playerMon, battle) },
  );
});

composer.callbackQuery("battle:run", async (ctx) => {
  await ctx.answerCallbackQuery();
  const session = ctx.session as Record<string, unknown>;
  const battle = session.currentBattle as any;
  if (battle) {
    battle.status = "forfeited";
    session.currentBattle = undefined;
    session.step = undefined;
  }
  await ctx.editMessageText("🏃 You ran from the battle! No shame in retreating.", {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
  });
});

function buildBattleKeyboard(playerMon: Pokemon | undefined, battle: any): import("../toolkit/ui/keyboard.js").InlineKeyboardMarkup {
  if (!playerMon) return inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]);

  const rows: import("../toolkit/ui/keyboard.js").InlineButton[][] = [];
  const moveRow = playerMon.moveset.map((m: string) => inlineButton(m, `battle:move:${m}`));
  if (moveRow.length > 0) rows.push(moveRow.slice(0, 2));
  if (moveRow.length > 2) rows.push(moveRow.slice(2, 4));
  rows.push([inlineButton("🎒 Use Item", "battle:items"), inlineButton("🏃 Run", "battle:run")]);
  return inlineKeyboard(rows);
}

composer.callbackQuery("battle:items", async (ctx) => {
  await ctx.answerCallbackQuery();
  const session = ctx.session as Record<string, unknown>;
  const inv = ((session.player as any)?.inventory as Record<string, number>) ?? {};
  const usable = ["potion", "superPotion", "antidote"].filter((id) => (inv[id] ?? 0) > 0);
  if (usable.length === 0) {
    await ctx.reply("No usable items!");
    return;
  }

  const rows = usable.map((id) => [
    inlineButton(`${ITEMS[id]?.name ?? id} (×${inv[id]})`, `battle:item:${id}`),
  ]);
  rows.push([inlineButton("⬅️ Back to battle", "battle:back")]);

  await ctx.editMessageText("🎒 Choose an item:", { reply_markup: inlineKeyboard(rows) });
});

composer.callbackQuery("battle:back", async (ctx) => {
  await ctx.answerCallbackQuery();
  const session = ctx.session as Record<string, unknown>;
  const battle = session.currentBattle as any;
  if (!battle) return;
  const allPokemon = getAllPokemon(ctx);
  const playerTeam = battle.teams[ctx.from?.id ?? 0] as string[];
  const playerMon = allPokemon[playerTeam[battle.playerTeamIdx]];
  const gymMon = battle.gymTeam[battle.gymTeamIdx] as Pokemon;
  await ctx.editMessageText(
    `Your ${playerMon?.nickname} (${playerMon?.hp}/${playerMon?.maxHp} HP) vs ${gymMon.nickname} (${gymMon.hp}/${gymMon.maxHp} HP)`,
    { reply_markup: buildBattleKeyboard(playerMon, battle) },
  );
});

export default composer;
