# BeamFilterBar — organism build-notes

Decisions and additive changes to the organism, newest first.

> The `[+]` menu's disabled "awaiting data" entries are a rendered-state ledger; how state/status
> renders across the estate is [/docs/state-rendering-grammar.md](../../../docs/state-rendering-grammar.md)
> (evidence: [/docs/status-grammar-audit.md](../../../docs/status-grammar-audit.md)). Phase-3
> reconciliation is separately gated — not triggered by these notes.

## Advanced representation — add / remove / persist fields *(2026-09-09)*

Opt-in `advanced` config turns the bar into the advanced filters panel (Figma `AdvancedFiltersPanel`,
node 12900-785; frame at `apps/gaspar/designs/AdvancedFiltersPanel.png`). Additive — absent ⇒ today's
default bar, byte-identical (no Sunlight consumer passes `advanced`, and none enters the added-field or
[+] paths). Kept the name `BeamFilterBar` (no rename/alias) so the ~8 Sunlight consumers don't churn;
"FiltersPanel" stays a concept name for a possible future quiet-day rename.

- **API:** `advanced?: { addableFields: AddableField[]; storageKey: string; onFieldRemoved?: (id) => void }`.
  `AddableField = { id, label, control, disabled?, disabledReason? }` — `control` is the page-wired
  input (composition, same as `children`), rendered by the bar only when added, wrapped with an `[x]`.
- **`useFilterFields` DELIBERATELY parallels `useColumnManager`** — the same opt-in-capability idiom.
  The organism owns the STRUCTURE (`addedFieldIds`) + persistence (`beam:filters:<storageKey>:fields:v1`,
  ordered id array, values never persisted; merge-on-load drops unknown/disabled ids in saved order).
  The page owns the VALUES (draft/applied); **removal bridges back via `onFieldRemoved`** so the page
  clears that field's draft value(s). CLEAR ALL zeroes values but never touches the added structure —
  structure is workspace, values are query.
- **[+] menu:** MUI `Menu` of not-yet-added fields; disabled "awaiting data" entries render disabled
  with their reason — the third rendered ledger (columns manager → error codes → this). Keyboard-
  operable; each `[x]` is focusable.

**Parked adjacencies (out of scope by design):** operators, AND/OR / boolean UI, saved filter sets,
duplicate field instances, chips, URL state, server-side seams. Later iterations, not omissions.
