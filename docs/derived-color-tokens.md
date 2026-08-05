# Derived color tokens — CSS color functions in Beam

*A focused companion to `BEAM.md`. For humans and AI assistants (Claude, Cowork)
working on Beam/Sunlight. If you are an AI: treat the guardrails as hard constraints,
and prefer proposing formulas over emitting literal colors.*

---

## 1. The idea in one paragraph

Designers author a **small set of seed colors** (brand primaries, backgrounds — synced
from Figma). Everything else that *follows a rule* is written **as the rule**, in CSS,
computed by the browser: `derived tokens`. One formula replaces dozens of hand-picked
values, can never drift from its seeds, and — the killer feature — **inherits every
theming axis for free**: because the formula references CSS variables
(`--mui-palette-primary-main`), its result updates automatically when product,
jurisdiction, or light/dark mode flips. Four seeds + two formulas currently drive
every border and page wash across 8 theme combinations.

## 2. The two live examples (read these before writing a new one)

### `tableBorder` — a quiet brand tint on every border

```css
/* dark scheme */  color-mix(in oklch, oklch(from var(--mui-palette-primary-main) l c h / 0.25) 77%, white)
/* light scheme */ color-mix(in oklch, oklch(from var(--mui-palette-primary-main) l c h / 0.25) 77%, black)
```

Decoded, inside-out:
- `oklch(from var(...) l c h / 0.25)` — **relative color syntax**: take primary,
  keep its lightness/chroma/hue, set alpha to 25%.
- `color-mix(in oklch, X 77%, white)` — blend 77% of that with 23% white, in
  **OKLCH** (a perceptual color space: mixes look how humans expect, no muddy
  in-betweens).
- The white/black anchor is **mirrored per scheme** — always mix toward the
  *contrast direction* (lighten on dark backgrounds, darken on light ones). A
  formula that mixes toward white looks great in dark mode and vanishes in light
  mode; this mirroring is the most common bug in derived tokens.
- Applied to `palette.divider` *and* MUI's internal `TableCell.border`, so Paper
  outlines, cell rules, and connector lines share one voice.

### `pageMesh` — a three-point tint field on every page *(2026-08-05, replaced the linear `pageGradient`)*

Three large soft radials, one formula, all products — each a subtle tint fading to
`transparent` over the page background:

```css
radial-gradient(120% 120% at 0% 0%,   color-mix(in oklch, var(--mui-palette-primary-main)          I, var(--mui-palette-background-default)) 0%, transparent 55%),  /* hue-a */
radial-gradient(110% 110% at 100% 0%, color-mix(in oklch, var(--beam-gradient-hue-b)                I, var(--mui-palette-background-default)) 0%, transparent 55%),  /* hue-b */
radial-gradient(130% 130% at 50% 120%,color-mix(in oklch, oklch(from var(--mui-palette-primary-main) l c calc(h + 45)) I, var(--mui-palette-background-default)) 0%, transparent 55%)  /* hue-c */
/* I = var(--beam-gradient-intensity) */
```

- **Three tint points, one recipe.** `hue-a` is primary (existing seed); `hue-b` is a
  designer-controlled seed (`--beam-gradient-hue-b`); `hue-c` is **derived by +45°
  hue rotation** off primary, so it rotates per product for free — no seed.
- **Product identity is the intensity dial, not a forked formula.** `gradientSeeds`
  carries `hueB` + `intensity` per product per scheme; the single formula reads them.
- **Every tint mixes toward `background-default`, never white/black** (the dark-mode
  tint bug). The fade is to `transparent` *only*, so the three layers blend and reveal
  the base beneath.
- **Light intensity < dark** (Sunlight 6/10, Gaspar 14/22): a light page has less
  headroom for tint before it muddies — the same asymmetry family as the surface ramp.
- **Painted on a FIXED `body::before` layer** (CssBaseline override): `position:
  fixed` so it's composited and never repaints on scroll, `pointer-events: none`,
  `z-index: -1`. Opaque ramp surfaces (Paper/Menu/Dialog) occlude it, so it shows only
  in page-background gaps. It sits behind the **Drawer** too (viewport-fixed) — a
  deliberate property: a translucent Drawer treatment later will let the mesh show
  through as a feature, not a surprise.
