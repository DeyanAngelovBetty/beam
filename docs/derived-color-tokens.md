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
- **The dot layer** *(2026-08-06)*. A repeating `radial-gradient` dot is layered FIRST
  in the mesh's `background-image` (first-on-top), tiled at `dotPitch`. Its **pitch is
  tuned against the blur, not taste**: `backdrop-filter` averages, so any pattern finer
  than the blur radius (24px) smears to flat and shows nothing through the frosted rail
  — hence pitch ≥ ~2× blur (56). This is also why **grain is the wrong texture here**:
  `feTurbulence` is high-frequency by definition, so it averages to nothing at any alpha.
  The dots exist to give the frosted rail something to diffuse; canvas texture is
  secondary. **Dot colour** (`dotColor`) is a mesh tint mixed *toward* `text.primary`,
  the foreground — so it **flips per scheme** (lighter dots on dark pages, darker on
  light), never a white/black literal; `dotOpacity` is lower in light (0.035 vs 0.055)
  because a dark dot on near-white reads louder than a light dot on dark. **Coupling to
  respect:** with 4 background layers, `background-size`/`-repeat` must be matching
  4-value lists (`pitch, auto, auto, auto` / `repeat, no-repeat, no-repeat, no-repeat`),
  or the three radials inherit the dot tile and repeat.

### `beamGradientBorder` — an opt-in lit edge from the same points *(2026-08-05)*

A barrel-exported sx factory. The rim is a `conic-gradient(from var(--beam-border-angle), …)`
drawn on an absolutely-positioned `::after` that sits just OUTSIDE the element (negative
`inset`) and grows OUTWARD on hover — 1px calm → 2px — so the element's own box never
changes size and nothing in layout moves *(reworked 2026-08-06 from the earlier inset-mask,
which only made the border look thinner from inside)*. Stops **reuse the page-mesh tint
points** (primary · `hue-b` · primary +45°), each mixed toward the surface so it's a lit
edge, not a rainbow. **Opt-in only** (never global on Paper); applied to the Gaspar
dashboard widget shells.

- **Grows outward, not `scale()`** — the ring width is an ABSOLUTE px change
  (`--beam-ring`, a registered `@property <length>` so it interpolates). `scale()` is
  relative, so the same factor gives different absolute growth on a narrow vs wide card —
  rims wouldn't match across a dashboard row — and non-uniform scale distorts the radius.
- **Concentric corners** — the pseudo's radius is `card-radius + ring` and grows with the
  ring, so the rim never pinches at the corner. `radius` must equal the element's own
  border-radius (default 24 = `MuiPaper.rounded`).
- **Constant geometry** — the rim exists at all times (1px calm, 2px hover); nothing
  appears on hover, and the element itself carries `border: none` (the pseudo is the whole
  rim). Consumers must NOT set `overflow: hidden` on the rim-bearing box — it clips the
  outward pseudo (clip inner content on an inner box instead).
- **Stacking** — `z-index: -1` puts the rim behind the element's own bg: the outward ring
  shows on the page, the center hides under the card → never over content, and an
  over-reaching rim tucks behind a neighbour. Relies on the element establishing no
  stacking context of its own (no transform/opacity/filter/z-index). The rim still paints
  **above** the page mesh: the mesh is `body::before` at root-level `z-index: -1`, and the
  card subtree paints later in the tree (and typically inside a nested stacking context),
  so the ring lands between mesh and card, not behind the mesh.
- **Intensity is a per-scheme seed** (`borderIntensity`, `{calm, hover}`); light needs
  more than dark or the edge vanishes on a near-white surface. Tune freely.
- **Surface is a parameter** — must be the real surface behind the element (default
  `background.paper` = surface 1); pass `--beam-surface-2/-3` for Menu/Dialog.
- **Animation** — `--beam-border-angle` is a registered `@property` (a typed `<angle>`,
  so it can interpolate; `inherits: false`). Because it doesn't inherit, the rotation runs
  **on the pseudo itself** so the animated angle reaches its gradient; it runs **paused**
  and resumes on hover (never restarts → no snap-back), and stays paused under
  `prefers-reduced-motion` — static but still lit.
- **`corner-shape` does NOT inherit to pseudo-elements** *(2026-08-06)*. A squircle
  surface (`MuiPaper.rounded`) does not pass its corner geometry to its own `::before`/
  `::after`; the pseudo would render a plain-radius ring around a squircle card — an
  obvious mismatch. Set `corner-shape: squircle` **explicitly** on any pseudo-based
  treatment layered on a squircle surface (radius and corner-shape both fall back together
  where squircle is unsupported, staying concentric). Applies to any future pseudo
  treatment here, not just this rim.

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

