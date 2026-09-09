# Status / state rendering — census (audit, phase 1 of 3)

**Date:** 2026-09-09 · **Scope:** read-only inventory. No recommendations — the grammar (phase 2) is
written against this table. Home is `/docs` (cross-cutting, per the spec-home convention).

**Method:** every place a status, state, or boolean condition is rendered with a visual encoding
(chip/badge, colored text, icon, dot, filled/outlined variant, spine, switch). Verbatim vocabulary.
Findings are recorded as found — the inconsistencies are the point.

**Incoming vocabulary (recorded, NOT acted on this pass):** Gaspar transactions' real status set is now
confirmed as **created / processing / pending / failed / completed**. The current mock + `TxBadge` still
use the observed **Succeeded / Pending / Failed**; not reseeded here.

---

## 1. Census

### 1a. Beam components (mechanisms defined here)

| # | Surface | file:line | Component | Vocabulary (verbatim) | Hue + sourcing | Fill | Driven by |
|---|---|---|---|---|---|---|---|
| 1 | BeamStatusBadge (def) | `packages/beam/src/BeamStatusBadge/BeamStatusBadge.tsx:19,26` | MUI `Chip` | `active, scheduled, draft, paused, expired, error, settled, pending, refunded, chargeback` (label `textTransform: capitalize`) | `statusColor` map → MUI semantic palette: active/settled=`success`, scheduled/pending=`info`, draft/expired=`default`, paused/refunded=`warning`, error/chargeback=`error` (semantic tokens) | filled; **outlined** for `draft, expired, refunded` | semantic `BeamStatus` prop |
| 2 | BeamBool (def) | `packages/beam/src/BeamStat/BeamStat.tsx:24` | icon pair (`CheckCircle` / `CancelOutlined`) | boolean — `titleAccess "Yes"` / `"No"` | `success.main` (true) / `error.main` (false) — semantic tokens | filled icon true / outlined icon false | `boolean` value |
| 3 | BeamStat severity spine | `packages/beam/src/BeamStat/BeamStat.tsx:36,45-46` | 2px spine `Box` + label icon | `warning`, `error` (+ implicit `default`) | spine via CSS vars `--beam-spine-{default,warning,error}` (theme-emitted); icon `warning.main` / `error.main` | spine bar; `WarningAmber` outlined (warning) / `Error` filled (error) | `severity` prop (`BeamStatSeverity = 'warning' \| 'error'`) |
| 4 | BeamSwitchField (def) | `packages/beam/src/BeamSwitchField/BeamSwitchField.tsx:44` | MUI `Switch` in outlined field | boolean on/off (+ notch `label`) | MUI Switch default (primary track when on) — semantic | track fill | `boolean checked` |

### 1b. Page-local badge/chip components

| # | Surface | file:line | Component | Vocabulary (verbatim) | Hue + sourcing | Fill | Driven by |
|---|---|---|---|---|---|---|---|
| 5 | Gaspar `TxBadge` (def) | `apps/gaspar/src/gaspar/TransactionsPage.tsx:314,318-325` | MUI `Chip` | Status: `Succeeded, Pending, Failed`; Direction: `Deposit, Withdrawal`; 3DS: `NotRequired, Authenticated` (raw API strings) | `POSITIVE_STATUSES = {Succeeded}` → `success`; everything else → `default` (semantic palette) | **always `outlined`** | raw API string + page-local one-value map |
| 6 | Sunlight `CRStatusChip` | `apps/sunlight/src/sunlight/changeRequestChips.tsx:29` | MUI `Chip` | `pending→Pending, approved→Approved, rejected→Rejected, canceled→Canceled, outdated→Outdated` | `CR_STATUS_COLOR` map: pending=`info`, approved=`success`, rejected=`error`, canceled/outdated=`default` (semantic) | **always `outlined`** | page-local `ChangeRequestStatus` (explicitly "NOT BeamStatus") + local map |
| 7 | Sunlight `OperationChip` | `apps/sunlight/src/sunlight/changeRequestChips.tsx:38` | MUI `Chip` | static `Update` | none (`default`) | `outlined` | static |
| 8 | Gaspar `NodeKindChip` | `apps/gaspar/src/gaspar/ruleBuilder/nodes/NodeKindChip.tsx:26` | MUI `Chip` | `sequence, condition, action` (via `NODE_KIND_LABEL`) | `KIND_COLOR`: sequence=`info`, condition=`warning`, action=`success` (semantic) | **filled** (default variant) | page-local `NodeKind` + local map |

