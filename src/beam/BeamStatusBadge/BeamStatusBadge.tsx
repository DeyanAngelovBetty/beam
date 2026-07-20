import Chip from '@mui/material/Chip';
import type { BeamStatusBadgeProps, BeamStatus } from './BeamStatusBadge.types';

const statusColor: Record<
  BeamStatus,
  'success' | 'info' | 'default' | 'warning' | 'error'
> = {
  active: 'success',
  scheduled: 'info',
  draft: 'default',
  paused: 'warning',
  expired: 'default',
  error: 'error',
};

export function BeamStatusBadge({ status, label, size = 'small' }: BeamStatusBadgeProps) {
  return (
    <Chip
      label={label ?? status}
      color={statusColor[status]}
      size={size}
      variant={status === 'draft' || status === 'expired' ? 'outlined' : 'filled'}
      sx={{ textTransform: 'capitalize', fontWeight: 500 }}
    />
  );
}
