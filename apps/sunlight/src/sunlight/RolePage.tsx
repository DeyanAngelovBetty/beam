import { useParams, useNavigate } from 'react-router-dom';
import { Stack, Button, BeamPageHeader } from '@betty/beam';
import { ROLES } from './roles';

/**
 * Role deep page — STUB. The permission matrix is a later design round
 * (detail-page-grammar §8, open questions). Proves the route resolves.
 */
export function RolePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const role = ROLES.find((r) => r.id === id);

  return (
    <Stack spacing={3}>
      <BeamPageHeader
        title={role ? role.name : `Role ${id}`}
        description={role ? role.description : 'Unknown role'}
        secondaryActions={
          <Button variant="text" onClick={() => navigate('/roles')}>
            ← Roles
          </Button>
        }
      />
    </Stack>
  );
}