### 1c. Shared status→badge mapping helpers (all render through BeamStatusBadge)

| # | Helper | file:line | Maps | Consumers (file:line) |
|---|---|---|---|---|
| 9 | `statusBadge(PayoutStatus)` | `apps/sunlight/src/sunlight/payoutConfigs.ts:205` | `Enabled→{active,"Enabled"}`, `Disabled→{draft,"Disabled"}` | GameConfigsPage:93; GameConfigEditor:79,152; MetaGamePresetsPage:123; MetaGamePresetEditor:96,218; PayoutConfigsPage:146; PayoutConfigEditor:99,220; DefaultGameConfigsPage:118; TargetingRulesGrid:52 |
| 10 | `lifecycleBadge(CampaignLifecycle)` | `apps/sunlight/src/sunlight/tokenCampaigns.ts:126` | `running→{active,"Running"}`, `scheduled→{scheduled,"Scheduled"}`, `ended→{expired,"Ended"}`, `disabled→{paused,"Disabled"}` | TokenCampaignsPage:111 |

### 1d. Direct BeamStatusBadge usages (vocabulary at the call site)

| # | Surface | file:line | Vocabulary (verbatim) | Driven by |
|---|---|---|---|---|
| 11 | Sunlight LoyaltyStatusPage | `LoyaltyStatusPage.tsx:157` | `status="pending" label="Pending"` (has-pending indicator) | boolean `hasPending` → hardcoded `pending` |
| 12 | Midnight PlayerSearchPage | `PlayerSearchPage.tsx:44` (data `players.ts:40`) | account status `active`, `pending` | `BeamStatus`-typed field |
| 13 | Midnight PlayerPaymentsPage | `PlayerPaymentsPage.tsx:95` (data `players.ts:47`) | `settled, pending, error, refunded, chargeback` | `BeamStatus`-typed field |
| 14 | Gaspar bench registry (list) | `apps/gaspar/src/bench/widgets/registry.tsx:106` (data :88-95) | `active, scheduled, error` | field typed `'active'\|'error'\|'scheduled'` |
| 15 | Gaspar bench registry (legend) | `registry.tsx:139-141` | `active→"Routing"`, `scheduled→"Settlement"`, `error→"Adyen"` (**relabeled** semantic tokens) | hardcoded status + custom `label` |
| 16 | Beam BeamDataTable stories | `BeamDataTable.stories.tsx:23,130,144,311,363` | `active, scheduled, paused, draft, error` (Perk/Paytable/WideRow) | `BeamStatus`-typed mock |
| 17 | Beam BeamStatusBadge stories | `BeamStatusBadge.stories.tsx:53,63` | full `BeamStatus` union | iteration |
| 18 | Beam ThemeGallery story | `packages/beam/src/stories/ThemeGallery.stories.tsx:40-44` | `active, scheduled, paused, draft, error` | hardcoded |

### 1e. BeamBool / BeamSwitchField usages (boolean)

