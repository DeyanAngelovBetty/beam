import { useMemo, useState } from 'react';
import {
  Stack,
  Button,
  Switch,
  TextField,
  MenuItem,
  BeamPageHeader,
  BeamFilterBar,
  BeamDataTable,
} from '@betty/beam';
import type { BeamColumn } from '@betty/beam';
import AddIcon from '@mui/icons-material/Add';
import { USERS, PERMISSION_OPTIONS, type User } from './users';

/**
 * Users — a back-office admin list, assembled from Beam pieces.
 *
 * Per the list-page grammar, tuned for this page: no row-controls rail; the
 * Name is the first column and a true link to the user's page (built later).
 * Active is the one permitted inline cell control (grammar §3). Filters are
 * submitted — applied on the Filter button, matching the 274-row list.
 */

interface Applied {
  q: string;
  active: 'any' | 'active' | 'inactive';
  perm: string;
}

const EMPTY: Applied = { q: '', active: 'any', perm: 'any' };

export function UsersPage() {
  const [draft, setDraft] = useState<Applied>(EMPTY);
  const [applied, setApplied] = useState<Applied>(EMPTY);
  const [activeOverrides, setActiveOverrides] = useState<Record<string, boolean>>({});

  const rows = useMemo(() => {
    const q = applied.q.trim().toLowerCase();
    return USERS.filter((u) => {
      if (q && !`${u.name} ${u.email}`.toLowerCase().includes(q)) return false;
      if (applied.active !== 'any' && u.active !== (applied.active === 'active')) return false;
      if (applied.perm !== 'any' && u.effectivePermission !== applied.perm) return false;
      return true;
    });
  }, [applied]);

  const isApplied = applied.q !== '' || applied.active !== 'any' || applied.perm !== 'any';

  const columns: BeamColumn<User>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (u) => u.name,
      getValue: (u) => u.name,
      isIdentity: true,
      getHref: (u) => `#/users/${u.id}`,
    },
    { key: 'email', header: 'Email', render: (u) => u.email, getValue: (u) => u.email },
    { key: 'role', header: 'Role', render: (u) => u.role, getValue: (u) => u.role, width: 200 },
    {
      key: 'perm',
      header: 'Effective permission',
      render: (u) => u.effectivePermission,
      width: 190,
    },
    {
      key: 'active',
      header: 'Active',
      align: 'center',
      width: 100,
      // The one permitted inline cell control — a field of the record, with
      // an aria-label. Not a row action (grammar §3).
      render: (u) => {
        const on = activeOverrides[u.id] ?? u.active;
        return (
          <Switch
            size="small"
            checked={on}
            onChange={(e) =>
              setActiveOverrides((o) => ({ ...o, [u.id]: e.target.checked }))
            }
            inputProps={{ 'aria-label': `Active — ${u.name}` }}
          />
        );
      },
    },
    { key: 'created', header: 'Created', render: (u) => u.created, align: 'right', width: 130 },
  ];

  return (
    <Stack spacing={3}>
      <BeamPageHeader
        title="Users"
        description="Operators with back-office access."
        action={
          <Button variant="contained" startIcon={<AddIcon />}>
            Add user
          </Button>
        }
      />

      <BeamFilterBar
        aria-label="User filters"
        searchValue={draft.q}
        onSearchChange={(q) => setDraft((d) => ({ ...d, q }))}
        searchPlaceholder="Search name or email"
        applied={isApplied}
        onFilter={() => setApplied(draft)}
        onClearAll={() => {
          setDraft(EMPTY);
          setApplied(EMPTY);
        }}
      >
        <TextField
          label="Active"
          size="small"
          select
          fullWidth
          value={draft.active}
          onChange={(e) => setDraft((d) => ({ ...d, active: e.target.value as Applied['active'] }))}
        >
          <MenuItem value="any">Any</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="inactive">Inactive</MenuItem>
        </TextField>
        <TextField
          label="Effective permission"
          size="small"
          select
          fullWidth
          value={draft.perm}
          onChange={(e) => setDraft((d) => ({ ...d, perm: e.target.value }))}
        >
          <MenuItem value="any">Any</MenuItem>
          {PERMISSION_OPTIONS.map((p) => (
            <MenuItem key={p} value={p}>
              {p}
            </MenuItem>
          ))}
        </TextField>
      </BeamFilterBar>

      <BeamDataTable
        columns={columns}
        rows={rows}
        getRowId={(u) => u.id}
        paginated
        emptyMessage="No users match these filters."
        aria-label="Users"
      />
    </Stack>
  );
}
