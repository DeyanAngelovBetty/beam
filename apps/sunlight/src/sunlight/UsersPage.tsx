import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stack,
  Button,
  Switch,
  BeamPage,
  TableFilters,
  useTableFilters,
  Table,
} from '@betty/beam';
import type { BeamColumn, TableFilterDefinition } from '@betty/beam';
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
const USER_DEFS: TableFilterDefinition<Applied>[] = [
  { key: 'q', control: 'text', label: 'Search', placeholder: 'Search name or email' },
  { key: 'active', control: 'select', label: 'Active', options: [{ label: 'Any', value: 'any' }, { label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }] },
  { key: 'perm', control: 'select', label: 'Effective permission', options: [{ label: 'Any', value: 'any' }, ...PERMISSION_OPTIONS.map((p) => ({ label: p, value: p }))] },
];

export function UsersPage() {
  const navigate = useNavigate();
  // Applied filters + URL sync are owned by useTableFilters (shareable, refresh-proof).
  const filters = useTableFilters<Applied>({ initialValues: EMPTY, urlSync: true });
  const applied = filters.applied;
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
            slotProps={{ input: { 'aria-label': `Active — ${u.name}` } }}
          />
        );
      },
    },
    { key: 'created', header: 'Created', render: (u) => u.created, align: 'right', width: 130 },
  ];

  return (
    <Stack spacing={3}>
      <BeamPage
        title="Users"
        subtitle="Operators with back-office access."
        action={
          <Button variant="contained" startIcon={<AddIcon />}>
            Add user
          </Button>
        }
      />

      <TableFilters definitions={USER_DEFS} controller={filters} />

      <Table
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
