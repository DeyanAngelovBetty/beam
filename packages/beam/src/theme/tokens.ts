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

export const products: Record<ProductName, Record<BrandName, BrandTokens>> = {
  sunlight: {
    ontario: {
      light: { primaryDown1: '#3832A0', primary0: '#5048E5', primaryUp1: '#828DF8', contrastText: '#FFFFFF' },
      dark: { primaryDown1: '#515BA4', primary0: '#7582EB', primaryUp1: '#909BEF', contrastText: '#111827' },
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
      light: { primaryDown1: '#0B534D', primary0: '#0F766E', primaryUp1: '#3F918B', contrastText: '#FFFFFF' },
      // dark default as entered in Figma (pre-correction footnote value) — Figma is seed truth
      dark: { primaryDown1: '#209486', primary0: '#57DDCC', primaryUp1: '#57DDCC', contrastText: '#111827' },
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
export const productFonts: Record<ProductName, { title: string; body: string }> = {
  sunlight: { title: 'Inter', body: 'Inter' },
  gaspar: { title: 'Sora', body: 'Geist' },
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
export const surfaceSeeds: Record<
  ProductName,
  { dark: { anchor: string; step: number }; light: { anchor: string; step: number } }
> = {
  sunlight: { dark: { anchor: '#0B0F19', step: 0.07 }, light: { anchor: '#F0F0F0', step: 0.01 } },
  gaspar: { dark: { anchor: '#041213', step: 0.085 }, light: { anchor: '#EDF1F1', step: 0.01 } },
};

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
   * Brand-tinted page wash — a whisper of primary fading into the page
   * background over the first ~320px. ONE formula serves every brand and
   * both schemes: its inputs are themselves CSS variables that flip.
   * Not bakeable to a Figma variable (gradients aren't a variable type);
   * its Figma twin, if needed, is a style.
   */
  pageGradient:
    'linear-gradient(180deg, color-mix(in oklch, var(--mui-palette-primary-main) 10%, var(--mui-palette-background-default)) 0%, var(--mui-palette-background-default) 320px)',

  /**
   * SURFACE RAMP — five elevation positions as oklch L-offsets from surface 0
   * (`background.default`, the anchor). c and h pass through, so surfaces stay
   * faintly branded instead of going flat grey. The formula is mode- AND
   * product-invariant: it resolves through `--mui-palette-background-default`
   * (which flips per mode/product) and `--beam-surface-step` (emitted per
   * product+mode in createBeamTheme). ×N lives here, not in the seed, so all
   * positions read one step var; arithmetic stays `l + N * step`.
   *
   * LOAD-BEARING (2026-08-05, was the additive `surface1` tracer): roles alias
   * positions — `background.default`→0, `background.paper`→1, Menu/Popover→2,
   * Dialog→3. `sunken` (-1) is emitted but consumed by nothing (reserved).
   */
  surface: {
    sunken: 'oklch(from var(--mui-palette-background-default) calc(l - 1 * var(--beam-surface-step)) c h)',
    paper: 'oklch(from var(--mui-palette-background-default) calc(l + 1 * var(--beam-surface-step)) c h)',
    raised: 'oklch(from var(--mui-palette-background-default) calc(l + 2 * var(--beam-surface-step)) c h)',
    top: 'oklch(from var(--mui-palette-background-default) calc(l + 3 * var(--beam-surface-step)) c h)',
  },

  /**
   * SPINE — the left-rule motif (detail-page-grammar §2). Its own tokens,
   * NOT a reference to tableBorder: the day table borders get tuned, spines
   * must not silently retune with them. Baked → `_derived (baked)` for Figma.
   *
   * - `default` is visually coincident with `tableBorder` today but an
   *   independent formula. It mixes the primary tint toward `text.primary`
   *   (which itself flips per scheme), so one formula serves both schemes with
   *   no per-scheme wiring — unlike `tableBorder`'s white/black split.
   * - `warning` / `danger` derive from the semantic palette (there are no
   *   dedicated warning/danger *seeds* in tokens yet — flagged 2026-07-24 —
   *   so they bind to `palette.warning/error.main`, the same "bind to the
   *   semantic layer" posture as tableBorder←primary).
   *
   * Consumed as CSS custom properties emitted by the theme:
   * `--beam-spine-default | -warning | -danger`.
   */
  spine: {
    default:
      'color-mix(in oklch, oklch(from var(--mui-palette-primary-main) l c h / 0.25) 77%, var(--mui-palette-text-primary))',
    warning: 'var(--mui-palette-warning-main)',
    danger: 'var(--mui-palette-error-main)',
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