- **Chrome-first**: nested `var()` (including a var in the `color-mix` percentage slot)
  and `oklch(from …)` need a modern engine — same posture as the rest of this doc.

### `beamGradientBorder` — an opt-in lit edge from the same points *(2026-08-05)*

A barrel-exported sx factory (Kevin Powell's two-background technique): a
`conic-gradient(from var(--beam-border-angle), …)` in `border-box` shows through a
`1px solid transparent` border, masked by a solid `padding-box` layer of the actual
surface. Stops **reuse the page-mesh tint points** (primary · `hue-b` · primary +45°),
each mixed toward the surface so it's a lit edge, not a rainbow — border and background
come from one palette. **Opt-in only** (never global on Paper); applied this pass to the
Gaspar dashboard widget shells.

- **Constant geometry** — the border is `1px solid transparent` at all times; calm is a
  low-intensity conic, so nothing appears on hover and nothing reflows.
- **Intensity is a per-scheme seed** (`borderIntensity`, `{calm, hover}`); light needs
  more than dark or the edge vanishes on a near-white surface. Tune freely.
- **Surface is a parameter** — must be the real surface behind the element (default
  `background.paper` = surface 1); pass `--beam-surface-2/-3` for Menu/Dialog.
- **Animation** — `--beam-border-angle` is a registered `@property` (a typed `<angle>`,
  so it can interpolate; `inherits: false` so it doesn't leak). The rotation runs
  **paused** and resumes on hover (never restarts → no snap-back); it stays paused under
  `prefers-reduced-motion` — static but still lit.
- **Squircle caveat** — `MuiPaper.rounded` carries `corner-shape: squircle`; whether
  `background-clip` follows the squircle corner is untested. Left intact, pending a visual
  check.

## 3. Recipe: adding a new derived token

1. **Name the rule, not the color.** "Selection wash is 8% primary over background"
   is a derived token; "#1A1B4B" is not.
2. **Reference CSS variables, never literals.** `var(--mui-palette-*)` inputs are
   what make the token axis-aware. A formula containing a hex is a bug.
3. **Decide: single formula or per-scheme mirror?** If the formula mixes toward
   white/black (a contrast direction), mirror it (`light`/`dark` variants). If all
   inputs are theme-flipping variables, one formula suffices.
4. **Add it to `packages/beam/src/theme/tokens.ts` → the `derived` section** (code-owned; the
   Figma→code sync preserves this block). Document what it derives from and why.
5. **Emit it** in `createBeamTheme.ts`: either into an MUI palette slot (like
   `divider`) or as a `--beam-*` custom property via `MuiCssBaseline` overrides.
6. **Bake for Figma if designers need it on canvas:** compute the literal results
   per brand×scheme and write them into the `_derived (baked)` collection in the
   Foundations file — labeled GENERATED, never hand-edited, regenerated when the
   formula or seeds change. (Gradients can't be Figma variables; their Figma twin,
   if needed, is a style.)
7. **Check contrast implications.** A derived color that text sits on needs the
   same WCAG scrutiny as a seed.

## 4. CSS features cheat sheet

| Feature | What it does | Support posture |
|---|---|---|
| `color-mix(in oklch, A p%, B)` | perceptual blend of two colors | broadly supported |
| `oklch(from X l c h / a)` (relative color) | derive a variant of an existing color | Chrome 119+, Safari 16.4+, FF 128+ |
| `var()` inside color functions | axis inheritance | everywhere |
| `corner-shape: squircle` | (cousin feature already in Beam) | Chrome 139+, progressive |

Posture: the BO is Chrome-first, same stance as the squircle — modern CSS is welcome;
anything player-facing gets a stricter support review.

## 5. Guardrails (especially for AI assistants)

- **Never precompute a formula's result into a component.** If you know the answer
  is "#3630A1 at 42%", the token is the *formula*, not the number. Hardcoded results
  silently stop tracking their seeds.
- **Formulas live in `tokens.ts`, not in component `sx`.** A color-mix in a
  component is a one-off; in the derived section it's a system rule.
- **Don't invent new theming axes** inside formulas (no per-product conditionals in
  CSS — the axis system handles that upstream; formulas just consume variables).
- **If something can't be derived** (needs designer judgment, or Figma can't
  represent even the baked result), stop and flag it — that's a seed request or a
  style, not a workaround.
- Respect the mirror rule (§2) — check every new formula in **both** schemes and at
  least two brands before calling it done.

