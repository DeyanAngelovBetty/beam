/**
 * Beam design tokens — GENERATED from the live Figma file via MCP sync.
 * Source: Beam (MUI v9) Foundations (9yNbolohxGitkMJKDjoyKG).
 * Synced: 2026-07-17 — first sync against the three-axis structure.
 *
 * Figma architecture (consume once, carry the rest, never skip a hop):
 *   jurisdiction (SEED — all literals; modes Ontario|Alberta;
 *                 groups {Product}/{theme}/…)
 *     ↑ product  (selector; modes Sunlight|Gaspar; per-mode aliases)
 *     ↑ palette  (top; modes Light|Dark; no groups)
 *
 * Code mirror: products[product][jurisdiction].{light|dark}
 * ⚠️ Gaspar values are DEMO placeholders (glanceable hues), not identity.
 */

export type ProductName = 'sunlight' | 'gaspar';
export type BrandName = 'ontario' | 'alberta';
export type ThemeMode = 'light' | 'dark';

export interface BrandModeTokens {
  primaryDown1: string;
  primary0: string;
  primaryUp1: string;
  contrastText: string;
}

export interface BrandTokens {
  light: BrandModeTokens;
  dark: BrandModeTokens;
  states: {
    hover: number;
    selected: number;
    focus: number;
    focusVisible: number;
    outlinedBorder: number;
  };
}

const STATES = { hover: 0.04, selected: 0.08, focus: 0.12, focusVisible: 0.3, outlinedBorder: 0.5 };

/**
 * FIELD_GEOMETRY — the 44px view↔edit TWIN datum, encoded as explicit values (not accidents of
 * typography). ONE source consumed by BOTH BeamStat (the view twin) and the outlined-field / switch
 * overrides (the edit twins) so they can never drift:
 *
 *   BeamStat height 44 = paddingY 6 (top) + label 12 + gap 2 + value 18 + paddingY 6 (bottom)
 *
 * A multiline value grows by `valueLineHeight` per line (3-line = 44 + 2×18 = 80), matching the
 * multiline field twin. The edit twins have NO internal label row (their label is the notch), and
 * the outlined border is an absolutely-positioned OVERLAY (not in the input's box), so a field's
 * 1-line height = `fieldPaddingY` 13 + value 18 + `fieldPaddingY` 13 = 44 — the same floor. Multiline
 * puts that 13 on the field ROOT (textarea padding 0), so 3-line = 13 + 3×18 + 13 = 80.
 */
export const FIELD_GEOMETRY = {
  height: 44, // the floor (single-line) — the twin datum
  paddingY: 6, // BeamStat top/bottom padding
  labelLineHeight: 12, // meta label row
  gap: 2, // label → value
  valueLineHeight: 18, // one value line; multiline grows by this
  fieldPaddingY: 13, // edit-twin field vertical padding: 13 + value 18 + 13 = 44 (border is an overlay)
} as const;

/**
 * fieldGeometrySx — the field-height mixin for CUSTOM inputs OUTSIDE the TextField family (a bespoke
 * bordered control that still wants to be a 44px field twin). Sugar over the same numbers, NOT the
 * mechanism (small outlined TextField/Select/multiline get 44px from the theme default). Spread into
 * an element's `sx`; it fills to the field floor and centres its content.
 */
export const fieldGeometrySx = {
  boxSizing: 'border-box',
  minHeight: `${FIELD_GEOMETRY.height}px`,
  display: 'flex',
  alignItems: 'center',
} as const;

