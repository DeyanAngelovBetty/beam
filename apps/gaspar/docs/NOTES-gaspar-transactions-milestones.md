# Transactions — milestone switcher & v-spec gap list

Build-notes for the "view as version" milestone switcher (2026-09-10). Derived from Boryana's
cumulative requirements doc `gaspar-transactions-requirements-v1.md`.

## What it is

A demo control (`ShellFooter` → "Viewing as", precedent: Sunlight's Acting-as switcher) that
shapeshifts the Transactions page to a release phase — v1.0 → v1.1 → v1.2 → Beyond. **Gating is
existence, not disablement:** each capability maps to *not passing* an already-opt-in prop on
`BeamDataTable` / `BeamFilterBar`. The switcher shows what a version IS, not what it's missing. Zero
organism changes.

The switcher itself (`MilestoneSwitcher.tsx`) is the always-visible **radio list** styled like
Sunlight's Acting-as — avatar-circle (version number) + label + release-date sub-line rows, selected
state, one click per hop. The "Viewing as" header links out to Boryana's Notion spec (external, new
tab). **Promotion candidate (logged, not built):** this is the *second* consumer of that persona-list
pattern, so the BEAM.md §2 trigger is met — extracting a shared organism is queued as a deliberate
task, replicated app-locally for now.

## Mechanism

- **URL-backed** `?milestone=` on the hash route (`#/transactions?milestone=v1_0`) so each phase is
  directly linkable for the deck. `MilestoneProvider` (React context, `milestone.tsx`) is a thin
  read/write over `useSearchParams`; it exposes `{ milestone, setMilestone, caps }`. Single source of
  truth = the URL; context distributes the derived `caps`.
