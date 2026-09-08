# SPEC — BeamDataTable Column Manager (Tracer Bullet 3)

**Date:** 2026-09-08
**Consumer:** Gaspar transactions page (first); Sunlight grids inherit
**Organism:** BeamDataTable — this IS an organism change, unlike bullet 1
**Scope:** Column show/hide + reordering + persistence, and the manager UI.
**Explicitly out of scope:** filters (separate workstream), row selection/export, density/sticky work, header-drag reordering (see Reordering), any change to column *definitions* on the Gaspar page beyond wiring the new capability.

## Why organism-level

Column visibility and order are TanStack table state (`columnVisibility`, `columnOrder`) the organism already sits on. Gaspar transactions is the live consumer; every Sunlight grid is a consumer-in-waiting. Per BEAM.md promotion logic this lands in the organism directly — but the API must be additive and opt-in so existing grids are untouched until they ask for it.

## Organism API

```ts
<BeamDataTable
  columns={columns}
  rows={rows}
  columnManager={{ storageKey: "gaspar.transactions" }}  // opt-in; absent = today's behavior
/>
```

- `columnManager?: { storageKey: string; catalog?: { id; label }[] }` — presence enables the capability. `storageKey` is required when enabled: persistence without a stable identity is a bug factory.
- Column identity = the existing `BeamColumn` accessor/id (`key`). No new per-column props required for v1, with one optional addition: `defaultHidden?: boolean` on `BeamColumn`, so a grid can ship catalog columns that exist but start invisible.
- Everything else (manager UI, state wiring, persistence) is internal to the organism.

## Manager UI

- Trigger: icon button in the grid's toolbar region (right-aligned). Tooltip "Manage columns".
- Surface: popover. Checkbox list of all columns in *current* order; reordering per row. Keyboard reorder must exist.
- "Reset to defaults" action at the popover foot — clears persisted state, returns to the column defs' declared order/visibility.
- No column is locked in v1. If a grid later needs a pinned/mandatory column, that's a deliberate API addition, not an assumption now.
- Hiding all columns must be impossible — minimum one visible column enforced.

## Persistence

- `localStorage`, key `beam:grid:<storageKey>:columns:v1`.
- Payload: `{ order: string[], hidden: string[] }`. Nothing else — widths, when they become adjustable, get their own versioned slot.
- **Merge rule (the part that always goes wrong):** persisted state may reference columns that no longer exist, and the grid may declare columns the persisted state has never seen. On load: drop unknown ids silently; insert new columns at their spec-declared position with their declared default visibility. A user's arrangement survives a deploy that adds a column; the new column still shows up.
- The `:v1` suffix is the schema escape hatch — bump it rather than migrating in place.

## Interplay with the Gaspar catalog

Decision (Deyan): **(b) Show catalog columns disabled, annotated "awaiting data".** The manager becomes a visible ledger of the column conversation. Catalog list sourced from the bullet-1 spec: Transaction Type, Name on Card, ProcessedBy, Fraud Rules Matched. *Payment Method Details is NOT a catalog column — it is the Phase B card cell inside Payment method.*

## Reordering scope note

v1 reorders via the manager popover list only — no header drag-and-drop. Header dragging is heavier and the popover covers the actual need; if it earns its way in later, it's additive.

## Acceptance

- Existing grids without `columnManager` render byte-identical to today — capability invisible until opted into.
- Toggle a column off → it disappears; reload → still hidden. Reorder → survives reload.
- Add a new column to the defs with persisted state present → it appears at declared position; user's other arrangements intact. Remove a column from defs → persisted reference dropped silently, no error.
- Reset returns to declared defaults and clears storage.
- Keyboard-only user can toggle and reorder.
- Minimum one visible column enforced.
- Sunlight builds and renders unchanged (organism change is additive — verify, don't assume).

---

## Build notes — how this was implemented (2026-09-08)

- **Files.** `useColumnManager.ts` (state + persistence + merge), `BeamColumnManager.tsx` (trigger + popover, internal — NOT barrel-exported), wiring in `BeamDataTable.tsx`, types in `BeamDataTable.types.ts` (`defaultHidden` on `BeamColumn`; `BeamColumnManagerConfig` with `catalog`). Story: `BeamDataTable.stories.tsx` → `ColumnManager`.
- **API delta.** `BeamColumn.defaultHidden?: boolean`; `BeamDataTableProps.columnManager?: { storageKey: string; catalog?: { id; label }[] }`. Both additive/opt-in.
- **Render reroute (architecture finding, surfaced + approved).** The render previously mapped the raw `columns` prop (header paired positionally to `getAllColumns()[i]`; body mapped `columns`), so `columnVisibility`/`columnOrder` would have been ignored. Header and body now iterate **`table.getVisibleLeafColumns()`** and resolve each back to its `BeamColumn` via an id→column `Map`. With no manager this yields declared order, all visible → **byte-identical**. TanStack stays the single state backbone (no parallel state).
- **Opt-in isolation.** When `columnManager` is absent, no `columnVisibility`/`columnOrder` state and no `on…Change` are threaded into `useReactTable`, and the toolbar's spacer + trigger are not rendered — a searchable-only or toolbar-less grid is unchanged in the DOM.
- **Reorder mechanism.** ▲/▼ buttons per row (keyboard + pointer, no DnD dependency). Drag handle is additive-later.
- **Merge rule.** `mergeOrder` keeps the persisted order for still-existing ids, drops unknown ids, and inserts new declared ids right after their nearest earlier declared neighbour. `mergeVisibility` obeys persisted hidden for known ids, declared `defaultHidden` for new ids. `reset` clears storage and returns to declared defaults WITHOUT re-persisting.
- **Min-one-visible.** Enforced twice: the last visible column's checkbox is disabled in the popover, and the organism's toggle handler refuses to hide the last visible column.
- **Sunlight render check.** No Sunlight grid opts into `columnManager`, and none uses `searchable` — so their toolbar branch stays false (no toolbar rendered) and the render reroute is order/visibility-neutral. Verified via the Storybook regression build; definitive pixel check is the maintainer's.

## Spec home

Organism-level specs live in **`packages/beam/docs/`** (this file is the first). Convention: organism specs → `packages/beam/docs/`; page design artifacts → `apps/*/designs/`; cross-cutting doctrine → `/docs`.
