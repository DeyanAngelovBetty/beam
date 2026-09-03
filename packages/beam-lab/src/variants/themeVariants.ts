import { createBeamTheme, products, type Theme, type BrandName, type ThemeSeedOverrides } from '@betty/beam';

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

export const THEME_VARIANTS: Record<LabProduct, ThemeVariant[]> = {
  gaspar: [
    // #1 = current shipped = the NEW teal (no overrides → reads the graduated tokens.ts).
    { id: 'current', label: 'Current (shipped)', buildTheme: (b) => createBeamTheme(b, 'gaspar') },
    // #2 = the outgoing lavender, kept as a candidate for reference / rollback.
    { id: 'lavender', label: 'Lavender (previous)', buildTheme: (b) => createBeamTheme(b, 'gaspar', lavenderOverrides(b)), overrides: lavenderOverrides },
  ],
  sunlight: [{ id: 'current', label: 'Modern Wisdom (current)', buildTheme: (b) => createBeamTheme(b, 'sunlight') }],
};
