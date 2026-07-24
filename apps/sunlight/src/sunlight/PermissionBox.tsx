import { useState } from 'react';
import { Box, Stack, Typography, Checkbox, Button } from '@betty/beam';
import type { PermissionGroup } from './userDetail';
import { roleColorById } from './RolesRail';
import type { Linking } from './useLinking';

/** One provenance tick per granting role — the static "why does he have this". */
function ProvenanceTicks({ roleIds }: { roleIds: string[] }) {
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

interface PermissionBoxProps {
  group: PermissionGroup;
  mode: 'view' | 'edit';
  granted: Set<string>;
  provenance: Map<string, string[]>;
  onTogglePermission?: (permId: string) => void;
  linking: Linking;
}

const rowSx = {
  px: 1,
  py: 0.75,
  borderRadius: 1,
  transition: 'opacity 120ms',
  // Row separators use the existing tableBorder (via divider) — the quieter
  // variant is queued (grammar §1); do not hardcode a toned rgba.
  '&:not(:last-of-type)': { borderBottom: 1, borderColor: 'divider' },
};

export function PermissionBox({ group, mode, granted, provenance, onTogglePermission, linking }: PermissionBoxProps) {
  const [revealed, setRevealed] = useState(false);

  if (mode === 'edit') {
    return (
      <Stack>
        {group.permissions.map((p) => {
          const on = granted.has(p.id);
          const grantedBy = provenance.get(p.id) ?? [];
          const lp = linking.permissionProps(p.id, grantedBy);
          return (
            <Stack
              key={p.id}
              direction="row"
              alignItems="center"
              spacing={1}
              data-permission-id={p.id}
              onMouseEnter={lp.onMouseEnter}
              onMouseLeave={lp.onMouseLeave}
              sx={{ ...rowSx, opacity: linking.permissionDimmed(p.id, grantedBy) ? 0.35 : 1 }}
            >
              <Checkbox
                size="small"
                checked={on}
                onChange={() => onTogglePermission?.(p.id)}
                onFocus={lp.onFocus}
                onBlur={lp.onBlur}
                inputProps={{ 'aria-label': p.label }}
                sx={{ p: 0.5 }}
              />
              <Typography variant="body2" sx={{ color: on ? 'text.primary' : 'text.disabled' }}>
                {p.label}
              </Typography>
            </Stack>
          );
        })}
      </Stack>
    );
  }

  // View: granted only, quiet; absences behind a reveal.
  const grantedPerms = group.permissions.filter((p) => granted.has(p.id));
  const ungranted = group.permissions.filter((p) => !granted.has(p.id));

  return (
    <Stack>
      {grantedPerms.map((p) => {
        const grantedBy = provenance.get(p.id) ?? [];
        const lp = linking.permissionProps(p.id, grantedBy);
        return (
          <Stack
            key={p.id}
            direction="row"
            alignItems="center"
            spacing={1}
            data-permission-id={p.id}
            tabIndex={0}
            onMouseEnter={lp.onMouseEnter}
            onMouseLeave={lp.onMouseLeave}
            onFocus={lp.onFocus}
            onBlur={lp.onBlur}
            sx={{ ...rowSx, outlineOffset: -2, opacity: linking.permissionDimmed(p.id, grantedBy) ? 0.35 : 1 }}
          >
            <ProvenanceTicks roleIds={grantedBy} />
            <Typography variant="body2">{p.label}</Typography>
          </Stack>
        );
      })}
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
    </Stack>
  );
}