export const products: Record<ProductName, Record<BrandName, BrandTokens>> = {
  sunlight: {
    ontario: {
      // Modern Wisdom combo (§6 run): Sunlight/primary @ Ontario → tangerine family. contrastText
      // UNTOUCHED (white on light, near-black on dark) — reported at officiation, not retuned.
      light: { primaryDown1: '#8D1100', primary0: '#B33F00', primaryUp1: '#EB7500', contrastText: '#FFFFFF' },
      dark: { primaryDown1: '#C47000', primary0: '#F59E1E', primaryUp1: '#FFB33F', contrastText: '#111827' },
      states: STATES,
    },
    alberta: {
      light: { primaryDown1: '#906013', primary0: '#CB871B', primaryUp1: '#E9AF54', contrastText: '#111827' },
      dark: { primaryDown1: '#BD7E19', primary0: '#E7A946', primaryUp1: '#EEC481', contrastText: '#111827' },
      states: STATES,
    },
  },
  gaspar: {
    ontario: {
      // candy combo (§6 run): Gaspar/primary @ Ontario → lavender family. contrastText UNTOUCHED
      // (WCAG probe reported, not retuned: dark #111827/#D8AFFF = 9.71:1, light #FFFFFF/#7C6296 = 5.19:1).
      light: { primaryDown1: '#5C4374', primary0: '#7C6296', primaryUp1: '#987EB3', contrastText: '#FFFFFF' },
      dark: { primaryDown1: '#946CB8', primary0: '#D8AFFF', primaryUp1: '#D8AFFF', contrastText: '#111827' },
      states: STATES,
    },
    alberta: {
      light: { primaryDown1: '#861B94', primary0: '#C026D3', primaryUp1: '#CD51DC', contrastText: '#FFFFFF' },
      dark: { primaryDown1: '#A255AE', primary0: '#ED94FA', primaryUp1: '#ED94FA', contrastText: '#111827' },
      states: STATES,
    },
  },
};

/**
 * SEED — product-scoped title/body typeface pair (Figma: `product/font/{title,body}`).
 * Font is a PRODUCT-axis seed, NOT jurisdiction — it moved out of the per-jurisdiction
 * `BrandTokens` on 2026-08-05 (font-by-jurisdiction was always the wrong collection; the
 * old Alberta=Poppins split is deliberately gone). Two seeds, not one: the body face is
 * the workhorse (data, `meta` keys, everything that isn't a headline); the title face is
 * display-only, bound to h1–h6 in `createBeamTheme`. Swapping a face is a one-line edit
 * here + the matching webfont line in each app / Storybook head (§4.5).
 *
 * Midnight is NOT a product (it renders via `product: 'sunlight'`), so it inherits
 * Sunlight's Inter/Inter — see Appendix C for the open item to promote it.
 *
 * ⚠️ Gaspar's pair (Sora display + Geist body) is real, not placeholder. Geist is the body
 * face specifically for its tabular figures (`font-variant-numeric: tabular-nums`, applied
 * in BeamDataTable's numeric cells) — the reason it beat a geometric face.
 */
export const productFonts: Record<ProductName, { title: string; body: string; titleWeight: number }> = {
  // titleWeight (Figma twin: `font/title/fontWeight`; Deyan syncs Figma separately) rides
  // with the faces and wires to the whole heading scale h1–h6 in createBeamTheme — one seed,
  // same as the face. 600 for both to start; they diverge the day one looks wrong.
  sunlight: { title: 'Inter', body: 'Inter', titleWeight: 600 },
  gaspar: { title: 'Sora', body: 'Geist', titleWeight: 600 },
};

/**
 * TITLE TREATMENT — the gradient title recipe's per-product dials (BeamPageHeader, default
 * on). Figma twins (real paths): `title/{dark,light}/tint`, `title/underlineWeight`,
 * `title/underlineFade`, `title/underlineOffset`, `title/{dark,light}/halo` (Deyan syncs Figma).
 * Two gradients, deliberately different (see BeamPageHeader):
 *  - `tint`  — % of primary mixed into text-primary for the TEXT gradient's far end. Per MODE:
 *              a dark near-white text tolerates more tint than a light near-black one, where a
 *              high mix raises L and costs contrast. Light values are proposals — flag: unsure,
 *              Deyan tunes on the bench.
 *  - `underlineWeight` — the decorative underline's px height. Per product, mode-invariant.
 *  - `underlineFade`   — % of primary in the underline gradient's far end (mixed toward
 *              background.default, which flips by mode — so mode variance comes free). Per
 *              product, mode-invariant for now.
 *  - `underlineOffset` — the underline's tuck depth (its `bottom`), so it passes BEHIND the
 *              glyphs (marker posture). Per product, mode-invariant (geometry).
 *  - `halo`   — the halo-clone's text-shadow blur radius. The halo impersonates the CANVAS
 *              (background.default) to carve a skip-ink gap between glyph edges and the
 *              underline. Per MODE (a near-white light-mode halo reads differently from a
 *              near-black dark one) — light values are proposals, flag: unsure, Deyan tunes.
 * A product wanting the treatment OFF dials `tint`→0% (flat text-primary), `underlineWeight`
 * →0px (no underline), and/or `halo`→0px (no separation). No prop, no branch — the dials are
 * the identity.
 */
