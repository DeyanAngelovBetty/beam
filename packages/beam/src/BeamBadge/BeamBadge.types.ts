/**
 * BeamBadge — the grammar-native state badge (docs/state-rendering-grammar.md). Two axes:
 *   hue = MEANING (semantic category), volume = VOLUME (loudness), label = the word (always shown).
 *
 * The type IS the grammar: a discriminated union on `hue` makes the illegal combinations
 * UNREPRESENTABLE — filled neutral (a shout with no category) and a hue with no label cannot be
 * written. `neutral` is the silent tier by definition; a semantic hue must choose noted or loud.
 *
 * The organism knows NO product vocabulary — pages map their strings to (hue, volume). No
 * `textTransform`: labels render as given, pages own casing (sentence case per the grammar).
 */
export type BeamBadgeHue = 'danger' | 'warning' | 'success' | 'in-progress';

export type BeamBadgeProps = (
  | { hue: 'neutral'; volume?: 'silent' } // neutral ⇒ silent only (no filled neutral)
  | { hue: BeamBadgeHue; volume: 'noted' | 'loud' } // a semantic hue ⇒ noted|loud, never silent
) & {
  /** The state word — ALWAYS present (hue is never color-alone; a11y is structural here). */
  label: string;
  size?: 'small' | 'medium';
};
