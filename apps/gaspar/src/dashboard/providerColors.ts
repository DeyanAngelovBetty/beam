/**
 * CATEGORICAL provider palette (gaspar-local, ruling 3 — promote to Beam tokens on a second consumer).
 * Colour follows the ENTITY, keyed by provider id, NEVER by rank/order (spec): a provider keeps its colour
 * wherever it sits and whatever the filter leaves standing, so removing a series never repaints the survivors.
 *
 * Chosen to NOT collide with the reserved semantic hues (success green / warning amber / error red / info blue)
 * nor with Gaspar's teal primary — violet + fuchsia, ~60° apart, both outside those bands. Per-mode by design
 * (not inverted): the dark steps are lighter/less-saturated for the dark surface, chosen against it
 * (derived-color-tokens.md). An UNKNOWN provider renders NEUTRAL with its raw label ("nothing invented").
 */
const PALETTE: Record<string, { light: string; dark: string }> = {
  Nuvei: { light: '#5A3FC0', dark: '#A99BF5' }, // violet
  Worldpay: { light: '#B5178E', dark: '#EC77D0' }, // fuchsia
};

const NEUTRAL = { light: '#6B7280', dark: '#9CA3AF' }; // unrecognised → neutral grey, raw label kept

/** `mode` is the live color scheme ('light' | 'dark' | 'system' | undefined); anything but 'light' → dark. */
export function providerColor(providerId: string, mode: string | undefined): string {
  return (PALETTE[providerId] ?? NEUTRAL)[mode === 'light' ? 'light' : 'dark'];
}
