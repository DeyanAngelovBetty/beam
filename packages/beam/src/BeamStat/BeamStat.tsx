import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import WarningAmberIcon from '@mui/icons-material/WarningAmber'; // OUTLINED — lower severity
import ErrorIcon from '@mui/icons-material/Error'; // FILLED — highest severity
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; // FILLED — boolean true
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'; // OUTLINED — boolean false
import { meta } from '../theme/textStyles';
import { FIELD_GEOMETRY } from '../theme/tokens';
import type { BeamStatProps, BeamStatSeverity } from './BeamStat.types';

/** severity → spine CSS var (emitted by the theme). */
const spineVar: Record<BeamStatSeverity | 'default', string> = {
  default: 'var(--beam-spine-default)',
  warning: 'var(--beam-spine-warning)',
  error: 'var(--beam-spine-error)',
};

/**
 * BeamBool — the boolean value pair. ONE fill principle across icon families (fill = the family's
 * notable state): true → CheckCircle FILLED success; false → Cancel OUTLINED error. Colour carries
 * the yes/no; fill carries emphasis. This is NOT an alarm — severity is the only alarm channel.
 */
export function BeamBool({ value }: { value: boolean }) {
  return value ? (
    <CheckCircleIcon titleAccess="Yes" sx={{ fontSize: 14, color: 'success.main', display: 'block' }} />
  ) : (
    <CancelOutlinedIcon titleAccess="No" sx={{ fontSize: 14, color: 'error.main', display: 'block' }} />
  );
}

export function BeamStat({ label, value, caption, showCaption = true, severity }: BeamStatProps) {
  const spine = spineVar[severity ?? 'default'];
  // A boolean value renders the icon pair; anything else flows through the text value slot.
  const isBool = typeof value === 'boolean';

  return (
    <Stack direction="row" sx={{ minWidth: 140 }}>
      {/* The spine — the FIELD's state, view-only. Stretches to the content height (44px floor). */}
      <Box aria-hidden sx={{ flexShrink: 0, width: '2px', borderRadius: 1, alignSelf: 'stretch', bgcolor: spine }} />
      <Stack sx={{ pl: 1.5, minWidth: 0, py: `${FIELD_GEOMETRY.paddingY}px`, gap: `${FIELD_GEOMETRY.gap}px` }}>
        {/* Label row — meta voice + the severity icon (fill = escalation: outlined warning → filled error). */}
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', minHeight: `${FIELD_GEOMETRY.labelLineHeight}px` }}>
          {severity === 'warning' && <WarningAmberIcon titleAccess="Warning" sx={{ fontSize: 12, color: 'warning.main', display: 'block' }} />}
          {severity === 'error' && <ErrorIcon titleAccess="Error" sx={{ fontSize: 12, color: 'error.main', display: 'block' }} />}
          <Box component="span" sx={{ ...meta }}>
            {label}
          </Box>
        </Stack>
        {isBool ? (
          <Box sx={{ minHeight: `${FIELD_GEOMETRY.valueLineHeight}px`, display: 'flex', alignItems: 'center' }}>
            <BeamBool value={value as boolean} />
          </Box>
        ) : (
          <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 500, lineHeight: `${FIELD_GEOMETRY.valueLineHeight}px`, overflowWrap: 'anywhere' }}>
            {value}
          </Typography>
        )}
        {caption && showCaption && (
          <Typography variant="caption" color="text.secondary">
            {caption}
          </Typography>
        )}
      </Stack>
    </Stack>
  );
}
