import { useState } from 'react';
import { Box, Stack, Typography, Checkbox, IconButton, Collapse, meta } from '@betty/beam';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { sectionState, sectionPermissionIds, type PermissionSectionDef } from './userDetail';
import { ItemBox } from './ItemBox';
import type { Linking } from './useLinking';

/**
 * A/B TOGGLE — layout craft question (detail-page §7). false = standard CSS
 * grid, aligned rows (aids comparison-scanning). true = grid-lanes masonry, a
 * progressive enhancement inert until browsers ship `grid-lanes` (same posture
 * as squircle). NEVER the columns hack. Flip and rebuild to A/B live.
 */
const MASONRY = false;

interface PageSectionProps {
  section: PermissionSectionDef;
  mode: 'view' | 'edit';
  granted: Set<string>;
  provenance: Map<string, string[]>;
  onTogglePermission?: (permId: string) => void;
  /** Reused for both the section-level select-all and each box's group checkbox. */
  onToggleGroup?: (permIds: string[], next: boolean) => void;
  linking: Linking;
  /** Starts collapsed when false. Defaults open; the page never sets it. */
  defaultOpen?: boolean;
}

export function PageSection({
  section,
  mode,
  granted,
  provenance,
  onTogglePermission,
  onToggleGroup,
  linking,
  defaultOpen = true,
}: PageSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const { state } = sectionState(section, granted);
  const allIds = sectionPermissionIds(section);

  return (
    // Section header is not a raised surface → exempt from the border rule (§1.3).
    <Box component="section">
      <Stack direction="row" alignItems="center" spacing={1} sx={{ pl: 1, py: 0.5 }}>
        {/* Select/unselect ALL permissions in ALL of this section's boxes.
            Hidden-but-space-preserved in view, like the box checkbox. */}
        <Checkbox
          size="small"
          checked={state === 'full'}
          indeterminate={state === 'partial'}
          onChange={() => onToggleGroup?.(allIds, state !== 'full')}
          inputProps={{ 'aria-label': `Toggle all ${section.name} permissions` }}
          sx={{ p: 0, visibility: mode === 'edit' ? 'visible' : 'hidden' }}
          disabled={mode !== 'edit'}
        />
        <Typography component="h2" sx={{ ...meta, flexShrink: 0 }}>
          {section.name}
        </Typography>
        <IconButton
          size="small"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? `Collapse ${section.name}` : `Expand ${section.name}`}
        >
          <ExpandMoreIcon fontSize="small" sx={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
        </IconButton>
        {/* Rule bleeds to the right edge of the row. */}
        <Box sx={{ flexGrow: 1, borderTop: 1, borderColor: 'divider' }} />
      </Stack>

      <Collapse in={open} timeout="auto">
        <Box
          sx={{
            mt: 1,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' },
            gap: 2,
            alignItems: 'start',
            // Progressive masonry (detail-page §7) — inert until `grid-lanes`
            // ships; base aligned-rows grid is the fallback. Never columns.
            ...(MASONRY
              ? {
                  '@supports (display: grid-lanes)': {
                    display: 'grid-lanes',
                    gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' },
                  },
                }
              : {}),
          }}
        >
          {section.groups.map((group) => (
            <ItemBox
              key={group.id}
              group={group}
              mode={mode}
              granted={granted}
              provenance={provenance}
              onTogglePermission={onTogglePermission}
              onToggleGroup={onToggleGroup}
              linking={linking}
            />
          ))}
        </Box>
      </Collapse>
    </Box>
  );
}
