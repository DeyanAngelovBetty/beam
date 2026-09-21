# Beam convergence — Wave 2: the Table contract (PROPOSAL)

**Status: APPROVED 2026-09-18. Build is GATED — does not start yet.** The three decision items in §6 are
resolved (rulings recorded inline). Reference read: `beam-alex @ b40e815` — `src/components/Table/`
(Table.tsx, Table.types.ts, Table.styles.ts, Table.constants.ts, TableActions/*, stories) and `ActionMenu/`.

**Sequencing (approved):** the **Community Jackpots** pages land first as a separate task. They are added
to the §7 consumer inventory once they exist, and migrated with the rest of Wave 2. Only then does the
build begin. Same mechanics as Wave 1: staged commits, per-batch gates, non-mechanical suspects surfaced
(not forced), single push at the end, nothing deploys mid-wave.

Fence (unchanged): no AppShell/BeamProvider (Wave 3), nothing outside Table's orbit.

---

## 0. The gap in one paragraph

Official `Table` is a **thin themed renderer over a TanStack core** (~270 lines + a 126-line
`.styles.ts`): raw `ColumnDef` columns, `data`, a single pinned **action-rail** column
(`{expand, select, menu}`), **controlled server-shaped pagination** (1-based `page` + `totalCount`,
no internal slicing), `maxHeight` **internal scroll**, `stickyHeader`, `loading`/`elevation`/`variant`.
Ours is an **84 KB organism** with a render-owning `BeamColumn` model, an identity-link concept,
built-in global search, **client-side** pagination (internal `getPaginationRowModel` slicing) with
`jumpToPage`/derived page-size options, a bulk-selection toolbar, a column manager, `rowAccent`, and
**stickyChrome** — a page-owns-the-scroll pinning system with viewport tiers, snap points, pin
reachability, and a measured header clone. Wave 1's lesson applies verbatim: **adopt official's shape
as the public contract; re-seat every lane capability as an additive opt-in that never alters a shared
prop; page-compose (or theme-seat) what official can't express, and flag it.**

The governing rule for the whole wave:

> **Official-subset-identical.** A `Table` rendered with *only* official-subset props
> (`data`, `columns`, `getRowId`, `stickyHeader`, `maxHeight`, `emptyMessage`, `loading`,
> `elevation`, `variant`, `actionRail`, `pagination`+`totalCount`+`paginationDisabled`) must behave
> and look **identical to official's Table**. Every lane extension is inert when its prop is absent.

---

## 1. Public API = official's Table, verbatim

Adopt `TableProps` exactly as official declares it (`Table.types.ts` + the `TableProps` in
`Table.tsx`):

```ts
type TableProps<TData extends RowData> =
  Pick<TableOptions<TData>, 'data' | 'columns'> & {
    getRowId: NonNullable<TableOptions<TData>['getRowId']>   // (row, index, parent) => string
    stickyHeader?: boolean
    onRowClick?: (row: TData) => unknown
    onRowHover?: (row: TData) => unknown
    onRowLeave?: (row: TData) => unknown
    maxHeight?: CSSProperties['height']
    emptyMessage?: string
    loading?: boolean
    elevation?: PaperProps['elevation']
    variant?: PaperProps['variant']
    actionRail?: TableActionRail<TData>
  } & (
    | { pagination?: undefined; totalCount?: never; paginationDisabled?: never }
    | { pagination: TablePaginationController; totalCount: number; paginationDisabled?: boolean }
  )

type TableActionRail<TData> = {
  expand?: (row: TData) => ReactNode
  select?: { onSelect: (row, selected) => unknown; onSelectAll: (selected) => unknown }
  menu?: (row: TData) => ActionMenuItem[]
}
type TablePaginationState      = { page: number; pageSize: number }        // page is 1-based
type TablePaginationController = TablePaginationState & { onChange: (p) => unknown }
```

**Renames / shape changes this forces on us** (each is a breaking public change — the point of the wave):

| Ours today | Official | Note |
|---|---|---|
| `rows: Row[]` | `data: TData[]` | rename |
| `columns: BeamColumn<Row>[]` | `columns: ColumnDef<TData>[]` | **model change** — §3 |
| `getRowId: (row) => string` | `getRowId: (row, i, parent) => string` | widen signature |
| `rowActions?: (row) => BeamRowAction[]` | `actionRail.menu?: (row) => ActionMenuItem[]` | §2.1 |
| `renderExpanded?: (row) => ReactNode` | `actionRail.expand?: (row) => ReactNode` | §2.1 |
| `selectable?: boolean` (+ internal select state) | `actionRail.select?: { onSelect, onSelectAll }` | §2.2 |
| `onRowHover?: (rowId \| null) => void` | `onRowHover?: (row) => unknown` + `onRowLeave?` | signature change; `highlightRowId` retires with it (§2) |
| `paginated?` + `pagination: PaginationState` (0-based) + `onPaginationChange` | `pagination: TablePaginationController` (1-based) + `totalCount` + `paginationDisabled` | §4 |
| *(absent)* | `loading`, `elevation`, `variant`, `maxHeight` | **add** — parity gaps |
| `'aria-label'` **required** | *(not in official props)* | keep as an additive optional; do not require it (requiring it breaks subset-identical construction) |

**New dependency official pulls in:** the `loading` prop renders `<Loader placement='top'>`. We have
**no `Loader`** in the barrel. Wave 2 must port/adopt official's `Loader` (small, in Table's orbit) or
map `loading` onto an equivalent top overlay. Flagged, not resolved (it's a tiny addition, but it's a
new component — call it out).

---

## 2. Lane extensions, re-seated as additive opt-ins

Everything below is **absent from official's props** and must stay a no-op when its prop isn't passed.
Grouped by how cleanly it re-seats.

### 2.1 Adopt official's shape (our concept already matches theirs)

- **`rowActions` → `actionRail.menu`.** Our whole "one definition, two projections" doctrine
  (list-grammar §3: the kebab AND the expanded-row action bar render the *same* `rowActions`) is
  **exactly official's model**: `actionRail.menu` renders both the overflow `ActionMenu` (kebab) *and*
  the buttons inside the expanded row (`Table.tsx` lines 206–222). Adopt `actionRail.menu`.
  - **Field map `BeamRowAction` → `ActionMenuItem`:** `id→id`, `label→label`, `icon→icon`,
    `destructive→destructive`, `disabled→disabled`, **`disabledReason→disabledTooltip`**, `onSelect→onSelect`.
    Official adds an enabled-state `tooltip?` we don't have (free to ignore).
  - **The one non-mechanical gap: submenus.** Our `BeamRowAction` is a discriminated union — an action
    is *either* flat (`onSelect`) *or* a **menu** (`options: BeamRowActionOption[]`). Official's
    `ActionMenuItem` is **flat only** (no `options`). Gaspar's Transactions uses the submenu for the
    **Export → {JSON, CSV, PDF, Excel}** row action (and the bulk Export). Official's `ActionMenu` can't
    nest. → **Decision surfaces in §6(c)/§7**: flatten Export into N top-level items
    (`Export JSON`, `Export CSV`, …) per official, *or* keep the nested menu as a page-level composition,
    *or* pitch a nested-item upstream. Recommend **flatten** (smallest, honors the contract).
- **`renderExpanded` → `actionRail.expand`.** Same shape, `(row) => ReactNode`. Straight rename. Note
  the coupling official bakes in: **`expand` alone** turns on the caret; when **both** `expand` and
  `menu` are present, the menu buttons also render inside the expanded panel. Our organism does the
  same thing, so behavior is preserved.

### 2.2 Selection: our bulk apparatus sits ON TOP of official's `select`

Official `actionRail.select` is **just the checkboxes + the callbacks** (`onSelect`, `onSelectAll`);
it owns no toolbar. Our `selectable` + `bulkActions`/`onBulkAction` is a **bulk-command surface** with
eligibility (`disabled`/`disabledReason`), `confirm`, and export-format `options` menus — none of which
official has.

- Re-seat: `select` (the checkbox column + selection state) = **official's `actionRail.select`**, adopted verbatim.
- **`bulkActions` / `onBulkAction` = a LANE extension** — an additive prop that renders our bulk strip
  above the grid and drives `select` under the hood. It stays ours; official has no counterpart. Keep
  the current `BeamBulkAction` shape (array *or* `(selectedRows) => …` factory) and `onBulkAction`.
- Consequence: with only `actionRail.select` (no `bulkActions`), the table shows checkboxes and fires
  callbacks — **identical to official**. The strip appears only when `bulkActions` is passed.

### 2.3 Pure lane extensions (additive props, no official surface)

- **`stickyChrome`** (+ `stickyChromeGapSx` / `stickyChromeExitSx` exports) — the big one; **§6(b)**.
  DOM contracts unchanged: `data-beam-sticky-chrome`, `data-stuck`, `data-overflow-start` /
  `data-overflow-end`, the `@container scroll-state(stuck)` posture, the measured header clone, the
  viewport tiers (`SHORT_VP_TIER1/2/3`), pin-reachability, and the two snap points. All of this is
  re-seated **inside the new file shape** but otherwise untouched (fence: no behavior change).
- **`columnManager`** (`BeamColumnManagerConfig` + `BeamColumnManager` + `useColumnManager`) — show/hide
  + reorder + persistence + the "awaiting data" catalog. Additive; unchanged. (It manipulates TanStack
  `columnOrder`/`columnVisibility`, so it rides on the raw-`ColumnDef` model cleanly — arguably *better*
  once columns are real `ColumnDef`s with stable `id`s.)
- **`rowAccent: (row) => BeamBadgeHue | undefined`** — the severity accent bar in the rail region.
  Additive; requires the rail (already true). Keep.
- **`searchable`** — our built-in global-search field (drives TanStack `globalFilter` +
  `getFilteredRowModel`). Official has **no** search. Additive lane prop; unchanged. (Note: it's only
  used where a page has no `TableFilters` bar — post-Wave-1 that's a shrinking set; §7 confirms.)
- **`jumpToPage`** — the "Page N of M" footer control. Additive; but it's **entangled with our
  client-side pagination** (it calls `table.setPageIndex`). Under official's controlled contract it must
  instead call `pagination.onChange`. Re-seat as a lane decoration on the official footer (§4).
- **`LinkComponent` / identity link** — retires from `Table` as a prop and moves into the **`beamCells`
  helper** (`beamCells.link({ getHref, LinkComponent })`), since columns are now raw `ColumnDef`. §3.
- **`highlightRowId` / `onRowHover(rowId)`** — cross-widget relational highlight. Official ships
  `onRowHover(row)`/`onRowLeave(row)` (row, not id, and no highlight prop). **Reconcile:** adopt
  official's `onRowHover(row)`/`onRowLeave(row)`; the DashboardBench cross-widget highlight (the only
  consumer) moves its id-mapping page-side, or we keep `highlightRowId` as an additive lane prop.
  Flag in §7 (bench is the suspect).

---

## 3. `BeamColumn` retires → the `beamCells` helper library

Official columns are raw TanStack `ColumnDef<TData>` (`accessorKey`/`id` + `header` + `cell`). Our
`BeamColumn` (`key`, `header`, `render`, `getValue`, `align`, `width`, `isIdentity`, `getHref`,
`defaultHidden`) is a render-owning abstraction. **Retire `BeamColumn` from the public API**; provide a
**`beamCells` helper library** — small functions that *return* `ColumnDef`s (or `ColumnDef.cell`
renderers) so product code keeps its terse, semantic column declarations while the Table sees only raw
`ColumnDef`s.

Helper set, **calibrated to the 15 distinct cell patterns the §7 audit found** (each returns a
`ColumnDef<TData>` with `cell`, `header`, and `meta: { align?, width? }`; `getValue`→`accessorFn` for
sort/search):

```ts
beamCells.text({ id, header, accessor, align?, width? })              // #1 plain passthrough (dominant)
beamCells.link({ id, header, accessor, getHref, LinkComponent?, icon? })  // #2 identity link (+icon variant)
beamCells.statusBadge({ id, header, accessor, badge })                // #3 BeamStatusBadge via statusBadge()
beamCells.badge({ id, header, accessor, tier })                       // #4 BeamBadge via a TIER map (spread)
beamCells.bool({ id, header, accessor })                             // #5 BeamBool (align center)
beamCells.timestamp({ id, header, accessor, format?, tooltip? })     // #6 local time + ISO tooltip (+ .slice variants)
beamCells.copyId({ id, header, accessor, mono?, mode? })             // #7 TruncateCopyCell (copy-to-clipboard id)
beamCells.number({ id, header, accessor, format? })                  // #8 toFixed/toLocaleString/Intl money, tabular, align right
beamCells.count({ id, header, accessor })                           // #9 length/count cell, align right
// #10 chips, #11 inline controls, #12 diff, #13 truncate+tooltip+placeholder, #14 composite,
// #15 composed-string → RAW `ColumnDef.cell` (bespoke). beamCells is OPTIONAL SUGAR, never the only door.
```

**Column → helper mapping (from the audit):**

| Pattern (audit #) | Helper | Columns / files |
|---|---|---|
| #1 plain text | `text` | ubiquitous (email, role, provider, type, method, desc, direction, currency, …) |
| #2 identity link | `link` | name/entity/player in Users, Roles, GameConfigs, MetaGamePresets, PayoutConfigs, TokenCampaigns, CampaignWinners, PendingApprovals; **icon+text**: LoyaltyStatus (`GemIcon`+name) |
| #3 `BeamStatusBadge` | `statusBadge` | GameConfigs, DefaultGameConfigs, MetaGamePresets, PayoutConfigs, PlayerSearch, PlayerPayments, bench |
| #4 `BeamBadge`+tier | `badge` | Transactions (`STATUS_TIER`), TokenCampaigns (`LIFECYCLE_TIER`), LoyaltyStatus (Pending), PendingApprovals (`CRStatusChip`) |
| #5 `BeamBool` | `bool` | TokenCampaigns (`enabled`) |
| #6 timestamp/date | `timestamp` | Transactions (`TimestampCell`), TokenCampaigns/CampaignWinners (`fmtDate`/`fmtGrantedAt`), PendingApprovals (`.slice(0,10)`), PlayerSearch/Users/Roles (plain date) |
| #7 copy-id | `copyId` | Transactions (id, customerEmail, pspTransactionId) — clearest promotion candidate |
| #8 number/money | `number` | Transactions (`toFixed`), PlayerPayments (`money`/Intl), LoyaltyLevels/LoyaltyExpanded/CampaignWinners (`toLocaleString`, `?? '—'`), bench (tabular) |
| #9 count | `count` | GameConfigs (`targetingRules.length`), PayoutConfigs (conditional row count) |
| #10–#15 bespoke | **raw `ColumnDef.cell`** | chips (`NodeKindChip`, `OperationChip`), inline controls (Users `Switch`, DefaultGameConfigs `select`+`Save`, PlayerSearch `Open`), diff (`ChangeValue`), truncate+placeholder (PendingApprovals reason), composite (`PaymentMethodCell`, `ErrorCodeCell`, depth-indent), composed-string (PendingApprovals last-action) |

Open sub-question (flag): our `align`/`width` and the sortable-header affordance currently live in the
organism keyed off `BeamColumn`. The helpers must thread `align`/`width` through `ColumnDef.meta` and the
organism's cell/header renderer must read it there — a small renderer change, called out so it isn't
mistaken for a behavior change. (Note official's stories use bare `accessorKey`/`header` with no
align/width, so this `meta` channel is a lane addition on top of official's column shape.)

---

## 4. Pagination: adopt official's controlled contract

**The fundamental difference:** official is **server-shaped** — you pass the *current page's* `data` +
`totalCount`; the Table renders exactly what it's given and **never slices** (no
`getPaginationRowModel`). Ours is **client-side** — you pass *all* `rows` + `paginated`, and the Table
slices internally (`getPaginationRowModel`, `count = getFilteredRowModel().rows.length`, 0-based
`pageIndex`).

Proposed end-state:

1. **Table adopts official's contract verbatim:** the `pagination: TablePaginationController` (1-based)
   `+ totalCount + paginationDisabled` discriminated union; drop `paginated`, `defaultPageSize`,
   `pageSizeOptions`, the 0-based `PaginationState`/`onPaginationChange`, and internal slicing. Page-size
   options become official's `TABLE_PAGE_SIZE_OPTIONS = [10, 25, 50]`.
2. **A small client-side adapter for demo data.** Every current consumer feeds *all* mock rows and lets
   the Table slice. To preserve that ergonomics without server slicing, add a **`useClientPagination`**
   (name TBD) lane hook: give it the full array (post-filter) → it returns
   `{ pageRows, pagination: TablePaginationController, totalCount }`. The page spreads those onto the
   Table. This is the one-line adapter that keeps demo pages simple.
3. **Reconcile with Wave 1.** `useTableFilters` **already exposes a 1-based
   `pagination: TablePaginationController`** (`{ page, pageSize, onChange }`) and already writes
   `page`/`pageSize` to the URL. So a filtered+paginated page becomes: `useTableFilters` owns the
   controller (URL source of truth) → `useClientPagination` slices the filtered rows against
   `filters.pagination` → Table renders the slice. **This removes the awkward Wave-1 seam**: today
   Gaspar's Transactions manually converts the controller's 1-based `pagination` into the Table's 0-based
   `PaginationState`/`onPaginationChange` (`tablePagination`/`onTablePaginationChange`, TransactionsPage
   lines 522–526). After Wave 2 the controller passes **straight through** — no conversion.
4. **Delete the Wave-1 local copies** (flagged then as "Wave 2"):
   - `packages/beam/src/TableFilters/TableFilters.types.ts` — the locally-defined
     `TablePaginationState` / `TablePaginationController`. Re-source from `Table/Table.types` (the
     official home). The barrel re-export (`index.ts` lines 149–150) repoints to Table.
   - `packages/beam/src/TableFilters/hooks/useTableFilters.ts` — the local `DEFAULT_TABLE_PAGE_SIZE = 10`.
     Re-source from `Table/Table.constants` (`DEFAULT_TABLE_PAGE_SIZE`, official).
5. **`jumpToPage`** re-seats as an additive footer decoration that calls `pagination.onChange({ page, … })`
   instead of `table.setPageIndex`. Gaspar's v1.2 pagination-at-500 (heavy page sizes + jump) then rides
   on the lane, not the core. (Note: official's fixed `[10,25,50]` doesn't include 500 — the heavy set is
   a lane override to reconcile; flag with §6(c).)

---

## 5. Files arrive in official's shape

Official file shape (target):

```
Table/
  Table.tsx            # thin renderer over TanStack + the rail column
  Table.types.ts       # TableProps, TableActionRail, TablePagination{State,Controller}
  Table.styles.ts      # ALL sx extracted here (official has no inline sx)
  Table.constants.ts   # DEFAULT_TABLE_PAGE_SIZE, TABLE_PAGE_SIZE_OPTIONS
  Table.stories.tsx    # title 'Components/Table'
  index.ts
  TableActions/
    TableActions.tsx
    TableHeaderActions/TableHeaderActions.tsx
    TableExpand/{TableExpand.tsx, TableExpand.styles.ts}
    TableSelect/{TableSelect.tsx, TableSelect.styles.ts}
    TableMenu/{TableMenu.tsx, TableMenu.styles.ts}
```

Ours today: a single **84 KB `Table.tsx`** (all sx inline), `Table.types.ts`, `Table.stories.tsx`,
`BeamColumnManager.tsx`, `useColumnManager.ts` — **no `.styles.ts`, no `TableActions/` subtree**.

Proposal: decompose to official's tree, **plus** a lane subtree for what official doesn't have —
`Table.styles.ts` gains the stickyChrome/rowAccent/search sx; the column manager stays as
`BeamColumnManager.tsx` + `useColumnManager.ts` (lane files) beside the official set; a `beamCells/`
helper module (§3). The `.styles.ts` extraction is **in-scope** for Table's own files only (fence:
"no `.styles.ts` moves beyond the Table files themselves"). This is the largest mechanical chunk of the
wave and the highest-risk for stickyChrome regressions — **stories are the regression harness** (every
existing Table story must render byte-identically).

---

## 6. DECISION ITEMS — RESOLVED (approved 2026-09-18)

### (a) Where the 44px `FIELD_TWIN` density lives

**Finding — the density is split today:**
- **Header** row height = **theme** (`createBeamTheme.ts` line 692:
  `MuiTableCell.head = { …meta, height: FIELD_TWIN_HEIGHT, paddingTop:0, paddingBottom:0 }`).
- **Pagination** toolbar height = **theme** (`MuiTablePagination.toolbar = { '&&': { minHeight: FIELD_TWIN_HEIGHT } }`).
- **Body** row height = **organism** (`Table.tsx` line 1398: inline `height: FIELD_TWIN_HEIGHT` on the data `TableRow`).

**The tension with the subset-identical rule.** Official's body rows carry **no** explicit height (MUI
`size='small'` default ≈ 33px). If we keep body-row 44 in the organism, an official-subset Table is
**taller** than official's → violates identical. If we move body density to the **theme**
(`MuiTableRow`/`MuiTableCell.body`), then **every** MUI table in the estate inherits 44 — including
app-local `MuiTable` compositions (Sunlight's `PayoutRowsGrid`, etc. — see §7), which today are *not*
44. Density is theme-layer lane doctrine; the question is whether "official-subset-identical" is defined
**against official-with-our-theme** (then theme-seated 44 is fine and *is* our identical baseline) or
**against official-with-official-theme** (then 44 must live in Table styles, scoped to the organism).

Options:
- **A — Theme-seat body density too** (`MuiTableCell` root/body height = 44). Cleanest single source;
  "identical" means "identical under Beam's theme." **Blast radius (from §7):** every excluded
  `MuiTable`-as-`Table` composition inherits 44 — `PerksPage`, `TargetingRulesGrid`, `LoyaltyRewardsEditor`,
  `Multiplier*`/`Payout*` `RowsGrid`/`RowsEditor`, `TokenCampaignDetailPage`, `WallStagePage`,
  `ConfigDiffPanel` — several of which are dense editor grids that may *not* want 44px rows. Desirable
  (one density everywhere) or surprising, depending on those grids — must eyeball them before choosing A.
- **B — Table-styles-seat body density** (`Table.styles.ts` sets the data-row height; theme stops at
  header/pagination). "Identical" means "identical to official's component under any theme." Cost: the
  density story fragments (header in theme, body in Table styles) — but it's *already* fragmented, so this
  merely formalizes it, and keeps the organism the owner of row geometry (matches the current comment at
  createBeamTheme.ts 689–690).
- **C — Keep exactly as-is** (header/pagination theme, body organism) and simply **declare** that
  subset-identical is measured against Beam's theme. Zero code motion; a doctrine sentence.

**DECISION — theme-scoped, keep-as-is this wave.** The 44px `FIELD_TWIN` is **estate doctrine and lives
in the theme layer**; `Table.styles.ts` stays **official-pure and transplantable** (no
component-specific height leaks into it). "Official-subset-identical" is therefore measured **against
Beam's theme** — a subset-only Table renders at Beam's density, which *is* our identical baseline. No
density code moves in Wave 2.

**Follow-up task (NOT this wave) — consolidate the density split into the theme.** Today body-row height
lives in the organism (`Table.tsx:1398`) while header + pagination live in the theme
(`createBeamTheme.ts:692,706`). A later task moves body density into the theme too (e.g. `MuiTableRow` /
`MuiTableCell` body) so the whole 44px story is one theme-layer source. **Blast radius to weigh then —
the ~9 app-local `MuiTable`-as-`Table` compositions that would inherit theme-seated body density:**
`PerksPage`, `TargetingRulesGrid`, `LoyaltyRewardsEditor`, `MultiplierRowsGrid`/`MultiplierRowsEditor`,
`PayoutRowsGrid`/`PayoutRowsEditor`, `TokenCampaignDetailPage`, `WallStagePage`, `ConfigDiffPanel` —
several are dense editor grids that may not want 44px rows. Recorded here so the follow-up inherits the
list.

**Follow-up task (NOT this wave) — define `theme.vars.overlays` in our theme (evaluate alongside the
density consolidation above).** The ported `TableNext/Table.styles.ts` optional-chains
`t.vars.overlays?.[elevation]` (the elevation-overlay shadow map official's `Table.styles.ts` reads
straight) because our cssVariables theme doesn't define an `overlays` map, so that path currently falls
through to no overlay. Evaluate seating `overlays` in `createBeamTheme` so the ported Table's `elevation`
resolves a real value instead of relying on the optional-chain fallback. (Ruling 2026-09-21, Wave 2 2a.1
— accepted with the sorting gate.)

### (b) Official's `maxHeight` internal scroll vs stickyChrome's page-owns-scroll

These are **opposite scroll architectures**:
- **Official:** `maxHeight` → `TableContainer { maxHeight, overflowY:auto }` (the *table* owns an
  internal scroll region) + `stickyHeader` (CSS `position:sticky` on `th`, sticky **within** that
  region). The rail column is `position:sticky; left:0` with a `.table-scrolledX` shadow.
- **Ours (stickyChrome):** the **page** owns the scroll; the grid has **no** internal scroll region; the
  top bucket (batch strip + a *measured clone* of the header) pins to the viewport top and the footer to
  the bottom via page-level stickiness, with viewport tiers, snap points, and pin-reachability that
  *disengage* the whole apparatus on short viewports.

**Structural conflicts to resolve:**
1. `maxHeight` (internal scroll) and `stickyChrome` (no internal scroll) are **mutually exclusive** by
   construction — you cannot pin chrome to the *page* while the rows scroll inside a *maxHeight* box.
   Proposal: they're an **either/or**; passing both is a misuse (dev-time warn, or a typed union that
   forbids it). Official-subset users get `maxHeight`; lane users get `stickyChrome`.
2. **`stickyHeader`** (official, CSS-sticky `th` within the scroll region) vs stickyChrome's **header
   clone** (a measured presentation copy that page-sticks because the real `thead` can't page-stick from
   inside the overflow-x scroller). With `stickyChrome` off, plain `stickyHeader` must behave exactly
   like official. With `stickyChrome` on, `stickyHeader` is subsumed (the clone does it). Proposal: honor
   `stickyHeader` in the official path; ignore/subsume it under `stickyChrome` (documented).
3. **DOM-contract overlap:** official already uses `.table-scrolledX` / `.table-actionRailCell` /
   `.table-dataRow` / `.table-detailsRow` class contracts for its rail shadow and hover styles; ours uses
   `data-overflow-*` / `data-stuck` / `data-beam-sticky-chrome`. These don't collide (different
   namespaces), but the re-seat must keep **both** sets alive: official's classes for the official path,
   the `data-*` contracts for the lane path. Confirm no `.styles.ts` extraction drops either.

**DECISION — explicit either/or, enforced.**
- **`maxHeight` alone** = official's internal-scroll behavior, **exactly** (the subset rule is
  inviolable: `TableContainer { maxHeight, overflowY:auto }` + `stickyHeader` CSS-sticky `th`, official's
  rail-shadow classes).
- **`stickyChrome` alone** = the page-owns-scroll lane extension (bucket/footer page-pin, clone, tiers,
  snap, reachability; `data-*` contracts).
- **Both set** = a **dev-mode `console.warn`**, and **`stickyChrome` wins** (it is the deliberate opt-in;
  `maxHeight` is ignored in that case).
- Keep **both** DOM-contract sets alive (official's `.table-scrolledX`/`.table-actionRailCell`/… for the
  official path; our `data-overflow-*`/`data-stuck`/`data-beam-sticky-chrome` for the lane path). The
  `.styles.ts` extraction must drop neither.

**BEAM.md doctrine line to add** (beside the Section/Table layering note): *standalone table that owns its
page → `stickyChrome` candidate; embedded or bounded table (in a panel, a drawer, a fixed region) →
`maxHeight`.*

### (c) Official props we may not be able to honor as-is

**DECISION — the subset rule does not bend.**
- Where honoring an official prop needs a dependency we lack, **PORT the dependency from official as part
  of this wave.** Concretely: `loading` → **port official's `Loader`** (2a). It is no longer "flagged" —
  it is scoped into the port.
- Where something is **genuinely impossible** in our setup, **flag it with rationale in the build
  report** — never silently no-op an official prop.
- Specific carve-outs stand as written below (stickyChrome overrides the frame, so `elevation`/`variant`
  apply to the non-sticky card; the Export **submenu** flattens to top-level `ActionMenuItem`s per §2.1;
  heavy page sizes + `jumpToPage` ride the lane footer, §4.5). Each is a documented lane boundary, not a
  dropped prop.

- **`elevation` / `variant`** drive `styles.tableWrapper(elevation)` (overlay image lookup
  `t.vars.overlays[elevation]`) and `Paper variant`. Our stickyChrome path **deconstructs the Paper
  border** (drops the frame; three regions redraw it) — so `elevation`/`variant` may be **meaningless or
  conflicting under stickyChrome**. Proposal: honor them in the official path; document that stickyChrome
  overrides the frame (they apply to the non-sticky card only).
- **`loading`** needs a **`Loader`** we don't have (§1). Honor-able only once Loader lands.
- **Nested row-action menus** (our Export submenu) have **no `ActionMenuItem` shape** — §2.1. Cannot be
  honored inside official's `menu` as-is; must flatten or page-compose.
- **Heavy page sizes (500) + `jumpToPage`** aren't in official's `[10,25,50]` — a lane override on the
  footer, not an official capability (§4.5).
- **`aria-label` required** — we must *not* keep it required (breaks subset-identical construction);
  demote to additive-optional.

---

## 7. Consumer inventory + batching

**Scope finding — two exports named `Table`.** `@betty/beam` exports both the organism `Table` and the
raw MUI table re-exported as `MuiTable` (`index.ts:91`, `Table as MuiTable`). Several files do
`import { MuiTable as Table }`, so their `<Table size="small">…children…</Table>` are **not** organism
consumers. **Landing renders zero tables.** No `.stories.tsx` renders the organism except
`Table.stories.tsx` itself.

**19 true organism consumers** *(Community Jackpots added 2026-09-18)*. Full audit below (props,
pagination style, verdict).

| # | File | Pagination | Verdict — reason |
|---|---|---|---|
| 1 | gaspar/**TransactionsPage** | **Controlled** (1-based→0-based) | **SUSPECT (hardest)** — every advanced prop milestone-gated; only controlled-pagination consumer; columnManager catalog; factory bulkActions w/ real CSV/JSON export + Export **submenu**; rowAccent; stickyChrome; page-composed `[+]` bar |
| 2 | midnight/PlayerSearchPage | `paginated` | mechanical-ish — action `<Button>` cell instead of onRowClick; `searchable` |
| 3 | midnight/PlayerPaymentsPage | `paginated` | suspect-lite — `renderExpanded`=`BeamStat` grid; nested tabs + preset chips |
| 4 | gaspar/bench/registry `WIDGETS.table` | none | mechanical (dummy widget) |
| 5 | gaspar/ruleBuilder/**GridLens** | none | **SUSPECT** — rows are a tree-flatten; depth-indent cell; `disabledReason` delete; `searchable` |
| 6 | sunlight/UsersPage | `paginated` | suspect-lite — inline `<Switch>` cell w/ `stopPropagation` vs `onRowClick` |
| 7 | sunlight/RolesPage | none | mechanical list |
| 8 | sunlight/GameConfigsPage | `paginated`+`defaultPageSize=20` | mechanical — conditional rowActions; `renderExpanded` sub-grid |
| 9 | sunlight/**DefaultGameConfigsPage** | none | **SUSPECT** — editable grid (`<TextField select>` + `<Button>Save`); keyed by `gameType` |
| 10 | sunlight/TokenCampaignsPage | `paginated` | mechanical — only `BeamBool` user |
| 11 | sunlight/CampaignWinnersPage | `paginated` | mechanical — cross-entity stage lookup; child-scoped rows |
| 12 | sunlight/LoyaltyStatusPage | `paginated` | suspect-lite — icon+text identity; concurrency-aware Pending badge; import/export actions |
| 13 | sunlight/MetaGamePresetsPage | `paginated`+`defaultPageSize=20` | mechanical — `renderExpanded` preview |
| 14 | sunlight/PayoutConfigsPage | `paginated`+`defaultPageSize=20` | mechanical — game-type-conditional count cell |
| 15 | sunlight/PendingApprovalsPage | none | **SUSPECT** — page-composed filter bar (Wave 1); cross-entity rows; custom chips; maker-checker actions; long queue unpaginated |
| 16 | sunlight/**LoyaltyExpandedPanel** | none | **SUSPECT** — the ONLY user of `highlightRowId` + `onRowHover(rowId)` (cross-highlights a sibling panel); dual-home (list `renderExpanded` + detail view) |
| 17 | sunlight/**LoyaltyRewardsDeltaTable** | none | **SUSPECT** — positional index-diff (`getRowId`=array index); `ChangeValue` before/after cells; documented false-edit cascade |
| 18 | sunlight/LoyaltyLevelsList | `paginated` | mechanical port |
| 19 | sunlight/CommunityJackpotsPage | `paginated` | mechanical list — identity link + kebab (Edit/Upload Theme/Delete) + Start/End date-slice filters; the CJ detail/milestone child tables are surfaceless `MuiTable`s (excluded, below) |

**Excluded `MuiTable`-as-`Table` compositions** (NOT organism consumers, but they matter for §6(a)
density blast radius): `PerksPage`, `TargetingRulesGrid`, `LoyaltyRewardsEditor`,
`MultiplierRowsGrid`/`MultiplierRowsEditor`, `PayoutRowsGrid`/`PayoutRowsEditor`,
`TokenCampaignDetailPage`, `WallStagePage`, `ConfigDiffPanel`, and the Community Jackpots detail/milestone
child tables (Milestones, Rewards Strategy, Milestone Winners — surfaceless `MuiTable`s inside Sections) —
all Sunlight.

### 7.1 Non-mechanical suspects — what breaks the mechanical `BeamColumn`→`beamCells` swap

- **TransactionsPage** — the acid test. Milestone-gated prop existence; the 1-based↔0-based pagination
  seam (which §4 *removes*); factory `bulkActions` + Export **submenu** (no `ActionMenuItem` shape, §2.1);
  columnManager catalog; rowAccent; stickyChrome. Migrate first after the port, alone, as its own batch.
- **DefaultGameConfigsPage** — an **editable grid** (selects + Save buttons in cells, per-row saved
  state, keyed by `gameType`). Raw `ColumnDef.cell` handles this fine (it's just a cell renderer), but
  it's not a `beamCells` helper — it's a bespoke `cell`. Confirms `beamCells` must be *optional sugar*,
  never the only way to declare a column (raw `ColumnDef.cell` always available).
- **LoyaltyExpandedPanel** — forces the **§2.3 hover-linking decision**: it's a *real* consumer of
  `highlightRowId` + `onRowHover(rowId)`, which official replaces with `onRowHover(row)`/`onRowLeave(row)`
  and no highlight prop. **Recommend: keep `highlightRowId` as an additive lane prop and adopt
  `onRowHover(row)`** (the panel maps row→id itself). Do not silently drop it.
- **LoyaltyRewardsDeltaTable** — index-keyed positional diff; a faithful port of official
  `StatusBoxesDiffTable`. `ColumnDef.cell` renders `ChangeValue`; the index `getRowId` is legal. Mechanical
  once columns are raw, but verify the false-edit-cascade note survives.
- **GridLens** — tree-flatten rows + depth-indent cell + rule-gated `disabledReason` delete. Cells are
  bespoke; mechanical under raw `ColumnDef`.
- **PendingApprovalsPage** — cross-entity rows + custom chips + composed multi-field cells + page-composed
  bar. Cells are bespoke `ColumnDef.cell`; mechanical-with-care.
- **UsersPage / PlayerSearchPage / PlayerPaymentsPage** — interactive/action cells (`Switch`, `Button`)
  and `renderExpanded` variants; all expressible as raw `ColumnDef.cell` + `actionRail.expand`.

### 7.2 Proposed batches (mirrors Wave 1 — staged commits, no split-brain, one push at the end)

- **2a — port** (§8.1): official-shape Table under the real name + a temporary `TableLegacy` (the current
  organism, renamed) so consumers migrate in batches; `beamCells`; `useClientPagination`; `Loader`; delete
  Wave-1 local `TablePagination*`/`DEFAULT_TABLE_PAGE_SIZE`.
- **2b — Gaspar + benches**: TransactionsPage (alone — the acid test), bench `registry`, GridLens.
- **2c — Sunlight, mechanical** (batchable together): RolesPage, GameConfigsPage, MetaGamePresetsPage,
  PayoutConfigsPage, TokenCampaignsPage, CampaignWinnersPage, LoyaltyLevelsList, LoyaltyStatusPage, UsersPage.
- **2d — Sunlight, suspects** (one PR, carefully): DefaultGameConfigsPage, PendingApprovalsPage,
  LoyaltyExpandedPanel (hover-linking), LoyaltyRewardsDeltaTable (index-diff).
- **2e — midnight**: PlayerSearchPage, PlayerPaymentsPage.
- **2×  — Community Jackpots**: the new pages (separate task), audited in when they exist and slotted
  into whichever app-batch they belong to (or their own batch), mechanical-vs-suspect decided at audit.
- **2f — delete `TableLegacy` + doctrine flip.**

Per-batch gate: typecheck 0 + affected-app builds + **every existing Table story renders** (the
stickyChrome regression harness). If any consumer proves non-mechanical beyond the notes above, stop and
surface it (the Wave-1 clause).

---

## 8. What "2a — the port" contains (batching is in §7.2)

The one batch worth detailing, since the rest is mechanical migration (§7.2):

- Official-shape `Table` under the real name: thin renderer over TanStack, `Table.styles.ts` (all sx
  extracted), `TableActions/` tree (Expand/Select/Menu/HeaderActions), `Table.constants`
  (`DEFAULT_TABLE_PAGE_SIZE`, `TABLE_PAGE_SIZE_OPTIONS`). §5.
- Lane extensions re-seated as additive opt-ins inside the new file shape (stickyChrome + hardening +
  DOM contracts, columnManager, bulkActions, rowAccent, `searchable`, `jumpToPage`, `highlightRowId`). §2.
- `beamCells` helper module (§3); `useClientPagination` adapter (§4); a `Loader` (§1).
- The current organism kept temporarily as `TableLegacy` (renamed, not shimmed) so consumers migrate in
  batches — deleted in 2f. No split-brain at wave end.
- Delete the Wave-1 local `TablePaginationState`/`TablePaginationController`/`DEFAULT_TABLE_PAGE_SIZE`
  copies; re-source from `Table/Table.types` + `Table/Table.constants`. §4.4.

**Doctrine flip (2f):** BEAM.md Table row → "aligned (API + implementation)"; `docs/beam-alignment.md`
decisions **2** (raw `ColumnDef` vs `BeamColumn`) and **3** (pagination contract) → DECIDED; decision
**4** (stickyChrome vs maxHeight scroll) records the **either/or lane-extension** ruling from §6(b); the
44px-density decision from §6(a) is written wherever it lands (theme or Table styles).

Per-batch gate throughout: typecheck 0 + affected app builds + **every existing Table story renders**
(the stickyChrome regression harness — BEAM.md §6.3). One push at the very end; nothing deploys mid-wave.
