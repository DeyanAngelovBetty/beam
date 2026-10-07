# Gaspar Dashboard — spec ↔ codebase reconciliation

**Status:** analysis + proposal only, no code changed. Companion to
[`apps/gaspar/docs/specs/gaspar-dashboard-requirements.md`](../apps/gaspar/docs/specs/gaspar-dashboard-requirements.md)
(Boryana), same role as [`gaspar-api-notes.md`](gaspar-api-notes.md): map what the spec requires onto what
the repo already has, name the gaps, and propose a gated build order. Nothing here is a ruling — the open
questions (§10) are Boryana's / BI's to settle.

**Spec invariants carried into every section** (the "Conventions that apply to every version" block): server-side
aggregation only; one axis per chart; colour follows the entity not its rank; identity never colour-alone
(legend + direct labels); semantic colour reserved; colour = judgement / arrow = direction; partial periods
marked; comparisons name their baseline; nothing invented ("definition pending", never a zero or a guess);
every figure drills through to Transactions; a table view per chart; dark mode designed not inverted; one
stated timezone.

---

## 1. Milestone mapping + gating

**The switcher is already app-wide and URL-backed** — [`apps/gaspar/src/gaspar/milestone.tsx`](../apps/gaspar/src/gaspar/milestone.tsx):
`MilestoneProvider` wraps the app, reads `?milestone=` via `useSearchParams`, exposes `{ milestone, caps }`
through context, and gates by **existence** (a capability = *not passing* an opt-in prop), zero organism
changes. Default is `beyond` (everything). So the source we need for route/nav/landing gating already exists
and is global; today its `caps` are **Transactions-only** (selection, advancedFilters, columnManager, …).

**Mapping (cumulative, per the spec):**

| Version | Dashboard presence |
|---|---|
| **v1.0** (19 Oct) | **No Dashboard.** No nav item; Transactions is the landing route. |
| **v1.1** | Dashboard exists: the control row + the **five reports**. Becomes the landing route. |
| **v1.2** | + seven headline tiles, five more reports, extended filters. |
| **beyond** | Design proposals (widget→dialog, dialog morph, scattered reveal), gated exactly like Transactions' Complete/Decline — shown at `beyond`, never shipped. |

**Proposed gating (existence, mirroring the Transactions doctrine — hiding is not access control; the real gate is
server-side):** derive `hasDashboard = RANK[m] >= RANK.v1_1` from the *same* milestone.
- **Route** — `/dashboard` renders only when `hasDashboard`; otherwise it redirects to `/transactions`.
- **Nav item** — the AppShell nav list includes "Dashboard" only when `hasDashboard`.
- **Landing** — `/` → `hasDashboard ? /dashboard : /transactions`.

This needs the `MilestoneProvider` to sit **above the router's landing/redirect decision** (it already wraps the
app) and a small `dashboard`/`tiles`/`extendedFilters`/`reportsV12` addition to `MilestoneCaps` (or a parallel
`dashboardCapsFor`). No new source of truth — one milestone, read in more places.

---

## 2. Control row = page chrome, URL-synced

Spec: one control row above the charts — **date range (with presets) + provider** — **shared across the whole
page** (no per-chart controls), reflected in the URL so a view is a shareable link.

**Reconciliation with Beam's draft→applied filter doctrine** (`useTableFilters` owns `draft` → `apply`; BEAM.md
§6 convergence / Wave 1):
- **Reuse** the URL-sync + typed-definition machinery (`useTableFilters` + `defineTableFilters`, as Transactions
  does) for consistency and free deep-linking.
- **Keep draft→applied — the estate-wide doctrine, same as Transactions** *(ruling 2026-10-06)*. The spec's
  "live" describes the **data** (fresh, server-aggregated, drill-through to the rows behind it); "never blanks"
  describes **rendering**. Neither requires apply-on-change — so the control row keeps the draft→applied gate
  (edit the range/provider, then apply), and **stale-while-revalidate** satisfies "never blanks": on apply, each
  chart keeps its last render until its own replacement arrives (ties into the per-chart state machine, §7).
  One filter apply-policy across the estate; no dashboard-only divergence.
