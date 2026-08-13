# Gaspar Rule Builder — spec + decision record

**Status:** Built (2026-08-13). This one file holds the whole trail — proposed → reviewed → built
→ what actually happened. Payment-routing rule-set editor: a ReactFlow canvas + a grid lens, two
projections over one store.

---

## Proposal

### What we're building

The Routing › Rule Builder page becomes real — a rule-set editor with two lenses over one store:

- **Graph lens** — `@xyflow/react` v12 canvas (zoom/pan, Controls, MiniMap, dotted Background whose
  colour derives from theme tokens). Node kinds `sequence | condition | action`, each a themed Beam
  card; selection uses the gradient-border recipe.
- **Grid lens** — `BeamDataTable` over the same store, one row per node (kind pigment-chip, name,
  params summary, connections). List-grammar conformant, read-only in v1.
- **Lens toggle** — `BeamTabs` graph|grid; switching never touches data.
- **Import/export** — versioned JSON `{ version: 1, name, nodes, edges }` incl. positions; export =
  copy/download, import = paste/file with graceful validation (error card, never a crash).
- **Demo seed** — a plausible card-routing set (EU + provider-health → Stripe/Adyen/Checkout).

### Fixed decisions (from the brief)

1. `@xyflow/react` is an **apps/gaspar-only** dependency; themed via its `--xy-*` CSS variables
   mapped to Beam tokens — no hardcoded colours, no stylesheet fork.
2. One module store (payoutConfigs precedent), two projections. The store leaves the maker-checker
   socket open (versioned, `registerEntity`-able later) — named, not built.
3. Node-kind vocabulary is page-local (3 words + pigments); no BeamStatus borrowing.
4. v1 edit affordances: add node (per kind), connect, rename, edit params, delete; manual
   positioning (persists in JSON). Auto-layout is **not** v1 — the button's home is proposed, nothing
   built.

### File plan

`apps/gaspar/src/gaspar/ruleBuilder/`: `ruleSetStore.ts` (types + singleton + seed + serialize +
validate + advisories + grammar), `RuleBuilderPage.tsx` (shell, tabs, import/export, RF provider,
error boundary), `GraphLens.tsx`, `GridLens.tsx`, `nodes/RuleNodeCard.tsx`, `nodes/NodeKindChip.tsx`,
`NodeInspector.tsx`, `RuleBuilderPage.stories.tsx`. Wiring: `navItems.tsx` (+`ruleBuilder` view),
`App.tsx` (view switch, lazy), `package.json` (+`@xyflow/react`).

### Data model

`RuleNode = { id, kind, name, position, params }` discriminated by `kind`; `RuleEdge = { id, source,
target }`; `RuleSet = { version, name, nodes, edges }`. Params (small but honest): **sequence**
`{ strategy: 'firstMatch' }`; **condition** `{ field: amount|currency|method|providerHealth, op, value }`;
**action** `{ type: route|reject|review, provider? }` (provider required iff route). JSON schema v1 =
the RuleSet verbatim, positions included. `validateRuleSet(json)` returns typed errors, never throws.

### Component anatomy

Page = `BeamPageHeader` (import/export actions) → `BeamTabs` → active lens, inside one
`<ReactFlowProvider>`. GraphLens = `<ReactFlow>` with themed Background/Controls/MiniMap + a
toolbar Panel (add-node buttons + a disabled **Tidy** stub where auto-layout will live). RuleNodeCard
= `<Paper variant="outlined">` (surface 1); selected → `beamGradientBorder()` (carry the
no-`overflow:hidden` constraint). GridLens = `BeamDataTable`. NodeInspector = the single edit surface
(rename / kind-specific params / delete).

### Dependency wiring

`@xyflow/react` is a plain gaspar dep (culori precedent — lives where it's used, never re-exported
from `@betty/beam`). Its stylesheet is imported once (`@xyflow/react/dist/style.css`) and themed by
mapping `--xy-*` → Beam tokens on the canvas container — exactly the dockview precedent
(`BenchDashboardDock.tsx:88-101`). No vite change.

### Open-question answers (as proposed)

- **Edge validation** — connect-time rejection of the kind grammar via `isValidConnection` (structure
  prevents; store stays valid by construction), plus a non-blocking render-time advisory layer for
  completeness (orphans, dead-ends, multiple roots).
