import Chip from '@mui/material/Chip';
import type { BeamBadgeProps, BeamBadgeHue } from './BeamBadge.types';

/**
 * hue = MEANING → the MUI severity palette key + the status-ink theme var. The chip never bakes a colour
 * literal; both the wash (severity.main channel) and the ink (`--beam-status-<hue>-ink`) resolve through
 * theme vars, so they track `data-beam-mode` (dark → light tint / light → dark shade).
 */
const SEVERITY: Record<BeamBadgeHue, { mui: 'error' | 'warning' | 'success' | 'info'; ink: string }> = {
  danger: { mui: 'error', ink: '--beam-status-danger-ink' },
  warning: { mui: 'warning', ink: '--beam-status-warning-ink' },
  success: { mui: 'success', ink: '--beam-status-success-ink' },
  'in-progress': { mui: 'info', ink: '--beam-status-in-progress-ink' },
};

/**
 * BeamBadge — the grammar-native state badge (docs/state-rendering-grammar.md).
 *
 * CONSTRUCTION: the TINTED grammar (2026-09-24, CEO + broad feedback on the red chip). A mid-saturated
 * FILLED chip is a contrast dead zone — no text colour passes AA on error.main — so instead of colour +
 * weight fighting a colour-math failure, EVERY semantic severity renders as ONE tinted construction: a faint
 * severity WASH (severity.main @ `--beam-status-fill-alpha` over the surface — stays near the surface, calm)
 * with the severity's FAR-FROM-SURFACE ink (`--beam-status-<hue>-ink`, mode-aware) and a 40% definition
 * border. AA (4.5:1) is verified for all four severities over Gaspar + Sunlight surfaces in both modes —
 * ratios + rationale live next to the values in createBeamTheme (STATUS_CHIP). `volume` (loud/noted) no
 * longer changes the semantic fill — loudness is carried by the row severity accent, the chip carries the
 * state legibly. `neutral` stays the hue-less SILENT tier (an outlined default chip). fontWeight 500.
 */
export function BeamBadge(props: BeamBadgeProps) {
  const { label, size = 'small' } = props;

  // Neutral = the hue-less silent tier — unchanged (an outlined, default-colour chip).
  if (props.hue === 'neutral') {
    return <Chip label={label} size={size} variant="outlined" sx={{ fontWeight: 500 }} />;
  }

  const sev = SEVERITY[props.hue];
  const channel = `var(--mui-palette-${sev.mui}-mainChannel)`;
  return (
    <Chip
      label={label}
      size={size}
      variant="filled"
      sx={{
        fontWeight: 500,
        // theme vars only — no baked colour. Fill = severity wash; ink = far-from-surface ramp end; border
        // = severity @ 40%. All mode-aware (the alpha + ink vars flip on data-beam-mode).
        color: `var(${sev.ink})`,
        backgroundColor: `rgba(${channel} / var(--beam-status-fill-alpha))`,
        border: `1px solid rgba(${channel} / var(--beam-status-border-alpha))`,
      }}
    />
  );
}
