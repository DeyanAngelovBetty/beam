import { createBeamTheme, products, gradientSeeds, type Theme, type BrandName, type ThemeSeedOverrides } from '@betty/beam';

/**
 * Theme Lab candidate-variant registry — a LAB-ONLY construct.
 *
 * BOUNDARY (guarded structurally, not by convention): this module is **NOT** re-exported from
 * `@betty/beam-lab`'s public entry (`../index.ts` exports only `ThemeLabDrawer`). Nothing outside the
 * lab imports it; app builds still call `createBeamTheme(brand, product)` and resolve exactly ONE
 * shipped theme per product, as today. Candidate variants are decision-time artifacts, never
 * shippable — a variant graduates by BECOMING the product theme (replacing the tokens.ts seed
 * values), not by this switch shipping. (See docs/derived-color-tokens.md.)
 *
 * Variant #1 per product is always the CURRENT shipped theme (no overrides) and the default.
 */

export type LabProduct = 'gaspar' | 'sunlight';

export interface ThemeVariant {
  id: string;
  label: string;
  /** Build this candidate under a real jurisdiction (composes with light/dark via the mode attribute). */
  buildTheme: (brand: BrandName) => Theme;
  /**
   * The candidate's seed overrides for a jurisdiction, or `undefined` for the CURRENT shipped theme
   * (no overrides). The Theme Lab drawer uses this to LOAD a preset into its live editing state — it
   * translates these seeds into its own override vars, so all knobs + Copy Combo then operate on the
   * candidate. `undefined` → loading the preset is just a Reset back to the shipped theme.
   */
  overrides?: (brand: BrandName) => ThemeSeedOverrides;
}

// ── Gaspar "Lavender (previous)" — the OUTGOING theme, retained for reference/rollback ─────────────
// 2026-09-03: teal GRADUATED to the shipped Gaspar/Ontario theme (tokens.ts), so preset #1 "Current
// (shipped)" now IS teal (no overrides). The outgoing lavender/candy values are captured HERE as a
// candidate — the purple that shipped between the candy combo (bc50e0e, 2026-08-11) and this decision.
//
// Ontario-only, mirroring the teal era: Alberta was magenta in BOTH the lavender and teal eras, so it
// falls through to shipped magenta. Surface anchor + gradient hueB/intensity are the lavender values;
// star params mirror shipped (colour-only difference from the current teal).
const LAVENDER_ONTARIO_PRIMARY: NonNullable<ThemeSeedOverrides['primary']> = {
  light: { primaryDown1: '#5C4374', primary0: '#7C6296', primaryUp1: '#987EB3', contrastText: '#FFFFFF' },
  dark: { primaryDown1: '#946CB8', primary0: '#D8AFFF', primaryUp1: '#D8AFFF', contrastText: '#111827' },
  states: products.gaspar.ontario.states, // non-colour, shared
};

const LAVENDER_SURFACE: NonNullable<ThemeSeedOverrides['surface']> = {
  dark: { anchor: '#000104', step: 0.085, navOffset: -0.15, navChroma: 2.2, navSpread: 0.7, navGlassAlpha: 0.52, navGlassBlur: 24, navGlassSaturate: 1.5 },
  light: { anchor: '#EEEFF2', step: 0.01, navOffset: -3, navChroma: 3.0, navSpread: 0.7, navGlassAlpha: 0.66, navGlassBlur: 24, navGlassSaturate: 1.4 },
};

const LAVENDER_GRADIENT: NonNullable<ThemeSeedOverrides['gradient']> = {
  dark: { hueB: '#0077A6', intensity: 34, starPitch: 40, starSizeRatio: 0.22, starIntensity: 4 },
  light: { hueB: '#217A8E', intensity: 14, starPitch: 40, starSizeRatio: 0.22, starIntensity: 6 },
};

const lavenderOverrides = (brand: BrandName): ThemeSeedOverrides => ({
  primary: brand === 'ontario' ? LAVENDER_ONTARIO_PRIMARY : undefined,
  surface: LAVENDER_SURFACE,
  gradient: LAVENDER_GRADIENT,
});

