import { products, gradientSeeds, type BrandName } from './tokens';
import type { ThemeSeedOverrides, BodyFace } from './createBeamTheme';

// ── BODY FACE (Theme Lab dimension; Gaspar, 2026-09-24) ───────────────────────────────────────────────
// "Thinner over smaller": the density lever is variable-font WEIGHT, not size (size holds at 14 — rows are
// datum-fixed, so smaller text buys no vertical space; only weight buys lightness, and 14px preserves a11y).
// Body/data ~380, caption/secondary ~340. FLOOR: nothing below the secondary weight on dark. The one corner
// to eyeball is Dense (12) × 340 on #041213 — if it shimmers, lift the secondary weight to 360.
const BODY_WEIGHT = 380; // body/data workhorse (variable axis)
const BODY_SECONDARY_WEIGHT = 340; // caption/overline de-emphasis (≥340 on dark)
// The live wdth/GRAD CSS vars the Theme Lab sliders drive (Roboto Flex only). The var() FALLBACKS are the
// preset (wdth 104, GRAD −30), so the face renders correctly before any slider moves. GRAD carries the
// THINNESS as a GRADE (stroke contrast, NOT weight) → metrics don't reflow → live thinning with zero layout
// shift (the Friday demo). opsz is left to `font-optical-sizing: auto` (not pinned in variation-settings).
export const BODY_WDTH_VAR = '--beam-body-wdth';
export const BODY_GRAD_VAR = '--beam-body-grad';
export const ROBOTO_FLEX_PRESET = { wdth: 104, grad: -30 };
type BodyFontSeed = NonNullable<ThemeSeedOverrides['bodyFont']>;
export const GASPAR_BODY_FACES: Record<BodyFace, BodyFontSeed> = {
  // Candidate default (aligns with Vasco's Figma). opsz ENGAGED via font-optical-sizing:auto (the
  // @fontsource inter/opsz build ships the opsz axis); +0.15px tracking = thin-on-dark air on body/data.
  inter: { family: 'Inter Variable', weight: BODY_WEIGHT, secondaryWeight: BODY_SECONDARY_WEIGHT, opticalSizing: 'auto', letterSpacing: '0.15px' },
  plex: { family: 'IBM Plex Sans Variable', weight: BODY_WEIGHT, secondaryWeight: BODY_SECONDARY_WEIGHT }, // alternate (kept in the matrix)
  geist: { family: 'Geist', weight: 400, secondaryWeight: 400 }, // PREVIOUS — static Google face (no variable axis)
  // Axis-rich candidate: wght 400 with THINNESS via GRAD (grade, not weight → no reflow), wdth 104, opsz
  // auto. wdth + GRAD read live CSS vars so the lab sliders thin the text with zero layout shift.
  'roboto-flex': {
    family: 'Roboto Flex Variable',
    variationSettings: `'wght' 400, 'wdth' var(${BODY_WDTH_VAR}, ${ROBOTO_FLEX_PRESET.wdth}), 'GRAD' var(${BODY_GRAD_VAR}, ${ROBOTO_FLEX_PRESET.grad})`,
    opticalSizing: 'auto',
  },
};
export const GASPAR_BODY_FACE_LABEL: Record<BodyFace, string> = { inter: 'Inter', plex: 'IBM Plex Sans', geist: 'Geist (previous)', 'roboto-flex': 'Roboto Flex' };
/** The `overrides.bodyFont` seam value for a chosen Body face (Theme Lab dimension). */
export const gasparBodyFont = (face: BodyFace) => GASPAR_BODY_FACES[face];

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
  // BRAND EXPLORATION (2026-09-24) — DIVERGES from Vasco's Figma (which maps the typeface to Inter). Trying
  // Quicksand 300 for the DISPLAY scale (page titles h1–h6 + section titles subtitle1). Self-hosted via
  // @fontsource-variable in apps/gaspar. Gaspar-only (Sunlight untouched).
  //
  // ⚠️ FONT SEAM — VASCO REVIEW LIST (decide once, together — one brand conversation; his confirm due Fri):
  //   (a) TITLE face: this Quicksand 300 exploration  vs  Vasco's Figma Inter. STILL DIVERGENT (exploration).
  //   (b) BODY face: NOW Inter Variable @ 380/340 + opsz auto + 0.15px tracking — ALIGNED WITH VASCO'S
  //       FIGMA (Inter), closing the prior Geist-vs-Figma discrepancy in Inter's favour. The Theme Lab
  //       Body-face dimension also carries IBM Plex Sans (alternate), Geist (previous), and Roboto Flex
  //       (axis-rich candidate — live wdth/GRAD sliders, thinness via grade with no reflow). Default stays
  //       Inter; the pick happens on the transactions grid. Pending Vasco's Friday confirm.
  // The BODY face is now a Theme Lab DIMENSION (Body face = Inter/Plex/Geist), the family half of the
  // bodyFont seam; the app injects the chosen face into `overrides.bodyFont`. Default below = Inter.
  titleFont: { family: 'Quicksand Variable', weight: 300 },
  bodyFont: gasparBodyFont('inter'), // default; the app's Body-face dimension overrides the family
  // "Thinner over smaller" (2026-09-24): body/data ~380, caption ~340, SIZE unchanged (14). The a11y-
  // preserving density argument — rows are datum-fixed (44px), so smaller text gains no vertical space;
  // weight, not size, carries the lightness. Pairs Quicksand 300 display over Inter 380 body.
  // surface anchor #041213 == shipped → omitted (no change). Gradient: keep shipped mesh, recolour the dark
  // hues toward the Figma palette + pin the official LOGO stops (light mesh untouched).
  gradient: {
    ...gradientSeeds.gaspar,
    dark: { ...gradientSeeds.gaspar.dark, hueB: '#57DDCC', hueC: '#4BA8DA', logoStops: { 1: '#0076A5', 2: '#4BA8DA', 3: '#57DDCC', 4: '#209486' } },
  },
});