- **Params** — as in Data model.
- **RF provider / SSR / story** — provider wraps the page; SSR is a non-issue (Vite SPA, `noSsr`); the
  story renders the real seeded page in a sized container (Lab surfaces-board precedent).
- **Grid editing** — read-only v1; rows offer "Edit in graph" + "Delete".
- **Bundle / lazy-load** — heavy dep on one route → lazy-load; report real numbers at build.

### Maker-checker socket (named, not built)

`RuleSet` carries `version`, and the store is a mutable singleton, so a future CR integration is a
pure add: `'ruleSet'` on `ChangeRequestEntity`, `RuleSetDraft = Omit<RuleSet,'version'>`, and
`registerEntity<RuleSetDraft>('ruleSet', { getVersion, applyDraft })` as the store's import
side-effect — mirroring `apps/sunlight/src/sunlight/loyaltyStatuses.ts`. Nothing built.

---

## Sign-off (2026-08-13)

Approved — build in the file order given.

**(a) Pigments: accepted** — sequence→info / condition→warning / action→success reads as a coherent
traffic-light metaphor (flow / decide / act) and stays inside semantic tokens. ONE constraint it
creates: the render-time validation advisories (Q1's badges) must NOT also wear the warning pigment,
or every condition node reads as permanently troubled and real advisories vanish into the crowd.
Advisories get a visually distinct treatment — error pigment for genuine problems, or a neutral
icon-only badge for completeness notes. Builder's pick, stated in the build report.

**(b) Connect-time rejection: approved**, with the render-time advisory layer exactly as proposed.
This is the maker-checker symmetry — structure prevents (`isValidConnection` refuses the drop),
validation backstops (import + advisories). Same doctrine, new surface.

**Everything else:** lazy-load approved (report real split numbers). Grid read-only + "Edit in
graph" / "Delete" approved. Gradient border on selection with the no-`overflow:hidden` constraint
approved — carry the registry comment's warning into the node card. Maker-checker socket name-only.
Trivial: `nodeInspector.tsx` → `NodeInspector.tsx` (component files are PascalCase).

---

## Build true-up (2026-08-13)

Built as approved. What actually happened:

- **Advisory treatment (sign-off a — the builder's pick):** advisories render as an **error-pigment
  icon badge** (`ReportProblemRounded` in `error.main`) on the node card's header, tooltip-listing the
  messages. Distinct from the warning-pigmented condition chip, so real advisories never blend in.
  Chosen over the neutral icon so a genuine "will never be reached / goes nowhere" reads with
  appropriate weight.
- **Bundle / lazy-load (the real numbers):** the Rule Builder route is `React.lazy` + `Suspense`.
  - Main gaspar entry: **675.08 KB raw / 212.11 KB gzip** — essentially flat vs the pre-task
    673 KB (+~2 KB of lazy glue + the recursive nav wiring). ReactFlow is **absent** from it (verified
    in-bundle).
  - Deferred `RuleBuilderPage` chunk: **202.47 KB raw / 66.18 KB gzip** JS + **15.87 KB / 2.67 KB
    gzip** CSS (the xyflow stylesheet) — downloaded only when an operator opens the route. This
    slightly exceeds the proposal's ~55–65 KB gz estimate because the chunk also carries the page
    code + d3-zoom/drag/selection + zustand; the point stands — none of it touches the landing bundle.
- **Deviations (all mechanical, no functional change):**
  - **Built leaf-first**, not top-down in the listed order, so `typecheck` stayed green after each
    file (a page importing not-yet-written children would error). Same files, dependency order.
  - **Nested-nav view wiring:** Rule Builder is a *child* of Routing, and the existing App nav map
    only wired top-level `view` tags. Fixed by making `GasparNavItem.children` recursively
    `GasparNavItem` (overriding `BeamNavItem`'s `children`) and recursing the wiring — so a `view`
    tag now routes at any depth.
  - **Import UI is an inline panel**, not a modal — `Menu`/`Dialog` aren't in the `@betty/beam`
    barrel, and an inline validate-before-apply panel is cleaner than adding atoms speculatively.
  - **`useReactFlow` not used in v1:** new nodes drop at a fixed cascading position rather than the
    viewport centre. The `<ReactFlowProvider>` is still in place (documented pattern + future
    toolbar), so screen-centre placement is a trivial follow-up alongside Tidy.
- **Gates:** typecheck 0, build ×4 green, Storybook builds (`Gaspar/Rule Builder` story renders the
  real seeded canvas).
