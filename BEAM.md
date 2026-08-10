# BEAM.md — Design System Operating Manual

**Beam** is Betty's back-office design system. This document is the shared contract for everyone
— human or AI assistant — designing, generating, or coding against it. If you are an AI agent
(Claude, Cowork, Claude Code): treat these as hard constraints, and when a request conflicts
with them, flag the conflict instead of silently complying.

*v0.1 · 2026-07-13 · maintained by Deyan · scope: Sunlight first, Payment Orchestrator BO and
Midnight retrofit next.*

---

## 1. The three-lane routing rule

Every design decision travels exactly one lane. Before implementing anything, classify it:

| Kind of decision | Example | Figma home | Code home |
|---|---|---|---|
| **Value** | brand color, spacing, font size, typeface | Variables (collections) | `packages/beam/src/theme/tokens.ts` (generated) |
| **Category rule** | "table headers are uppercase", focus rings, density | Text styles / effect styles | Theme `components` overrides in `createBeamTheme.ts` |
| **Structure / behavior** | what a table is, row expansion, bulk actions | Components (variants, properties) | Organisms in `packages/beam/src/` + stories |

Why it matters: each lane has its own sync mechanism and its own single source of truth.
Putting a decision in the wrong lane means it silently stops propagating.

## 2. Layer architecture (Figma and code mirror each other)

```
Products (Sunlight, Orchestrator BO, Midnight retrofit)   ≈ app code
        ↓ subscribes to            ↑ promotion path
Beam Organisms (shared operational grammar)                ≈ @betty/beam
        ↓ subscribes to
Beam Foundations (MUI v9 kit + Betty token collections)    ≈ node_modules
```

- **Foundations** = the paid MUI for Figma v9 kit, *modified*: Betty's `brand` and `palette`
  collections live inside it. Never re-download the kit over this file. (Currently Organisms
  shares this file on clearly-marked pages — acceptable while there is one consumer; split into
  its own library when the Orchestrator BO becomes the second consumer.)
- **Promotion path:** patterns are born in product files. When a *second* product needs one, it
  moves up to Organisms. Nobody predicts sharedness in advance; usage decides.
  - Worked example, both halves: `SunlightShell` was deliberately **left** in `apps/sunlight`
    even though all three demo apps plainly would need a BO shell — and then **promoted** to
    `BeamAppShell` one step later, when Gaspar actually became the second consumer. Same day,
    both decisions. Waiting cost nothing and the abstraction was better for having two real
    consumers to answer to. `BeamPageHeader` and `BeamTabs` followed the same path from
    duplication in Sunlight and Gaspar. *(2026-07-20)*
- Product-specific patterns (e.g. the paytable editor) start and stay in the product until
  promoted.

## 3. Axes & dimensionality

The theming axes are **product** (Sunlight | Gaspar | …), **jurisdiction**
(Ontario | Alberta | …), and **theme** (Light | Dark). Rules, in order of how much
pain each one prevents:
 
1. **Axes earn their existence.** A dimension is added when the first token
   genuinely varies along it — never in anticipation. Every token that stays
   product-invariant is the design system doing its job.