- **Date presets** (last 24h / 7d / 30d / MTD / custom) are a dashboard control, not a `dateTime` field pair;
  propose a small `DateRangePreset` control feeding the same URL params (edited in the draft, committed on
  apply). The bucket (day/week/month) is **derived from the range**, never user-chosen (spec).
- **Page chrome, not a widget** — consistent with the dashboard-phase ruling (Filters is page chrome, pinned
  above the grid, outside any widget manager; BEAM.md §6.3a).

---

## 3. Charts foundation

**Superset check (Observed):** there is **no chart library anywhere** — not in this monorepo, not in official
Beam (`beam-alex`), not in Sunlight-official. The bench Trend widget (`BandWidget`) hand-rolls its visual. So a
charts foundation is a **net-new dependency**, not an inheritance — the superset principle gives nothing to
adopt here.

**The spec's interaction bar is high and specific:** line crosshair with an all-series tooltip; per-mark tooltip
on bars/segments; **keyboard-reachable** tooltips (not hover-only); 100% stacked bars (+ absolute toggle);
legend on every multi-series chart **plus** direct labels where they fit; partial-period marking; hit targets
larger than the marks; and a **table view for every chart**. Plus: all chart text from theme tokens (both
modes), categorical colour bound to the entity (§4).

**Ruling (2026-10-06): don't pick yet — SPIKE `@mui/x-charts` first.** x-charts is **theme-native** (reads the
MUI theme) and the **easier adoption for the product teams**, so it's the default to beat. The next batch opens
with a spike building **Report 1** (two series, line **crosshair**, **keyboard-reachable** tooltip) and
**Report 3** (**100% stacked bars + absolute toggle**) in `@mui/x-charts`, judged against the spec's full
interaction + a11y bar (crosshair multi-series tooltip, keyboard tooltips, direct labels, partial-period
marking, hit targets > marks, per-chart table view, theme-token text colour).

**Fall back to `visx` ONLY where x-charts can't meet the bar — and report exactly where** (which requirement,
which chart). visx (D3 scales + React-owned SVG) is the escape hatch because we'd own the SVG and can build the
exact crosshair / keyboard focus order / direct labels / partial-period hatching / oversized hit areas; the cost
is more code, so it's used surgically, not wholesale. A mixed outcome (x-charts for most, visx for the points it
misses) is an acceptable result of the spike.

Either library gets its categorical palette from our tokens (§4), never a bundled default; palette + a11y checks
follow the **dataviz** skill + `derived-color-tokens.md` at build time. **Flag D-2 (resolved to a spike):** the
library is chosen by the spike's evidence, not up front.

**DECISION (2026-10-07): `@mui/x-charts@9.15.0` — adopted.** The spike (Reports 1 & 3) cleared most of the bar
cheaply and it is **theme-native** (reads `@mui/material@9`, peer `^7.3.0 || ^9.0.0`) + the easiest adoption for
the product teams. **New dependency** on `apps/gaspar` (+ its d3 transitive tree; `npm audit` flags transitive
vulns to triage). Met out of the box: line crosshair + multi-series axis tooltip, 100% stacked (computed share)
+ absolute toggle, legend, theme-token text, hit-target = axis band. **Gaps, filled by TARGETED additions (not
a reason for visx):**
- **Keyboard-reachable tooltips — NOT in x-charts** (grepped v9.15 `dist`: no keyboard/tabIndex/keydown/arrow/
  activedescendant). So the **per-chart table view is the mandatory a11y path**, not optional — next step.
- **Direct series labels** — no native support → a small custom end-label overlay when built.
- **Per-segment / per-bar partial styling** — no native support → we split each series into a complete-buckets
  series + a last-bucket "tail" series and style the tail (dashed+hollow line / faded bar) via the per-series
  `.MuiLineElement/MarkElement/BarElement-series-<id>` classes.
