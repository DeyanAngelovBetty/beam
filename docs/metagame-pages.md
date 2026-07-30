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

## Columns & filters

*Per Georgi (Slack, 2026-07-30):* Columns are **Name** (API Code) · **Game
Type** · **Status** · **Payout Rows** (count) · **Actions** (the rail kebab).
- **Avg Payout — VETOED.** It was our enhancement (ours-not-spec); Georgi cut
  it. The number still feeds the detail page's Live Checks, just not the list.
- **Updated — dropped** from the list.
- Filters: **exact-match** semantics on Game Type + Status; search over name/id.
  Sorting + pagination (default **20**) unchanged.

## Actions

*Per Georgi (Slack, 2026-07-30):* the row's actions are **Edit** + **Enable ↔
Disable** only (the toggle shows the opposite of the current status). **Clone
removed.** Defined once as `rowActions` (list-grammar §3) and projected to both
the kebab and the expansion action bar — one place changes, every surface
follows. Confirmation dialogs ship **plain** (`window.confirm`); real copy is
brief §10.1.
- **No Delete** anywhere (brief §10). **No batch actions** — the brief specifies
  no bulk workflows, so this page renders none. The persistent batch strip
  remains a BeamDataTable capability + list-grammar doctrine for pages that earn
  it (list-grammar §4, §6); Payout Configs isn't one.

## PayoutRowsGrid (expansion content)

*Per Georgi (Slack, 2026-07-30):* **Win Message | Probability | Rewards**.
Rewards are one column, listed inline per row ("3.00 BTY, 2.00 Tokens", via the
display label map). Probability displays as a **percentage** (stored 0..1, ×100,
no trailing-zero padding). The earlier merged-cell / rowSpan anatomy (a line per
reward) was superseded; it may return in the **editor** half of the pattern.

## Payout Config — Create / Edit page

*Per Georgi's Create spec (2026-07-30).* Routes: **`/payout-configs/new`**
(Create) and **`/payout-configs/:id`** (Edit) — one `PayoutConfigEditor`, mode
by param.

- **No view mode — deliberate divergence.** Brief §5.2 defines only Create/Edit;
  MetaGame configs are always editable (Enabled configs stay editable, brief
  §10). This departs from the User page's view↔edit doctrine, on purpose.
- **Header-actions vs bottom bar — flagged to Georgi.** Cancel + Create/Save sit
  in the page-header actions slot (detail-grammar §4 save model), not the bottom
  bar Georgi sketched. Doctrine wins; a one-line move if product overrules. Save
  is gated on a valid form **and** total probability exactly 100%.
- **% input supersedes the brief.** Probability is entered as a **percentage**
  (Georgi's latest, superseding the brief's decimal input); stored domain value
  stays 0..1. Held as a raw string in the form, converted on save; the sum-to-100
  Live Check works in percentage space.
- **Status** is visible (badge) but not editable here (brief §5.2.8); Enable is a
  separate post-create action. **Game Type** is read-only on edit (brief §5.2.7).
- **Live Check** (Total + Remaining, BeamStat severity — its first real
  consumer): 100% → quiet · <100% → `warning` · >100% → `danger`.
- **Minimums doctrine (one line, so Game Configs inherits it): _structural
  prevention for local rules, validation for aggregate rules._** ≥1 reward per
  row and no-duplicate-reward-type are LOCAL → prevented structurally (disabled
  controls / filtered options). ≥1 row overall and total-=-100% are AGGREGATE →
  validated (Save blocks, message by the Live Check).
- **Persistence** mirrors the brief's aggregate PUT: `PayoutRow` gained `id?`
  (retained across update; new rows assigned; omitted rows removed). The editor
  pairs it with a client-only `_key`.

## Pages planned (brief screen inventory)

- **Payout Configs — list** ✓ (`/payout-configs`).
- **Payout Config — Create/Edit** ✓ (`/payout-configs/new`, `/payout-configs/:id`).
  The detail *view* Live Checks over `expectedAvgPayout` are a separate later
  round (this page is the editor).
- **Game Configurations — list + editor** (with the condition builder) — pending
  (Georgi's agent builds the list + editor shell on a branch).
  - *ConditionBuilder scaffolded bench-first (2026-07-30)* — the editor's flagged
    invention, built standalone in `apps/sunlight` (`conditionTree.ts` +
    `ConditionBuilder.tsx` + `ConditionSummary.tsx`, `Lab/Sunlight/ConditionBuilder`)
    so it slots into that editor when both land. Domain mirrors the API Condition
    JSON (Group/Leaf, All/Any, In/NotIn); never renders raw JSON — the summary is
    the read-only prose twin. Controlled, `isValidConditionTree` exposed for the
    editor's Save gate. **Pending:** nesting visuals (spine-motif territory,
    reserved) and the per-field value **lookup data** (placeholder lists — no
    lookup endpoints, brief §14). Value control is a constrained multi-select
    (no free entry); new leaves default field/operator, empty-values is the honest
    incomplete signal.
- **Default Configs mapping** — pending.
- **Presets** — pending.