| # | Surface | file:line | Vocabulary | Driven by |
|---|---|---|---|---|
| 19 | TokenCampaignsPage (list) | `TokenCampaignsPage.tsx:118` | Enabled (yes/no icon) | `c.enabled` boolean |
| 20 | TokenCampaignDetailPage (view) | `TokenCampaignDetailPage.tsx` (BeamStat `value={boolean}` → BeamBool) | Enabled | `enabled` boolean |
| 21 | TokenCampaignDetailPage (edit twin) | `TokenCampaignDetailPage.tsx:203` | `BeamSwitchField label="Enabled"` | `d.enabled` |
| 22 | UsersPage (inline) | `UsersPage.tsx:98` | MUI `Switch` (Active toggle) | `activeOverrides` boolean |
| 23 | TargetingRulesEditor | `TargetingRulesEditor.tsx:164` | MUI `Switch` | rule enabled boolean |
| 24 | DetailsPanel / BeamStat stories | `DetailsPanel.stories.tsx:52,71`; `BeamStat.stories.tsx:116` | `BeamSwitchField label="Assigned only" / "Active"` | boolean |
| 25 | ThemeGallery story | `ThemeGallery.stories.tsx:55` | `Switch defaultChecked` | static |

### 1f. Colored-text / icon state encodings (not chips)

| # | Surface | file:line | What | Hue + sourcing | Fill | Driven by |
|---|---|---|---|---|---|---|
| 26 | Sunlight `ChangeValue` (inline delta) | `ChangeValue.tsx:32,47` | before/after spans | `error.main` + `alpha(error,0.12)` bg + line-through / `success.main` + `alpha(success,0.12)` bg (semantic + `alpha()` derived) | tinted text w/ alpha background | `changed` + before/after (delta state) |
| 27 | Sunlight TargetingRulesEditor advisory | `TargetingRulesEditor.tsx:273` | `WarningAmber` icon + text, `role="status"` | `warning.main` (semantic) | icon + text | `selectedOption.status === 'Disabled'` |
| 28 | Gaspar RuleNodeCard advisory | `ruleBuilder/nodes/RuleNodeCard.tsx:44` | `ReportProblem` icon, `aria-label`, tooltip | `error.main` (semantic) | icon only (hue + shape) | `advisories.length > 0` |
| 29 | Gaspar KpiCardWidget delta | `bench/widgets/KpiCardWidget.tsx:36` | delta caption text | `success.main` (semantic) | text only | static (demo) |
| 30 | Validation-error text (family) | `ConditionBuilder.tsx:139`; `MultiplierRowsEditor.tsx:99,104`; `PayoutRowsEditor.tsx:136`; `TargetingRulesEditor.tsx:208` | `Typography color="error" role="alert"` | `error` (semantic) | text only | form validation state |
| 31 | Destructive-action buttons (family) | `PendingApprovalDetailPage.tsx:100`; `GameConfigEditor.tsx:229`; `UserPage.tsx:294`; `LoyaltyStatusEditor.tsx:409`; `MetaGamePresetsPage.tsx:232`; `PayoutConfigEditor.tsx:314`; `MetaGamePresetEditor.tsx:388`; `ruleBuilder/NodeInspector.tsx:84`; `BeamRowMenu.tsx:18,21` | `Button`/menu item `color="error"` | `error` (semantic) | button/text | static destructive intent (an ACTION affordance, not a status render — recorded for hue completeness) |

### 1g. MUI `Alert` severity (a separate "severity" vocabulary)

| # | Surface | file:line | Vocabulary | Hue | Driven by |
|---|---|---|---|---|---|
| 32 | Sunlight Alerts | `LoyaltyStatusPage.tsx:182` (`success`/`info`); `PendingApprovalDetailPage.tsx:120` (`warning`),`131` (`info`); `LoyaltyStatusEditor.tsx:162,354` (`info`); `ConfigDiffPanel.tsx:58` (`info`); `AppAlertBar.stories.tsx:24-88` (info/success/warning/error) | MUI severity `info, success, warning, error` | MUI Alert semantic palette | page state |

### 1h. Hand-rolled status-ish chips in stories

| # | Surface | file:line | Vocabulary | Hue | Fill |
|---|---|---|---|---|---|
| 33 | BeamPageHeader story | `BeamPageHeader.stories.tsx:76,81` | `Pending` (`color="info"`), `Active` (`color="success"`) — raw `Chip`, not BeamStatusBadge | semantic | outlined |
| 34 | Gaspar bench filter chips | `bench/widgets/registry.tsx:155,156`; `DashboardBench.tsx:56` | `Last 24h` (filled default), `All providers` (outlined) — non-status filter labels | none | filled / outlined |

