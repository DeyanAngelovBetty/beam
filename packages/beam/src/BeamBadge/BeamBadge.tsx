import Chip from '@mui/material/Chip';
import type { BeamBadgeProps, BeamBadgeHue } from './BeamBadge.types';

/**
 * hue = MEANING → the status-tier theme vars. The chip never bakes a colour literal; the solid fill
 * (`--beam-status-<hue>-solid`, mode-invariant) and the outlined ink (`--beam-status-<hue>-ink`, mode-aware)
 * both resolve through theme vars.
 */
const HUE_VAR: Record<BeamBadgeHue, { solid: string; ink: string }> = {
  danger: { solid: '--beam-status-danger-solid', ink: '--beam-status-danger-ink' },
  warning: { solid: '--beam-status-warning-solid', ink: '--beam-status-warning-ink' },
  success: { solid: '--beam-status-success-solid', ink: '--beam-status-success-ink' },
  'in-progress': { solid: '--beam-status-in-progress-solid', ink: '--beam-status-in-progress-ink' },
};

/**
 * BeamBadge — the grammar-native state badge (docs/state-rendering-grammar.md).
 *
 * TWO-LEVER construction (final, 2026-09-24 — §6.13). Hue = meaning, volume = loudness, expressed as three
 * tiers:
 *   • LOUD (semantic hue + `loud`) — FILLED colour: a DARK solid (`--beam-status-<hue>-solid`, AAA with
 *     white, mode-invariant) + white text. The one shout (e.g. Failed).
 *   • NOTED (semantic hue + `noted`) — OUTLINED colour: the far-from-surface INK for text + border over a
 *     transparent chip (mode-aware). Legible without shouting (e.g. Succeeded, Pending challenge).
 *   • TRANSIENT (`neutral`) — OUTLINED colourless, the silent tier (e.g. Initiated, Processing, Draft).
 * fontWeight 500. All colours are theme vars — no literals. (The tinted construction that briefly shipped
 * is retained only in the Storybook harness as the evaluated alternative.)
 */
export function BeamBadge(props: BeamBadgeProps) {
  const { label, size = 'small' } = props;

  // TRANSIENT — the hue-less silent tier (outlined, default colour).
  if (props.hue === 'neutral') {
    return <Chip label={label} size={size} variant="outlined" sx={{ fontWeight: 500 }} />;
  }

  const v = HUE_VAR[props.hue];

  // LOUD — filled dark solid + white text (the one shout).
  if (props.volume === 'loud') {
    return (
      <Chip
        label={label}
        size={size}
        variant="filled"
        sx={{ fontWeight: 500, backgroundColor: `var(${v.solid})`, color: 'var(--beam-status-on-solid)' }}
      />
    );
  }

  // NOTED — outlined colour: far-from-surface ink for text + border, transparent chip.
  return (
    <Chip
      label={label}
      size={size}
      variant="outlined"
      sx={{ fontWeight: 500, color: `var(${v.ink})`, borderColor: `var(${v.ink})`, backgroundColor: 'transparent' }}
    />
  );
}
