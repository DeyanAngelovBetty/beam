import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stack,
  Button,
  BeamPage,
  TableFilters,
  useTableFilters,
  Table,
} from '@betty/beam';
import type { BeamColumn, BeamRowAction, TableFilterDefinition } from '@betty/beam';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import GroupIcon from '@mui/icons-material/Group';
import DeleteIcon from '@mui/icons-material/Delete';
import { ROLES, type Role } from './roles';
import { RouterIdentityLink } from './RouterIdentityLink';

/**
 * Roles — tier 3, like Users: the Name links to /roles/:id and a row click
 * navigates there. Single-row actions in a kebab rail (no bulk). Search is
 * submitted on the Filter button and lives in the URL (list §1).
 */
interface RoleFilters {
  q: string;
}
const ROLE_DEFS: TableFilterDefinition<RoleFilters>[] = [{ key: 'q', control: 'text', label: 'Search', placeholder: 'Search roles' }];

export function RolesPage() {
  const navigate = useNavigate();
  const filters = useTableFilters<RoleFilters>({ initialValues: { q: '' }, urlSync: true });
  const appliedQ = filters.applied.q;

  const rows = useMemo(() => {
    const q = appliedQ.trim().toLowerCase();
    if (!q) return ROLES;
    return ROLES.filter((r) => `${r.name} ${r.description}`.toLowerCase().includes(q));
  }, [appliedQ]);

  const columns: BeamColumn<Role>[] = [
    {
      key: 'name',
      header: 'Role',
      render: (r) => r.name,
      getValue: (r) => r.name,
      isIdentity: true,
      getHref: (r) => `${import.meta.env.BASE_URL}roles/${r.id}`,
    },
    { key: 'desc', header: 'Description', render: (r) => r.description },
    { key: 'users', header: 'Users', align: 'right', render: (r) => r.userCount, getValue: (r) => r.userCount, width: 110 },
    { key: 'created', header: 'Created', render: (r) => r.created, align: 'right', width: 130 },
  ];

  const rowActions = (r: Role): BeamRowAction[] => [
    { id: 'edit', label: 'Edit', icon: <EditIcon fontSize="small" />, onSelect: () => {} },
    { id: 'users', label: 'Users in Role', icon: <GroupIcon fontSize="small" />, onSelect: () => {} },
    {
      id: 'delete',
      label: 'Delete',
      icon: <DeleteIcon fontSize="small" />,
      onSelect: () => {},
      destructive: true,
    },
  ];

  return (
    <Stack spacing={3}>
      <BeamPage
        title="Roles"
        subtitle="Permission sets assigned to operators."
        action={
          <Button variant="contained" startIcon={<AddIcon />}>
            Add role
          </Button>
        }
      />

      <TableFilters definitions={ROLE_DEFS} controller={filters} />

      <Table
        columns={columns}
        rows={rows}
        getRowId={(r) => r.id}
        rowActions={rowActions}
        onRowClick={(r) => navigate(`/roles/${r.id}`)}
        LinkComponent={RouterIdentityLink}
        emptyMessage="No roles match this search."
        aria-label="Roles"
      />
    </Stack>
  );
}