2. **One axis per collection's modes.** Mode cross-products
   (`SunlightOntario`, `GasparAlberta`) are **banned** — they burn the 4-mode cap
   at 2×2 and destroy mode semantics. When a token genuinely varies along two
   axes, the value cross-product is unavoidable *arithmetic*; it lives in **token
   groups** (rows scale; columns don't).
3. **Consume once, carry the rest, never skip a hop.** Walking up the chain, each
   collection consumes exactly one axis with its modes and carries the
   not-yet-consumed axes in its group names. Consumed axes never reappear;
   groups shrink as you climb; the top collection has none. Aliases point exactly
   one hop down.
4. **The chain** (current): `jurisdiction` (SEED — all literals; modes
   Ontario|Alberta; groups `{Product}/{theme}/…`) ← `product` (selector; modes
   Sunlight|Gaspar; per-mode aliases into the matching group) ← `palette` (top;
   modes Light|Dark; groupless; what components bind to).
5. **Verification is mechanical:** the sync resolves every axis combination
   end-to-end; a skipped hop or stale alias shows up as a wrong hex or a frozen
   axis. (2026-07-17: 8/8 combinations verified.)

## 4. Token rules

1. **Single source of truth per token, not single place for all tokens.**
   - **Seed tokens** (hand-chosen literals: primaries, surfaces, typefaces,
     accents): **Figma is truth**; `tokens.ts` is generated from it, never
     hand-edited.
   - **Derived tokens** (rules computed from seeds — color-mix, relative color):
     **code is truth**; they live in the `derived` section of `tokens.ts` (which
     syncs preserve), because Figma cannot express color functions.
   - **Baked snapshots**: derived results are computed to literals and written
     back to Figma (`_derived (baked)` collection, labeled GENERATED, never
     hand-edited) so canvases can bind to the real rendered colors, drift-free.
   - The lanes: **Figma→code for seeds · code→Figma for snapshots.** Every token
     has exactly one source; the sources live in two places with a crisp boundary.
   - Full doctrine, worked examples, recipe and AI guardrails:
     `derived-color-tokens.md`.
2. **No hardcoded colors, spacing, or type in components or designs.** Because the sync
   pipeline audits tokens (it caught a real WCAG failure); hardcoded values escape the audit.
   Exception: one-off communication artifacts (diagrams, decks). *(That audit is the Figma-side
   `audit:contrast` lane — not an in-repo gate; typecheck/build don't run it. See Appendix C.)*
3. **Three independent theming axes** — product, jurisdiction, theme — governed by the
   "Axes & dimensionality" section. They multiply through the collection chain; they never
   collapse into one axis or into mode cross-products.
4. **contrastText belongs to the color it sits on.** Alias a contrastText only to the contrast
   decision of its own background — never to a neighboring color's (an Alberta error button
   must not inherit brand-primary ink). This rule exists because we shipped and reverted
   exactly that mistake.
5. **Typeface is a PRODUCT-axis seed — a title/body pair.** *(2026-08-05.)* `product/font/{title,
   body}` (tokens.ts `productFonts`): the **body** face is the base `typography.fontFamily` — the
   workhorse for data and for the `meta` key voice, which omits `fontFamily` *on purpose*
   (`textStyles.ts`) so it inherits the body face. The **title** face binds to **h1–h6 only**, so
   expressive type lives at headline size and never in data. Numeric columns in that data use
   **tabular figures** (`font-variant-numeric: tabular-nums`, applied to right-aligned cells in
   BeamDataTable) — Gaspar's body face is Geist chosen for exactly this. Font moved off the
   per-jurisdiction collection where it never belonged: **Alberta no longer renders Poppins, and
   that is the correction landing, not a regression — do not restore it.** Swapping a face is one
   seed edit + one webfont line per app `index.html` + `packages/beam/.storybook/preview-head.html`
   (Figma renders installed fonts for free; browsers must load them).
6. **Alias hygiene:** palette aliases into brand; components bind to palette (semantic), not
   brand (raw), and never to `material/colors` primitives.
7. Plan-tier constraints are real: 4 modes per collection below Enterprise. Current
   headroom: palette holds light|dark (2 of 4); product has one free slot reserved for the
   next product; jurisdiction has two free slots for future markets.

## 5. Theming rules (code)

- **Mode (light/dark) switches via CSS variables** — an attribute flip (`data-beam-mode`),
  never JS theme reconstruction. This is a deliberate inversion of Midnight's architecture and
  its re-render cost.
- **The estate emits the native CSS `color-scheme` property on the same `data-beam-mode`
  layer** *(2026-08-04):* so the browser's OWN widgets — scrollbars, native `<select>`,
  date/time inputs, checkbox/radio, Chrome autofill — follow app mode, not the OS. Set at one
  seam in `createBeamTheme` `MuiCssBaseline` (a `:root` dark default guarding the no-attribute /
  SSR frame per `defaultMode`, overridden per mode by `[data-beam-mode="light"|"dark"]`), so it
  flips with no theme rebuild like every other mode-scoped token. Do not confuse the two
  same-named mechanisms: MUI's `colorSchemes` config themes *our tokens* (the palette); the
  native `color-scheme` property themes the *browser's own* widgets. The cascade behind the
  hand-written seam (`:root` emits first, equal specificity, so the attribute rules win) was
  **re-verified byte-identical at the v9 bump** — same emitted order, and v9 emits no native
  `color-scheme` of its own — and is now pinned to **MUI 9.2.0**. Re-verify on the next major.
- **Brand is deploy-time in player-facing surfaces** (the payment SDK: one build, one brand)
  but **runtime in back offices** (operators manage multiple jurisdictions from one seat —
  header Location switcher). Brand switch may rebuild the theme; mode switch must not.
- MUI action opacities come from the Figma `_states` alphas (hover 4%, selected 8%, focus 12%);
  focusVisible 30% and outlinedBorder 50% are consumed at component level.
- **Stack rhythm is gap, never margin-top** *(2026-07-30):* vertical/horizontal
  rhythm between stacked elements comes from the parent's `gap` (Stack `spacing`,
  now `useFlexGap: true` estate-wide), never from `mt`/`mb` sprinkled on child
  Papers/Boxes/sections. **Scope:** this governs *layout rhythm between siblings*
  only. Out of jurisdiction: a component's own intrinsic spacing (a Divider's
  `my`, a Typography's `gutterBottom` — type-idiom gutters), a margin inside a
  `Collapse` that must collapse with its content, and optical nudges within a
  component. Flag the ambiguous; don't convert reflexively.

