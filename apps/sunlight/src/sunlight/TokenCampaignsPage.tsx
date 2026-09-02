import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Stack,
  Alert,
  Button,
  MenuItem,
  TextField,
  BeamPageHeader,
  BeamFilterBar,
  BeamDataTable,
  BeamStatusBadge,
  BeamBool,
} from '@betty/beam';
import type { BeamColumn, BeamRowAction } from '@betty/beam';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/EditRounded';
import EmojiEventsIcon from '@mui/icons-material/EmojiEventsOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import { RouterIdentityLink } from './RouterIdentityLink';
import {
  getTokenCampaigns,
  campaignLifecycle,
  lifecycleBadge,
  campaignSummary,
  LIFECYCLES,
  type CampaignLifecycle,
  type TokenCampaign,
} from './tokenCampaigns';

/**
 * Token Campaigns — the Prize Wall flow's list page (step 1), per list-page grammar: a filter bar,
 * a datagrid, pagination. Name is the identity link → the campaign detail route (a stub for now);
 * the drill-down skeleton (detail · stage · winners) is registered but stubbed.
 *
 * §-declaration: promoted filters Status (lifecycle) + Enabled · Name is the identity link (tier 3:
 * row → /prize-wall/token-campaigns/:id) · kebab Edit / View Winners / Delete — all STUBS this round
 * (Edit + View Winners navigate to stub routes; Delete only notices — no destructive behaviour,
 * pipeline hangs on the CR-granularity open item). New Token Campaign primary action is a stub.
 */

type Notice = { severity: 'success' | 'info' | 'warning' | 'error'; msg: string } | null;

interface Applied {
  q: string;
  status: 'any' | CampaignLifecycle;
  enabled: 'any' | 'yes' | 'no';
}
const EMPTY: Applied = { q: '', status: 'any', enabled: 'any' };

const BASE = '/prize-wall/token-campaigns';
const fmtDate = (iso: string) => iso.slice(0, 10);

