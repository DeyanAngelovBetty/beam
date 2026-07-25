import { useState } from 'react';
import { Box, Stack, Typography, Checkbox, Button } from '@betty/beam';
import type { PermissionGroup } from './userDetail';
import { roleColorById } from './RolesRail';
import type { Linking } from './useLinking';
import { ItemRow, ItemDot } from './ItemRow';

/**
 * One provenance tick per granting role — the static "why does he have this".
 * PARKED: not rendered today; the view marker is a plain dot pending a design
 * pass. Do not re-enable without the design.
 * styling: pending design pass
 */
export function ProvenanceTicks({ roleIds }: { roleIds: string[] }) {
  return (
    <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }} aria-hidden>
      {roleIds.map((roleId) => (
        <Box
          key={roleId}
          sx={{ width: 3, height: 14, borderRadius: 1, bgcolor: roleColorById(roleId) }}
        />
      ))}
    </Stack>
  );
}

/**
 * The granted-only view's absence affordances: the "None granted." empty state
 * and the "+n not granted" reveal.
 * PARKED: not rendered today; pending a design pass. Do not re-enable without
 * the design.
 * styling: pending design pass
 */
function ParkedViewExtras({ group, granted }: { group: PermissionGroup; granted: Set<string> }) {
  const [revealed, setRevealed] = useState(false);
  const grantedPerms = group.permissions.filter((p) => granted.has(p.id));
  const ungranted = group.permissions.filter((p) => !granted.has(p.id));

  return (
    <>
      {grantedPerms.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ px: 1, py: 0.75 }}>
          None granted.
        </Typography>
      )}
      {ungranted.length > 0 && (
        <Box sx={{ px: 0.5, pt: 0.5 }}>
          <Button size="small" variant="text" color="inherit" onClick={() => setRevealed((r) => !r)}>
            {revealed ? 'Hide' : `+${ungranted.length} not granted`}
          </Button>
          {revealed && (
            <Stack sx={{ pl: 1 }}>
              {ungranted.map((p) => (
                <Typography key={p.id} variant="body2" sx={{ color: 'text.disabled', px: 1, py: 0.5 }}>
                  {p.label}
                </Typography>
              ))}
            </Stack>
          )}
        </Box>
      )}
    </>
  );
}

interface PermissionBoxProps {
  group: PermissionGroup;
  mode: 'view' | 'edit';
  granted: Set<string>;
  provenance: Map<string, string[]>;
  onTogglePermission?: (permId: string) => void;
  linking: Linking;
}

const permissionBoxSx = {
  p: 0,
  // border: '1px solid lime'
};

export function PermissionBox({ group, mode, granted, provenance, onTogglePermission, linking }: PermissionBoxProps) {
  if (mode === 'edit') {
    return (
      <Stack sx={{ ...permissionBoxSx }}>
        {group.permissions.map((p) => {
          const on = granted.has(p.id);
          const grantedBy = provenance.get(p.id) ?? [];
          return (
            <ItemRow
              key={p.id}
              linkKind="permission"
              linkId={p.id}
              handlers={linking.permissionProps(p.id, grantedBy)}
              dimmed={linking.permissionDimmed(p.id, grantedBy)}
              align="start"
              marker={
                <Checkbox
                  size="small"
                  checked={on}
                  onChange={() => onTogglePermission?.(p.id)}
                  inputProps={{ 'aria-label': p.label }}
                  sx={{ p: 0 }}
                />
              }
              label={
                <Typography variant="body2" sx={{ color: on ? 'text.primary' : 'text.disabled' }}>
                  {p.label}
                </Typography>
              }
            />
          );
        })}
      </Stack>
    );
  }

  // View: granted only, quiet; absences behind a reveal (parked, see above).
  const grantedPerms = group.permissions.filter((p) => granted.has(p.id));

  return (
    <Stack>
      {grantedPerms.map((p) => {
        const grantedBy = provenance.get(p.id) ?? [];
        return (
          <ItemRow
            key={p.id}
            linkKind="permission"
            linkId={p.id}
            handlers={linking.permissionProps(p.id, grantedBy)}
            dimmed={linking.permissionDimmed(p.id, grantedBy)}
            tabIndex={0}
            marker={<ItemDot />}
            label={<Typography variant="body2">{p.label}</Typography>}
          />
        );
      })}
    </Stack>
  );
}