- **Default = Beyond** (everything, today's behavior) when the param is absent or unrecognised. Beyond
  is written as *absence* — selecting it clears the param, keeping the default URL clean.
- Footer switcher ↔ URL stay in sync (`setMilestone` writes the query, `replace` so phase hops don't
  pollute back-button history). Nav wiring in `App.tsx` preserves `?milestone` across in-app
  navigation, so the phase survives moving between views (harmless query on other routes).
- **Demo scaffolding, not access control** — the requirements doc is explicit: "hiding a control is
  not access control"; real enforcement is server-side.

## Nav & route gating (2026-09-10)

The **sidenav** gates by milestone too, per the release phasing + Deyan's ruling:

| Milestone | Nav |
| --- | --- |
| v1.0 | Transactions only |
| v1.1+ (incl. Beyond) | Dashboard · Transactions · Rule Builder |

- Policy + prune live in `navItems.tsx` (`allowedViews`, `pruneNav`, `landingView`); the nav is pruned
  to allowed views plus their ancestors. **Hidden = absent from the nav, not disabled.**
- **Read literally:** the ruling enumerates exactly the functional views, so the speculative IA
  sections (Providers, Disputes, Reporting, Administration) are pruned at *every* milestone — including
  Beyond — since none maps to a real view. If the placeholder IA should return at v1.1+/Beyond, that's
  a one-line change to `MILESTONE_VIEWS` (add them) — flagged, not assumed.
- **Route guard** (`App.tsx`): a deep-link to a view outside the milestone (e.g.
  `#/dashboard?milestone=v1_0`) redirects to Transactions with `?milestone` preserved — the URL never
  shows a page the version lacks. Landing (`/`, unknown hash) resolves to the milestone's landing view
  (Dashboard when present, else Transactions).

## Caps → prop map (cumulative; ✓ = present)

| Capability → prop | v1.0 | v1.1 | v1.2 | Beyond |
| --- | :--: | :--: | :--: | :--: |
| Grid + 14 columns, timeline expansion (`renderExpanded`), pagination (`paginated`) | ✓ | ✓ | ✓ | ✓ |
| Base filters — search, date range, Status, Direction, Provider | ✓ | ✓ | ✓ | ✓ |
| `selection` → `selectable` + `bulkActions` + the bulk **Export** menu | – | ✓ | ✓ | ✓ |
| `columnManager` → `columnManager` (show/hide + reorder) | – | – | ✓ | ✓ |
| `advancedFilters` → filter bar `advanced` (`[+]` addable fields) | – | – | ✓ | ✓ |
| `paginationAt500` → `pageSizeOptions` (up to 500) + `jumpToPage` | – | – | ✓ | ✓ |
| `actions` → Complete/Decline in the bulk strip **and** the row kebab (`rowActions`) | – | – | – | ✓ |

Two composition rules the table doesn't show on its own:

- The **bulk strip appears at v1.1 with Export only**; Complete/Decline join the *same* strip at
  Beyond (the `bulkActions` factory filters by `caps.actions`).
- The **row kebab (`rowActions`) exists only at Beyond**. It's the home of Complete/Decline, and
  **per-row Export folds in there too** — the spec's export scope is "entire filtered result set, or
  the selection" (bulk), so there is no per-row export at v1.1/v1.2. This is deliberately more
  doc-faithful than the pre-switcher page, which offered a per-row Export from v1.

## Pagination at 500 (2026-09-11 — Ruslan's v1.2 feedback)

- **Organism API (opt-in, per-grid):** `pageSizeOptions?: number[]` (override; omitted → the light
  derived default `[5,10,25,defaultPageSize]`, so no grid silently gains 500) + `jumpToPage?: boolean`
  (a "Page N of M" input: Enter commits clamped to `[1,M]`, Esc/blur revert, disabled at one page,
  tooltip hint while out-of-range — **rejected in the UI, never an error state**). Default size stays 10.
- **Gaspar wiring:** at **v1.2+** (`caps.paginationAt500`) → `pageSizeOptions={[10,25,50,100,250,500]}`
  + `jumpToPage`. v1.0/v1.1 keep the light default. Mock grew to **~1,200 rows** (same generator, same
  enums, no new vocabulary; `stageForDemo` still leads page one).
- **Performance — measured, not assumed.**
  - *Instrument:* `BeamDataTable` logs `rows × cols → ms (render→commit)` to the console behind a
    **`perf=1` URL token** (works on **dev and prod** — the token can ride the hash, e.g.
    `#/transactions?milestone=v1_2&perf=1`; off by default). Open at 500/page and read the number.
  - *First-principles estimate:* 500 rows × 14 cols ≈ 7k cells + ~1.5k copy-button / badge / accent
    nodes; expandable panels mount **only when expanded**; no per-row listeners beyond the row. Expect
    **500 static DOM rows to be comfortable in Chrome** — but this is an estimate.
  - *Definitive number:* to be captured in-browser on the **prod** build and pasted here. **If it proves
    slow, STOP** — virtualization is a separate project (collides with rail / expandable / pinned panel),
    not this pass.

    > PROD measurement (Chrome, 500/page): _pending — paste `[BeamDataTable perf]` console line here._

## Ledger — pagination contract questions (record, don't build)

Konstantin/backend, per Boryana's v1.2 phasing. The mock's counts stay **exact**; these are real-service
concerns only:
- **Response-time budget** for 500-row pages across the full column set (a backend load requirement, not
  a client setting — the client renders what the endpoint serves within budget).
- **Approximate count at scale:** if an exact total becomes expensive, an approximate count is acceptable
  **provided the interface says it is approximate** (a label the count cell would carry). Not built — the
  mock counts are exact, so there is nothing to hedge yet.

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
11. **v1.0: Rule Builder present or not?** — Boryana's v1.0 references 3DS rules living *in the Rule
    Builder* while also stating the Back Office is Transactions-only at v1.0. The nav ruling puts Rule
    Builder at v1.1; the contradiction is Boryana's to resolve (agenda material, nav follows the
    ruling).
