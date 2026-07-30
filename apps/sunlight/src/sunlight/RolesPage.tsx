import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Stack,
  Button,
  BeamPageHeader,
  BeamFilterBar,
  BeamDataTable,
} from '@betty/beam';
import type { BeamColumn, BeamRowAction } from '@betty/beam';
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
export function RolesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const appliedQ = searchParams.get('q') ?? '';
  const [draftQ, setDraftQ] = useState(appliedQ);

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
      <BeamPageHeader
        title="Roles"
        description="Permission sets assigned to operators."
        action={
          <Button variant="contained" startIcon={<AddIcon />}>
            Add role
          </Button>
        }
      />

      <BeamFilterBar
        aria-label="Role filters"
        searchValue={draftQ}
        onSearchChange={setDraftQ}
        searchPlaceholder="Search roles"
        applied={appliedQ !== ''}
        onFilter={() => setSearchParams(draftQ.trim() ? { q: draftQ.trim() } : {})}
        onClearAll={() => {
          setDraftQ('');
          setSearchParams({});
        }}
      >
        {null}
      </BeamFilterBar>

      <BeamDataTable
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
