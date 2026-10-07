/**
 * CATEGORICAL entity palettes (gaspar-local, ruling 3 — promote to Beam tokens on a second consumer).
 * Colour follows the ENTITY, keyed by id, NEVER by rank/order (spec): removing a series never repaints the
 * survivors. Reserved semantic hues (success green / warning amber / error red / info blue) and the teal
 * primary are excluded. Per-mode by design (not inverted; derived-color-tokens.md).
 *
 * COLOUR-BLINDNESS (2026-10-07): the first violet/fuchsia provider pair COLLAPSED under deutan/protan
 * (CIEDE2000 ΔE ~6–10). Retuned for LIGHTNESS contrast (which red-green CVD preserves) — the blue↔yellow fix
 * is unavailable here (yellow/orange = warning, blue = info). Verified pairs (min of deutan+protan ΔE):
 *   providers  light 36  · dark 47      directions  light 22 · dark 13     (all ≥ 12 = distinguishable)
 * Colour is still never the sole channel — the legend + the stacking order + direct labels carry identity.
 */
type ModeColor = { light: string; dark: string };
const pick = (c: ModeColor, mode: string | undefined) => c[mode === 'light' ? 'light' : 'dark'];

const PROVIDER: Record<string, ModeColor> = {
  Nuvei: { light: '#4C1D95', dark: '#DDD6FE' }, // deep violet / light violet
  Worldpay: { light: '#E879F9', dark: '#A21CAF' }, // bright fuchsia / deep magenta
};
const NEUTRAL: ModeColor = { light: '#6B7280', dark: '#9CA3AF' }; // unknown provider → neutral, raw label kept

const DIRECTION: Record<string, ModeColor> = {
  Deposit: { light: '#1E1B4B', dark: '#A5B4FC' }, // dark indigo / light indigo
  Withdrawal: { light: '#C026D3', dark: '#F472B6' }, // magenta / pink — NOT grey (spec)
};

/** `mode` is the live color scheme ('light' | 'dark' | 'system' | undefined); anything but 'light' → dark. */
export function providerColor(providerId: string, mode: string | undefined): string {
  return pick(PROVIDER[providerId] ?? NEUTRAL, mode);
}
export function directionColor(direction: string, mode: string | undefined): string {
  return pick(DIRECTION[direction] ?? NEUTRAL, mode);
}
