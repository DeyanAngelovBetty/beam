import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stack,
  Alert,
  Button,
  BeamPage,
  TableFilters,
  useTableFilters,
  Table,
} from '@betty/beam';
import type { BeamColumn, BeamRowAction, TableFilterDefinition } from '@betty/beam';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/EditRounded';
import UploadIcon from '@mui/icons-material/UploadFileOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import { RouterIdentityLink } from './RouterIdentityLink';
import { listJackpots, fmtDateTimeET, type CommunityJackpot } from './communityJackpots';

/**
 * Community Jackpots — list page (designs/CJs.png). Standalone list-page grammar: a filter bar
 * (TableFilters: Search by Name + Start/End date, date-sliced like Gaspar) + the datagrid + pagination.
 * Name is the identity link → the jackpot detail; the row kebab is Edit / Upload Theme (stub) / Delete
 * (stub — the estate's no-delete-pipeline convention). New Community Jackpot enters the Add draft flow.
 *
 * This is the ONE organism-Table consumer among the CJ pages (embedded child tables are surfaceless
 * MuiTable compositions inside Sections). Slotted into Wave 2's §7 inventory — migrates with the wave.
 */

const BASE = '/community-jackpots';

type Notice = { severity: 'success' | 'info' | 'warning'; msg: string } | null;

interface Filters {
  q: string;
  start: string | null;
  end: string | null;
}
const EMPTY: Filters = { q: '', start: null, end: null };
const JACKPOT_DEFS: TableFilterDefinition<Filters>[] = [
  { key: 'q', control: 'text', label: 'Search by Name', placeholder: 'Search by Name' },
  { key: 'start', control: 'dateTime', label: 'Start Date' },
  { key: 'end', control: 'dateTime', label: 'End Date' },
];

export function CommunityJackpotsPage() {
  const navigate = useNavigate();
  const [notice, setNotice] = useState<Notice>(null);

  const filters = useTableFilters<Filters>({ initialValues: EMPTY, urlSync: true });
  const applied = filters.applied;

  const rows = useMemo(() => {
    const q = applied.q.trim().toLowerCase();
    // dateTime controls yield yyyy-mm-ddThh:mm; slice to the calendar date (Gaspar convention).
    const from = applied.start?.slice(0, 10);
    const to = applied.end?.slice(0, 10);
    return listJackpots().filter((j) => {
      if (q && !j.name.toLowerCase().includes(q)) return false;
      if (from && j.startDate.slice(0, 10) < from) return false;
      if (to && j.endDate.slice(0, 10) > to) return false;
      return true;
    });
  }, [applied.q, applied.start, applied.end]);

  const columns: BeamColumn<CommunityJackpot>[] = [
    { key: 'id', header: 'ID', getValue: (j) => j.id, render: (j) => j.id, width: 100 },
    {
      key: 'name',
      header: 'Name',
      getValue: (j) => j.name,
      isIdentity: true,
      getHref: (j) => `${import.meta.env.BASE_URL}${BASE.replace(/^\//, '')}/${j.id}`,
      render: (j) => j.name,
    },
    { key: 'milestones', header: 'Milestones', width: 140, getValue: (j) => j.milestones.length, render: (j) => j.milestones.length },
    { key: 'start', header: 'Start Date', width: 240, getValue: (j) => j.startDate, render: (j) => fmtDateTimeET(j.startDate) },
    { key: 'end', header: 'End Date', width: 240, getValue: (j) => j.endDate, render: (j) => fmtDateTimeET(j.endDate) },
  ];

  const rowActions = (j: CommunityJackpot): BeamRowAction[] => [
    { id: 'edit', label: 'Edit', icon: <EditIcon fontSize="small" />, onSelect: () => navigate(`${BASE}/${j.id}/edit`) },
    {
      id: 'upload-theme',
      label: 'Upload Theme',
      icon: <UploadIcon fontSize="small" />,
      onSelect: () => setNotice({ severity: 'info', msg: `Upload Theme for "${j.name}" — stub. Theme upload isn't wired yet; nothing was uploaded.` }),
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <DeleteIcon fontSize="small" />,
      destructive: true,
      onSelect: () => setNotice({ severity: 'warning', msg: `Delete "${j.name}" — stub. No delete pipeline yet; nothing was removed.` }),
    },
  ];

  return (
    <Stack spacing={3}>
      <BeamPage
        title="Community Jackpots"
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate(`${BASE}/new`)}>
            New Community Jackpot
          </Button>
        }
      />

      <TableFilters definitions={JACKPOT_DEFS} controller={filters} />

      {notice && (
        <Alert severity={notice.severity} onClose={() => setNotice(null)}>
          {notice.msg}
        </Alert>
      )}

      <Table
        columns={columns}
        rows={rows}
        getRowId={(j) => j.id}
        LinkComponent={RouterIdentityLink}
        rowActions={rowActions}
        onRowClick={(j) => navigate(`${BASE}/${j.id}`)}
        paginated
        emptyMessage="No community jackpots match these filters."
        aria-label="Community jackpots"
      />
    </Stack>
  );
}
