import { useParams, useNavigate } from 'react-router-dom';
import { Stack, Button, BeamPageHeader } from '@betty/beam';
import { USERS } from './users';

/**
 * User deep page — STUB (commit 1 plumbing). The real view/edit page lands
 * in commit 3; this just proves the route resolves a record and back-nav
 * works.
 */
export function UserPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = USERS.find((u) => u.id === id);

  return (
    <Stack spacing={3}>
      <BeamPageHeader
        title={user ? user.name : `User ${id}`}
        description={user ? user.email : 'Unknown user'}
        secondaryActions={
          <Button variant="text" onClick={() => navigate('/users')}>
            ← Users
          </Button>
        }
      />
    </Stack>
  );
}
