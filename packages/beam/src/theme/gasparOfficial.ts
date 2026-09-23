import { products, gradientSeeds, type BrandName } from './tokens';
import type { ThemeSeedOverrides } from './createBeamTheme';

// REJECTED SOURCE (do not re-extract): the `gaspar-official` clone @ 01d61ab was the WRONG SURFACE — its
// `rule-editor/` purple (#7c6cf0) is the rule-editor tool's OWN accent, not the Gaspar product palette.
//
// ── Gaspar "Official (Vasco/Figma)" — the official product palette ─────────────────────────────────
// SOURCE: Vasco's Figma mapping — file **9yNbolohxGitkMJKDjoyKG**, node **12982-921** (pulled directly).
// A DARK theme; only the dark scheme is official (light scheme = the shipped teal). Mapped onto our seeds
// (primary / secondary / text / gradient); primary + surface anchor already MATCH shipped teal (the shipped
// teal graduated FROM this Figma). Provenance per value (Figma variable → our slot):
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
//            defaulted to the shipped teal mesh RECOLORED (dark hueB→#57DDCC, hueC→#4BA8DA) — FLAGGED for
//            eyeball (keep / re-tune / drop).
//   FALLBACK *.light (whole scheme)  — Figma is dark-only; light = the shipped teal
//   FALLBACK divider · nav/sidebar params · hover-COLOUR (washes cover state-paint OPACITY only)
//   FALLBACK severity success/warning/error — our theme HARDCODES severity (createBeamTheme); the seed seam
//            can't reach it, so this renders SHIPPED severity. Seam-extension question is open.
// Typeface: Inter + standard MUI ramp — matches ours, no change.
//
// USED IN TWO PLACES: the Gaspar app's DEFAULT theme (a deliberate, temporary default-swap seam — see
// apps/gaspar/src/App.tsx) and the Theme Lab "Current (shipped)" candidate.
export const gasparOfficialOverrides = (brand: BrandName): ThemeSeedOverrides => ({
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
