import Chip from '@mui/material/Chip';
import type { ChipProps } from '@mui/material/Chip';
import type { BeamBadgeProps } from './BeamBadge.types';

/** hue = MEANING → theme semantic color (theme picks the hex per mode; never a literal). */
const HUE_COLOR: Record<string, ChipProps['color']> = {
  danger: 'error',
  warning: 'warning',
  success: 'success',
  'in-progress': 'info',
  neutral: 'default',
};

/**
 * BeamBadge — renders the grammar (see BeamBadge.types). volume = VOLUME: `loud` fills, `noted` and
 * `silent` outline (silent is the neutral, hue-less tier). fontWeight only — NO textTransform.
 */
export function BeamBadge(props: BeamBadgeProps) {
  const { label, size = 'small' } = props;
  const volume = props.hue === 'neutral' ? 'silent' : props.volume;
  return (
    <Chip
      label={label}
      color={HUE_COLOR[props.hue]}
      size={size}
      variant={volume === 'loud' ? 'filled' : 'outlined'}
      sx={{ fontWeight: 500 }}
    />
  );
}
