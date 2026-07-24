import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import { RouterIdentityLink } from './RouterIdentityLink';

/**
 * Users — a back-office admin list, assembled from Beam pieces.
 *
 * Tier 3: the Name is a true link to /users/:id, and a row click navigates
 * to the same place. Active is the one permitted inline cell control
 * (grammar §3). Filters are submitted on the Filter button and live in the
 * URL, so a filtered view is shareable and survives refresh (list §1).
 */

interface Applied {
  q: string;
  active: 'any' | 'active' | 'inactive';
  perm: string;
}

const EMPTY: Applied = { q: '', active: 'any', perm: 'any' };

/** Applied filters -> URL query, omitting defaults so the URL stays clean. */
function toParams(d: Applied): URLSearchParams {
  const p = new URLSearchParams();
  if (d.q.trim()) p.set('q', d.q.trim());
  if (d.active !== 'any') p.set('active', d.active);
  if (d.perm !== 'any') p.set('perm', d.perm);
  return p;
}

export function UsersPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Applied filters are read from the URL (the shareable, refresh-proof
  // source of truth); the draft is local until the Filter button submits it.
  const activeParam = searchParams.get('active');
  const applied: Applied = {
    q: searchParams.get('q') ?? '',
    active: activeParam === 'active' || activeParam === 'inactive' ? activeParam : 'any',
    perm: searchParams.get('perm') ?? 'any',
  };
  const [draft, setDraft] = useState<Applied>(applied);
  const [activeOverrides, setActiveOverrides] = useState<Record<string, boolean>>({});

  const rows = useMemo(() => {
    const q = applied.q.trim().toLowerCase();
    return USERS.filter((u) => {
      if (q && !`${u.name} ${u.email}`.toLowerCase().includes(q)) return false;
      if (applied.active !== 'any' && u.active !== (applied.active === 'active')) return false;
      if (applied.perm !== 'any' && u.effectivePermission !== applied.perm) return false;
      return true;
    });
  }, [applied.q, applied.active, applied.perm]);

  const isApplied = applied.q !== '' || applied.active !== 'any' || applied.perm !== 'any';

  const columns: BeamColumn<User>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (u) => u.name,
      getValue: (u) => u.name,
      isIdentity: true,
      getHref: (u) => `${import.meta.env.BASE_URL}users/${u.id}`,
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
            // Inline control — must not trigger the row's navigate-to-detail.
            onClick={(e) => e.stopPropagation()}
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
        onFilter={() => setSearchParams(toParams(draft))}
        onClearAll={() => {
          setDraft(EMPTY);
          setSearchParams({});
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
        onRowClick={(u) => navigate(`/users/${u.id}`)}
        LinkComponent={RouterIdentityLink}
        paginated
        emptyMessage="No users match these filters."
        aria-label="Users"
      />
    </Stack>
  );
}