These are localized additions; wholesale visx is not warranted.

---

## 4. Categorical colour tokens (provider palette)

Spec: a provider keeps **one colour everywhere**, independent of rank/order; a filter that changes the number of
series **must not repaint the survivors**; semantic hues (good/warning/critical) are reserved and never reused
as a series colour; dark mode is **designed, not inverted**.

**Proposal:**
- A **categorical palette** separate from the semantic ramp and from the product/brand seeds — e.g.
  `providerColors` in the theme, N fixed slots chosen for mutual distinguishability **and** for non-collision
  with the reserved semantic hues, with an independently-designed dark-mode set (per
  [`derived-color-tokens.md`](derived-color-tokens.md) — steps chosen against the dark surface, contrast checked
  per mode, not a light-mode inversion).
- The **provider→slot mapping lives in one stable map** keyed by **provider id** (not by series index or sort
  position): `Record<providerId, slot>`. Because colour binds to the id, adding/removing a provider via the
  filter never shifts another provider's colour — survivors never repaint (the spec's hard rule). An
  **unrecognised** provider renders neutrally with its raw label ("nothing invented").
- Where it lives: **gaspar-local first, promote on a second consumer** (BEAM.md §2) — **approved 2026-10-06**.
  (Promotes into Beam tokens the moment a second surface needs a fixed categorical palette.)
- **Colour-blindness over-constraint — OPEN for Boryana/design (2026-10-07).** On this palette the only
  non-semantic, non-teal-primary space is the purple→magenta band, which red-green CVD flattens. A **4-way**
  CVD-distinct set (2 providers + 2 directions, shown on the same page) is **not achievable** (best 4-way
  worst-pair ΔE ≈ 5). Shipped resolution: each FAMILY gets a hue centre (providers = violet, directions =
  rose) with lightness contrast WITHIN the pair, so **within a chart** the pair is strongly distinct
  (deutan/protan ΔE 33–44) while the families read apart for normal vision; CROSS-family CVD is weaker (≈ 8–18),
  carried by the spec's mandated legend + direct labels (colour never the sole channel). **Decision needed if
  stronger CVD is required:** relax the teal/semantic reservation for charts, or add a second channel (dashes/
  patterns per series). Not decided here.

---

## 5. Aggregation contract (draft — Konstantin playbook)

Spec: **server-side aggregation only**; the page **never pages the transactions list to compute totals**;
dedicated endpoints take `{ range, bucket, dimension filters }` and return series + the totals to render.

