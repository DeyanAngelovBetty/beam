Companion to the Gaspar Payment Orchestrator Requirements Specification. Referenced from §4 (Technical Requirements) and §6 (Release Phasing).

Requirements are **cumulative**: each version assumes everything before it. The Dashboard begins at v1.1, alongside the Canada-wide rollout — there is no Dashboard in v1.0.

**Relationship to Tableau.** Tableau remains the system of record for month-end and MBR reporting, and the Data Warehouse relay continues unaffected. The Gaspar Dashboard exists for what Tableau cannot do: it is live, and every figure leads to the transactions behind it. Where the two report the same measure, the definitions must match exactly.

### Conventions that apply to every version

- **Aggregation is server-side.** The Dashboard calls aggregation endpoints. It never pages through the transactions list to compute totals.
- **One axis per chart.** Two measures of different scale become two charts, or one indexed to a common base. No dual-axis charts.
- **Colour follows the entity, never its rank.** A provider keeps the same colour whichever chart it appears in and wherever it sits in the order. A filter that changes the number of series must not repaint the survivors.
- **Identity is never colour alone.** Any chart with two or more series carries a legend; series are also directly labelled where they fit.
- **Semantic colour is reserved.** Good, warning and critical states have their own colours and are never reused as a series colour.
- **Colour encodes judgement; an arrow encodes direction.** Where falling is good — withdrawals, decline counts — the colour says good and the arrow says down. The two are separate signals.
- **Partial periods are marked.** The in-progress period renders distinctly and is labelled. A partial month must never be drawn as if it were a completed one.
- **Comparisons name their baseline.** "Vs prior period" is stated in words on the figure — which dates, which population.
- **Nothing is invented.** An unrecognised category renders neutrally with its raw label. A measure with no data says so; it does not render zero.
- **Every figure drills through** to Transactions, filtered to exactly the population behind it.
- **A table view exists for every chart**, exposing the same numbers.
- **Dark mode is designed, not inverted.** Steps are chosen against the dark surface and checked for contrast independently.
- **One timezone.** All bucketing and period boundaries use a single stated timezone, applied consistently across every report. This is a decision to record, not to leave implicit.

---

### v1.1 — (TBC)

#### Data source

Dedicated aggregation endpoints returning pre-aggregated series. Each accepts the period range, the bucket size, and the active dimension filters, and returns the series plus the totals needed to render.

- **Bucketing** — day, week or month, derived from the selected range rather than chosen by the user.
- **Boundaries** — period boundaries resolve in the single timezone fixed above; a day means the same thing on every chart.
- **Currency** — CAD only at this stage, but the response carries currency explicitly so multi-currency later does not restructure the contract. Values in different currencies are never summed without conversion.
- **Freshness** — the maximum acceptable staleness is stated and the interface shows when the data was last computed. "Live" must mean something specific rather than being an aspiration.

#### Metric definitions

Every measure has exactly one definition, recorded here and surfaced on the page through an information affordance on each chart. Where a measure shares a name with a Tableau measure, the definitions must be identical.

**Approval rate** requires its numerator and denominator stated explicitly — approved payments over submitted payments, with a decision recorded on whether payments rejected before submission count in the denominator. This single definition drives several charts, so it is settled once.

#### The five reports

**1. Deposits vs Withdrawals**

Two series over time. Value and count are separate views selected by a toggle, never two scales on one chart. Approved transactions only.

**2. AVG Deposits and AVG Withdrawals per Transaction**

Two series over time. Mean value per transaction, with the denominator defined — approved transactions, not attempts.

**3. Deposits by Payment Provider**

Share of deposit volume per provider over time, as 100% stacked bars. An absolute-volume view is available as a toggle. Provider colours are fixed and shared across every chart on the page.

**4. Withdrawals by Payment Provider**

As above, for withdrawals.

**5. Deposits Approval Rate vs Total Deposit Approval Rate by Payment Provider**

