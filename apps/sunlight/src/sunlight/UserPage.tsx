import { useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useBlocker } from 'react-router-dom';
import {
  Stack,
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  BeamPageHeader,
  BeamStat,
  BeamEmptyState,
} from '@betty/beam';
import {
  SECTIONS,
  ROLE_BY_ID,
  getUserDetail,
  effectiveGrants,
  provenanceFor,
  saveUserEdit,
} from './userDetail';
import { RolesRail } from './RolesRail';
import { PageSection } from './PageSection';
import { useLinking } from './useLinking';
import { modeBorder } from './surfaceBorder';

const STATS_GRID = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
  gap: 2,
} as const;

interface Working {
  name: string;
  email: string;
  description: string;
  roleIds: string[];
  grants: Set<string>;
}

const sameSet = (a: Iterable<string>, b: Iterable<string>) => {
  const sa = new Set(a);
  const sb = new Set(b);
  return sa.size === sb.size && [...sa].every((x) => sb.has(x));
};

export function UserPage({ edit = false }: { edit?: boolean }) {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const detail = getUserDetail(id);
  const linking = useLinking();

  if (!detail) {
    return (
      <Stack spacing={3}>
        <BeamPageHeader
          title="User not found"
          secondaryActions={
            <Button variant="text" onClick={() => navigate('/users')}>
              ← Users
            </Button>
          }
        />
        <BeamEmptyState title={`No user with id ${id}`} description="It may have been removed." />
      </Stack>
    );
  }

  const viewPath = `/users/${id}`;
  const editPath = `/users/${id}/edit`;
  const breadcrumb = (
    <Link
      href={`${import.meta.env.BASE_URL}users`}
      underline="hover"
      color="text.secondary"
      variant="body2"
      onClick={(e) => {
        e.preventDefault();
        navigate('/users');
      }}
    >
      ← Users
    </Link>
  );

  return edit ? (
    <UserEdit detail={detail} viewPath={viewPath} breadcrumb={breadcrumb} linking={linking} />
  ) : (
    <UserView detail={detail} editPath={editPath} breadcrumb={breadcrumb} linking={linking} />
  );
}

// ---- View mode ----

function UserView({
  detail,
  editPath,
  breadcrumb,
  linking,
}: {
  detail: NonNullable<ReturnType<typeof getUserDetail>>;
  editPath: string;
  breadcrumb: React.ReactNode;
  linking: ReturnType<typeof useLinking>;
}) {
  const navigate = useNavigate();
  const granted = effectiveGrants(detail.id, detail.roleIds);
  const provenance = provenanceFor(detail.roleIds);

  return (
    <Stack spacing={2}>
      {breadcrumb}
      <BeamPageHeader
        title={detail.name}
        description={detail.email}
        action={
          <Button variant="contained" onClick={() => navigate(editPath)}>
            Edit
          </Button>
        }
      />

      {/* Stats block: raised + read-only → border present but transparent
          (§1, constant-geometry clause), so view↔edit doesn't jump. */}
      <Paper elevation={0} sx={{ p: 2, ...modeBorder(false) }}>
        <Box sx={STATS_GRID}>
          <BeamStat label="Name" value={detail.name} />
          <BeamStat label="Email" value={detail.email} />
          <BeamStat label="Description" value={detail.description} />
        </Box>
      </Paper>

      <RolesPermissionsLayout
        rail={<RolesRail mode="view" assignedIds={detail.roleIds} linking={linking} />}
        sections={SECTIONS.map((section) => (
          <PageSection
            key={section.id}
            section={section}
            mode="view"
            granted={granted}
            provenance={provenance}
            linking={linking}
          />
        ))}
      />
    </Stack>
  );
}

// ---- Edit mode ----