export const titleSeeds: Record<
  ProductName,
  {
    tint: { dark: string; light: string };
    underlineWeight: string;
    underlineFade: string;
    underlineOffset: string;
    halo: { dark: string; light: string };
  }
> = {
  sunlight: {
    tint: { dark: '30%', light: '18%' },
    underlineWeight: '2px',
    underlineFade: '50%',
    underlineOffset: '.5rem', // shallower than gaspar — calmer with the 2px weight (proposed)
    halo: { dark: '4px', light: '5px' },
  },
  gaspar: {
    tint: { dark: '55%', light: '32%' },
    underlineWeight: '3px',
    underlineFade: '50%',
    underlineOffset: '.65rem', // Deyan's bench value
    halo: { dark: '5px', light: '6px' },
  },
};

/** Back-compat alias for pre-product-axis callers. */
export const brands = products.sunlight;

/**
 * ROLE RAMP — a categorical accent ramp for role provenance (detail-page §6).
 * SEED lane (literals, Figma-truth per §4.1): a genuine system gap filled as
 * a seed-lane proposal, not a local invention (BEAM §10.6).
 *
 * Six hues spaced around the wheel, distinct from the indigo brand primary,
 * at ~500-level saturation so each reads on both dark surfaces (#0B0F19 /
 * #111827) and light. Consumed categorically by index (role N → ramp[N % 6]);
 * no component ever hardcodes a role color.
 *
 * ⚠️ Demo-picked hexes, dark-first (the BO defaults to dark); light-mode is
 * acceptable, not tuned. Pending a real Figma pass + per-mode review.
 */
export const roleRamp: readonly string[] = [
  '#14B8A6', // teal
  '#F59E0B', // amber
  '#F43F5E', // rose
  '#0EA5E9', // sky
  '#8B5CF6', // violet
  '#84CC16', // lime
];

/** Categorical role color by index — wraps at the ramp length. */
export const roleColor = (index: number): string => roleRamp[((index % roleRamp.length) + roleRamp.length) % roleRamp.length];

/**
 * SEED — product-scoped surface ramp: an anchor (surface 0, the page) + a step
 * size per scheme (Figma: `product/surface/{dark,light}/{anchor,step}`). Font
 * and surface are the two PRODUCT-axis seed groups; jurisdiction no longer
 * carries background — the old product-background and per-jurisdiction bg
 * variables were deleted in Figma, so surfaces are product-scoped only now.
 *
 * The step is an oklch lightness delta per position. Its ×N stays in the derived
 * formula (not the seed) so all five positions read one step var; the arithmetic
 * stays `l + N * step` — as trivial as the bake parser allows.
 *
 * Midnight isn't a ProductName (it renders via `product: 'sunlight'`), so it
 * inherits Sunlight's ramp — same posture as fonts (Appendix C).
 *
 * ⚠️ Light step is 0.010, NOT dark's 0.07: light mode has only ~0.045 of L
 * headroom above the page, so its ramp is necessarily compressed and shadow
 * carries elevation there. At 0.02 surface 3 would compute to L 1.0151 — past
 * pure white, impossible. See docs/derived-color-tokens.md §7.
 */
