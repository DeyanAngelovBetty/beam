/**
 * CATEGORICAL entity palettes (gaspar-local, ruling 3). Colour follows the ENTITY, keyed by id, never by rank.
 * Reserved semantic hues (success/warning/error/info) and the teal primary are excluded. Per-mode.
 *
 * COLOUR-BLINDNESS (2026-10-07, two rounds). WITHIN each chart the pair must be CVD-distinct; ACROSS the two
 * charts the families must not read as the same colour. A full 4-way CVD-distinct set is UNACHIEVABLE on this
 * palette — the only non-semantic, non-teal space is the purple→magenta band, and red-green CVD flattens it
 * (best 4-way worst-pair ≈ 5). Resolution: give each FAMILY a hue centre (providers = VIOLET, directions =
 * ROSE) with LIGHTNESS contrast WITHIN the pair (CVD preserves lightness). Verified CIEDE2000 min(deutan,protan):
 *   providers  light 38 · dark 40      directions  light 33 · dark 44     (within-chart — what disambiguates)
 * Cross-family is weaker (≈ 8–18), so colour is NOT the sole channel: the spec-mandated LEGEND + DIRECT LABELS
 * + consistent stacking order carry identity, and lines render thick enough to read at low surface contrast.
 * OPEN for Boryana/design: if stronger CVD is required, relax the teal/semantic reservation for charts, or add
 * a second channel (patterns/dashes) — logged in gaspar-dashboard-notes §4.
 */
type ModeColor = { light: string; dark: string };
const pick = (c: ModeColor, mode: string | undefined) => c[mode === 'light' ? 'light' : 'dark'];

const PROVIDER: Record<string, ModeColor> = {
  Nuvei: { light: '#4C1D95', dark: '#DDD6FE' }, // deep violet / light violet
  Worldpay: { light: '#C4B5FD', dark: '#7C3AED' }, // light violet / mid violet (stacked beside Nuvei)
};
const NEUTRAL: ModeColor = { light: '#6B7280', dark: '#9CA3AF' }; // unknown provider → neutral, raw label kept

const DIRECTION: Record<string, ModeColor> = {
  Deposit: { light: '#9D174D', dark: '#F9A8D4' }, // dark rose / light pink
  Withdrawal: { light: '#F472B6', dark: '#BE185D' }, // pink / dark rose — NOT grey (spec)
};

/** `mode` is the live color scheme ('light' | 'dark' | 'system' | undefined); anything but 'light' → dark. */
export function providerColor(providerId: string, mode: string | undefined): string {
  return pick(PROVIDER[providerId] ?? NEUTRAL, mode);
}
export function directionColor(direction: string, mode: string | undefined): string {
  return pick(DIRECTION[direction] ?? NEUTRAL, mode);
}
