import { products, gradientSeeds, type BrandName } from './tokens';
import type { ThemeSeedOverrides, BodyFace } from './createBeamTheme';

// ── BODY FACE (Theme Lab dimension; Gaspar, 2026-09-24) ───────────────────────────────────────────────
// "Thinner over smaller": the density lever is variable-font WEIGHT, not size (size holds at 14 — rows are
// datum-fixed, so smaller text buys no vertical space; only weight buys lightness, and 14px preserves a11y).
// Body/data ~380, caption/secondary ~340. FLOOR: nothing below the secondary weight on dark. The one corner
// to eyeball is Dense (12) × 340 on #041213 — if it shimmers, lift the secondary weight to 360.
// Live CSS vars the Theme Lab sliders drive (body/data only). The var() FALLBACKS carry each preset's
// DEFAULT, so the face renders correctly before any slider moves:
//   • --beam-body-wght / --beam-body-wght-secondary — WEIGHT (a registered axis → CSS font-weight); every
//     face responds (variable faces continuously, static Geist by snapping). The wght slider drives these.
//   • --beam-body-wdth / --beam-body-grad — Roboto Flex's CUSTOM axes (font-variation-settings). GRAD is a
//     GRADE (stroke thickness, NOT weight) → changing it NEVER reflows → the zero-layout-shift thinning demo.
export const BODY_WGHT_VAR = '--beam-body-wght';
export const BODY_WGHT_SEC_VAR = '--beam-body-wght-secondary';
export const BODY_WDTH_VAR = '--beam-body-wdth';
export const BODY_GRAD_VAR = '--beam-body-grad';
// Roboto Flex preset — DEFAULT body face (CEO 2026-09-24): wght 240 with GRAD 0 (already thin at 240 — no
// double-thinning), wdth 104, opsz auto. See §6 ledger + gaspar-notes for the 240-vs-340 scope flag.
export const ROBOTO_FLEX_PRESET = { wght: 240, wdth: 104, grad: 0 };
const wght = (fallback: number) => `var(${BODY_WGHT_VAR}, ${fallback})`;
const wghtSec = (fallback: number) => `var(${BODY_WGHT_SEC_VAR}, ${fallback})`;
type BodyFontSeed = NonNullable<ThemeSeedOverrides['bodyFont']>;
export const GASPAR_BODY_FACES: Record<BodyFace, BodyFontSeed> = {
  // Inter — opsz ENGAGED via font-optical-sizing:auto (the inter/opsz build ships opsz); +0.15px tracking.
  inter: { family: 'Inter Variable', weight: wght(380), secondaryWeight: wghtSec(340), opticalSizing: 'auto', letterSpacing: '0.15px' },
  plex: { family: 'IBM Plex Sans Variable', weight: wght(380), secondaryWeight: wghtSec(340) }, // alternate (kept in the matrix)
  geist: { family: 'Geist', weight: wght(400), secondaryWeight: wghtSec(400) }, // PREVIOUS — static; snaps to 300/400/500/600
  // DEFAULT (CEO 2026-09-24): wght 240 (thinness via weight, GRAD 0 so no double-thin), wdth 104, opsz auto.
  // wght + wdth + GRAD all read live vars → the lab sliders thin the text with zero layout shift (GRAD).
  'roboto-flex': {
    family: 'Roboto Flex Variable',
    weight: wght(ROBOTO_FLEX_PRESET.wght),
    secondaryWeight: wghtSec(Math.max(ROBOTO_FLEX_PRESET.wght - 40, 200)),
    variationSettings: `'wdth' var(${BODY_WDTH_VAR}, ${ROBOTO_FLEX_PRESET.wdth}), 'GRAD' var(${BODY_GRAD_VAR}, ${ROBOTO_FLEX_PRESET.grad})`,
    opticalSizing: 'auto',
  },
};
export const GASPAR_BODY_FACE_LABEL: Record<BodyFace, string> = { inter: 'Inter', plex: 'IBM Plex Sans', geist: 'Geist (previous)', 'roboto-flex': 'Roboto Flex' };
/** Per-face wght SLIDER range (body/data). `min` is each build's REAL floor so the matrix never lies:
 *  variable faces render to 100 (Inter opsz 100–900, Plex 100–700, Roboto Flex 100–1000); static Geist
 *  floors at 300 (its loaded weights 300/400/500/600). `default` = the preset's un-dragged weight. */
export const GASPAR_BODY_WGHT: Record<BodyFace, { min: number; max: number; default: number }> = {
  inter: { min: 100, max: 460, default: 380 },
  plex: { min: 100, max: 460, default: 380 },
  geist: { min: 300, max: 460, default: 400 },
  'roboto-flex': { min: 100, max: 460, default: ROBOTO_FLEX_PRESET.wght },
};
// MONO face — Roboto Mono Variable (@fontsource-variable/roboto-mono, wght 100–700), chosen for FAMILY
// KINSHIP with the Roboto Flex body. It FOLLOWS the body weight (createBeamTheme emits --beam-mono-wght =
// clamp(100, body-wght + delta, 700)), replacing the system `monospace` keyword whose non-variable faces
// clamp at ~400 and split the grid into two weights at body 240. weightDelta +20: mono's fixed advance
// width makes stems read lighter per nominal weight, so a gentle lift brings mono to visual parity with the
// proportional body at 240 (conservative end of the sanctioned 20–40; nudge toward 40 if still wispy).
const GASPAR_MONO = { family: 'Roboto Mono Variable', weightDelta: 20, min: 100, max: 700 } as const;
/** The `overrides.bodyFont` seam value for a chosen Body face (Theme Lab dimension) — every face carries the
 *  same mono, which follows that face's body weight. */
export const gasparBodyFont = (face: BodyFace) => ({ ...GASPAR_BODY_FACES[face], mono: GASPAR_MONO });

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
  //   (b) BODY face: DEFAULT is now ROBOTO FLEX @ wght 240 (CEO 2026-09-24 — thinner, likability over the
  //       a11y-conservative 340 ops value; DESIGN-REPO SCOPE, re-evaluate before product handoff). The
  //       Theme Lab Body-face dimension carries Inter (opsz + 0.15px, the Figma-aligned candidate), IBM Plex
  //       Sans, Geist (previous), and Roboto Flex; the wght slider (+ Roboto wdth/GRAD) thins live. This
  //       DIVERGES from Vasco's Figma (Inter) again at the default — pending his Friday confirm.
  // The BODY face is a Theme Lab DIMENSION (Inter/Plex/Geist/Roboto Flex), the family+axis half of the
  // bodyFont seam; the app injects the chosen face into `overrides.bodyFont`. Default below = Roboto Flex.
  titleFont: { family: 'Quicksand Variable', weight: 300 },
  bodyFont: gasparBodyFont('roboto-flex'), // DEFAULT (CEO 240); the app's Body-face dimension overrides it
  // "Thinner over smaller": density is WEIGHT, SIZE unchanged (14) — rows are datum-fixed (44px), so smaller
  // text gains no vertical space; weight carries the lightness. Default body 240 / caption 200; pairs
  // Quicksand 300 display over the thin body.
  // surface anchor #041213 == shipped → omitted (no change). Gradient: keep shipped mesh, recolour the dark
  // hues toward the Figma palette + pin the official LOGO stops (light mesh untouched).
  gradient: {
    ...gradientSeeds.gaspar,
    dark: { ...gradientSeeds.gaspar.dark, hueB: '#57DDCC', hueC: '#4BA8DA', logoStops: { 1: '#0076A5', 2: '#4BA8DA', 3: '#57DDCC', 4: '#209486' } },
  },
});