**Proposed response shape** (one contract, multi-currency-ready so it doesn't restructure later):

```jsonc
{
  "metric": "deposits_vs_withdrawals",   // which report
  "currency": "CAD",                      // EXPLICIT — values in different currencies never summed unconverted
  "bucket": "day",                        // day | week | month, derived from the range (not user-chosen)
  "range": { "from": "…", "to": "…", "tz": "<stated timezone>" },
  "partial": { "bucketKey": "…" },        // which trailing bucket is in-progress (marked distinctly)
  "computedAt": "<ISO>",                   // surfaced as "last computed …"
  "stalenessBudgetMs": 0,                  // the stated max acceptable staleness → "live" means something
  "series": [ { "key": "deposit", "label": "Deposits", "points": [ { "bucket": "…", "value": 0, "count": 0 } ] } ],
  "totals": { /* the figures the chart/tile needs, per series + aggregate */ }
}
```

**Mock aggregation layer (dev):** a gaspar-local module computes these responses **over the existing
wire-shaped transaction fixtures** (`RAW_PAYMENTS` / the fixtures behind
[`TransactionsPage.tsx`](../apps/gaspar/src/gaspar/TransactionsPage.tsx) + the samples in
`apps/gaspar/fixtures/`). The page consumes **only this contract**, never the transactions list.

**Drill-through parity is the load-bearing constraint:** the aggregator's bucketing/predicate and the
Transactions filter must compute over the **same fixtures with the same predicate**, so a segment's count equals
the count the drill-through lands on. Propose a **single shared predicate module** (the filter logic
Transactions already applies — status/direction/provider/date/errorCode) imported by both the mock aggregator
and the Transactions page, so they cannot drift. **Flag D-4:** "approved transactions only" (reports 1–2) and
the approval-rate numerator/denominator (§10) must be the exact same predicate the tiles/charts and the
drill-through use — settle the definition once (§10), encode once.

---

## 6. Drill-through mapping (chart dimension → Transactions filter)

Transactions filters available (from [`TransactionsPage.tsx`](../apps/gaspar/src/gaspar/TransactionsPage.tsx)
`TxFilters`): `createdFrom`/`createdTo` (date, calendar-day sliced), `status`, `direction`
(Deposit/Withdrawal), `provider`, `currency`, `threeDs`, `errorCode`, `amountMin/Max`.

| Report / dimension | Transactions filter | Status |
|---|---|---|
| Date bucket (every chart) | `createdFrom` + `createdTo` | ✅ maps (bucket → its date span) |
| Direction (Deposits / Withdrawals) | `direction` | ✅ maps |
| Provider segment/series | `provider` | ✅ maps |
| "Approved only" population (reports 1, 2, 5) | `status` = the approved value(s) | ✅ maps — once the approved-status set is settled (§10) |
| Report 5 approval-rate segment | `provider` + `direction=Deposit` + date + approved `status` | ✅ composable |
| v1.2 Top-5 failure reasons | `errorCode` | ✅ maps — spec already shares this vocabulary with the Error Code column |
| v1.2 currency / jurisdiction / method / traffic / segment | `currency` ✅; jurisdiction / method / traffic / segment **none** | ⚠️ partial |
| v1.2 "per Player" / FTD / FTDA population | **no filter** (no distinct-player, no first-time-depositor filter) | ❌ not offered |

**Per the spec, where there is no matching filter the drill-through is NOT offered** (not approximated). So:
the v1.2 player/FTD-population figures expose **no** drill-through until Transactions grows those filters (or
emits those events — see the "beyond" funnel note in the spec). Jurisdiction/method/traffic/segment
drill-through waits on those Transactions filters existing. **Flag D-5:** list the Transactions filters v1.2
drill-through needs that don't exist yet.

Returning from a drill-through **restores the Dashboard's previous state** (its URL control state — §2).

---

## 7. Per-chart states (independent)

Spec: each chart **loads / empties / fails independently**; one failing endpoint degrades only its own chart.

**Proposal — a `ReportCard` (Section-based) owning a per-chart state machine:**
- **Loading** — a skeleton that **preserves the chart's footprint** (fixed aspect box) so the grid never
  reflows as charts arrive.
- **Empty** — two distinct messages: *"no data in this range"* vs *"no data at all"* (the aggregation contract
  can distinguish: empty series within range vs the metric never having data).
- **Error** — states the failure **on that card** and offers **retry** (re-runs just that endpoint).
- Each card holds its own async state; **applying** the control row (§2 draft→applied) triggers N independent
  fetches; charts render progressively (no chart waits on another), and **keep their prior render until their
  replacement arrives** (§2 stale-while-revalidate). The page never blanks.

Built on the dashboard-phase `Section` surface (BEAM.md §6.3a) — the card is a `Section`, the title band carries
the chart title + the §8 affordances.

---

## 8. Widget → dialog, re-scoped (updates treatment-plan Gate 3)

The earlier tracer assumed *the whole card opens the dialog* and *rim hover = "this opens"*. **The spec breaks
both:** clicks on marks **drill through**, so the card body is not a dialog trigger, and every figure is
interactive. Re-scope:
- **Explicit affordance in the Section title band** — an **expand** control (and an **info** control for the
  metric definition), not the card. Keyboard-reachable, visible focus (spec a11y).
- **The dialog = the expanded chart + its table view + its metric definition** (the info content). One place to
  read the numbers, the definition, and see the chart large.
- **Tracer moves to Report 1 — Deposits vs Withdrawals** (was the Transactions widget).
- **Rim hover is decoration again**, not the "this opens" cue (that cue is now the explicit title-band button).
- **Treatment plan:** **Gate 3 updates** accordingly (dialog trigger = title-band expand, not the card; rim =
  decoration). **Gates 1a / 1b / 2 are unchanged** (model, geometry/persistence, Lab control, BeamDialog
  primitive all stand). BeamDialog (gate 2) is still the surface; it now opens from the title-band control.

---

## 9. BeamStat for the v1.2 tiles — what it needs

**Observed:** `BeamStat` today ([`BeamStat.types.ts`](../packages/beam/src/BeamStat/BeamStat.types.ts)) carries
`label`, `value`, `caption`, `showCaption`, `severity` (warning/error alarm only). It has **no delta channel**,
and v2 **deliberately dropped the `tone` (positive/neutral tint) channel** — "there is deliberately NO
positive/neutral tint channel."

**The v1.2 tiles need three separate things BeamStat can't express:**
1. a **delta value** + its **named comparison period** (the baseline stated in words on the tile — spec);
2. **polarity** (good/bad **colour**) — which re-introduces a colour-judgement channel v2 removed;
3. **direction** (up/down **arrow**) — a *separate* input from polarity, because the spec's rule is
   "colour = judgement, arrow = direction" (where falling is good, colour says good **and** arrow says down).

**APPROVED (2026-10-06) as an additive, opt-in lane extension:** a `delta?` input
`{ value: ReactNode; polarity: 'good' | 'bad'; direction: 'up' | 'down'; comparisonLabel: string }` — polarity
and direction **independent** (never derive one from the other, never from the numeric sign). The reopened
colour channel is **scoped to the delta row only** — the value itself stays tint-free (v2's `tone`-drop stands
everywhere else). Opt-in: a `BeamStat` with no `delta` is byte-identical to today.

**Gate before code (ruling):** a **doctrine note + a `beam-alignment.md` entry** land **before** the BeamStat
change — recording it as an additive lane extension (it never alters the shared shape; absent `delta` = official
behaviour) and flagging the reopened colour channel for the upstream `BeamStat` exchange. That doctrine/alignment
step is the first item of **Batch 3**, ahead of the tiles.

---

## 10. Open questions for Boryana / BI (list only — do not decide; UI shows "definition pending" until settled)

1. **Timezone** — the single stated timezone for all bucketing/boundaries (spec requires one explicit value).
2. **Approval-rate denominator** — do payments **rejected before submission** count in the denominator?
   (Drives reports 5, v1.2 FTDA AR, and every "approval" figure — settle once, §5.)
3. **Freshness budget** — the max acceptable staleness per endpoint ("live" must mean a number).
4. **Bucketing thresholds** — at what range spans does day→week→month switch.
5. **FTD / FTDA / FTDA AR definitions** — **blocked with BI**; v1.2 tiles + the FTDA reports can't ship until
   Gaspar and Tableau agree, or two systems publish contradictory numbers under one name (spec §v1.2).
6. **"Approval time" interval** — named start/end timestamps (the spec says it can mean ≥3 intervals).
7. **Distinct-player denominator** — how a player active in only part of the period counts (v1.2 per-Player AVG).
8. **Base-currency / conversion policy** — stated wherever a converted total appears, once the currency filter
   goes live (v1.2 multi-currency).
9. **Axis date-label format** — ISO (`2026-10-07`) vs short (`Oct 7` / `W41` / `Oct`)? (chart-spike surfaced it.)
10. **Axis title wording** — e.g. `Bucket (week)` — keep the mechanism-name, or a friendlier label?
11. **Y-axis currency display** — `CAD value` vs `$` prefix vs compact (`$1.2k`); and the % axis format for the
    share view.

---

## Bench widget → spec mapping

The current dashboard-bench widgets (`apps/gaspar/src/bench/widgets/registry.tsx`) are demo stand-ins; against
the spec:

| Bench widget | Spec home | Verdict |
|---|---|---|
| **KPI** (`KpiCardWidget`) | the v1.2 **headline tiles** (PTD + delta) | → **v1.2 tile** — needs the §9 BeamStat delta extension; bench version is a placeholder. |
| **Trend** (`BandWidget`) | v1.1 line reports (1 Deposits vs Withdrawals, 2 AVG) | → **v1.1 report** — replaced by a real charted line (§3); the hand-rolled band is bench-only. |
| **Gateway status** | *none* — the spec has no provider-health/status report | **bench-only.** |
| **Transactions** (mini-table) | *none* — the Dashboard consumes aggregations, never the transactions list; the real link is **drill-through to the Transactions page** | **bench-only.** |
| **Next settlement** (`NextGemStandIn`) | *none* — no settlement/cutoff report in the spec | **bench-only.** |

So most bench widgets have no spec home; the Dashboard's real content is the **five reports** (v1.1) and the
**tiles + five reports** (v1.2). The bench stays as the record (Lab/Bench/Dashboard), not shipped.

---

## Proposed build order (gated batches)

Each batch gated behind the milestone rank (existence-gating, §1); "beyond" proposals gated like Complete/Decline.

- **Batch 0 — v1.0 (confirm):** no Dashboard; Transactions is landing. Verify the milestone gating hides the
  Dashboard route + nav + landing below v1.1. *(Mostly wiring §1.)*
- **Batch 1 — v1.1 foundations + the chart SPIKE:** §3 **spike** — Report 1 (two series, crosshair,
  keyboard tooltip) + Report 3 (100% stacked + absolute toggle) in `@mui/x-charts`, judged against the a11y /
  interaction bar; `visx` fallback only where x-charts misses, **reported exactly where**; the spike yields the
  thin chart layer (axes/legend/tooltip/table-view/state-frame) + those two reports. Alongside: §1 route/nav/
  landing gating · §5 aggregation contract + mock aggregator over fixtures + the shared drill-through predicate ·
  §4 provider categorical tokens (light+dark) · §2 control row (presets + provider, URL-synced, **draft→applied**
  + stale-while-revalidate) · §7 `ReportCard` state machine. **Gated on Flag D-4 (shared predicate) + the §10
  approval-rate + timezone answers.**
- **Batch 2 — v1.1 the remaining reports:** Report 2 (AVG lines) → 4 (withdrawals stacked) → 5 (per-provider
  approval-rate lines + heavier aggregate total). (Reports 1 + 3 came out of the Batch 1 spike.) Each with table
  view, info/metric-definition affordance, drill-through (§6), independent states (§7).
- **Batch 3 — v1.2 tiles:** §9 **doctrine note + `beam-alignment.md` entry first**, then the BeamStat `delta`
  lane extension, then the 7 PTD tiles. **FTD / FTDA / FTDA AR tiles blocked on the §10.5 BI definitions** —
  render "definition pending", never a number.
- **Batch 4 — v1.2 more reports + extended filters:** the 5 additional reports (per-Player AVG, FTDA AR, Top-5
  failure reasons, 2× approval-time distributions) + extended filters (jurisdiction/currency/method/traffic/
  segment) + the multi-currency rule going active. Drill-through added only where Transactions has the filter
  (§6); otherwise not offered.
- **Batch 5 — beyond (design proposals, gated like Complete/Decline):** §8 widget→dialog (title-band expand/info
  affordance, Report 1 tracer, BeamDialog from gate 2), dialog morph, scattered reveal. Decoration-only rim.

**Flagship note:** the Gaspar Dashboard is a flagship surface — every batch stays local until Deyan's in-session
click-through, per CLAUDE.md.