**Limitation — relative colour reads channels from ONE origin** *(2026-08-06)*. `oklch(from
X l c h)` decomposes a single origin `X`; you can't take L from one colour and C/H from
another in one expression, and CSS can't extract a channel to a scalar `var()` to bridge
them. So "anchor-L + brand-hue" — a colour whose lightness tracks `background-default` while
its hue stays brand — **is not expressible**. The workaround is a **pinned L per scheme**
(a mode-scoped seed), set relative to the anchor by hand and re-tuned if the anchor moves;
the alternative (JS hex→oklch maths at theme build) is the runtime colour computation this
whole system exists to avoid. First hit: the Gaspar **brand mark** — a CSS-masked silhouette
(the `.svg` stays the source) filled by the three mesh tint points at `--beam-mark-l`
(dark 0.82 · light 0.40), so it follows the ramp instead of carrying hardcoded colours. The
ghost is the same mask desaturated (chroma 0 → grey), a watermark that reads as absence.

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
per-jurisdiction bg variables were **deleted** — **surfaces are NOT jurisdiction-
scoped; do not restore it.** *Why:* the jurisdiction collection holds per-product
**primaries** because primary genuinely varies by market; **surfaces do not**, so
duplicating them onto the jurisdiction axis produced *identical* values in both
modes (Ontario == Alberta) — noise, not signal. The step is now product- *and*
mode-scoped: the product half bakes at theme construction (product is a rebuild),
the mode half still flips on `[data-beam-mode]`.

**Light step is 0.010, not 0.02** — a correction, not a placeholder. At 0.02,
surface 3 computes to L 1.0151 — past pure white, impossible. Light mode has only
~0.045 of L headroom above the page, so its ramp is necessarily compressed and
**shadow carries elevation there** (the asymmetry above). Dark keeps 0.07 (0.085
for Gaspar — a wider separation).

**STILL un-baked, un-audited.** Bake and contrast audit remain un-runnable
in-repo (BEAM Appendix C), so the live ramp is unverified against those lanes. Its
baked output now lives at **`product/_ramp/*`** — moved into the `product` collection
on 2026-08-10 from the standalone `_derived surfaces (baked)` collection, which
duplicated the product axis (BEAM Appendix C). It is a designer SNAPSHOT, not the
source — code computes the real values; do not read or mirror it. Inside `product`,
`surface/*` and `gradient/*` are hand-authored seeds; `_ramp/*` is baked.

**The nav rail — a compensator, not a ramp position** *(2026-08-06)*. `navSurface`
sits *below* the anchor (`calc(l + navOffset * step)`, navOffset < 0) so the shell
chrome recedes (content rises, chrome sinks — shell-grammar §2). `navOffset` lives in
`surfaceSeeds` alongside anchor/step, but it is **not** an integer ramp rung: it
multiplies the step, so it varies with it per scheme.

**"Recede" inverts direction by scheme** *(corrected 2026-08-06; navOffset dark
−0.5 → −0.15)*. In LIGHT there is room below the anchor, so recede = darker and a big
multiple (−3 against the 0.010 step) works. In DARK there is *no room* — −0.5 put
Gaspar's rail at a near-black void that grabbed **more** attention than the mesh-lit
page, the opposite of the intent. So in dark the rail must sit **close** to the
anchor (−0.15) and let the lit page be the brighter thing. The intent is constant;
the direction flips. **Same asymmetry family as shadow-carries-elevation-in-light /
lightness-in-dark** — the second time this pattern has bitten, hence written down.

**Sixth instance — and the first that broke MEANING, not intensity** *(2026-08-06)*.
The docked rail's separation shadow: an **inset** shadow darkening the rail's own edge
reads as a recess in light (page brighter) but as **self-shadowing** in dark (rail
darker than page → lit face + shaded edge → looks *in front* of the page) — identical
CSS, inverted *metaphor*, not merely inverted strength. Every prior instance (navOffset,
dot opacity, glass alpha, edge lift, well-shadow alpha) was a magnitude/direction tune;
this one changed what the pixels *mean*, so the fix was structural — an **outward** drop
shadow that falls on the page, not the rail (shell-grammar §2) — not a re-tune. The inset
is retired, not adjusted.

**The chroma lever.** The rail is the ONLY surface with chroma identity of its own:
`c` is multiplied by `navChroma` (`calc(c * var(--beam-surface-nav-chroma))`); every
other ramp position passes anchor chroma through ×1. That's what keeps Gaspar's dark
rail *tinted chrome* rather than a grey/black void. **Sunlight's light anchor is
C 0.0000, so its rail stays neutral grey at any multiplier — correct, not a bug; do
not add a floor.**

