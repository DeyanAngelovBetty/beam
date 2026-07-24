import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { meta } from '../theme/textStyles';
import type { BeamStatProps, BeamStatSeverity, BeamStatTone } from './BeamStat.types';

/** Tone → semantic palette slot for the value. No color literals (BEAM §4.2). */
const toneColor: Record<BeamStatTone, string> = {
  default: 'text.primary',
  success: 'success.main',
  warning: 'warning.main',
  error: 'error.main',
  info: 'info.main',
};

/** Severity → spine CSS var (emitted by the theme) + paired icon. */
const spineVar: Record<BeamStatSeverity | 'default', string> = {
  default: 'var(--beam-spine-default)',
  warning: 'var(--beam-spine-warning)',
  danger: 'var(--beam-spine-danger)',
};

export function BeamStat({ label, value, caption, tone = 'default', severity }: BeamStatProps) {
  const spine = spineVar[severity ?? 'default'];

  return (
    <Stack direction="row" sx={{ minWidth: 140 }}>
      {/* The spine: field state/severity (border = container nature). */}
      <Box
        aria-hidden
        sx={{ flexShrink: 0, width: '2px', borderRadius: 1, alignSelf: 'stretch', bgcolor: spine }}
      />
      <Stack spacing={0.25} sx={{ pl: 1.5, minWidth: 0 }}>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          {severity === 'warning' && (
            <WarningAmberIcon titleAccess="Warning" sx={{ fontSize: 14, color: 'warning.main' }} />
          )}
          {severity === 'danger' && (
            <ErrorOutlineIcon titleAccess="Danger" sx={{ fontSize: 14, color: 'error.main' }} />
          )}
          {/* Key in the shared `meta` voice — one definition, spread here. */}
          <Box component="span" sx={{ ...meta }}>
            {label}
          </Box>
        </Stack>
        <Typography variant="subtitle1" sx={{ color: toneColor[tone], fontWeight: 500, overflowWrap: 'anywhere' }}>
          {value}
        </Typography>
        {caption && (
          <Typography variant="caption" color="text.secondary">
            {caption}
          </Typography>
        )}
      </Stack>
    </Stack>
  );
}
