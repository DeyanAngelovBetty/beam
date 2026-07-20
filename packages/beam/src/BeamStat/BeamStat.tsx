import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { BeamStatProps, BeamStatTone } from './BeamStat.types';

/** Tone → semantic palette slot. No color literals (BEAM.md §4.2). */
const toneColor: Record<BeamStatTone, string> = {
  default: 'text.primary',
  success: 'success.main',
  warning: 'warning.main',
  error: 'error.main',
  info: 'info.main',
};

export function BeamStat({ label, value, caption, tone = 'default' }: BeamStatProps) {
  return (
    <Stack spacing={0.25} sx={{ minWidth: 120 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}
      >
        {label}
      </Typography>
      <Typography variant="subtitle1" sx={{ color: toneColor[tone], fontWeight: 500 }}>
        {value}
      </Typography>
      {caption && (
        <Typography variant="caption" color="text.secondary">
          {caption}
        </Typography>
      )}
    </Stack>
  );
}
