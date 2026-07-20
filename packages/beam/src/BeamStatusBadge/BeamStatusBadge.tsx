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
  settled: 'success',
  pending: 'info',
  refunded: 'warning',
  chargeback: 'error',
};

/** Quiet, resolved states read as outlines; live states read as fills. */
const OUTLINED: BeamStatus[] = ['draft', 'expired', 'refunded'];

export function BeamStatusBadge({ status, label, size = 'small' }: BeamStatusBadgeProps) {
  return (
    <Chip
      label={label ?? status}
      color={statusColor[status]}
      size={size}
      variant={OUTLINED.includes(status) ? 'outlined' : 'filled'}
      sx={{ textTransform: 'capitalize', fontWeight: 500 }}
    />
  );
}