**⚠️ STANDING NOTE — the current high-water mark for `bake:derived`.** The nav
gradient's top stop pins lightness at `calc(l + (navOffset + navSpread) * step)` —
**two custom vars in a sum, times a third.** This is the most complex channel
expression in the estate; nothing else nests arithmetic this deep. Whoever writes
`bake:derived` (BEAM Appendix C) should know **before they start** that this is the
expression that will break a naive parser first — it is the shape to design against,
not discover. Until then it stays the high-water mark; anything more complex is a
warning sign.

## 8. Candidate theme variants — decision-time lab artifacts *(2026-09-03)*

When a product needs to **compare and choose** between 2–3 candidate themes, the
candidates live in the **Theme Lab only** — never in the shipped token set.

- **Never shippable.** A candidate variant is a decision-time artifact. It **graduates
  by BECOMING the product theme** — replacing the `tokens.ts` seed values (and, per the
  open item below, the Figma variables) — **not** by the variant switch shipping. There
  is deliberately no runtime variant axis in an app: `createBeamTheme(brand, product)`
  resolves exactly one shipped theme per product, as always.
- **Structural boundary.** The candidate registry lives at
  `packages/beam-lab/src/variants/themeVariants.ts` and is **not** re-exported from
  `@betty/beam-lab`'s public entry — nothing outside the lab can import it. Candidates
  build via a seed-override seam on the factory (`createBeamTheme(brand, product,
  overrides?)`, default `undefined` → today's exact behaviour), so no shipped per-product
  value is touched. The comparison surface is a self-contained lab story
  (`ThemeVariants.stories.tsx`) that owns its own `ThemeProvider` and rebuilds per
  **variant × jurisdiction**, with **light/dark** the usual attribute flip — a candidate
  is only meaningful seen under every real mode combination.
- **Isolate the variable under test.** Non-colour params (surface steps, nav glass, the
  star-mesh geometry) are held **identical across variants**, so a comparison isolates
  **colour**. When a recovered variant predates a modern slot, fill it from the shipped
  theme (neutral) and mark it; drop old params with no modern slot.

**First instance — Gaspar "Teal (recovered)".** The pre-purple teal theme, resurrected
from git history (shipped `08965b8` 2026-07-20; replaced `28aa256` + `bc50e0e`
2026-08-11) and ported into today's seed shape. **Bounding finding:** only **Ontario**
was teal — **Alberta was magenta in both the teal era and today**, so the candidate
decision is **Ontario-only** (teal `#0F766E` vs today's lavender `#7C6296`), and Alberta
is constant across the candidates. This also **bounds the eventual Figma sync scope**
(below) to Ontario.

**OPEN ITEM — Figma propagation.** A landed theme decision must propagate to the Figma
variables **`product` collection** (Vasco's modes) — Beam's seeds are generated from
there, so a decision that only lands in `tokens.ts` will be overwritten on the next sync.
**Manual sync for now; flag when a decision lands** (and scope it — e.g. the teal decision
is the Ontario `product/gaspar` primary + surface anchor + mesh, not Alberta).

### 8.1 Variants integrate into the lab as loadable PRESETS *(2026-09-03)*

The candidate registry is now wired into the **Theme Lab drawer** as presets (the Storybook
board keeps only the side-by-side static glance). **Selecting a preset LOADS its seed bundle
into the drawer's live editing state** — the same override vars the knobs write — so all
controls (anchor, seeds, L/C/H, ramp) and **Copy Combo** operate on the candidate against
real app surfaces. Comparison and fine-tuning become one tool; this is also the groundwork
for the designer-collaborator lane (load → tune → Copy Combo → external sync).

- Preset #1 = current shipped (no overrides) = default. **Reset** returns to the loaded
  preset's state (not an empty sheet). **Switching presets is armed** — a first attempt with
  unsaved tuning warns inline ("switch again to discard"), a second confirms; no dialog.
  *Rationale: the drawer is becoming a **collaborator surface** — a one-click destructive
  discard guarded only by a caption is wrong for a 20-minute tuning session.* Copy Combo's
  name defaults to the preset (`teal-recovered-tuned`) but a **user-typed name survives**
  preset switches (the default only overwrites its own untouched prior default).

- **DIRECTION RULING — repo tokens are the source of truth for colour.** The Figma variables
  `product` collection (Vasco's modes) is a **mirror, updated FROM the repo, never the
  reverse.** A decision is made in the lab, lands in `tokens.ts` (graduation = replacing the
  seed values), and is then pushed to Figma — Figma never overwrites a repo colour decision.
  (This is why the §8 Figma-propagation item is a *push on decision*, not a pull.)

- **OPEN ITEMS.** (i) The **combo JSON** (`copyCombo`'s export) should become a **versioned,
  documented interchange schema** — the contract between the lab and the external sync — not
  just an ad-hoc shape (next step). (ii) A **designer-collaborator lane doc (`VASCO.md`)** —
  the load → tune → Copy Combo → sync workflow for a non-repo collaborator — is pending.
