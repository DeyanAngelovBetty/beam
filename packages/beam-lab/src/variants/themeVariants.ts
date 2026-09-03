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

// ── Gaspar "Teal (recovered)" — ported from git history ───────────────────────────────────────────
// The teal Gaspar theme shipped from the monorepo split (08965b8, 2026-07-20) and was replaced by
// the current purple/candy theme (28aa256 + bc50e0e, 2026-08-11). Values recovered at 28aa256^ (the
// last fully-teal state). PORT, not a restore — mapped into today's seed shape.
//
// FINDING (bounds the decision + the eventual Figma sync): only ONTARIO was teal. Alberta was
// already magenta in the teal era, identical to today — so the candidate decision is Ontario-only
// (teal vs today's lavender), and Alberta falls through to the shipped magenta below.
//
// NON-COLOUR PARAMS ARE DELIBERATELY IDENTICAL to the shipped Gaspar theme (surface steps + nav
// glass; the star mesh params) so the comparison isolates COLOUR. Slot-mapping notes:
//  - (a) DROPPED — the teal era's page mesh was a DOT recipe (dotPitch/dotSize/dotOpacity); today's
//    mesh is a STAR recipe, so those three have no modern slot and are gone.
//  - (b) NEUTRAL FILL — starPitch/starSizeRatio/starIntensity didn't exist in the teal era; filled
//    to mirror shipped Gaspar (40 / 0.22 / 4 dark · 6 light). hueC / starColor / logoStops left
//    ABSENT (derived by default), as the teal era never defined them.

const TEAL_ONTARIO_PRIMARY: NonNullable<ThemeSeedOverrides['primary']> = {
  light: { primaryDown1: '#0B534D', primary0: '#0F766E', primaryUp1: '#3F918B', contrastText: '#FFFFFF' },
  dark: { primaryDown1: '#209486', primary0: '#57DDCC', primaryUp1: '#57DDCC', contrastText: '#111827' },
  states: products.gaspar.ontario.states, // non-colour, shared — identical across variants
};

const TEAL_SURFACE: NonNullable<ThemeSeedOverrides['surface']> = {
  // anchor is the teal-tinted near-black / near-white; steps + nav params identical to shipped.
  dark: { anchor: '#041213', step: 0.085, navOffset: -0.15, navChroma: 2.2, navSpread: 0.7, navGlassAlpha: 0.52, navGlassBlur: 24, navGlassSaturate: 1.5 },
  light: { anchor: '#EDF1F1', step: 0.01, navOffset: -3, navChroma: 3.0, navSpread: 0.7, navGlassAlpha: 0.66, navGlassBlur: 24, navGlassSaturate: 1.4 },
};

const TEAL_GRADIENT: NonNullable<ThemeSeedOverrides['gradient']> = {
  // hueB/intensity are the teal-era greens; star params are the shipped-Gaspar neutral fills (b).
  dark: { hueB: '#68DD57', intensity: 22, starPitch: 40, starSizeRatio: 0.22, starIntensity: 4 },
  light: { hueB: '#17760F', intensity: 14, starPitch: 40, starSizeRatio: 0.22, starIntensity: 6 },
};

// Alberta (brand !== 'ontario') → primary undefined → createBeamTheme falls through to the shipped
// magenta. Surface + gradient are product-level (teal era applied them under both jurisdictions).
const tealOverrides = (brand: BrandName): ThemeSeedOverrides => ({
  primary: brand === 'ontario' ? TEAL_ONTARIO_PRIMARY : undefined,
  surface: TEAL_SURFACE,
  gradient: TEAL_GRADIENT,
});

export const THEME_VARIANTS: Record<LabProduct, ThemeVariant[]> = {
  gaspar: [
    { id: 'current', label: 'Purple (current)', buildTheme: (b) => createBeamTheme(b, 'gaspar') },
    { id: 'teal', label: 'Teal (recovered)', buildTheme: (b) => createBeamTheme(b, 'gaspar', tealOverrides(b)), overrides: tealOverrides },
  ],
  sunlight: [{ id: 'current', label: 'Modern Wisdom (current)', buildTheme: (b) => createBeamTheme(b, 'sunlight') }],
};