## 6. Ideas menu (unclaimed, come play)

Hover/selected washes derived from primary · focus rings (`primary` at 30% — the
`focusVisible` state token, but computed) · chart color ramps generated from primary
by rotating OKLCH hue · elevation tints (surface + n% primary per level) · product-
accent derivatives once Gaspar's identity lands · status-badge soft variants
(status color at 12% over background). Each is one formula. That's the point.

## 7. The surface ramp — elevation as a derived L-offset (load-bearing · 2026-08-05)

The tracer (`derived.surface1`, commit `ee10823`) proved a new *kind* of derived
token: one whose formula is mode-invariant but whose step size is a scoped seed.
Promoted to load-bearing on 2026-08-05 — the five-position `derived.surface` now
drives every background in every product. What it settled, then how it landed:

**DECIDED — the mechanism.** Surfaces are positions on an elevation **ramp**, not
a vocabulary list. Each surface is an OKLCH **lightness offset** from surface 0
(the page background), with **c and h passed through** so surfaces stay faintly
branded instead of going flat grey:
`oklch(from <surface 0> calc(l + <step>) c h)`.

**DECIDED — mode-scoped step seeds.** The formula is mode-**invariant**; only the
step *size* is a mode-scoped seed (`--beam-surface-step`). It is emitted under
`[data-beam-mode]` — the same attribute-flip layer MUI uses for its palette vars
— so a mode change updates every surface with **no theme rebuild** (BEAM §5).
This is the reusable shape for any derived token whose *size*, not whose *rule*,
varies by mode: the rule lives in `:root`, the mode-scoped magnitude on the
`[data-beam-mode]` selectors.

**DECIDED — the light/dark asymmetry is deliberate, not a bug.** Light mode has
no headroom above paper-white, so its ramp is nearly flat and **shadow carries
elevation**. Dark mode's shadow is invisible against a near-black surface, so
**lightness carries elevation**. One doctrine either way: *elevation is carried
by the surface ramp; shadow is a contact cue, not the elevation itself.* The two
modes look structurally different because of this, on purpose.

**DECIDED — never mix toward a literal.** Derived colors mix toward a mode-scoped
seed (`--beam-mix-lift` / `--beam-mix-sink`), never `white` / `black`: white over
a near-black dark surface is the classic tint bug. Applies to the relative-color
fallback shape and to any future gradient or shadow formula.

**DECIDED — the five positions, load-bearing (2026-08-05).** The tracer
graduated: `derived.surface` holds all five positions and the roles **alias**
them — `background.default`→0 (page), `background.paper`→1 (paper),
Menu/Popover→2 (raised), Dialog→3 (top). `surface -1` (sunken) is emitted and
reserved (no consumer yet). **A role never carries its own hex** — it points at a
ramp position, and the arithmetic guarantees the order.

**What the repoint fixed.** Hand-picked surfaces had drifted out of order: dark
`paper` (L 0.228) sat *above* the old `overlay` (L 0.210), so a menu rendered
**darker** than the card it opened over. Positions computed from one anchor + one
step cannot invert like that — the ordering bug is now corrected by arithmetic,
not vigilance. That correction is the point of the whole change.

**Seeds are PRODUCT-scoped** (`surfaceSeeds`, tokens.ts): anchor + step per
scheme, per product (Figma `product/surface`). The old product-background and
per-jurisdiction bg variables were **deleted** — **jurisdiction no longer affects
surfaces, deliberately; do not restore it.** The step is now product- *and*
mode-scoped: the product half bakes at theme construction (product is a rebuild),
the mode half still flips on `[data-beam-mode]`.

**Light step is 0.010, not 0.02** — a correction, not a placeholder. At 0.02,
surface 3 computes to L 1.0151 — past pure white, impossible. Light mode has only
~0.045 of L headroom above the page, so its ramp is necessarily compressed and
**shadow carries elevation there** (the asymmetry above). Dark keeps 0.07 (0.085
for Gaspar — a wider separation).

**STILL un-baked, un-audited.** Bake and contrast audit remain un-runnable
in-repo (BEAM Appendix C), so the live ramp is unverified against those lanes. The
Figma `_derived surfaces (baked)` collection is a designer SNAPSHOT, not the
source — code computes the real values; do not read or mirror it.
