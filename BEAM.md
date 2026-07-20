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
| **Value** | brand color, spacing, font size, typeface | Variables (collections) | `src/theme/tokens.ts` (generated) |
| **Category rule** | "table headers are uppercase", focus rings, density | Text styles / effect styles | Theme `components` overrides in `createBeamTheme.ts` |
| **Structure / behavior** | what a table is, row expansion, bulk actions | Components (variants, properties) | Organisms in `src/beam/` + stories |

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
   Exception: one-off communication artifacts (diagrams, decks).
3. **Three independent theming axes** — product, jurisdiction, theme — governed by the
   "Axes & dimensionality" section. They multiply through the collection chain; they never
   collapse into one axis or into mode cross-products.
4. **contrastText belongs to the color it sits on.** Alias a contrastText only to the contrast
   decision of its own background — never to a neighboring color's (an Alberta error button
   must not inherit brand-primary ink). This rule exists because we shipped and reverted
   exactly that mistake.
5. **New brand typeface = one Figma value + one webfont line.** Figma renders installed fonts
   for free; browsers must load them (`index.html` + `.storybook/preview-head.html`).
6. **Alias hygiene:** palette aliases into brand; components bind to palette (semantic), not
   brand (raw), and never to `material/colors` primitives.
7. Plan-tier constraints are real: 4 modes per collection below Enterprise. Current
   headroom: palette holds light|dark (2 of 4); product has one free slot reserved for the
   next product; jurisdiction has two free slots for future markets.

## 5. Theming rules (code)

- **Mode (light/dark) switches via CSS variables** — an attribute flip (`data-beam-mode`),
  never JS theme reconstruction. This is a deliberate inversion of Midnight's architecture and
  its re-render cost.
- **Brand is deploy-time in player-facing surfaces** (the payment SDK: one build, one brand)
  but **runtime in back offices** (operators manage multiple jurisdictions from one seat —
  header Location switcher). Brand switch may rebuild the theme; mode switch must not.
- MUI action opacities come from the Figma `_states` alphas (hover 4%, selected 8%, focus 12%);
  focusVisible 30% and outlinedBorder 50% are consumed at component level.

## 6. Component rules

1. **Atoms are MUI. We never rebuild them.** MUI's docs are the atom documentation; the theme
   makes them Betty's. Beam's own surface area is *organisms only*.
2. **All imports go through the barrel** (`src/beam/index.ts` → eventually `@betty/beam`),
   never `@mui/material` directly in product code. Cost: zero. Payoff: one seam when an atom
   ever needs extending or swapping.
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

## Appendix A — Established mappings

| Figma | Code |
|---|---|
| `jurisdiction` collection — modes Ontario\|Alberta; groups `{Product}/{theme}/…` (**seed**: all literals) | `tokens.ts → products[product][jurisdiction]` |
| `product` collection — selector; modes Sunlight\|Gaspar; per-mode aliases into jurisdiction groups | `createBeamTheme(brand, product)` · Storybook **Product** toolbar |
| `palette` collection — modes light\|dark; groupless; what components bind to | MUI `colorSchemes` as CSS variables (`data-beam-mode`) |
| `…/primary/{theme}/primary -1 / (default) / 1` | `palette.primary.dark / main / light` |
| `…/primary/{theme}/alpha 4·8·12%` | `palette.action.{hover,selected,focus}Opacity` |
| `jurisdiction {Product}/fontFamily` | `theme.typography.fontFamily` (+ webfont links in app **and** Storybook head) |
| `jurisdiction {Product}/bg/screen · overlay` | dark `background.default / paper` |
| `derived.tableBorder` — code formula | `palette.divider` + MUI `TableCell.border`; baked → `_derived (baked)` |
| `derived.pageGradient` — code formula | `--beam-page-gradient` via CssBaseline (non-bakeable; Figma twin = a style) |
| `_derived (baked)` collection | GENERATED snapshots of code formulas — never hand-edit |
| text style `table/meta` | `tableMetaText` → `MuiTableCell.head/.footer` + `MuiTablePagination` labels |
| component `BeamStatusBadge` (Status=…) | `<BeamStatusBadge status="…">` (Code Connected) |
| rename log | `brand`→`jurisdiction` · palette modes →plain `light`/`dark` · kit-original demo modes removed |

## Appendix B — Known gaps / open items

- Gaspar values are glanceable **demo placeholders**, not identity — real design pass
  pending; two dark defaults carry pre-correction values (`#57DDCC`/`#ED94FA`; intended
  `#2DD4BF`/`#E879F9`) — true up or bless
- Gaspar backgrounds currently identical to Sunlight (teal-cast option open); Gaspar app
  environment unspawned (cost ≈ accent seed + `createBeamTheme(brand, 'gaspar')` + shell)
- typography collection mobile mode: `fontFamily` still raw Roboto (needs jurisdiction alias)
- Code Connect mapping is "simple" flavor (no template snippet) — refine via CLI later
- Organisms → separate Figma library file: pending second consumer (Orchestrator BO)
- MUI major version for the real Sunlight repo: current MUI is v9, POC is v7 — decide before
  scaffold
- `@betty/beam` as a published package vs in-repo: later
- Asset pipeline: gems done (GemIcon self-registering registry); coins & collection art
  pending; automated Figma→repo export pending network allowlist (`www.figma.com`)
- Productionized sync now has **three output lanes**: seeds→`tokens.ts` · contrast checks ·
  bake→`_derived (baked)`