export function TokenCampaignsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [notice, setNotice] = useState<Notice>(null);

  // Applied filters live in the URL (shareable, refresh-proof); the draft is local until Filter.
  const statusParam = searchParams.get('status');
  const enabledParam = searchParams.get('enabled');
  const applied: Applied = {
    q: searchParams.get('q') ?? '',
    status: LIFECYCLES.includes(statusParam as CampaignLifecycle) ? (statusParam as CampaignLifecycle) : 'any',
    enabled: enabledParam === 'yes' || enabledParam === 'no' ? enabledParam : 'any',
  };
  const [draft, setDraft] = useState<Applied>(applied);

  const rows = useMemo(() => {
    const q = applied.q.trim().toLowerCase();
    return getTokenCampaigns().filter((c) => {
      if (q && !`${c.name} ${c.id}`.toLowerCase().includes(q)) return false;
      if (applied.status !== 'any' && campaignLifecycle(c) !== applied.status) return false;
      if (applied.enabled !== 'any' && c.enabled !== (applied.enabled === 'yes')) return false;
      return true;
    });
  }, [applied.q, applied.status, applied.enabled]);

  const isApplied = applied.q !== '' || applied.status !== 'any' || applied.enabled !== 'any';

  const submit = () => {
    const p = new URLSearchParams();
    if (draft.q.trim()) p.set('q', draft.q.trim());
    if (draft.status !== 'any') p.set('status', draft.status);
    if (draft.enabled !== 'any') p.set('enabled', draft.enabled);
    setSearchParams(p, { replace: true });
  };
  const clearAll = () => {
    setDraft(EMPTY);
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  // Columns ≈ Figma: Name (identity link) · Token/prize info (derived summary placeholder) · Start ·
  // End · Enabled (BeamBool per the boolean ruling) · Created by.
  const columns: BeamColumn<TokenCampaign>[] = [
    {
      key: 'name',
      header: 'Campaign',
      getValue: (c) => c.name,
      isIdentity: true,
      getHref: (c) => `${import.meta.env.BASE_URL}${BASE.replace(/^\//, '')}/${c.id}`,
      render: (c) => c.name,
    },
    {
      key: 'status',
      header: 'Status',
      width: 120,
      getValue: (c) => campaignLifecycle(c),
      render: (c) => {
        const b = lifecycleBadge(campaignLifecycle(c));
        return <BeamStatusBadge status={b.status} label={b.label} size="small" />;
      },
    },
    // Placeholder content — real "token / prize info" corrected on Deyan's Figma review.
    { key: 'summary', header: 'Prize info', getValue: (c) => campaignSummary(c), render: (c) => campaignSummary(c), width: 170 },
    { key: 'start', header: 'Start date', getValue: (c) => c.startDate, render: (c) => fmtDate(c.startDate), align: 'right', width: 120 },
    { key: 'end', header: 'End date', getValue: (c) => c.endDate, render: (c) => fmtDate(c.endDate), align: 'right', width: 120 },
    { key: 'enabled', header: 'Enabled', width: 100, align: 'center', getValue: (c) => (c.enabled ? 'yes' : 'no'), render: (c) => <BeamBool value={c.enabled} /> },
    { key: 'createdBy', header: 'Created by', getValue: (c) => c.createdBy, render: (c) => c.createdBy, width: 150 },
  ];

  // Kebab: Edit leads (write intent, list §3), then View Winners, then Delete. All STUBS — Edit +
  // View Winners navigate to stub routes; Delete only notices (no destructive behaviour, pipeline
  // hangs on the CR-granularity open item — detail-page-grammar).
  const rowActions = (c: TokenCampaign): BeamRowAction[] => [
    { id: 'edit', label: 'Edit', icon: <EditIcon fontSize="small" />, onSelect: () => navigate(`${BASE}/${c.id}`, { state: { edit: true } }) },
    { id: 'winners', label: 'View Winners', icon: <EmojiEventsIcon fontSize="small" />, onSelect: () => navigate(`${BASE}/${c.id}/winners`) },
    {
      id: 'delete',
      label: 'Delete',
      icon: <DeleteIcon fontSize="small" />,
      destructive: true,
      onSelect: () => setNotice({ severity: 'warning', msg: `Delete "${c.name}" — stub. No delete pipeline yet (hangs on the CR-granularity ruling). Nothing was removed.` }),
    },
  ];

  return (
    <Stack spacing={3}>
      <BeamPageHeader
        title="Token Campaigns"
        subtitle="Prize Wall token campaigns and their stages."
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setNotice({ severity: 'info', msg: 'New Token Campaign — stub. The create flow lands in a later prompt.' })}
          >
            New Token Campaign
          </Button>
        }
      />

      <BeamFilterBar
        aria-label="Token campaign filters"
        searchValue={draft.q}
        onSearchChange={(q) => setDraft((d) => ({ ...d, q }))}
        searchPlaceholder="Search campaign name"
        applied={isApplied}
        onFilter={submit}
        onClearAll={clearAll}
      >
        <TextField select fullWidth size="small" label="Status" value={draft.status} onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as Applied['status'] }))}>
          <MenuItem value="any">Any</MenuItem>
          {LIFECYCLES.map((l) => (
            <MenuItem key={l} value={l} sx={{ textTransform: 'capitalize' }}>{l}</MenuItem>
          ))}
        </TextField>
        <TextField select fullWidth size="small" label="Enabled" value={draft.enabled} onChange={(e) => setDraft((d) => ({ ...d, enabled: e.target.value as Applied['enabled'] }))}>
          <MenuItem value="any">Any</MenuItem>
          <MenuItem value="yes">Enabled</MenuItem>
          <MenuItem value="no">Disabled</MenuItem>
        </TextField>
      </BeamFilterBar>

      {notice && (
        <Alert severity={notice.severity} onClose={() => setNotice(null)}>
          {notice.msg}
        </Alert>
      )}

      <BeamDataTable
        columns={columns}
        rows={rows}
        getRowId={(c) => c.id}
        LinkComponent={RouterIdentityLink}
        rowActions={rowActions}
        paginated
        emptyMessage="No token campaigns match these filters."
        aria-label="Token campaigns"
      />
    </Stack>
  );
}
