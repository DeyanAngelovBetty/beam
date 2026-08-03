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

### `pageGradient` — brand wash on every page

```css
linear-gradient(180deg,
  color-mix(in oklch, var(--mui-palette-primary-main) 10%, var(--mui-palette-background-default)) 0%,
  var(--mui-palette-background-default) 320px)
```

- **One formula, no per-scheme variants** — both inputs are themselves CSS variables
  that flip with mode/brand/product, so the gradient adapts everywhere by itself.
  Prefer this shape whenever possible; mirror per scheme only when the contrast
  direction genuinely matters (as in `tableBorder`).
- Emitted as a custom property (`--beam-page-gradient`) via a CssBaseline override;
  consumed with `backgroundImage: 'var(--beam-page-gradient)'`.

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

## 7. The surface ramp — elevation as a derived L-offset (tracer · 2026-08-03)

The tracer (`derived.surface1`, commit `ee10823`) proved a new *kind* of derived
token: one whose formula is mode-invariant but whose step size is a mode-scoped
seed. What it settled, and what it left for the foundations session:

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

**PROPOSED — for the foundations session, not decided:**
- The five-step vocabulary — `surface -1` sunken · `0` page · `1` paper · `2`
  raised · `3` top. Names and count go to the session for argument.
- The specific deltas (step: light `0.02` / dark `0.07`). Placeholder numbers.

**STATUS — tracer, additive.** `derived.surface1` exists and is consumed by
nothing; `background.paper` is **not** repointed at it. It proves the CSS half of
the pipeline only — **bake and contrast audit are un-runnable in-repo** (BEAM
Appendix C), so this token is **unbaked and unaudited**. The full ramp,
borders-derived-from-their-own-surface, shadows, and gradients are pending the
foundations session.
