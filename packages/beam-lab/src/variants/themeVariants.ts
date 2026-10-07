import { createBeamTheme, products, gasparOfficialOverrides, type Theme, type BrandName, type ThemeSeedOverrides } from '@betty/beam';

/**
 * Theme Lab candidate-variant registry — a LAB-ONLY construct.
 *
 * BOUNDARY (guarded structurally, not by convention): this module is **NOT** re-exported from
 * `@betty/beam-lab`'s public entry (`../index.ts` exports only `ThemeLabDrawer`). Nothing outside the
 * lab imports it. Candidate variants are decision-time artifacts — a variant graduates by BECOMING the
 * product theme (replacing the tokens.ts seed values). (See docs/derived-color-tokens.md.)
 *
 * Variant #1 per product is the CURRENT shipped default. For Gaspar that is now the Vasco/Figma official
 * palette — applied via a TEMPORARY default-swap seam (the app passes `gasparOfficialOverrides`; see
 * apps/gaspar/src/App.tsx), pending token graduation after the CEO/brand ratification. "Teal (previous
 * shipped)" is the outgoing raw-tokens default, kept for A/B + rollback.
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
  dark: { anchor: '#000104', step: 0.085, navOffset: -0.15, navChroma: 2.2, navSpread: 0.7, navGlassAlpha: 0.52, navGlassBlur: 18, navGlassSaturate: 1.6 },
  light: { anchor: '#EEEFF2', step: 0.01, navOffset: -3, navChroma: 3.0, navSpread: 0.7, navGlassAlpha: 0.66, navGlassBlur: 18, navGlassSaturate: 1.4 },
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

// The Gaspar "Official (Vasco/Figma)" override lives in @betty/beam (theme/gasparOfficial.ts) — shared by
// the app's DEFAULT theme (the temporary default-swap seam) and the "Current (shipped)" candidate below.

// ── Sunlight "Modern Wisdom (previous)" — the OUTGOING Sunlight seed before alex-sunlight graduated to
// tokens.ts (2026-10-07). Kept as a selectable preset for side-by-side + rollback. Ontario-only primary
// (Alberta was untouched by alex-sunlight); the surface (anchors) is product-scoped, so it restores both
// jurisdictions' warmer-reverted canvas.
const SUNLIGHT_PREV_PRIMARY_ONTARIO: NonNullable<ThemeSeedOverrides['primary']> = {
  light: { primaryDown1: '#8D1100', primary0: '#B33F00', primaryUp1: '#EB7500', contrastText: '#FFFFFF' },
  dark: { primaryDown1: '#C47000', primary0: '#F59E1E', primaryUp1: '#FFB33F', contrastText: '#111827' },
  states: products.sunlight.ontario.states, // non-colour, shared
};
const SUNLIGHT_PREV_SURFACE: NonNullable<ThemeSeedOverrides['surface']> = {
  dark: { anchor: '#0E121B', step: 0.07, navOffset: -0.15, navChroma: 2.2, navSpread: 0.7, navGlassAlpha: 0.52, navGlassBlur: 18, navGlassSaturate: 1.6 },
  light: { anchor: '#F0F0F0', step: 0.01, navOffset: -3, navChroma: 3.0, navSpread: 0.7, navGlassAlpha: 0.66, navGlassBlur: 4, navGlassSaturate: 1.4 },
};
const sunlightPreviousOverrides = (brand: BrandName): ThemeSeedOverrides => ({
  surface: SUNLIGHT_PREV_SURFACE,
  ...(brand === 'ontario' ? { primary: SUNLIGHT_PREV_PRIMARY_ONTARIO } : {}),
});

export const THEME_VARIANTS: Record<LabProduct, ThemeVariant[]> = {
  gaspar: [
    // #1 = current shipped = the Vasco/Figma official palette (the app default; see gasparOfficial.ts).
    { id: 'current', label: 'Current (shipped)', buildTheme: (b) => createBeamTheme(b, 'gaspar', gasparOfficialOverrides(b)), overrides: gasparOfficialOverrides },
    // #2 = the OUTGOING teal default (raw tokens, no overrides) — kept for the A/B + rollback.
    { id: 'teal', label: 'Teal (previous shipped)', buildTheme: (b) => createBeamTheme(b, 'gaspar') },
    // #3 = the earlier lavender, kept as a candidate for reference / rollback.
    { id: 'lavender', label: 'Lavender (previous)', buildTheme: (b) => createBeamTheme(b, 'gaspar', lavenderOverrides(b)), overrides: lavenderOverrides },
  ],
  sunlight: [
    // #1 = current shipped = alex-sunlight (tuned with Alex; graduated to tokens.ts 2026-10-07; no overrides).
    { id: 'current', label: 'Alex (Sunlight)', buildTheme: (b) => createBeamTheme(b, 'sunlight') },
    // #2 = the OUTGOING Modern Wisdom seed, kept for the A/B side-by-side + rollback.
    { id: 'previous', label: 'Sunlight (previous)', buildTheme: (b) => createBeamTheme(b, 'sunlight', sunlightPreviousOverrides(b)), overrides: sunlightPreviousOverrides },
  ],
};
