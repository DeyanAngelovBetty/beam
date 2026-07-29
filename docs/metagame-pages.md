# MetaGame pages — Betty Meta Games in Beam

*The MetaGame back-office workstream in `apps/sunlight`, under the "Betty Meta
Games" nav section. Source of truth: Georgi's **MetaGame Design Brief** + **Simple
Guide** (`docs/reference/`). This doc records the domain model, the IA decisions,
and the pages planned; it grows with the workstream. v2 · 2026-07-29 (aligned to
the brief).*

---

## Domain model — Payout Configs

A **PayoutConfig** is a payout table: weighted rows, each a probability of
landing on a prize value plus the rewards paid. Shape lives in
`apps/sunlight/src/sunlight/payoutConfigs.ts` (mock-data lane).

- **PayoutConfig**: `id`, `name`, `gameType`, `status`, `rows: PayoutRow[]`,
  `createdAt`, `updatedAt`.
  - **`name` is the API Code** (brief §5.1): the list column is labelled "Name",
    the underlying field is the config's API code. Noted in the types.
- **PayoutRow**: `probability` (0..1), `winMessage`, `prizeValue`,
  `rewards: Reward[]`. Rows with `probability: 0` are **visual only** — shown,
  never landed.
- **Reward**: `rewardType` (**`Coins` | `Tokens`** only, brief) + `amount`
  (positive integer). A row carries at most one of each type — no repeats.
- **GameType**: the canonical **eight** (brief) — `Wheel`, `Scratcher`,
  `DailyWheel`, `DailyScratcher`, `DailyGift`, `MultiplierMadness`,
  `InstantWheel`, `WheelOfWins`.
- **Status**: **`Enabled` | `Disabled`** only (brief). A config is *created*
  Disabled; activation is a separate concern, not a status. Disabled is the
  normal prep state — never an error.
- **Derived helpers**: `expectedAvgPayout` (Σ probability × value) and
  `probabilityTotal` (should be 1.0) — the seed of the detail page's **Live
  Checks**. "Topaz - Weekend Special" sums to 0.9 (a validation demo).

### Status vocabulary — §6.4 creak RESOLVED (2026-07-29)

The earlier tracer flagged that `BeamStatus` had no word for the old "Disabled".
With the brief's two-state model this resolves by **mapping to existing
vocabulary**, no union extension:

- **Enabled → `active`** — positive, green fill.
- **Disabled → `draft`** — neutral/dormant, grey **outline**. Deliberately *not*
  `paused`, which `BeamStatusBadge` renders as a **warning** (amber); Disabled is
  a normal prep state, not a warning. Domain labels ("Enabled"/"Disabled")
  override the badge copy.

## IA decisions

- **One Payout Configurations list for all game types — CONFIRMED (2026-07-29,
  per brief).** GameType is a promoted filter, not per-type nav entries. *(Was
  provisional pending Georgi; the brief confirms the single list.)*

## Columns & filters (brief §5.1)

- Columns: **Name** (API Code) · **Game type** · **Status** · **Rows** (count) ·
  **Avg payout** · **Updated**.
  - **Avg payout is OUR enhancement**, not in the brief's column spec — kept
    because it makes the list scannable and it's the same number the detail
    page's Live Checks will surface. Flagged here as ours-not-spec.
- Filters: **exact-match** semantics on Game type + Status; search over name/id.
- Pagination: default **20** rows/page (`BeamDataTable defaultPageSize`).

## Actions (brief)

- Row kebab: **Edit** + **Enable/Disable** (the toggle shows the opposite of the
  current status). Confirmation dialogs ship **plain** (`window.confirm`); the
  real dialog + exact copy come from brief §10.1.
- **No Delete** anywhere (brief). **No batch actions** — the brief specifies no
  bulk workflows, so this page renders none. The persistent batch strip remains
  a BeamDataTable capability + list-grammar doctrine for pages that earn it
  (list-grammar §4, §6); Payout Configs simply isn't one.

## Pages planned (brief screen inventory)

- **Payout Configs — list** ✓ (`/payout-configs`).
- **Payout Config — detail/editor** — stub only (`/payout-configs/:id`). Row
  editor + Live Checks (BeamStat severity over `expectedAvgPayout` /
  `probabilityTotal`) is a later round.
- **Game Configurations — list + editor** (with the condition builder) — pending.
- **Default Configs mapping** — pending.
- **Presets** — pending.