function UserEdit({
  detail,
  viewPath,
  breadcrumb,
  linking,
}: {
  detail: NonNullable<ReturnType<typeof getUserDetail>>;
  viewPath: string;
  breadcrumb: React.ReactNode;
  linking: ReturnType<typeof useLinking>;
}) {
  const navigate = useNavigate();

  const original = useMemo(
    () => ({
      name: detail.name,
      email: detail.email,
      description: detail.description,
      roleIds: detail.roleIds,
      grants: effectiveGrants(detail.id, detail.roleIds),
    }),
    [detail]
  );

  const [working, setWorking] = useState<Working>(() => ({
    name: original.name,
    email: original.email,
    description: original.description,
    roleIds: [...original.roleIds],
    grants: new Set(original.grants),
  }));
  // Read live by the blocker: Save flips it synchronously before navigate(),
  // so the save's own navigation isn't blocked (state wouldn't apply in time).
  const savingRef = useRef(false);

  const isDirty =
    working.name !== original.name ||
    working.email !== original.email ||
    working.description !== original.description ||
    !sameSet(working.roleIds, original.roleIds) ||
    !sameSet(working.grants, original.grants);

  // Guard route-away (breadcrumb, nav, Cancel) while there are unsaved changes.
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && !savingRef.current && currentLocation.pathname !== nextLocation.pathname
  );

  const provenance = provenanceFor(working.roleIds);

  const toggleRole = (roleId: string) =>
    setWorking((w) => {
      const roleIds = new Set(w.roleIds);
      const role = ROLE_BY_ID.get(roleId);
      if (!role) return w;
      const grants = new Set(w.grants);
      if (roleIds.has(roleId)) {
        roleIds.delete(roleId);
        const remaining = [...roleIds];
        for (const p of role.grants) {
          const stillGranted = remaining.some((rid) => ROLE_BY_ID.get(rid)?.grants.includes(p));
          if (!stillGranted) grants.delete(p);
        }
      } else {
        roleIds.add(roleId);
        for (const p of role.grants) grants.add(p);
      }
      return { ...w, roleIds: [...roleIds], grants };
    });

  const togglePermission = (permId: string) =>
    setWorking((w) => {
      const grants = new Set(w.grants);
      if (grants.has(permId)) grants.delete(permId);
      else grants.add(permId);
      return { ...w, grants };
    });

  const toggleGroup = (permIds: string[], next: boolean) =>
    setWorking((w) => {
      const grants = new Set(w.grants);
      for (const p of permIds) {
        if (next) grants.add(p);
        else grants.delete(p);
      }
      return { ...w, grants };
    });

  const save = () => {
    savingRef.current = true; // stop the blocker before we navigate
    saveUserEdit(detail.id, {
      name: working.name,
      email: working.email,
      description: working.description,
      roleIds: working.roleIds,
      grants: [...working.grants],
    });
    navigate(viewPath);
  };

  return (
    <Stack spacing={2}>
      {breadcrumb}
      <BeamPageHeader
        title={working.name || 'User'}
        description={working.email}
        secondaryActions={
          <Button variant="text" onClick={() => navigate(viewPath)}>
            Cancel
          </Button>
        }
        action={
          <Button variant="contained" disabled={!isDirty} onClick={save}>
            Save
          </Button>
        }
      />

      {/* Stats block in edit: holds form fields → border visible (§1.2). Same
          geometry as view (constant border), so the skeleton reads as "same
          thing, now editable" with zero jump — only the border color changes. */}
      <Paper elevation={0} sx={{ p: 2, ...modeBorder(true) }}>
        <Box sx={STATS_GRID}>
          <TextField
            label="Name"
            size="small"
            value={working.name}
            onChange={(e) => setWorking((w) => ({ ...w, name: e.target.value }))}
          />
          <TextField
            label="Email"
            size="small"
            value={working.email}
            onChange={(e) => setWorking((w) => ({ ...w, email: e.target.value }))}
          />
          <TextField
            label="Description"
            size="small"
            multiline
            value={working.description}
            onChange={(e) => setWorking((w) => ({ ...w, description: e.target.value }))}
          />
        </Box>
      </Paper>

      <RolesPermissionsLayout
        rail={<RolesRail mode="edit" assignedIds={working.roleIds} onToggle={toggleRole} linking={linking} />}
        sections={SECTIONS.map((section) => (
          <PageSection
            key={section.id}
            section={section}
            mode="edit"
            granted={working.grants}
            provenance={provenance}
            onTogglePermission={togglePermission}
            onToggleGroup={toggleGroup}
            linking={linking}
          />
        ))}
      />

      <Dialog open={blocker.state === 'blocked'} onClose={() => blocker.reset?.()}>
        <DialogTitle>Discard unsaved changes?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            You have unsaved changes to this user. Leaving now will discard them.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => blocker.reset?.()}>Keep editing</Button>
          <Button color="error" onClick={() => blocker.proceed?.()}>
            Discard
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

// ---- Shared layout ----

function RolesPermissionsLayout({ rail, sections }: { rail: React.ReactNode; sections: React.ReactNode[] }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '260px 1fr' }, gap: 2, alignItems: 'start' }}>
      <Box sx={{ position: { md: 'sticky' }, top: { md: 88 } }}>{rail}</Box>
      {/* Sections stack vertically; each PageSection owns its own box grid
          (and the masonry toggle) internally. */}
      <Stack spacing={3}>{sections}</Stack>
    </Box>
  );
}
