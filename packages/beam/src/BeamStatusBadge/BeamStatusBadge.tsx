import Box from '@mui/material/Box';
import { BeamBadge } from '../BeamBadge/BeamBadge';
import type { BeamBadgeHue } from '../BeamBadge/BeamBadge.types';
import type { BeamStatusBadgeProps, BeamStatus } from './BeamStatusBadge.types';

/**
 * BeamStatusBadge — LEGACY ADAPTER over BeamBadge (the grammar-native keystone). It bridges the old
 * `BeamStatus` vocabulary to (hue, volume) so existing consumers render pixel-identically while
 * surfaces migrate to explicit page maps (docs/state-rendering-grammar.md).
 *
 * The map DELIBERATELY reproduces today's rendering — which is loud-heavy (mostly filled), a snapshot
 * of the pre-grammar budget violations. It is NOT the grammar's recommended volumes; each surface's
 * migration onto its own vocabulary→tier map is where the loudness budget gets enforced. New code
 * should use BeamBadge + a page map, not this.
 */
type Tier = { hue: 'neutral'; volume?: 'silent' } | { hue: BeamBadgeHue; volume: 'noted' | 'loud' };

const STATUS_TO_TIER: Record<BeamStatus, Tier> = {
  active: { hue: 'success', volume: 'loud' },
  settled: { hue: 'success', volume: 'loud' },
  scheduled: { hue: 'in-progress', volume: 'loud' },
  pending: { hue: 'in-progress', volume: 'loud' },
  paused: { hue: 'warning', volume: 'loud' },
  refunded: { hue: 'warning', volume: 'noted' },
  error: { hue: 'danger', volume: 'loud' },
  chargeback: { hue: 'danger', volume: 'loud' },
  draft: { hue: 'neutral', volume: 'silent' },
  expired: { hue: 'neutral', volume: 'silent' },
};

export function BeamStatusBadge({ status, label, size = 'small' }: BeamStatusBadgeProps) {
  // Legacy pixel-parity: the old chip applied `textTransform: capitalize`. BeamBadge no longer
  // transforms (pages own casing); the wrapper restores capitalize here, safe because the BeamStatus
  // vocabulary is single-word. The Chip label inherits text-transform from this span.
  return (
    <Box component="span" sx={{ textTransform: 'capitalize' }}>
      <BeamBadge {...STATUS_TO_TIER[status]} label={label ?? status} size={size} />
    </Box>
  );
}