// REJECTED SOURCE (do not re-extract): the `gaspar-official` clone @ 01d61ab was the WRONG SURFACE — its
// `rule-editor/` purple (#7c6cf0) is the rule-editor tool's OWN accent, not the Gaspar product palette.
//
// ── Gaspar "Official (Vasco/Figma)" — the official product palette ─────────────────────────────────
// SOURCE: Vasco's Figma mapping — file **9yNbolohxGitkMJKDjoyKG**, node **12982-921** (pulled directly).
// A DARK theme; only the dark scheme is official (light scheme = Current shipped). Mapped onto our seeds
// (primary / secondary / text / surface / gradient); primary + surface anchor already MATCH shipped teal
// (the shipped teal graduated FROM this Figma). Provenance per value (Figma variable → our slot):
//   MAPPED   primary.main    #57DDCC  → primary.dark.primary0     (= shipped Ontario dark, identical)
//   MAPPED   primary pressed #209486  → primary.dark.primaryDown1 (= shipped, identical)
//   MAPPED   action hover  #57DDCC14  → states.hover  = 0.08  (8% wash → MUI action opacity, per spec)
//   MAPPED   action select #57DDCC1F  → states.selected = 0.12 (12% wash → MUI action opacity)
//   MAPPED   secondary       #4BA8DA / light #5BB8EA → secondary.dark.{main,light}
//   MAPPED   background paper #041213  → surface anchor (= shipped #041213; no override needed, noted)
//   MAPPED   text.primary   #EDF2F7 / text.secondary #A0AEC0 → text.dark.{primary,secondary}
//   MAPPED   logo gradient  #0076A5→#4BA8DA→#57DDCC→#209486 → gradient.dark.logoStops (1..4)
//   DERIVED  primary.dark.primaryUp1  — Figma gives no lighter primary → = main #57DDCC (shipped does too)
//   DERIVED  primary.dark.contrastText #111827 — shipped (Figma unspecified; dark ink on the light teal)
//   DERIVED  secondary.dark.dark #3A8FC0 — darker secondary shade (Figma gives only main + light)
//   DERIVED  background.default (#000303) + higher elevation rungs — our ramp DERIVES them from the anchor
//   FALLBACK page mesh — the #0076A5..#209486 gradient is the LOGO gradient, not a page mesh; the mesh is
//            defaulted to our shipped teal mesh RECOLORED (dark hueB→#57DDCC, hueC→#4BA8DA) — FLAGGED for
//            eyeball (keep / re-tune / drop).
//   FALLBACK *.light (whole scheme)  — Figma is dark-only; light = Current (shipped)
//   FALLBACK divider · nav/sidebar params · hover-COLOUR (washes cover state-paint OPACITY only)
//   FALLBACK severity success/warning/error — our theme HARDCODES severity (createBeamTheme); the seed seam
//            can't reach it, so the preset renders SHIPPED severity. Seam-extension question is open (report).
// Typeface: Inter + standard MUI ramp — matches ours, no change.
const vascoOverrides = (brand: BrandName): ThemeSeedOverrides => ({
  // Jurisdiction-agnostic dark primary (= shipped teal); light scheme + focus opacity stay shipped.
  primary: {
    light: products.gaspar[brand].light,
    dark: { primaryDown1: '#209486', primary0: '#57DDCC', primaryUp1: '#57DDCC', contrastText: '#111827' },
    states: { ...products.gaspar[brand].states, hover: 0.08, selected: 0.12 },
  },
  secondary: { dark: { main: '#4BA8DA', light: '#5BB8EA', dark: '#3A8FC0' } },
  text: { dark: { primary: '#EDF2F7', secondary: '#A0AEC0' } },
  // surface anchor #041213 == shipped → omitted (no change). Gradient: keep shipped mesh, recolour the dark
  // hues toward the Figma palette + pin the official LOGO stops (light mesh untouched).
  gradient: {
    ...gradientSeeds.gaspar,
    dark: { ...gradientSeeds.gaspar.dark, hueB: '#57DDCC', hueC: '#4BA8DA', logoStops: { 1: '#0076A5', 2: '#4BA8DA', 3: '#57DDCC', 4: '#209486' } },
  },
});

export const THEME_VARIANTS: Record<LabProduct, ThemeVariant[]> = {
  gaspar: [
    // #1 = current shipped = the NEW teal (no overrides → reads the graduated tokens.ts).
    { id: 'current', label: 'Current (shipped)', buildTheme: (b) => createBeamTheme(b, 'gaspar') },
    // #2 = the outgoing lavender, kept as a candidate for reference / rollback.
    { id: 'lavender', label: 'Lavender (previous)', buildTheme: (b) => createBeamTheme(b, 'gaspar', lavenderOverrides(b)), overrides: lavenderOverrides },
    // #3 = the OFFICIAL Gaspar product palette from Vasco's Figma (9yNbolohxGitkMJKDjoyKG · 12982-921).
    { id: 'official', label: 'Official (Vasco/Figma)', buildTheme: (b) => createBeamTheme(b, 'gaspar', vascoOverrides(b)), overrides: vascoOverrides },
  ],
  sunlight: [{ id: 'current', label: 'Modern Wisdom (current)', buildTheme: (b) => createBeamTheme(b, 'sunlight') }],
};
