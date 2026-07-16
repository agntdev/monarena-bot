# Pokémon Battle RPG Bot — Bot specification

**Archetype:** custom

**Voice:** playful and concise — write every user-facing message, button label, error, and empty state in this voice.

A persistent Pokémon-themed RPG bot enabling turn-based PvE gym battles and asynchronous 6v6 PvP duels. Players collect and train Pokémon, manage teams, and engage in strategic battles with status effects, items, and progression mechanics. Key events are summarized in an admin channel to maintain engagement and fairness.

> This is the complete contract for the bot. Implement EVERY entry point, flow, feature, integration, and edge case below. The completeness review checks the bot against this document after each build pass.

## Primary audience

- Casual-to-competitive gamers
- Pokémon enthusiasts
- Busy players seeking flexible scheduling

## Success criteria

- Players can complete onboarding with starter Pokémon
- Successful PvE gym battle completion with rewards
- PvP duel initiation and resolution with turn persistence
- Admin channel receives structured event summaries
- Persistent data survives Telegram session resets

## Entry points

Every feature must be reachable from the bot's command/button surface (button-first; only /start and /help are slash commands).

- **/start** (command, actor: user, command: /start) — Open main menu with onboarding/trainer setup
- **View Pokédex** (button, actor: user, callback: pokedex:view) — Browse available Pokémon species and details
- **Challenge Gym** (button, actor: user, callback: gym:challenge) — Select and challenge a PvE gym
- **Manage Team** (button, actor: user, callback: team:manage) — Edit party composition, moves, and items
- **Issue Duel** (button, actor: user, callback: pvp:challenge) — Send asynchronous challenge to another player
- **Accept Duel** (button, actor: user, callback: pvp:accept) — Respond to pending challenge invitation

## Flows

### Onboarding
_Trigger:_ /start

1. Display welcome message
2. Offer starter Pokémon selection
3. Prompt for trainer name input
4. Grant starter items

_Data touched:_ Player, Pokémon, Item

### PvE Gym Battle
_Trigger:_ gym:challenge

1. Select target gym
2. Confirm challenge
3. Begin turn-based battle
4. Track battle log
5. Award rewards on victory

_Data touched:_ Battle, Gym, Player

### PvP Duel Challenge
_Trigger:_ pvp:challenge

1. Select opponent
2. Choose challenge team
3. Set optional stakes
4. Send invitation to admin channel

_Data touched:_ Battle, Player

### Async PvP Turn Handling
_Trigger:_ battle:turn_prompt

1. Send turn action prompt
2. Wait for user response
3. Apply move/item action
4. Resolve opponent's turn state

_Data touched:_ Battle, Pokémon

## Data entities

Durable data (must survive a restart) uses the toolkit's persistent store, never in-memory maps.

- **Player** _(retention: persistent)_ — Trainer profile linked to Telegram account
  - fields: telegram_id, trainer_name, rank, inventory, party
- **Pokémon** _(retention: persistent)_ — Persistent collectible battle entity
  - fields: species, nickname, level, xp, hp, moveset, held_item, status
- **Gym** _(retention: persistent)_ — PvE challenge with AI trainers
  - fields: name, leader, roster, rewards, cooldown_timer
- **Battle** _(retention: persistent)_ — Turn-based match state container
  - fields: participants, teams, turn_order, action_log, status
- **Item** _(retention: persistent)_ — Consumable or equippable game item
  - fields: name, type, effect, quantity
- **Move** _(retention: persistent)_ — Attack/skill with RPG mechanics
  - fields: name, power, accuracy, type, pp, effects

## Integrations

- **Telegram** (required) — Bot API messaging and admin channel notifications
Call external APIs against their real contract (correct endpoints, ids, params); credentials from env. Do not fake responses.

## Owner controls

- Post system announcements to admin channel
- Configure gym reward tables
- Manage duel timeout rules
- View battle logs for moderation
- Adjust IP-compliant content filters

## Notifications

- Duel invitation alerts
- Turn expiration warnings
- Battle result summaries
- Level-up notifications
- Admin channel event logs

## Permissions & privacy

- Telegram account required for persistent data
- No personal data shared beyond battle logs
- Admin channel access restricted to moderators

## Edge cases

- Players missing their turn due to inactivity
- Invalid move selection during battle
- Duplicate Pokémon in team composition
- Battle log storage limits

## Required tests

- End-to-end onboarding flow with starter distribution
- Async duel turn resolution with timeout handling
- Gym battle reward distribution validation
- Admin channel notification formatting

## Assumptions

- One Telegram account = one player
- 6v6 battle format with alternating turns
- 72-hour duel timeout with forfeiture
- Default damage formulas from RPG conventions
