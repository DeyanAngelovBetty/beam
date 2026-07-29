# MetaGame pages — Betty Meta Games in Beam

*The MetaGame back-office workstream in `apps/sunlight`, under the "Betty Meta
Games" nav section. Source material: Georgi's MetaGame Configuration doc and the
legacy Yoda back office we're replacing. This doc grows with the workstream — it
records the domain model, the IA decisions (and which are provisional), and the
pages planned. v1 · 2026-07-29.*

---

## Domain model — Payout Configs

A **PayoutConfig** is a payout table: weighted rows, each a probability of
landing on a prize value plus the rewards paid. Shape lives in
`apps/sunlight/src/sunlight/payoutConfigs.ts` (mock-data lane).

- **PayoutConfig**: `id`, `name`, `gameType` (`Scratcher` | `RewardsWheel` |
  `WheelOfWins` | `MultiMadness`), `status` (`Live` | `Draft` | `Disabled`),
  `rows: PayoutRow[]`, `createdAt`, `updatedAt`.
- **PayoutRow**: `probability` (0..1), `winMessage`, `prizeValue`,
  `rewards: Reward[]`. Rows with `probability: 0` are **visual only** — shown,
  never landed.
- **Reward**: discriminated union on `rewardType` — `{ Coins, amount }`,
  `{ FreeSpins, gameId, spinCount }`, extensible per the doc.
- **Derived helpers**: `expectedAvgPayout` (Σ probability × value) and
  `probabilityTotal` (should be 1.0). These are the seed of the detail page's
  **Live Checks** — kept in one place so list and detail compute identically.

Seed fixtures worth knowing: **Topaz - Weekend Special** probabilities sum to
**0.9** (a future validation demo); **Default Payout Table** and **Legacy
Scratcher** carry visual-only rows; **Legacy Scratcher** also has a no-win
(value 0) row and is the lone `Disabled` example.

### Status vocabulary — one creak flagged

`BeamStatus` (BEAM.md §6.4) has no exact word for **Disabled**. It currently
rides `paused` with a `label="Disabled"` override — semantic status, overridden
copy. **Open:** whether `Disabled`/`inactive` earns its own lifecycle word is a
deliberate vocabulary decision, not made here.

## IA decisions

- **One Payout Configurations list for all game types** *(provisional,
  2026-07-29 — pending Georgi's confirmation)*. GameType is a **promoted
  filter**, not a set of per-type nav entries. The legacy Yoda splits
  Scratcher / RewardsWheel / … into separate nav items; the list grammar reads
  that as navigation doing a filter's job (list §1). If Georgi wants per-type
  entry points, revisit — but the single list + filter is the grammar default.

## Pages planned

- **Payout Configs — list** ✓ (`/payout-configs`). Assembled per list grammar:
  promoted filters GameType + Status, URL-resident filter state, tier-3 row
  click → detail, rail expand+select+kebab (Edit / Clone / Delete), bulk
  Go Live / Delete, row expansion showing the Yoda winnable/visual-only preview
  (plain — design pass pending).
- **Payout Config — detail** — stub only (`/payout-configs/:id`). The row editor
  and the Live Checks (BeamStat severity over `expectedAvgPayout` /
  `probabilityTotal`) are a separate design round.
- **Game Configurations** + the condition builder — deferred.
- **Default Configs** — planned.
- **Presets** — planned.