A line per provider plus a visually heavier total line. The total is the aggregate across providers, not an average of the provider lines — those differ whenever volumes are uneven, and the distinction must be implemented deliberately.

#### Controls

A single control row above the charts: date range with presets, and provider. Control state is **shared across the whole page** — there are no per-chart controls.

Control state is reflected in the URL so a view can be shared as a link and reopened in the same state. This is the mechanism by which someone says "look at this" without describing which filters to set.

#### Drill-through

Every mark, segment and figure opens Transactions with filters pre-applied to exactly the population it represents. The mapping from chart dimension to transaction filter is explicit and lossless: a provider segment for a given week opens that provider, that date range, that direction.

Where a chart dimension has no corresponding transaction filter, the drill-through is not offered rather than approximated.

Returning from Transactions restores the Dashboard's previous state.

#### Interaction

Line charts carry a crosshair with a tooltip reading all series at that point. Bar and segment charts carry a per-mark tooltip. Hit targets are larger than the marks themselves. Tooltips are reachable by keyboard, not hover alone.

#### States

Each chart loads, empties and fails **independently**. One failing endpoint degrades its own chart and no other; the page never blanks because a single query failed.

- **Loading** — a skeleton preserving each chart's footprint, so the layout does not reflow.
- **Empty** — distinguishes "no data in this range" from "no data at all".
- **Error** — states the failure on that chart and offers retry.

#### Accessibility

Legend present on every multi-series chart. Chart text takes its colour from theme tokens so it reads in both themes. Every chart has a table view exposing the same values. All controls keyboard reachable with visible focus states.

#### Non-functional

A stated response budget per aggregation endpoint. Charts render progressively as their data arrives; no chart waits on another. Changing a control does not blank the page — existing charts stay visible until their replacements arrive.

---

### v1.2 — date TBD

#### Headline tiles

Seven PTD tiles: Deposits, Withdrawals, Net Deposits, FTD, FTDA, FTDA AR, Non-Dep/FTD, each with a prior-period delta.

- The comparison period is computed explicitly and named on the tile.
- Delta colour encodes good or bad; an arrow encodes up or down.
- **Blocked until FTD, FTDA and FTDA AR are defined with BI.** If Gaspar and Tableau compute these differently, two systems publish contradictory numbers under the same name. The definitions are a prerequisite, not a detail.

#### Additional reports

**AVG Deposits vs AVG Withdrawals per Player** — denominator is distinct players transacting in the period, defined precisely for players active in only part of it.

**FTDA Approval Rate vs Total FTDA Approval Rate by Payment Provider** — same construction as report 5, on the first-time-depositor population.

**Top 5 Deposit Failure Reasons by attempted deposits** — ranked horizontal bars, click-through to affected players. The failure-reason vocabulary is shared with the Error Code column on Transactions; one list, not two.

**Deposits Approval Time by Payment Provider** — distribution across time buckets. The measurement start and end points are stated explicitly as named timestamps, since "approval time" can mean at least three different intervals.

**Withdrawals Approval Time by Payment Provider** — as above.

#### Extended filters

Jurisdiction, currency, method, traffic source, segment. Added to the shared control row and to the URL state.

Introducing a currency filter makes the multi-currency rule active: aggregations never sum across currencies without conversion, and the base-currency policy is stated wherever a converted total appears.

---

### Beyond v1.2

Reports are added on business need, decided at the time. Two technical notes for whatever comes next.

**Anything measuring the deposit funnel is gated on data Gaspar does not yet emit** — the deposit-attempt events, and the rule decision recorded per payment. Without both, only the segment from submission to approval can be drawn, which is the part Tableau already covers. This is a data prerequisite, not a reporting task.

**Alerting, when it arrives, watches the same numbers the page displays.** A threshold that triggers an alert and a threshold shown on a tile must be the same value from the same computation, or the two will disagree in public.