---

## 2. Vocabulary index — the collision map

Distinct words and everywhere they render (→ shows the encoding they receive):

- **Enabled / Disabled** — *same concept, three+ mechanisms:*
  - `statusBadge` → **BeamStatusBadge** `active` (green, filled) / `draft` (neutral, outlined), label "Enabled"/"Disabled" — all config/payout/preset pages (#9).
  - `lifecycleBadge` "Disabled" → **BeamStatusBadge** `paused` (**warning**, filled) — TokenCampaignsPage (#10). → **"Disabled" is neutral(`draft`) in configs but amber(`paused`) in campaigns.**
  - Token campaign "Enabled" → **BeamBool** (green check / red cancel icon) — list (#19) and detail view (#20); **BeamSwitchField** in edit (#21). → "Enabled" is a green/neutral chip in one place, a green/red icon in another, a switch in a third.
- **Pending** — `pending` **BeamStatusBadge** `info` (LoyaltyStatusPage #11, midnight #12/#13); `pending` **CRStatusChip** `info` (#6); `Pending` **TxBadge** `default`/**neutral** (gaspar #5). → same word, `info` vs neutral, three mechanisms. Also a hand-rolled `info` chip in a story (#33).
- **Failed / error** — gaspar `Failed` → **TxBadge** `default`/**neutral** (#5); everywhere else the failure concept is `error` → **BeamStatusBadge** red (midnight #13, bench #14/#15, stories). → a failed payment carries **no** alarm hue in gaspar, red elsewhere.
- **Succeeded / settled / active** (the "good" concept) — gaspar `Succeeded` → `success` (#5); `settled`/`active` → `success` (#1, midnight, configs). Same hue, three different words + two mechanisms.
- **Active** — `active` **BeamStatusBadge** `success` (midnight accounts #12, ThemeGallery #18, bench #14); label "Active" on payout `Enabled` (#9); `active` **relabeled "Routing"** (bench #15); `Active` hand-rolled `success` chip (story #33).
- **scheduled** — `scheduled` `info` (campaigns #10, midnight, bench #14); **relabeled "Settlement"** (bench #15).
- **Direction / 3DS values** (`Deposit/Withdrawal`, `NotRequired/Authenticated`) — rendered through **TxBadge** as neutral chips (#5): non-status vocabularies wearing the status-badge mechanism.
- **severity** — the word carries two vocabularies: **BeamStat** `severity = warning | error` (#3) vs **MUI Alert** `severity = info | success | warning | error` (#32). Same word, different member sets, different components.
- **Update** — static **OperationChip** (#7), the only "operation" word; CR model is update-only.
- **sequence / condition / action** — **NodeKindChip** filled `info/warning/success` (#8) — a traffic-light vocabulary unique to the rule builder.

---

## 3. Mechanisms summary — distinct implementations

Eleven distinct state-encoding implementations:

1. **`BeamStatusBadge`** (MUI Chip; semantic `BeamStatus` map; filled + a 3-member outlined set). Doctrine: BEAM.md §6.4 — statuses are semantic vocabulary, theme picks the hex.
2. **`TxBadge`** (gaspar, page-local MUI Chip; **always outlined**; observed-only `success` for `Succeeded`, else neutral). Doctrine: "mirror the BeamStatusBadge *mechanism*, page-local, deliberately NOT `BeamStatus`; unseen → neutral, no invented enum→color."
3. **`CRStatusChip`** (sunlight, page-local MUI Chip; **always outlined**; CR map). Doctrine: same "mirror the mechanism, NOT BeamStatus" (CR lifecycle has no design-vocabulary implications).
4. **`OperationChip`** (sunlight, page-local; static outlined).
5. **`NodeKindChip`** (gaspar, page-local MUI Chip; **filled**; kind traffic-light map). Doctrine: same "mirror the mechanism, NOT BeamStatus"; note it forbids `warning` for advisories (kept distinct — #28).
6. **`BeamBool`** (icon pair; semantic success/error; fill = emphasis). Doctrine: one-fill-principle boolean; "colour carries yes/no, fill carries emphasis, NOT an alarm."
7. **`BeamStat` severity spine** (CSS-var spine + paired icon; `warning|error`). Doctrine: spine is the field's alarm channel, never color-alone (WCAG 1.4.1), severity never inferred from value.
8. **`BeamSwitchField` / MUI `Switch`** (boolean toggle; track color).
9. **`ChangeValue`** (inline delta; tinted before/after text spans, `alpha()` backgrounds). Doctrine: inline-delta approval rendering.
10. **Colored-text/icon advisories & validation** (`color="error"/"warning"` on Typography/Box/Button + `role="alert"/"status"`) — ad hoc, no shared component.
11. **MUI `Alert`** (severity info/success/warning/error) — MUI's own, used directly.

Two shared mapping helpers (#9 `statusBadge`, #10 `lifecycleBadge`) feed #1; both convert a domain vocabulary into `BeamStatus`, and that conversion is where "Disabled" acquires two different hues.

---

## 4. Anomalies

- **No hardcoded status hues.** Every hue routes through MUI semantic palette props (`success/info/warning/error/default`) or `alpha(theme.palette.*)` (#26). No rgba literals in status rendering. (Clean.)
- **"Disabled" renders in two hues** — neutral `draft` (configs, #9) vs amber `paused` (campaign lifecycle, #10). Same user-facing word, different alarm reading.
- **Failure carries no alarm hue in gaspar** — `TxBadge` renders `Failed` as a neutral `default` chip (#5), visually indistinguishable from `Pending`/other neutrals; `error`-red is used for the same concept in every other surface.
- **Two badge fill conventions** — `BeamStatusBadge` mixes filled + a quiet-outlined set; `TxBadge` and `CRStatusChip` are **always outlined**; `NodeKindChip` is **always filled** (filled colored, not the quiet-outlined convention).
- **Non-status vocabularies wearing the status-badge mechanism** — `Direction` (Deposit/Withdrawal) and `3DS` (NotRequired/Authenticated) render through `TxBadge` (#5); the chip mechanism is reused for plain enums that carry no status semantics (all neutral, so hue encodes nothing there).
- **Relabeled semantic tokens** — bench legend renders `active→"Routing"`, `scheduled→"Settlement"`, `error→"Adyen"` (#15): the hue's semantic meaning and the visible label are decoupled (a red chip labeled "Adyen").
- **`severity` word collision** — `BeamStat` (`warning|error`) vs MUI `Alert` (`info|success|warning|error`) (#3 vs #32): same prop name, different member sets, different components.
- **Casing inconsistency** — `BeamStatusBadge` forces `textTransform: capitalize` (so `active`→"Active"); `TxBadge`/`CRStatusChip` render the raw label as-authored (`Succeeded`, `Pending`, `Update`). Mixed casing across the estate's chips.
- **Hue-adjacent-to-icon encodings** — `BeamBool` (#2) and the advisory icons (#27, #28) carry meaning in color; each pairs a distinct icon *shape* (check vs cancel; WarningAmber vs ReportProblem) and `titleAccess`/`aria-label`, so none is strictly color-alone. `RuleNodeCard` advisory (#28) is icon-only (no visible text label) — meaning via hue + icon shape + tooltip/aria-label.
- **Hand-rolled status chips in a story** (#33) — `BeamPageHeader.stories` builds `Pending`/`Active` chips directly from MUI `Chip` rather than `BeamStatusBadge`, duplicating the vocabulary outside the sanctioned component.
- **Incoming-vs-current gaspar mismatch** — real vocabulary `created/processing/pending/failed/completed` vs mock/`TxBadge` `Succeeded/Pending/Failed` (recorded above; not reconciled this pass).
