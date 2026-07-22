import { useMemo, useState } from 'react';
import {
  Stack,
  Button,
  BeamPageHeader,
  BeamFilterBar,
  BeamDataTable,
} from '@betty/beam';
import type { BeamColumn, BeamRowMenuItem } from '@betty/beam';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import GroupIcon from '@mui/icons-material/Group';
import DeleteIcon from '@mui/icons-material/Delete';
import { ROLES, type Role } from './roles';

/**
 * Roles — assembled like Users, but with single-row actions in a kebab rail
 * (no bulk). Name is the first column after the rail and a true link to the
 * role's page (built later). Search is submitted on the Filter button.
 */
export function RolesPage() {
  const [draftQ, setDraftQ] = useState('');
  const [appliedQ, setAppliedQ] = useState('');

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
      getHref: (r) => `#/roles/${r.id}`,
    },
    { key: 'desc', header: 'Description', render: (r) => r.description },
    { key: 'users', header: 'Users', align: 'right', render: (r) => r.userCount, getValue: (r) => r.userCount, width: 110 },
    { key: 'created', header: 'Created', render: (r) => r.created, align: 'right', width: 130 },
  ];

  const rowMenu = (r: Role): BeamRowMenuItem[] => [
    { id: 'edit', label: 'Edit', icon: <EditIcon fontSize="small" />, onClick: () => {} },
    { id: 'users', label: 'Users in Role', icon: <GroupIcon fontSize="small" />, onClick: () => {} },
    {
      id: 'delete',
      label: 'Delete',
      icon: <DeleteIcon fontSize="small" />,
      onClick: () => {},
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
        onFilter={() => setAppliedQ(draftQ)}
        onClearAll={() => {
          setDraftQ('');
          setAppliedQ('');
        }}
      >
        {null}
      </BeamFilterBar>

      <BeamDataTable
        columns={columns}
        rows={rows}
        getRowId={(r) => r.id}
        rowMenu={rowMenu}
        emptyMessage="No roles match this search."
        aria-label="Roles"
      />
    </Stack>
  );
}
