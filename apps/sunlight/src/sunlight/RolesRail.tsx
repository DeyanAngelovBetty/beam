import { Box, Paper, Stack, Typography, Checkbox, meta, roleColor } from '@betty/beam';
import { ROLE_DEFS, ROLE_BY_ID } from './userDetail';
import type { Linking } from './useLinking';

/** A small role-color bar — the spine motif at its smallest (detail-page §5). */
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
    // Border = nature (§1): read-only list is borderless; the edit checklist is bordered.
    <Paper variant={mode === 'edit' ? 'outlined' : 'elevation'} elevation={mode === 'edit' ? 0 : 1} sx={{ p: 2 }}>
      <Typography component="h2" sx={{ ...meta, mb: 1.5 }}>
        Roles
      </Typography>
      <Stack spacing={0.5}>
        {roles.map((role) => {
          const isAssigned = assigned.has(role.id);
          const dimmed = linking.roleDimmed(role.id) || (mode === 'edit' && !isAssigned);
          const props = linking.roleProps(role.id);
          const row = (
            <Stack
              key={role.id}
              direction="row"
              alignItems="center"
              spacing={1}
              data-role-id={role.id}
              tabIndex={mode === 'view' ? 0 : undefined}
              onMouseEnter={props.onMouseEnter}
              onMouseLeave={props.onMouseLeave}
              onFocus={props.onFocus}
              onBlur={props.onBlur}
              sx={{
                px: 1,
                py: 0.5,
                borderRadius: 1,
                cursor: mode === 'view' ? 'default' : 'pointer',
                opacity: dimmed ? 0.35 : 1,
                transition: 'opacity 120ms',
                outlineOffset: 2,
              }}
              onClick={mode === 'edit' ? () => onToggle?.(role.id) : undefined}
            >
              {mode === 'edit' && (
                <Checkbox
                  size="small"
                  checked={isAssigned}
                  onChange={() => onToggle?.(role.id)}
                  onClick={(e) => e.stopPropagation()}
                  inputProps={{ 'aria-label': `Assign role ${role.name}` }}
                  sx={{ p: 0.5 }}
                />
              )}
              <RoleTick colorIndex={role.colorIndex} />
              <Typography variant="body2">{role.name}</Typography>
            </Stack>
          );
          return row;
        })}
        {mode === 'view' && roles.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No roles assigned.
          </Typography>
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
