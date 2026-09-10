# Transactions — milestone switcher & v-spec gap list

Build-notes for the "view as version" milestone switcher (2026-09-10). Derived from Boryana's
cumulative requirements doc `gaspar-transactions-requirements-v1.md`.

## What it is

A demo control (`ShellFooter` → "View as version", precedent: Sunlight's Acting-as switcher) that
shapeshifts the Transactions page to a release phase — v1.0 → v1.1 → v1.2 → Beyond. **Gating is
existence, not disablement:** each capability maps to *not passing* an already-opt-in prop on
`BeamDataTable` / `BeamFilterBar`. The switcher shows what a version IS, not what it's missing. Zero
organism changes.

## Mechanism

- **URL-backed** `?milestone=` on the hash route (`#/transactions?milestone=v1_0`) so each phase is
  directly linkable for the deck. `MilestoneProvider` (React context, `milestone.tsx`) is a thin
  read/write over `useSearchParams`; it exposes `{ milestone, setMilestone, caps }`. Single source of
  truth = the URL; context distributes the derived `caps`.
- **Default = Beyond** (everything, today's behavior) when the param is absent or unrecognised. Beyond
  is written as *absence* — selecting it clears the param, keeping the default URL clean.
- Footer select ↔ URL stay in sync (`setMilestone` writes the query, `replace` so phase hops don't
  pollute back-button history). Nav wiring in `App.tsx` preserves `?milestone` across in-app
  navigation, so the phase survives moving between views (harmless query on other routes).
- **Demo scaffolding, not access control** — the requirements doc is explicit: "hiding a control is
  not access control"; real enforcement is server-side.

## Caps → prop map (cumulative; ✓ = present)

| Capability → prop | v1.0 | v1.1 | v1.2 | Beyond |
| --- | :--: | :--: | :--: | :--: |
| Grid + 14 columns, timeline expansion (`renderExpanded`), pagination (`paginated`) | ✓ | ✓ | ✓ | ✓ |
| Base filters — search, date range, Status, Direction, Provider | ✓ | ✓ | ✓ | ✓ |
| `selection` → `selectable` + `bulkActions` + the bulk **Export** menu | – | ✓ | ✓ | ✓ |
| `columnManager` → `columnManager` (show/hide + reorder) | – | – | ✓ | ✓ |
| `advancedFilters` → filter bar `advanced` (`[+]` addable fields) | – | – | ✓ | ✓ |
| `actions` → Complete/Decline in the bulk strip **and** the row kebab (`rowActions`) | – | – | – | ✓ |

Two composition rules the table doesn't show on its own:

- The **bulk strip appears at v1.1 with Export only**; Complete/Decline join the *same* strip at
  Beyond (the `bulkActions` factory filters by `caps.actions`).
- The **row kebab (`rowActions`) exists only at Beyond**. It's the home of Complete/Decline, and
  **per-row Export folds in there too** — the spec's export scope is "entire filtered result set, or
  the selection" (bulk), so there is no per-row export at v1.1/v1.2. This is deliberately more
  doc-faithful than the pre-switcher page, which offered a per-row Export from v1.

## v-spec gap list (agenda material — recorded, NOT built this pass)

Surfaced while mapping the page to the requirements doc. These are page↔spec deltas for a future
conversation; the fence excluded sorting and anything server-side.

1. **Sorting** — doc v1.0 requires every column sortable both directions (server-side, default
   Created At desc). The page has none.
2. **Server-side paging / sorting / filtering** — doc v1.0 mandates it ("the client never loads the
   full result set to filter locally"); the page is all client-side over a mock.
3. **Error Code + 3DS Status as v1.0 default filters** — doc lists both as v1.0 single-selects; the
   page implements them as advanced `[+]` fields, so gating the `[+]` menu to v1.2 also removes them
   at v1.0/v1.1. Promoting them to always-on default fields is a filter-bar recomposition — deferred
   deliberately, and pending Ruslan's user feedback, which bears on it.
4. **Merchant Transaction ID** — doc's 15-column set has it (field TBC) as a column distinct from
   Gaspar Transaction ID (`id`); the page has neither the column nor a catalog entry (page = 14
   columns). Also: doc's Search covers Merchant Transaction ID; the page can't (no field), and adds
   Customer Email instead.
5. **Transaction Type vs Direction** — doc v1.0 wants Transaction Type as a *badge* on `direction`;
   the page renders Direction as plain text (grammar: category ≠ state) and treats Transaction Type as
   a separate awaiting-data catalog column. Same category-not-state tension applies to **3DS Status**
   (doc: badge; page: plain). Ties to the open Konstantin question already noted in-page.
6. **Customer ID link** — doc: "links to the player record"; page: plain text.
7. **Loading / Error states** — doc v1.0 requires a layout-preserving loading state and an error state
   with retry; the page has only an empty-message state (mock is always loaded).
8. **Export fidelity** — doc: exports the *entire filtered set*, UTF-8 **with BOM**, async above a row
   threshold, with a per-export audit record (it moves PII). Page: selection/per-row, client-side, no
   BOM/audit.
9. **Column-manager persistence** — doc v1.2: server-side per user (must survive a device change);
   page: localStorage.
10. **Pagination affordances** — doc: total count + visible range shown, size configurable up to 500
    with jump-to-page; page uses the organism's default client pagination.
