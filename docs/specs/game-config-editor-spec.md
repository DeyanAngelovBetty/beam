# Game Config Create/Edit — filled detail-page spec (archived)

*Archived per the spawn-detail-page skill. Source: Deyan (from Georgi's spec),
2026-08-01. Built 2026-07-31 → `GameConfigEditor` + `TargetingRulesEditor` +
`gameConfigForm.ts`, extending Georgi's merged `gameConfigs.ts` + list. Domain
doc: `docs/reference/` (brief §6) + Georgi's Create Game Config spec.*

---

## STEP 0 — collision check
Builds on Georgi's Game Configs LIST + `gameConfigs` domain. **Verified merged to
main** (`5169569 Game Configs`); extended, not duplicated.

## Identity & routes
- Title: "Create Game Config" / edit: the config name (`code`).
- Routes: `/game-configs/new` · `/game-configs/:id` (replaced the stubs).
- Back: `← Game Configs`. Subtitle (create): "New configurations are created as
  Disabled."

## Modes
Create + Edit only — no view mode (MetaGame default).

## Save model
Cancel + Create/Save in the BeamPageHeader actions slot (grammar §4). Gated on:
name valid+unique · every rule has a PayoutConfig · every rule's condition passes
`isValidConditionTree` · fallback has its PayoutConfig. Unsaved guard: `useBlocker`
+ dialog.

## Status
Chip below the title (identity, not action); not editable here. The cross-object
rule ("cannot Enable while enabled rules reference Disabled PayoutConfigs")
belongs to the Enable ACTION (list), not Save — surfaced here as a non-blocking
warning.

## Basic information
- **Name** (`code`): text, required, ≤100, unique within GameType (seed store).
- **Game Type**: dropdown (canonical eight), required; **read-only on edit**.
- GameType change on CREATE → **mark-invalid** (least destructive): selections
  kept, marked invalid if off-type, operator re-picks.

## Editable collection — TargetingRules
Order IS priority (top = highest; no numbers). Per rule: header ("Rule n" +
Enabled/Disabled toggle + Delete; **no name field** — flagged), a GameType-
filtered PayoutConfig select (name + status badge; Disabled selectable), and the
ConditionBuilder (via its exported API only; collapsed state is the read-only
list's concern). Reorder: **up/down arrows** (drag is a flagged later
enhancement); first/last disable appropriately. **Fallback**: structurally fixed
last row — always present, always Enabled, conditionless, no Delete/toggle/
reorder; only its PayoutConfig select. Add Rule inserts above the fallback.

## Validation (classified)
- fallback exists/enabled/last/conditionless → STRUCTURAL (fixed row).
- rule has a PayoutConfig → inline, Save-gated.
- condition tree valid (and flat, per the model mismatch) → inline, Save-gated.
- name required/length/unique → inline, Save-gated.
- enabled rule references a Disabled PayoutConfig → AGGREGATE, **non-blocking**
  warning by the rules header.

## Live Checks
None (no numeric aggregate) — the disabled-reference warning occupies the
aggregate-message position.

## Persistence
Seed-store helpers in `gameConfigs.ts`: `getGameConfig` / `createGameConfig`
(status Disabled) / `updateGameConfig` (aggregate PUT: `TargetingRule.id`
retained, `_key` client-side, omitted removed) / `gameConfigNameIsUnique`.

## Flags (resolved / recorded during build)
- **Condition-model mismatch** (flat persisted vs nested builder): adapter in
  `gameConfigForm.ts`; nested groups Save-blocked until the model grows to a tree
  (Georgi's call).
- **Rule display name**: sketch vs API — built without; retained on save.
- **Drag reorder**: later enhancement; arrows now (revisitable).
- **Seed cross-references** (orphan PayoutConfig ids / condition vocabularies in
  `GAME_CONFIGS`): data-cleanup follow-up, not machinery.
- **ConditionBuilder nesting visuals**: `pending design pass` (Deyan's bench).

## Stories
`Lab/Sunlight/TargetingRulesEditor`: fallback-only · multiple rules (reorder
states) · disabled-PayoutConfig warning · invalid condition. (Collapsed-rule
story skipped — the editor has no collapse; that's the read-only list's job.)
