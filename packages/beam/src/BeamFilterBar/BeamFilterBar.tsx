import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import type { BeamFilterBarProps } from './BeamFilterBar.types';

export function BeamFilterBar({
  children,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search',
  presets = [],
  activePreset = null,
  onPresetChange,
  onFilter,
  onClearAll,
  applied = false,
  'aria-label': ariaLabel,
}: BeamFilterBarProps) {
  return (
    <Paper
      variant="outlined"
      component="section"
      aria-label={ariaLabel}
      sx={{
        p: 2,
        // Applied state reads as a lit border (grammar §1).
        ...(applied && { borderColor: 'primary.main' }),
      }}
    >
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

        {/* Search leads; promoted fields follow, wrapping into as many columns
            as the viewport allows — the one layout every list screen shares. */}
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
          {onSearchChange && (
            <TextField
              size="small"
              fullWidth
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                  // Individually clearable — the reference pattern for every field.
                  endAdornment: searchValue ? (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        aria-label="Clear search"
                        edge="end"
                        onClick={() => onSearchChange('')}
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : undefined,
                },
              }}
            />
          )}
          {children}
        </Box>

        {(onFilter || onClearAll) && (
          <Stack direction="row" spacing={1} alignItems="center">
            {onFilter && (
              <Button variant={applied ? 'contained' : 'outlined'} onClick={onFilter}>
                Filter
              </Button>
            )}
            {onClearAll && (
              <Button variant="text" onClick={onClearAll} disabled={!applied}>
                Clear all
              </Button>
            )}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