## 6. Component rules

1. **Atoms are MUI. We never rebuild them.** MUI's docs are the atom documentation; the theme
   makes them Betty's. Beam's own surface area is *organisms only*.
2. **All imports go through the barrel** (`packages/beam/src/index.ts` = `@betty/beam`),
   never `@mui/material` directly in product code. Cost: zero. Payoff: one seam when an atom
   ever needs extending or swapping.
   - **Carve-out: `@mui/icons-material` may be imported directly in apps.** Icons are not
     themed atoms — there is no styling seam to protect — and curating a re-export list of
     ~60 glyphs is churn that buys nothing. Beam re-exports an icon only when it wraps it
     with meaning (as `GemIcon` does). *(Decided 2026-07-20, when the monorepo split turned
     this convention into an enforceable package boundary.)*
3. **Every organism ships as a trio:** `Name.types.ts` + `Name.tsx` + `Name.stories.tsx`.
   Stories are the regression harness — internal rewrites must keep existing stories green.
4. **Statuses are semantic vocabulary, not colors.** `BeamStatusBadge` accepts
   `active | scheduled | draft | paused | expired | error`; extending the union is a
   vocabulary decision made deliberately, never a color pick. (Approval-flow states like
   `pendingApproval` are anticipated candidates.)
5. **Headless engine + themed surface.** Complex behavior (tables today, likely more) uses
   headless libraries (TanStack Table) purely as state engines; Beam renders 100% of the
   pixels with themed MUI atoms. We do not adopt pre-styled component libraries beyond MUI.
6. **Accessibility is not optional:** every interactive organism takes/derives `aria-label`s;
   contrast is enforced at token level (see 3.4).

## 7. Figma ↔ code sync mechanics

- **Tokens down:** Figma variables → MCP/script sync → `tokens.ts` → theme. Run after any
  variable change.
- **Identity back:** organisms published in Figma get **Code Connect** mappings so Dev Mode
  resolves designs to `<BeamComponent props />` instead of raw CSS. Moving a published
  component between files breaks its mapping — remap after moves.
- **Category rules:** Figma text/effect styles ↔ theme `components` overrides, paired by name
  (`table/meta` ↔ `tableMetaText` in the theme). Keep the mapping list in this doc's appendix as it
  grows.
- Figma component ↔ code component naming matches 1:1 (`BeamStatusBadge` both sides);
  variant property values in Figma map to prop values in code (documented in the Code Connect
  template).

