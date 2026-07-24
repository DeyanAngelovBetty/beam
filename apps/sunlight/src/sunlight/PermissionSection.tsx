import { useState } from 'react';
import { Box, Stack, Typography, Paper, Divider, Checkbox, IconButton, Collapse, meta } from '@betty/beam';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { groupState, type PermissionGroup } from './userDetail';
import { PermissionBox } from './PermissionBox';
import type { Linking } from './useLinking';

/** Header spine encodes group state (§6): full = quiet · partial = accent · none = dim. */
const spineFor: Record<'full' | 'partial' | 'none', { color: string; opacity: number }> = {
  full: { color: 'var(--beam-spine-default)', opacity: 1 },
  partial: { color: 'var(--mui-palette-primary-main)', opacity: 1 },
  none: { color: 'var(--beam-spine-default)', opacity: 0.3 },
};

interface PermissionSectionProps {
  group: PermissionGroup;
  mode: 'view' | 'edit';
  granted: Set<string>;
  provenance: Map<string, string[]>;
  onTogglePermission?: (permId: string) => void;
  onToggleGroup?: (permIds: string[], next: boolean) => void;
  linking: Linking;
}

export function PermissionSection({
  group,
  mode,
  granted,
  provenance,
  onTogglePermission,
  onToggleGroup,
  linking,
}: PermissionSectionProps) {
  const [open, setOpen] = useState(true);
  const { state, granted: g, total } = groupState(group, granted);
  const spine = spineFor[state];
  const ids = group.permissions.map((p) => p.id);

  return (
    // Section header is not a raised surface → exempt from the border rule (§1.3).
    <Box component="section">
      <Stack direction="row" alignItems="center" spacing={1} sx={{ py: 1 }}>
        <Box aria-hidden sx={{ flexShrink: 0, width: 3, height: 16, borderRadius: 1, bgcolor: spine.color, opacity: spine.opacity }} />
        <Typography component="h2" sx={{ ...meta }}>
          {group.name}
        </Typography>
        <Typography component="span" sx={{ ...meta, opacity: 0.7 }}>
          {g} / {total}
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        {mode === 'edit' && (
          <Checkbox
            size="small"
            checked={state === 'full'}
            indeterminate={state === 'partial'}
            onChange={() => onToggleGroup?.(ids, state !== 'full')}
            inputProps={{ 'aria-label': `Toggle all ${group.name} permissions` }}
            sx={{ p: 0.5 }}
          />
        )}
        <IconButton size="small" onClick={() => setOpen((o) => !o)} aria-label={open ? `Collapse ${group.name}` : `Expand ${group.name}`}>
          <ExpandMoreIcon fontSize="small" sx={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
        </IconButton>
      </Stack>
      <Divider />
      <Collapse in={open} timeout="auto">
        {/* Border = nature (§1): read-only view box is borderless (raised, calm);
            the edit checklist is bordered. */}
        <Paper variant={mode === 'edit' ? 'outlined' : 'elevation'} elevation={0} sx={{ p: 1, mt: 1 }}>
          <PermissionBox
            group={group}
            mode={mode}
            granted={granted}
            provenance={provenance}
            onTogglePermission={onTogglePermission}
            linking={linking}
          />
        </Paper>
      </Collapse>
    </Box>
  );
}
