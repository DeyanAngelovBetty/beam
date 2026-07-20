import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import type { BeamFilterBarProps } from './BeamFilterBar.types';

export function BeamFilterBar({
  children,
  presets = [],
  activePreset = null,
  onPresetChange,
  onSearch,
  onClear,
  'aria-label': ariaLabel,
}: BeamFilterBarProps) {
  return (
    <Paper variant="outlined" component="section" aria-label={ariaLabel} sx={{ p: 2 }}>
      <Stack spacing={2}>
        {presets.length > 0 && (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {presets.map((preset) => (
              <Chip
                key={preset.id}
                label={preset.label}
                size="small"
                variant={activePreset === preset.id ? 'filled' : 'outlined'}
                color={activePreset === preset.id ? 'primary' : 'default'}
                onClick={
                  onPresetChange
                    ? () => onPresetChange(activePreset === preset.id ? null : preset.id)
                    : undefined
                }
              />
            ))}
          </Stack>
        )}

        {/* Fields wrap into as many columns as the viewport allows — the one
            layout decision every list screen already agrees on. */}
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              lg: 'repeat(4, minmax(0, 1fr))',
            },
          }}
        >
          {children}
        </Box>

        {(onSearch || onClear) && (
          <Stack direction="row" spacing={1}>
            {onSearch && (
              <Button variant="contained" onClick={onSearch}>
                Search
              </Button>
            )}
            {onClear && (
              <Button variant="outlined" onClick={onClear}>
                Clear
              </Button>
            )}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