type NavSchemeSeed = {
  anchor: string;
  step: number;
  navOffset: number;
  navChroma: number;
  navSpread: number;
  // Frosted-glass rail. glassAlpha is HIGHER in light on purpose: blur over a
  // near-white backdrop returns near-white, so a light rail must keep more of its
  // own tint or it dissolves into the page. Blur stays at the seed (bigger erases
  // the 56px mesh dots). See docs/shell-grammar.md §2 / derived-color-tokens §2.
  navGlassAlpha: number;
  navGlassBlur: number;
  navGlassSaturate: number;
};
export const surfaceSeeds: Record<ProductName, { dark: NavSchemeSeed; light: NavSchemeSeed }> = {
  sunlight: {
    dark: { anchor: '#0E121B', step: 0.07, navOffset: -0.15, navChroma: 2.2, navSpread: 0.7, navGlassAlpha: 0.52, navGlassBlur: 24, navGlassSaturate: 1.5 },
    light: { anchor: '#F0F0F0', step: 0.01, navOffset: -3, navChroma: 3.0, navSpread: 0.7, navGlassAlpha: 0.66, navGlassBlur: 24, navGlassSaturate: 1.4 },
  },
  gaspar: {
    // candy combo (§6 run): anchors → near-black dark / cool off-white light. UNLIKE the plum
    // mirror this MOVED L (dark 0.168 → 0.068). --beam-mark-l still holds, NOT retuned: dark
    // mark-l 0.82 now sits 0.75 above the anchor (was 0.65 at plum) — light-on-dark, MORE
    // margin; light anchor 0.952, mark-l 0.40 sits 0.55 below (≈unchanged). The "large L move"
    // caveat in the mark-l comment was checked: direction holds, margin grows. Reported, not retuned.
    dark: { anchor: '#000104', step: 0.085, navOffset: -0.15, navChroma: 2.2, navSpread: 0.7, navGlassAlpha: 0.52, navGlassBlur: 24, navGlassSaturate: 1.5 },
    light: { anchor: '#EEEFF2', step: 0.01, navOffset: -3, navChroma: 3.0, navSpread: 0.7, navGlassAlpha: 0.66, navGlassBlur: 24, navGlassSaturate: 1.4 },
  },
};

/**
 * SEED — product-scoped page-mesh controls (Figma `product/gradient`). Same shape
 * as surfaceSeeds. The page mesh is a THREE-point recipe (derived.pageMesh): one
 * formula, all products — product identity is the `intensity` dial, not a forked
 * formula. `hueB` is the designer-controlled second tint; `intensity` is the mix
 * percentage each tint takes over background-default.
 *
 * Light intensity is lower than dark (a light page has less headroom for tint
 * before it muddies) — the same asymmetry family as the surface ramp.
 *
 * Midnight isn't a ProductName (renders via `product: 'sunlight'`), so it inherits
 * Sunlight's mesh — same posture as fonts/surfaces.
 */
type GradientSchemeSeed = {
  hueB: string;
  intensity: number;
  // hue-c is DERIVED-BY-DEFAULT (primary rotated +45°, `derived.gradientHueC`); this optional
  // seed is the OFFICIATED OVERRIDE — present = a product literal pins it, ABSENT = still
  // derived. First override officiated via the combo lanes (docs/sync-lanes-runbook.md §6).
  hueC?: string;
  // Betty STAR layer (brand geometry tiled in the mesh — the four-point sparkle, masked on
  // body::after). SHAPE is brand-constant (never a seed/export); these tune it per product:
  // `starPitch` = tile SPACING in px (per product, mode-invariant — bigger = sparser/calmer);
  // `starSizeRatio` = glyph/tile fraction, DECOUPLED from pitch (a mask's repeat period equals
  // its size, so the glyph size lives in the image — see starGeometry.ts), mode-invariant;
  // `starIntensity` = per-scheme visibility %; `starColor?` = officiated colour override
  // (ABSENT = derived from `derived.starColor`, mirroring the hue-c override seam).
  starPitch: number;
  starSizeRatio: number;
  starIntensity: number;
  starColor?: string;
  // LOGO gradient stop overrides — SPARSE: only officiated slots get a literal, absent = derived
  // (`derived.logoStops`), mirroring the hueC/starColor seam. Keyed 1–4 (the four gradient stops).
  // No Figma twin until a slot's first officiated override (derived-tokens doctrine).
  logoStops?: Partial<Record<1 | 2 | 3 | 4, string>>;
};
export const gradientSeeds: Record<
  ProductName,
  { dark: GradientSchemeSeed; light: GradientSchemeSeed }
