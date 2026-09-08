import { useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Popover from '@mui/material/Popover';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import ViewColumnIcon from '@mui/icons-material/ViewColumnOutlined';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpwardRounded';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownwardRounded';

/** A real, toggleable/reorderable column, in current order (hidden ones included). */
export interface ManagerColumn {
  id: string;
  label: string;
  visible: boolean;
}

export interface BeamColumnManagerProps {
  columns: ManagerColumn[];
  /** Disabled "awaiting data" ledger rows (option b) — never toggleable or reorderable. */
  catalog: { id: string; label: string }[];
  onToggle: (id: string) => void;
  onMove: (id: string, dir: 'up' | 'down') => void;
  onReset: () => void;
}

/**
 * BeamColumnManager — the toolbar trigger + popover for BeamDataTable's column manager. Internal to
 * the organism (not barrel-exported). Show/hide via checkbox; reorder via ▲/▼ buttons (keyboard AND
 * pointer, no DnD dependency — a drag handle is additive-later). Reset returns to declared defaults.
 * Minimum one visible column is enforced: the last visible column's checkbox is disabled.
 */
export function BeamColumnManager({ columns, catalog, onToggle, onMove, onReset }: BeamColumnManagerProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);
  const visibleCount = columns.filter((c) => c.visible).length;

  return (
    <>
      <Tooltip title="Manage columns">
        <IconButton size="small" aria-label="Manage columns" onClick={(e) => setAnchorEl(e.currentTarget)}>
          <ViewColumnIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ minWidth: 300, py: 1 }} role="group" aria-label="Column manager">
          <List dense disablePadding>
            {columns.map((c, i) => {
              const lockedOn = c.visible && visibleCount <= 1; // last visible — can't hide it
              return (
                <ListItem
                  key={c.id}
                  disableGutters
                  sx={{ pl: 1, pr: 0.5 }}
                  secondaryAction={
                    <Stack direction="row" sx={{ alignItems: 'center' }}>
                      <IconButton
                        size="small"
                        aria-label={`Move ${c.label} up`}
                        disabled={i === 0}
                        onClick={() => onMove(c.id, 'up')}
                      >
                        <ArrowUpwardIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        aria-label={`Move ${c.label} down`}
                        disabled={i === columns.length - 1}
                        onClick={() => onMove(c.id, 'down')}
                      >
                        <ArrowDownwardIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  }
                >
                  <FormControlLabel
                    sx={{ m: 0 }}
                    control={
                      <Checkbox
                        size="small"
                        checked={c.visible}
                        disabled={lockedOn}
                        onChange={() => onToggle(c.id)}
                        slotProps={{ input: { 'aria-label': `Show ${c.label}` } }}
                      />
                    }
                    label={c.label}
                  />
                </ListItem>
              );
            })}

            {catalog.length > 0 && <Divider sx={{ my: 1 }} />}
            {catalog.map((c) => (
              <ListItem key={c.id} disableGutters sx={{ pl: 1, pr: 0.5, opacity: 0.6 }}>
                <FormControlLabel
                  sx={{ m: 0 }}
                  control={<Checkbox size="small" checked={false} disabled />}
                  label={
                    <Stack>
                      <Typography variant="body2">{c.label}</Typography>
                      <Typography variant="caption" color="text.secondary">awaiting data</Typography>
                    </Stack>
                  }
                />
              </ListItem>
            ))}
          </List>

          <Divider sx={{ my: 1 }} />
          <Box sx={{ px: 2 }}>
            <Button size="small" onClick={onReset}>Reset to defaults</Button>
          </Box>
        </Box>
      </Popover>
    </>
  );
}
