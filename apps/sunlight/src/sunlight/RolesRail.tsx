import { Box, Paper, Stack, Typography, Checkbox, meta, roleColor } from '@betty/beam';
import { ROLE_DEFS, ROLE_BY_ID } from './userDetail';
import type { Linking } from './useLinking';
import { ItemRow, ItemDot } from './ItemRow';
import { modeBorder } from './surfaceBorder';

/**
 * A small role-color bar — the spine motif at its smallest (detail-page §5).
 * PARKED: not rendered today; the view marker is a plain dot pending a design
 * pass. Do not re-enable without the design.
 * styling: pending design pass
 */
function RoleTick({ colorIndex }: { colorIndex: number }) {
  return (
    <Box
      aria-hidden
      sx={{ flexShrink: 0, width: 3, height: 16, borderRadius: 1, bgcolor: roleColor(colorIndex) }}
    />
  );
}

interface RolesRailProps {
  mode: 'view' | 'edit';
  assignedIds: string[];
  onToggle?: (roleId: string) => void;
  linking: Linking;
}

export function RolesRail({ mode, assignedIds, onToggle, linking }: RolesRailProps) {
  const assigned = new Set(assignedIds);
  // View lists assigned roles only; edit shows the full catalog.
  const roles = mode === 'view' ? ROLE_DEFS.filter((r) => assigned.has(r.id)) : ROLE_DEFS;

  return (
    // Border = nature (§1): constant border, visible only in the interactive
    // (edit) mode; view keeps its raised elevation. Border presence is constant
    // geometry (no view↔edit jump); visibility is the mode signal.
    <Paper elevation={mode === 'edit' ? 0 : 1} sx={{ ...modeBorder(mode === 'edit') }}>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{
          px: 1,
          py: 0.5,
          pl: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
          minHeight: 38,
        }}
      >
        <Typography component="h2" sx={{ ...meta }}>
          Roles
        </Typography>
      </Stack>

      <Stack spacing={0.5}>
        {roles.map((role) => {
          const isAssigned = assigned.has(role.id);
          const dimmed = linking.roleDimmed(role.id) || (mode === 'edit' && !isAssigned);
          return (
            <ItemRow
              key={role.id}
              linkKind="role"
              linkId={role.id}
              handlers={linking.roleProps(role.id)}
              dimmed={dimmed}
              rounded
              cursor={mode === 'view' ? 'default' : 'pointer'}
              tabIndex={mode === 'view' ? 0 : undefined}
              onClick={mode === 'edit' ? () => onToggle?.(role.id) : undefined}
              marker={
                mode === 'edit' ? (
                  <Checkbox
                    size="small"
                    checked={isAssigned}
                    onChange={() => onToggle?.(role.id)}
                    onClick={(e) => e.stopPropagation()}
                    inputProps={{ 'aria-label': `Assign role ${role.name}` }}
                    sx={{ p: 0 }}
                  />
                ) : (
                  <ItemDot />
                )
              }
              label={<Typography variant="body2">{role.name}</Typography>}
            />
          );
        })}
        {mode === 'view' && roles.length === 0 && (
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="body2" color="text.secondary">
              No roles assigned.
            </Typography>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}

/** Reads a role's ramp color by id — for provenance ticks elsewhere. */
export function roleColorById(roleId: string): string {
  const role = ROLE_BY_ID.get(roleId);
  return role ? roleColor(role.colorIndex) : 'transparent';
}