> = {
  sunlight: {
    // Modern Wisdom combo (§6 run): hue-c pinned — Sunlight's FIRST officiated override, so it
    // stops deriving its bottom glow (mirrors the gaspar candy hue-c pin).
    dark: { hueB: '#FFF3C2', intensity: 10, hueC: '#D95F1A', starPitch: 59, starSizeRatio: 0.23, starIntensity: 5 },
    light: { hueB: '#D3C68F', intensity: 6, hueC: '#F53400', starPitch: 59, starSizeRatio: 0.23, starIntensity: 5 },
  },
  gaspar: {
    // candy combo (§6 officiating run): hue-c pinned as the first officiated override.
    dark: { hueB: '#0077A6', intensity: 34, hueC: '#66D2FF', starPitch: 40, starSizeRatio: 0.22, starIntensity: 4 },
    light: { hueB: '#217A8E', intensity: 14, hueC: '#33809F', starPitch: 40, starSizeRatio: 0.22, starIntensity: 6 },
  },
};

/**
 * SEED — gradient-border intensity, PER SCHEME (tunable dials, not inline
 * numbers). The opt-in gradient border (`beamGradientBorder`) reuses the page-
 * mesh tint points; this is how strongly they read at the 1px edge. `calm` is
 * the always-on state (constant geometry — the border never appears on hover);
 * `hover` is the interactive lift. LIGHT needs MORE than dark: a low-contrast
 * edge on a near-white surface can vanish entirely. Starting points — move them.
 */
export const borderIntensity: Record<ThemeMode, { calm: number; hover: number }> = {
  dark: { calm: 32, hover: 60 },
  light: { calm: 45, hover: 72 },
};

/**
 * SEED — brand-mark lightness, PER SCHEME. The app-owned brand mark (a CSS-masked
 * silhouette) paints its brand hues at THIS oklch L, so the mark follows the ramp
 * and stays legible: a light mark on the dark shell, a dark mark on light.
 *
 * It's a pinned L, not a live `anchor-L + Δ`: relative colour reads channels from
 * ONE origin, so `oklch(from primary …)` can't also pull the anchor's L, and CSS
 * can't extract a channel to a scalar to bridge them. Emitted as `--beam-mark-l`
 * (mode-scoped, Beam's one seam). Chosen ~0.6 from the current anchors in the
 * contrast direction; a large anchor move re-tunes this one number.
 */
export const markLightness: Record<ThemeMode, number> = { dark: 0.82, light: 0.4 };

/**
 * DERIVED TOKENS — computed in CSS from other tokens at runtime.
 * These have no literal Figma value (Figma cannot express color-mix /
 * relative color syntax); their Figma twin, when needed, is a static
 * per-brand approximation. Syncs regenerate the blocks above and
 * preserve this one.
 *
 * Browser note: relative color syntax needs a modern engine (Chrome 119+,
 * Safari 18, Firefox 128+) — fine for a Chrome-first BO, same posture as
 * corner-shape.
 */

// Logo gradient — the three REAL stops of today's mark recipe (primary, hue-b, primary+45°, each
// remapped to --beam-mark-l for legibility). See `derived.logoStops` for why these are split out.
const LOGO_STOP_PRIMARY = 'oklch(from var(--mui-palette-primary-main) var(--beam-mark-l) c h)';
const LOGO_STOP_HUEB = 'oklch(from var(--beam-gradient-hue-b) var(--beam-mark-l) c h)';
const LOGO_STOP_PRIMARY_45 = 'oklch(from var(--mui-palette-primary-main) var(--beam-mark-l) c calc(h + 45))';

