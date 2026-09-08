# BeamDataTable — organism build-notes

Decisions and additive changes to the organism, newest first. (Column-manager capability has its own
spec: `SPEC-beam-datatable-column-manager.md`.)

## Scroll-behavior — pinned expanded panel + edge shadows *(2026-09-08, density installment #2)*

Two scroll affordances on the horizontal scroll area. No sticky headers (out of scope).

- **Expanded panel pins to the visible width, not the row.** The `renderExpanded` panel used to live in
  the `colSpan` cell and scroll sideways with the columns. It now sits in a `position: sticky; left: 0;
  width: 100cqw` wrapper. `100cqw` resolves to a new **container-query wrapper** (`container-type:
  inline-size`) around the scroll container — the *visible* scroll-area width, independent of the
  scroller's `scroll-state` support. So the timeline + its action bar never scroll sideways, at any
  scroll position or viewport. Chose container-query units over a measured width for a pure-CSS
  solution on Baseline; `ResizeObserver`-measured width stays the break-glass fallback (not needed —
  `inline-size` containment did not disturb the table layout; verified at build).
- **Scroll-aware edge shadows.** Both edges share the SAME soft gradient (shared `EDGE_WIDTH`,
  `--beam-edge-shadow` tint), fading away from the edge, so they read as siblings. The RIGHT is an
  absolute `pointer-events:none` overlay at the scroll area's right edge (leftward-fading). The LEFT
  carries TWO layers on the rail cell, doing different jobs and appearing together: a **`::before` 1px
  divider** (theme `divider` token) that defines the rail *boundary*, plus the **`::after` gradient**
  at `left: 100%` (rightward-fading) signalling the *occlusion*. Both left layers anchor to the rail's
  *actual* right edge (`right:0` / `left:100%`), tracking the rail width as controls change it — no
  hardcoded offset. Visibility unchanged:
  LEFT via `@container scroll-state(scrollable: inline-start)` + `data-overflow-start` fallback; RIGHT
  via `data-overflow-end`. Both attributes are set on the wrapper by a passive, rAF-throttled
  scroll+resize listener (un-gated so it always runs — the right overlay can't be a `scroll-state`
  descendant, so it has no pure-CSS path). Shadows appear only while scrollable in that direction and
  vanish at the edges; a grid with no horizontal overflow shows **none, ever**.
- **Compat / posture:** the pinned panel is all-modern-browser (container queries, Baseline 2023). The
  shadows are **progressive affordance** — scroll-state gives the left shadow pure-CSS on Chrome, the
  rAF listener covers every browser for both edges; graceful absence only with JS disabled, accepted.
- **Token:** both edges draw from **`derived.edgeShadow`** (emitted as `--beam-edge-shadow`) — a
  mode-agnostic `color-mix(... common.black 22% ...)`; **retired the hardcoded `RAIL_SCROLLED_SHADOW`
  literal.** Sticky headers (a later installment) will draw from the same token.

## Layout pass — bulk strip inside the surface, manager trigger to the footer *(2026-09-08)*

Two moves; blast radius is Gaspar transactions + two stories (the repo-wide inventory found **no**
Sunlight/midnight grid passes `selectable`/`columnManager`/`bulkActions`).

- **Bulk-actions strip moved INSIDE the grid's `Paper`, as the top section** (was an unboxed strip on
  the page background above the surface). Now a bordered top region (`px:2`, `minHeight:48`,
  `borderBottom`) — the BeamPaper-sectioning *pattern* (DetailsPanel/PrizeWall precedent), applied
  without adopting the component (see the future task below).
- **Column-manager trigger relocated to the FOOTER, leftmost**, with the aria-live selection count
  immediately to its right; rows-per-page + range + pagination stay right. aria-live preserved across
  the move. The footer's left cluster renders only when `selectable || columnManager`; everyone else
  keeps the **bare `paginationEl`** path → byte-identical.
- **Density installment #1 — empty-toolbar elimination.** With the trigger gone, the top toolbar
  renders only for `searchable`. A grid with `searchable=false` (Gaspar transactions) now renders **no
  top toolbar at all**, reclaiming the dense toolbar row (~48px). This is the first concrete move of
  the density topic; further density/sticky work is out of scope until picked up deliberately.

**Future doctrine task (own task, own gate):** *grid surface → a shared surface primitive, or an
always-bordered / full-bleed / multi-region BeamPaper variant.* Today the grid uses raw
`Paper variant="outlined"`. BeamPaper was **not** adopted here because its border is a semantic — the
editability border (transparent until the surface holds an input) — whereas a grid must be
always-outlined; adopting it without an API extension would ship a regression as a swap.

## Batch-actions surface — eligibility + confirm + selection-aware factory *(2026-09-08)*

Brought the bulk-actions surface up to the **BeamRowMenu doctrine** the row kebab already followed
(actions computed against their subject; disable-with-a-reason, never silently hide). All additive,
opt-in, back-compat — the only consumers were two stories.

- **`BeamBulkAction` gained `disabled?`, `disabledReason?`, `confirm?`.** `disabled` adds page-computed
  eligibility on top of the always-on zero-selection disable; `disabledReason` shows as a tooltip when
  disabled (the doctrine `BeamRowAction` already has). `confirm` requests a confirm for a
  **non-destructive** action (destructive already auto-confirms) — the surface confirms when
  `a.confirm || a.destructive`, so existing destructive consumers are unchanged.
- **`bulkActions` grew to `BeamBulkAction[] | ((selectedRows: Row[]) => BeamBulkAction[])`** (Option C).
  The factory mirrors `rowActions: (row) => …` — it's resolved with the actual selected `Row` objects
  (`table.getSelectedRowModel().rows.map(r => r.original)`), so a page can compute `disabled`/reason
  against the **live selection** while the organism stays the single owner of selection state. The
  rejected alternative (an `onRowSelectionChange` callback + page-mirrored selection) was the
  parallel-state smell. Back-compat: an array is used as-is.

**Queued organism decision — a styled confirm surface.** The surface still uses `window.confirm`
(reused, not a new dialog, to avoid scope creep and the estate's no-dialogs lean). The native confirm
will read **visually off-brand in live demos** — that observation is exactly what should drive (or
not drive) promoting a styled confirm surface into the organism. Not built; logged here so the
decision is made on evidence.

*Inherited behavior worth watching:* the surface calls `resetRowSelection()` after every bulk action,
so selection clears after Export too ("export-then-act re-selection"). Accepted as-is; flagged as a
usage question in the first consumer's notes (Gaspar transactions).
