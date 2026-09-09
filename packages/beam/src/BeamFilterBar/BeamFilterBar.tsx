import { useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import type { BeamFilterBarProps } from './BeamFilterBar.types';
import { useFilterFields } from './useFilterFields';

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
  advanced,
  'aria-label': ariaLabel,
}: BeamFilterBarProps) {
  // Advanced representation (add/remove/persist fields). Inert when `advanced` is absent — the render
  // below is then byte-identical to the default bar.
  const fields = useFilterFields(advanced);
  const [addAnchor, setAddAnchor] = useState<HTMLElement | null>(null);

  return (
    <Paper
      variant="outlined"
      component="section"
      aria-label={ariaLabel}
      // Border is constant — it's an interactive surface (detail-page §1.2).
      // The applied-state signal is the filled Filter CTA only (below).
      sx={{ p: 2 }}
    >
      <Stack spacing={2}>
        {presets.length > 0 && (
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
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
            as the viewport allows — the one layout every list screen shares.
            Advanced: added fields (each with an [x]) continue the flow, then [+]. */}
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

          {/* Added fields — the page-wired control + an [x] to its right (per Figma). */}
          {fields.addedFields.map((f) => (
            <Box key={f.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>{f.control}</Box>
              <IconButton
                size="small"
                aria-label={`Remove ${f.label} filter`}
                onClick={() => fields.removeField(f.id)}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}

          {/* [+] add-field — after the last field. Opens a menu of not-yet-added fields; disabled
              "awaiting data" entries appear disabled with their reason. */}
          {fields.enabled && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton
                aria-label="Add filter"
                onClick={(e) => setAddAnchor(e.currentTarget)}
                sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}
              >
                <AddIcon />
              </IconButton>
              <Menu anchorEl={addAnchor} open={Boolean(addAnchor)} onClose={() => setAddAnchor(null)}>
                {fields.menuFields.length === 0 && (
                  <MenuItem disabled>All filters added</MenuItem>
                )}
                {fields.menuFields.map((f) =>
                  f.disabled ? (
                    <MenuItem key={f.id} disabled sx={{ display: 'block', py: 0.5 }}>
                      <Typography variant="body2">{f.label}</Typography>
                      {f.disabledReason && (
                        <Typography variant="caption" color="text.secondary">{f.disabledReason}</Typography>
                      )}
                    </MenuItem>
                  ) : (
                    <MenuItem
                      key={f.id}
                      onClick={() => {
                        fields.addField(f.id);
                        setAddAnchor(null);
                      }}
                    >
                      {f.label}
                    </MenuItem>
                  )
                )}
              </Menu>
            </Box>
          )}
        </Box>

        {(onFilter || onClearAll) && (
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
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