export const derived = {
  /**
   * Brand-tinted table/surface border — a quiet derivative of primary, so
   * borders shift subtly between Ontario and Alberta. Mixed toward the
   * contrast direction per scheme (white on dark, black on light).
   */
  tableBorder: {
    dark: 'color-mix(in oklch, oklch(from var(--mui-palette-primary-main) l c h / 0.25) 77%, white)',
    light: 'color-mix(in oklch, oklch(from var(--mui-palette-primary-main) l c h / 0.25) 77%, black)',
  },
  /**
   * PAGE MESH — a three-point tint field over the page background. ONE formula,
   * all products; product identity is the intensity dial (`gradientSeeds`), not a
   * forked formula. Three large soft radials, each anchored at a different edge:
   *   hue-a = primary (seed)          · top-left
   *   hue-b = --beam-gradient-hue-b   · top-right (designer seed)
   *   hue-c = --beam-gradient-hue-c   · bottom (DERIVED default, with an OVERRIDE seam)
   * hue-c is derived-with-override: its default VALUE is the rotation expression (emitted
   * per scheme in createBeamTheme via `derived.gradientHueC`), so it stays brand-reactive —
   * each jurisdiction's primary rotates to its own hue-c. AXIS NOTE: the rotation is
   * brand-reactive (follows the jurisdiction primary); an override (e.g. the Theme Lab writing
   * a literal to the var) is a PRODUCT literal that stops following — no Figma twin until an
   * override is officiated (derived-tokens doctrine). Reading it inlined the rotation before;
   * the var indirection is byte-invisible.
   * Each tint MIXES TOWARD background-default at `--beam-gradient-intensity`
   * (never white/black — that's the dark-mode tint bug); the fade is to
   * `transparent` only, so the layers blend and reveal the base beneath. Painted
   * over `background-default` as the background-color. Not bakeable to a Figma
   * variable (gradients aren't a variable type); its Figma twin is a style.
   */
  pageMesh:
    // THREE radials (dot layer removed — it was the placeholder for the Betty star, now a
    // MASK on its own fixed layer, body::after; see createBeamTheme). These fill (no tile).
    'radial-gradient(120% 120% at 0% 0%, color-mix(in oklch, var(--mui-palette-primary-main) var(--beam-gradient-intensity), var(--mui-palette-background-default)) 0%, transparent 55%), ' +
    'radial-gradient(110% 110% at 100% 0%, color-mix(in oklch, var(--beam-gradient-hue-b) var(--beam-gradient-intensity), var(--mui-palette-background-default)) 0%, transparent 55%), ' +
    'radial-gradient(130% 130% at 50% 120%, color-mix(in oklch, var(--beam-gradient-hue-c) var(--beam-gradient-intensity), var(--mui-palette-background-default)) 0%, transparent 55%)',

  /**
   * hue-c DEFAULT — the primary rotated +45° in hue. Its value IS this expression (not a
   * literal), so emitting it per scheme keeps it brand-reactive. The Theme Lab overrides it by
   * writing a literal to `--beam-gradient-hue-c` on the mode block (product literal); removing
   * that override returns it to this rotation. (See the pageMesh comment's axis note.)
   */
  gradientHueC: 'oklch(from var(--mui-palette-primary-main) l c calc(h + 45))',

  /**
   * STAR colour DEFAULT — inherited verbatim from the old dot layer's derivation: a mesh tint
   * (primary) mixed TOWARD the foreground (`text.primary`), so it flips per scheme (lighter
   * stars on dark pages, darker on light). Never a white/black literal. This is `--beam-star-
   * color`'s derived-by-default value; an officiated `starColor` seed overrides it (mirrors
   * hue-c). Intensity is applied at use (`--beam-star-intensity`); the 45/55 lean is the knob.
   */
  starColor: 'color-mix(in oklch, var(--mui-palette-primary-main) 45%, var(--mui-palette-text-primary))',

  /**
   * LOGO gradient stops — FOUR registered `<color>` slots the Theme Lab overrides per-slot (the
   * hue-c override seam, ×4). The masked wordmark paints `linear-gradient(<angle>, stop-1 0%,
   * stop-2 25%, stop-3 50%, stop-4 100%)`.
   *
   * DEFAULTS reproduce TODAY's 3-stop mark-l recipe mapped COLLINEARLY onto 4 slots, so the logo
   * is BYTE-IDENTICAL before any Lab override: the three real stops keep their exact expressions
   * at 0/50/100, and stop-2 is a collinear sRGB-midpoint FILLER at 25% — the colour the old
   * gradient already renders there, so the fourth slot is a visual no-op (default gradient
   * interpolation is sRGB in Chrome; the mix matches it). The canonical seed derivation
   * (hue-b / mix / primary / hue-c, no mark-l) is a CANDIDATE default parked for the design
   * alignment — flattens the lightness journey + breaks light-scheme contrast, see the byte-check
   * report — to be applied later as a one-line swap here.
   *
   * Standalone exprs (no var()→registered-var refs) so each computes independently; a `logoStops`
   * seed pins any slot per product/scheme (sparse — no Figma twin until first officiated override).
   */
  logoStops: {
    1: LOGO_STOP_PRIMARY,
    2: `color-mix(in srgb, ${LOGO_STOP_PRIMARY}, ${LOGO_STOP_HUEB})`,
    3: LOGO_STOP_HUEB,
    4: LOGO_STOP_PRIMARY_45,
  } as Record<1 | 2 | 3 | 4, string>,

  /**
   * SURFACE RAMP — five elevation positions as oklch L-offsets from the ANCHOR seed
   * (`--beam-surface-anchor`, surface 0, the page). c and h pass through, so surfaces stay
   * faintly branded instead of going flat grey. Mode- AND product-invariant: the formula
   * appears ONCE per slot and resolves through `--beam-surface-anchor` (the ONE hex, flipped
   * per mode/product in createBeamTheme) + `--beam-surface-step`. ×N lives here, not in the
   * seed, so all positions read one step var; arithmetic stays `l + N * step`.
   *
   * These emit as REGISTERED @property `<color>` vars (`--beam-ramp--1`…`3`) so the browser
   * COMPUTES them to resolved colours — `getComputedStyle` returns a real value, making the
   * browser the formula engine (the future bake lane and the Theme Lab panel both READ the
   * ramp, never re-implement the oklch math; precedent: `--beam-border-angle`). Aliases then
   * point at the ramp — `background.default`→ramp-0, `background.paper`→ramp-1, Menu/Popover→
   * ramp-2, Dialog→ramp-3; a consumer never repeats the formula. `sunken` (-1) reserved.
   */
  ramp: {
    sunken: 'oklch(from var(--beam-surface-anchor) calc(l - 1 * var(--beam-surface-step)) c h)',
    // Slot 0 is the anchor PASSTHROUGH, not the n=0 formula — an `oklch(from hex l c h)`
    // round-trip could drift the page colour by a rounding ulp vs the old raw hex. This keeps
    // background.default byte-identical; the registered <color> still resolves it for reads.
    anchor: 'var(--beam-surface-anchor)',
    paper: 'oklch(from var(--beam-surface-anchor) calc(l + 1 * var(--beam-surface-step)) c h)',
    raised: 'oklch(from var(--beam-surface-anchor) calc(l + 2 * var(--beam-surface-step)) c h)',
    top: 'oklch(from var(--beam-surface-anchor) calc(l + 3 * var(--beam-surface-step)) c h)',
  },

  /**
   * NAV SURFACE — the rail's background, a single swappable recipe (emitted as
   * `--beam-nav-surface`, applied ONLY at panel()/MuiDrawer-paper). Translucency
   * is next: adding an alpha channel + backdrop-filter should be a change HERE,
   * not a hunt through the shell.
   *
   * A 2-stop VERTICAL linear gradient — deliberately a different SHAPE from the
   * page mesh's 3-point radial field, so chrome and content never read as one
   * continuous surface. Top = `navOffset + navSpread` steps (lifts under the brand
   * mark); bottom = `navOffset` (settles toward the footer).
   *
   * The rail is the ONLY surface with chroma identity of its own: `c` is
   * multiplied by `--beam-surface-nav-chroma` (every other ramp position passes
   * anchor chroma through ×1). Sunlight's light anchor is C 0.0000, so its rail
   * stays neutral grey at any multiplier — correct, not a bug; no floor.
   *
   * ⚠️ HIGH-WATER MARK for `bake:derived`: the top stop's lightness is
   * `calc(l + (navOffset + navSpread) * step)` — two custom vars in a sum, times a
   * third. This is the most complex channel expression in the estate and the one
   * that will break a naive bake parser FIRST. See derived-color-tokens §7.
   */
  navSurface:
    'linear-gradient(180deg, ' +
    'oklch(from var(--beam-surface-anchor) calc(l + (var(--beam-surface-nav-offset) + var(--beam-surface-nav-spread)) * var(--beam-surface-step)) calc(c * var(--beam-surface-nav-chroma)) h / var(--beam-nav-glass-alpha)), ' +
    'oklch(from var(--beam-surface-anchor) calc(l + var(--beam-surface-nav-offset) * var(--beam-surface-step)) calc(c * var(--beam-surface-nav-chroma)) h / var(--beam-nav-glass-alpha)))',

  /**
   * NAV EDGE — a 1px catch of light on the frosted rail's top + right inner edges
   * (applied as an inset shadow, no added width — constant geometry). The rail's
   * OWN tint lifted in lightness, never a white literal. The lift lives in a single
   * baked offset (`--beam-nav-edge-offset` = navOffset + navSpread + EDGE_LIFT,
   * summed in JS) so this stays a single-var calc and does NOT re-raise the channel
   * high-water mark (see §7).
   */
  navEdge:
    'oklch(from var(--beam-surface-anchor) calc(l + var(--beam-nav-edge-offset) * var(--beam-surface-step)) calc(c * var(--beam-surface-nav-chroma)) h / var(--beam-nav-edge-alpha))',

  /**
   * NAV WELL SHADOW — the recessed rail RECEIVES a shadow from the content plane
   * above it (chrome sinks; content rises — shell-grammar §2), applied as an inset
   * shadow on the docked rail's right inner edge. A dark, SURFACE-tinted colour (30%
   * of the anchor's L, keeping its hue/chroma) — never a black literal. Alpha is
   * per-scheme (`--beam-nav-shadow-alpha`), stronger in light.
   */
  navShadow:
    'oklch(from var(--beam-surface-anchor) calc(l * 0.3) c h / var(--beam-nav-shadow-alpha))',

  /**
   * SPINE — the left-rule motif (detail-page-grammar §2). Its own tokens,
   * NOT a reference to tableBorder: the day table borders get tuned, spines
   * must not silently retune with them. Baked → `_derived (baked)` for Figma.
   *
   * - `default` is visually coincident with `tableBorder` today but an
   *   independent formula. It mixes the primary tint toward `text.primary`
   *   (which itself flips per scheme), so one formula serves both schemes with
   *   no per-scheme wiring — unlike `tableBorder`'s white/black split.
   * - `warning` / `error` derive from the semantic palette (there are no
   *   dedicated warning/error *seeds* in tokens yet — flagged 2026-07-24 —
   *   so they bind to `palette.warning/error.main`, the same "bind to the
   *   semantic layer" posture as tableBorder←primary). (`danger` → `error`
   *   2026-08-25, aligning the severity vocabulary with the palette + BeamStat v2.)
   *
   * Consumed as CSS custom properties emitted by the theme:
   * `--beam-spine-default | -warning | -error`.
   */
  spine: {
    default:
      'color-mix(in oklch, oklch(from var(--mui-palette-primary-main) l c h / 0.25) 77%, var(--mui-palette-text-primary))',
    warning: 'var(--mui-palette-warning-main)',
    error: 'var(--mui-palette-error-main)',
  },

  /**
   * MOTION — Beam's first motion tokens (shell-grammar §4). Three named
   * motions; `duration` and `easing` are SEPARATE fields so each injects as its
   * own CSS var (`--beam-motion-{name}-duration` / `-easing`), plus a composed
   * `--beam-motion-{name}` shorthand. The split is load-bearing: durations may
   * later register as Figma *number* variables while easings stay code-side
   * strings (deferral dated in shell-grammar §4). Code is truth until then,
   * same posture as the derived colors above.
   *
   * Values are PLACEHOLDERS — choreography (durations, easings, and every
   * visual outcome) is the bench pass. The tokens ship unused.
   */
  motion: {
    // micro-feedback: peek slide, hovers
    quick: { duration: '180ms', easing: 'ease-out' }, // motion: Deyan tunes on the bench
    // things that travel or reflow: the lock morph, grid reflow
    move: { duration: '300ms', easing: 'ease' }, // motion: Deyan tunes on the bench
    // crossfades: the ghost ignition
    fade: { duration: '200ms', easing: 'linear' }, // motion: Deyan tunes on the bench
  },
};
