import { useParams, useNavigate } from 'react-router-dom';
import { Stack, BeamPageHeader } from '@betty/beam';
import { ROLES } from './roles';
import { backTo } from './backTo';

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
        back={backTo(navigate, '/roles', 'Roles')}
        description={role ? role.description : 'Unknown role'}
      />
    </Stack>
  );
}
