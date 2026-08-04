import { useState } from 'react';
import { Box, Stack, Typography, Checkbox, Button, Paper, meta } from '@betty/beam';
import { groupState, type PermissionGroup } from './userDetail';
import { roleColorById } from './RolesRail';
import type { Linking } from './useLinking';
import { ItemRow, ItemDot } from './ItemRow';
import { modeBorder } from './surfaceBorder';

/**
 * ItemBox — a titled box of ItemRows (detail-page §6). Header: group name in
 * the meta voice + a tri-state group checkbox (edit only). Body: view lists
 * granted rows only; edit is the full checklist. Collapse lives one level up,
 * in PageSection.
 */

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
 * and the "+n not granted" reveal. Superseded for now by the zero-granted-view
 * rule (a box with no granted rows renders nothing), but kept for the design
 * round that decides absence.
 * PARKED: not rendered today. Do not re-enable without the design.
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

/** Header spine encodes group state (§6): full = quiet · partial = accent · none = dim. */
const spineFor: Record<'full' | 'partial' | 'none', { color: string; opacity: number }> = {
  full: { color: 'var(--beam-spine-default)', opacity: 1 },
  partial: { color: 'var(--mui-palette-primary-main)', opacity: 1 },
  none: { color: 'var(--beam-spine-default)', opacity: 0.3 },
};

/**
 * The group-state header spine + "n / total" fraction.
 * PARKED: not rendered today; pending a design pass. Do not re-enable.
 * styling: pending design pass
 */
function ParkedHeaderExtras({ group, granted }: { group: PermissionGroup; granted: Set<string> }) {
  const { state, granted: g, total } = groupState(group, granted);
  const spine = spineFor[state];
  return (
    <>
      <Box aria-hidden sx={{ flexShrink: 0, width: 3, height: 16, borderRadius: 1, bgcolor: spine.color, opacity: spine.opacity }} />
      <Typography component="span" sx={{ ...meta, opacity: 0.7 }}>
        {g} / {total}
      </Typography>
    </>
  );
}

interface ItemBoxProps {
  group: PermissionGroup;
  mode: 'view' | 'edit';
  granted: Set<string>;
  provenance: Map<string, string[]>;
  onTogglePermission?: (permId: string) => void;
  onToggleGroup?: (permIds: string[], next: boolean) => void;
  linking: Linking;
}

export function ItemBox({ group, mode, granted, provenance, onTogglePermission, onToggleGroup, linking }: ItemBoxProps) {
  const { state } = groupState(group, granted);
  const ids = group.permissions.map((p) => p.id);
  const grantedPerms = group.permissions.filter((p) => granted.has(p.id));

  // Grammar revision (2026-07-27): a box with zero granted rows renders
  // nothing in view. Absence affordances stay parked (ParkedViewExtras).
  if (mode === 'view' && grantedPerms.length === 0) return null;

  const rows = mode === 'edit' ? group.permissions : grantedPerms;

  return (
    <Paper elevation={0} sx={{ overflow: 'hidden', ...modeBorder(mode === 'edit') }}>
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: 'center', p: 1, borderBottom: 1, borderColor: 'divider' }}
      >
        <Checkbox
          size="small"
          checked={state === 'full'}
          indeterminate={state === 'partial'}
          onChange={() => onToggleGroup?.(ids, state !== 'full')}
          inputProps={{ 'aria-label': `Toggle all ${group.name} permissions` }}
          sx={{ p: 0, visibility: mode === 'edit' ? 'visible' : 'hidden' }}
          disabled={mode !== 'edit'}
        />
        <Typography component="h3" sx={{ ...meta }}>
          {group.name}
        </Typography>
      </Stack>

      <Stack>
        {rows.map((p) => {
          const on = granted.has(p.id);
          const grantedBy = provenance.get(p.id) ?? [];
          return (
            <ItemRow
              key={p.id}
              linkKind="permission"
              linkId={p.id}
              // Permission rows are dimming targets only — no linking handlers,
              // and no tabIndex (a11y: a focus stop that fires nothing is an
              // anti-pattern; edit rows are already reachable via the checkbox).
              dimmed={linking.permissionDimmed(grantedBy)}
              marker={
                mode === 'edit' ? (
                  <Checkbox
                    size="small"
                    checked={on}
                    onChange={() => onTogglePermission?.(p.id)}
                    inputProps={{ 'aria-label': p.label }}
                    sx={{ p: 0 }}
                  />
                ) : (
                  <ItemDot />
                )
              }
              label={
                <Typography variant="body2" sx={{ color: mode === 'edit' && !on ? 'text.disabled' : 'text.primary' }}>
                  {p.label}
                </Typography>
              }
            />
          );
        })}
      </Stack>
    </Paper>
  );
}