## 8. Domain grounding (from the Yoda audit + data-flow docs)

Design against the real model, not a generic BO:

- **Paytables are first-class, reusable, stable-identity objects** with versioned revisions
  (Yoda's unstable IDs are a named defect). Every paytable UI shows Expected Avg Payout and
  validates probabilities sum to 1 — verification is ambient, not a separate act.
- **Rules reference defaults** (`use default` is a first-class option, not hardcoded paytable
  binding) — the 80-rules × 400-clicks A/B story is the cost of getting this wrong.
- **Segmentation is a targeting attribute, not the physical shape of configuration** (no
  one-row-per-loyalty-tier layouts).
- **Approval/provisioning states must be visible on objects** (draft / pending approval /
  live), not hidden in URLs.
- Patterns to keep from Yoda: progressive disclosure (inline row expansion), clone-first
  workflows *with guardrails*, environment banners, preview-before-commit, status + filter +
  search on every list. Patterns to reject: walls of numbers, GUID-first displays, dev
  vocabulary in labels, bulk-selection absence.

## 9. Working process

- **Tracer bullets before volume:** prove each new kind of change end-to-end on the smallest
  example (e.g. uppercase headers), then scale.
- **Propose → review → build.** AI assistants present a plan or diff for review before large
  generations; small verified steps over big unverifiable ones.
- **Verify, don't assume:** code changes are typechecked and built before handoff; Figma
  changes are screenshot-verified; token changes re-run the sync.
- **Decisions get written down here** the day they're made, with their reason. An undocumented
  decision doesn't exist.
- **The Lab.** App-local patterns get bench stories under `Lab/<Product>/<Name>` for isolated
  design iteration *before* page integration. A Lab entry is a question, not a home: it either
  graduates with its component via the promotion path (§2), or is deleted once its question is
  answered. *(2026-07-25.)* **A comparison bench is the exception:** when the question is "which
  of these," the *winner* graduates into a product page while the bench itself **stays put** as
  the record of the decision — the head-to-head is the evidence, and evidence outlives the choice.
  (First case: `Lab/Bench/Dashboard` — Variant 1 graduated to Gaspar's Dashboard; the bench and
  its losing Variant 2 remain.) *(2026-08-05.)*
- **Product collaborators and their agents.** Collaborators work in this repo directly, by
  branch and PR; their agents read BEAM.md and the grammars and follow them — a collaborator can
  ship a coherent page without ever reasoning about the doctrine behind it. That is the
  mechanism, and it works. *(2026-08-04.)*
  - **Assembly is self-serve; invention is design lane.** A page built from existing grammars
    with existing organisms is *assembly* — branch, build, PR, no gate. A new page species,
    organism, save model, or interaction — anything that sets a precedent the grammars don't
    already answer — is *invention*: it goes through Deyan **before** it is built, not after (the
    promotion path, §2). The test is not size — a 300-line page from settled patterns is
    assembly; six lines that change nesting rhythm are invention.
  - **Stories are a byproduct, not a burden.** Agents write Storybook entries by following the
    grammars (§6.3, the regression harness); nobody budgets for them. A collaborator who believes
    supporting Storybook is separate work they must do has been misinformed — at the Presets and
    Default Game Configs pages *(2026-07-31)*, a collaborator's agent produced pages, components,
    and Storybook entries in one pass; the collaborator did not write or maintain a story, and is
    unlikely to know any were created.
  - **The docs travel with the package.** Beam without BEAM.md and `docs/` is a component
    library, and a worse one than MUI. Consuming Beam means consuming the docs — or it is not
    Beam being consumed.
  - **Agents cannot see each other.** Two agents in separate sessions share no view of who did
    what; an unexplained ref move is more likely a human or another session than a fault. Report
    state, don't repair it, and never take an irreversible or outward-facing action — force-push,
    remote branch deletion, history rewrite — without an explicit go from Deyan in that session.
- **Major dependency upgrades** follow [docs/major-upgrades.md](docs/major-upgrades.md): a red,
  install-only commit first (typecheck is *not* the blast radius), then staged fixes — and the
  barrel makes upstream codemods inert, so mind the import-rewrite recipe. *(2026-08-04.)*

## 10. For AI assistants generating designs (Cowork / Figma agents)

1. Use **library components from Foundations** (and Organisms once split) — do not draw new
   buttons, inputs, chips, or tables from scratch.
2. Bind every color, radius, and spacing to **existing variables**; every text layer to an
   existing **text style** where one applies. No raw hex, ever.
3. Set all three axes on frames you produce: `product` (Sunlight/Gaspar), `jurisdiction`
   (Ontario/Alberta), and `palette` (light/dark). Check your design across combinations —
   contrast bugs hide in the corners, and there are eight corners now.
4. New repeated UI ideas are **proposals for organisms**, not local inventions: name them,
   note them, don't fork them per screen.
5. Respect the status vocabulary (5.4) and the domain rules (7) — e.g. any paytable mockup
   shows sum-to-1 and Expected Avg Payout; any rule mockup offers "use default".
6. When a needed token, style, or component doesn't exist: **stop and flag it** — that's a
   system gap to fix once, not a local workaround to invent.

---

## Appendix A — Repo map & Figma files

The repo is an npm-workspaces monorepo: one design system, several demo apps.

```
packages/beam/          @betty/beam — tokens, theme, organisms, Storybook
apps/landing/           the published index (links every surface + its Figma file)
apps/sunlight/          loyalty back office
apps/gaspar/            payment orchestrator back office
apps/midnight-demo/     retrofit slice — player search + payments tab
```

Apps alias `@betty/beam` to `packages/beam/src` and consume it as source; there is no
package build step. Published to GitHub Pages on push to `main`: landing at the site
root, each app and Storybook in its own subdirectory.

| Surface | Figma | Code |
|---|---|---|
| Foundations + Organisms | [Beam (MUI v9)](https://www.figma.com/design/9yNbolohxGitkMJKDjoyKG/Beam--MUI-v9-?node-id=4662-14) | `packages/beam` |
| Sunlight | [Sunlight](https://www.figma.com/design/erQ1X8e91k6YwRsKgnzXDY/Sunlight?node-id=0-1) | `apps/sunlight` |
| Gaspar | *not yet created* | `apps/gaspar` |
| Midnight retrofit | *not yet created* | `apps/midnight-demo` |

Keep this table and `apps/landing/src/registry.ts` in step — the landing page is what
everyone else sees, and a missing Figma link there reads as "no design exists".

## Appendix B — Established mappings

| Figma | Code |
|---|---|
| `jurisdiction` collection — modes Ontario\|Alberta; groups `{Product}/{theme}/…` (**seed**: all literals) | `tokens.ts → products[product][jurisdiction]` |
| `product` collection — selector; modes Sunlight\|Gaspar; per-mode aliases into jurisdiction groups | `createBeamTheme(brand, product)` · Storybook **Product** toolbar |
| `palette` collection — modes light\|dark; groupless; what components bind to | MUI `colorSchemes` as CSS variables (`data-beam-mode`) |
| `…/primary/{theme}/primary -1 / (default) / 1` | `palette.primary.dark / main / light` |
| `…/primary/{theme}/alpha 4·8·12%` | `palette.action.{hover,selected,focus}Opacity` |
| `product/font/{title,body}` | **body** → `theme.typography.fontFamily`; **title** → `typography.h1`–`h6` (`createBeamTheme` via `productFonts`) · webfont links in app **and** Storybook head |
| `product/surface/{dark,light}/{anchor,step}` | `surfaceSeeds` → a 5-position derived ramp (`derived.surface`): `background.default`→0, `background.paper`→1, Menu/Popover→2, Dialog→3; sunken −1 reserved. Jurisdiction no longer carries background *(product-scoped since 2026-08-05; the old `bg/*` vars were deleted — don't restore)*. See docs/derived-color-tokens.md §7 |
| `derived.tableBorder` — code formula | `palette.divider` + MUI `TableCell.border`; baked → `_derived (baked)` |
| `derived.pageGradient` — code formula | `--beam-page-gradient` via CssBaseline (non-bakeable; Figma twin = a style) |
| `_derived (baked)` collection | GENERATED snapshots of code formulas — never hand-edit |
| text style `meta` (supersedes `table/meta`) | `meta` (`theme/textStyles.ts`) → `MuiTableCell.head/.footer` · `MuiTablePagination` labels · `MuiInputLabel` · exported for organisms (BeamStat key, section/box headers) |
| `derived.spine.{default,warning,danger}` — code formulas | `--beam-spine-*` CSS vars via CssBaseline; baked → `_derived (baked)` |
| component `BeamStatusBadge` (Status=…) | `<BeamStatusBadge status="…">` (Code Connected) |
| rename log | `brand`→`jurisdiction` · palette modes →plain `light`/`dark` · kit-original demo modes removed · `table/meta`→`meta` (graduated table-local → universal key voice, 2026-07-24) |

## Appendix C — Known gaps / open items

- Gaspar values are glanceable **demo placeholders**, not identity — real design pass
  pending; two dark defaults carry pre-correction values (`#57DDCC`/`#ED94FA`; intended
  `#2DD4BF`/`#E879F9`) — true up or bless
- Gaspar backgrounds currently identical to Sunlight (teal-cast option open). Gaspar app
  environment **spawned 2026-07-20** (`apps/gaspar`, transactions screen); its marquee
  node-graph rule builder is still to come — graph library to be chosen with Ivan
- typography collection mobile mode: `fontFamily` still raw Roboto (needs a product-axis alias
  into `productFonts`)
- **Midnight is not a product** — it renders via `product: 'sunlight'` (`apps/midnight-demo`) and
  so inherits Sunlight's Inter body/title. Figma's `product/font` may carry a distinct Midnight
  title face; code does not chase an aspirational seed (2026-08-05, Figma to be corrected to
  match). Promoting Midnight to a real product — its own `ProductName` value and axis corner — is
  its own decision on its own day, not a side effect of a font change.
- **Gaspar Dashboard renders the default widget set.** `DashboardPage` renders
  `BenchDashboardStatic` with its default `visibleWidgetIds` (every widget in `dashboardConfig`).
  Per-role narrowing is a **prop that already exists but is not wired** — there's no
  role→widget-set mapping feeding it yet. *(2026-08-05.)*
- **`dockview-react` is a spike dependency awaiting bench retirement.** It backs the
  dashboard-bench's losing Variant 2 (`apps/gaspar/src/bench`); the bench stays as the record of
  the decision (§9 Lab exception), so the dep stays with it. Removing `dockview-react` + Variant 2
  is deferred until the bench is retired — removal sites are marked `// SPIKE: remove if Variant 1
  wins`. *(2026-08-05.)*
- **Dashboard bench — Variant 3 "cards declare, container satisfies" (under evaluation).**
  *(2026-08-07.)* A third contender (`BenchDashboardDeclare`, Storybook-only, judged against
  Variant 1) inverting layout authority: config keeps only `id` + `order`; the **card** declares
  its width (`WIDGETS[id].span`, in the widget definition); a `repeat(auto-fit, minmax(min(240px,
  100%), 1fr))` + `grid-auto-flow: dense` + `grid-auto-rows: auto` grid satisfies it. Kills the
  KPI height bug *structurally* — content-sized rows mean a card takes the height it needs, so the
  chart fits with no rowSpan anywhere (the two-authorities split that caused the bug is gone).
  **Deliberate product consequence: a user CANNOT drag a card wider — the card decides its span.**
  Findings for the judging: (1) Trap 1 (a `span N` exceeding the track count) is clamped in pure
  CSS — the container publishes its track count as `--cols` via a **min-width container-query
  ladder generated from the shared `BASE`/`GAP`** (rungs at `trackStart(n)`, up to `MAX_COLS = 8`),
  and each card takes `span min(--span, --cols)` = "the tracks I want, or all that exist, whichever
  is smaller." The ladder and auto-fit are **two derivations of the same count** and stay honest
  only while both read those roots (commented at both sites). A card that must always fill the row
  declares `span: 'full'` → `grid-column: 1 / -1` (ceiling-free, no `--cols`); `filter` is the one
  such card. **The ladder has a real ceiling:** past `trackStart(9) = 2288px` auto-fit yields 9
  tracks while `--cols` saturates at 8 — inert today (largest numeric span is 3, and `'full'` is
  ladder-independent), but a card wanting > 8 tracks would need `MAX_COLS` raised or `'full'`.
  `min()`-in-grid-span **resolves in Chrome — confirmed in devtools 2026-08-10** (at 1314px cards took
  distinct widths); the fallback, if it ever regressed, is numeric cards collapsing to one track. (2)
  `dense` diverges visual from DOM order: at 3 cols `status` backfills row 1 col 3 ahead of `band`;
  at 4 cols `table` backfills ahead of `filter`. Reading/tab order stays = config `order`. (3)
  **"No empty slots" is not absolute** — dense removes the *large* holes, but a **1-track parity
  hole** appears at some counts (current set: one hole at 2, 3 and 6 tracks; 4/5/7 pack clean)
  because the lone `span: 1` card (`status`) doesn't tessellate with its neighbours and no other
  1-track card remains to backfill. Tuning spans to tessellate would mean a card lying about its
  content need — not done. (4) **Proportional spans (Trend, `{divisor:2,min:2,max:4}` = "~half the
  grid, 2–4") — a NEGATIVE finding, recorded plainly *(2026-08-10)*: a proportional span RELOCATES
  the parity hole (6→7), it does NOT reduce it.** It is monotonic in `--cols`, so the value that
  closes the 6-track hole (Trend = 3) also applies at 7, opening one there; a monotonic span cannot
  fix a parity gap. Its real, judgeable value is the *other* thing — a card asking for a proportion
  of the grid and GROWING with it (Trend 2→2→3→3→4 across 4–8 tracks). **But the parity gap is a
  property of the CARD SET, not a mark against V3:** the same simulation on Variant 1's fixed
  12-column grid gives **3 interior empty cells, constant at every width** (the rowSpan-1 `status`
  leaves a 3-wide gap beneath it), whereas V3's worst case at any single width is **1** (0 at most
  widths). V3 has *strictly fewer* holes than the grid it's judged against. `round(down, …)` for the
  proportional value (CSS Values 4) **also resolves in a grid span — confirmed in devtools 2026-08-10:**
  at 1551px Trend rendered `--min 2 / --max 4 / --divisor 2` and occupied **3 of 6 tracks** =
  `round(down, 6/2)` clamped and guarded; `'full'` spanned every track. **Row-
  leftover absorption ("stretch to fill the free tracks beside me") is NOT expressible** and must
  not be re-added: a card can read the total track count but not its own row occupancy, so faking it
  needs position maths — the thing this model exists to avoid; a static floor only moves the hole.
  Reordering (Trap 3) is reported, not solved: DOM order follows config, but `auto-fit` + `dense`
  place cards, so a role cannot pin a position without positioning authority the model avoids.
- ~~The page mesh sits behind the Drawer; the shell pass intends a translucent Drawer~~ —
  **landed 2026-08-06:** the rail is **frosted glass** (translucent nav-surface + `backdrop-filter`
  blur/saturate), so the mesh + dots diffuse through it as intended. Two OPEN items: (a) the
  **narrow-viewport** drawer is a MUI modal, so its `backdrop-filter` blurs the **scrim**
  (semi-transparent dark), not the raw mesh — acceptable for now; the raw backdrop there is a
  Modal/`Backdrop` change, a separate conversation. (b) the rail shows the mesh's viewport-fixed
  **left edge** — verify it doesn't unify rail and page and undercut chrome-recedes.
- **The peek/float panel's `boxShadow: 8` is a raw MUI (black-literal) shadow** — the last
  thing in the shell still using a non-tokenized colour. The docked rail's separation shadow
  is surface-derived (`--beam-nav-shadow`, per-scheme alpha); peek should follow rather than
  carry MUI's black elevation. Not urgent — peek genuinely floats and the black reads fine on
  its own — but it's inconsistent with the no-black-literals doctrine. Retokenize when the
  shell gets its next pass. *(2026-08-06.)*
- Code Connect mapping is "simple" flavor (no template snippet) — refine via CLI later
- Organisms → separate Figma library file: the second consumer now exists in code
  (`apps/gaspar`), so the Figma-side split is due
- ~~MUI major version: POC is v7, upstream is v9 — decide before scaffold~~ — **resolved
  2026-08-04:** the estate runs **`@mui/material` 9.2.0** as of the v9 bump (branch
  `bump/mui-v9`, fast-forward merged to `main` at `ff19c69`). There is **no MUI v8** —
  Material UI went 7 → 9 to realign its major with MUI X — so the history skips a number by
  design, not omission. Migration findings: [docs/major-upgrades.md](docs/major-upgrades.md).
- ~~`@betty/beam` as a published package vs in-repo~~ — **decided 2026-07-20: in-repo npm
  workspace, consumed as source** (apps alias `@betty/beam` → `packages/beam/src`, no build
  step). Forced by `GemIcon`'s `import.meta.glob` asset registry, which resolves at Vite
  transform time and cannot survive precompilation. Revisit if Beam ever ships outside this repo.
- **Placeholder organisms awaiting a Figma design pass**: `BeamPageHeader`, `BeamTabs`,
  `BeamFilterBar` (added 2026-07-20, grouped under "Organisms (placeholder)" in Storybook).
  Shape-only, so screens had something stable to build against — the design thinking is
  deliberately deferred to Figma rather than improvised in code. `BeamFilterBar` in particular
  passes fields as children; a field-schema API is the open design question. *(`BeamStat`
  graduated 2026-07-24 — spine motif + `meta` key + severity; no longer a placeholder.)*
- Asset pipeline: gems done (GemIcon self-registering registry); coins & collection art
  pending; automated Figma→repo export pending network allowlist (`www.figma.com`)
- **The token sync — three NAMED lanes, none in this repo yet:**

  | Lane | Direction | Trigger | Truth | Status |
  |---|---|---|---|---|
  | `sync:seeds` | Figma → `tokens.ts` | any variable change | Figma | **not in repo** |
  | `bake:derived` | code → Figma (two targets, below) | any derived-formula change | code | **not in repo** |
  | `audit:contrast` | reads resolved values, gates | after either lane | — | **not in repo** |

  **`bake:derived` has TWO targets, on different axes** *(2026-08-10)* — the earlier
  single-`_derived (baked)` description was incomplete:

  | Baked output | Modes (axis) | What bakes there, and why that axis |
  |---|---|---|
  | `_derived (baked)` | Ontario · Alberta (**jurisdiction**) | `tableBorder`, spine — they derive from `primary`, which IS jurisdiction-scoped |
  | `product/_ramp/*` | Sunlight · Gaspar · Midnight Assistant (**product**) | the surface ramp — product-scoped |

  The surface ramp was **moved INTO the `product` collection on 2026-08-10.** It
  previously lived in its own `_derived surfaces (baked)` collection, which duplicated
  the product axis: a frame had to set the product mode **twice** (once per collection),
  and a mismatch silently paired one product's fonts with another product's surfaces.
  One collection, one switch. Naming convention now separating seeds from derived
  *inside* `product`: **`surface/*` and `gradient/*` are seeds you author in Figma;
  `_ramp/*` is baked output, never hand-edited** (the `_` marks generated, as `_derived` does).

  None of the three exists as a repo script. They are executed Figma-side via the
  MCP connector, on demand, by Deyan. **A seed or derived-token change is
  UNVERIFIED until that run happens** — typecheck and build do not audit tokens.
  At least two ad-hoc implementations exist (Deyan's and Alex's); neither is
  authoritative. Landing one implementation in-repo, under these three names, is
  an open item. *(2026-08-03.)*
