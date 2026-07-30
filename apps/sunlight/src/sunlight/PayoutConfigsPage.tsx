import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Stack,
  Button,
  TextField,
  MenuItem,
  BeamPageHeader,
  BeamFilterBar,
  BeamDataTable,
  BeamStatusBadge,
} from '@betty/beam';
import type { BeamColumn, BeamRowAction } from '@betty/beam';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import { RouterIdentityLink } from './RouterIdentityLink';
import { PayoutRowsGrid } from './PayoutRowsGrid';
import {
  PAYOUT_CONFIGS,
  GAME_TYPES,
  PAYOUT_STATUSES,
  statusBadge,
  type PayoutConfig,
  type GameType,
  type PayoutStatus,
} from './payoutConfigs';

/**
 * Payout Configs — the first MetaGame back-office list, aligned to Georgi's
 * Design Brief (2026-07-29). ONE list for every game type (IA confirmed), with
 * GameType + Status as exact-match promoted filters.
 *
 * §5 declaration (post-brief): promoted filters GameType + Status · tier 3 (row
 * click → /payout-configs/:id, Name is the identity link) · rail expand + kebab
 * (Edit + Enable/Disable — no Delete, brief) · NO batch actions (brief specifies
 * none) · no inline cell control. The rail caret expands the Yoda preview.
 */

interface Applied {
  q: string;
  gameType: 'any' | GameType;
  status: 'any' | PayoutStatus;
}

const EMPTY: Applied = { q: '', gameType: 'any', status: 'any' };

/** Applied filters -> URL query, omitting defaults so the URL stays clean. */
function toParams(d: Applied): URLSearchParams {
  const p = new URLSearchParams();
  if (d.q.trim()) p.set('q', d.q.trim());
  if (d.gameType !== 'any') p.set('gameType', d.gameType);
  if (d.status !== 'any') p.set('status', d.status);
  return p;
}

// Row actions are stubbed — behaviour wiring is a later round; only navigation
// is real. Enable/Disable dialogs ship PLAIN (window.confirm); the real dialog
// and its exact copy come from brief §10.1 (not yet in-repo).
function confirmToggle(config: PayoutConfig, next: 'Enable' | 'Disable') {
  if (typeof window === 'undefined') return;
  if (window.confirm(`${next} "${config.name}"?`)) {
    console.log(next.toLowerCase(), config.id);
  }
}

export function PayoutConfigsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Applied filters live in the URL (shareable, refresh-proof); the draft is
  // local until the Filter button submits (list §1). Filters are exact-match.
  const gameTypeParam = searchParams.get('gameType');
  const statusParam = searchParams.get('status');
  const applied: Applied = {
    q: searchParams.get('q') ?? '',
    gameType: GAME_TYPES.includes(gameTypeParam as GameType) ? (gameTypeParam as GameType) : 'any',
    status: PAYOUT_STATUSES.includes(statusParam as PayoutStatus) ? (statusParam as PayoutStatus) : 'any',
  };
  const [draft, setDraft] = useState<Applied>(applied);

  const rows = useMemo(() => {
    const q = applied.q.trim().toLowerCase();
    return PAYOUT_CONFIGS.filter((c) => {
      if (q && !`${c.name} ${c.id}`.toLowerCase().includes(q)) return false;
      if (applied.gameType !== 'any' && c.gameType !== applied.gameType) return false;
      if (applied.status !== 'any' && c.status !== applied.status) return false;
      return true;
    });
  }, [applied.q, applied.gameType, applied.status]);

  const isApplied = applied.q !== '' || applied.gameType !== 'any' || applied.status !== 'any';

  // Columns per brief §5.1: Name (API Code), Game type, Status, Rows — plus Avg
  // payout, which is OUR enhancement (not in the brief spec), and Updated.
  const columns: BeamColumn<PayoutConfig>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (c) => c.name,
      getValue: (c) => c.name,
      isIdentity: true,
      getHref: (c) => `${import.meta.env.BASE_URL}payout-configs/${c.id}`,
    },
    { key: 'gameType', header: 'Game type', render: (c) => c.gameType, getValue: (c) => c.gameType, width: 170 },
    {
      key: 'status',
      header: 'Status',
      width: 130,
      getValue: (c) => c.status,
      render: (c) => {
        const b = statusBadge(c.status);
        return <BeamStatusBadge status={b.status} label={b.label} size="small" />;
      },
    },
    // Columns per Georgi (Slack, 2026-07-30): Name | Game Type | Status |
    // Payout Rows | Actions (the rail kebab). Avg Payout (our enhancement) was
    // vetoed; Updated dropped — see metagame-pages.md.
    { key: 'rows', header: 'Payout Rows', align: 'right', width: 120, getValue: (c) => c.rows.length, render: (c) => c.rows.length },
  ];

  // The row's actions — ONE definition, projected to both the kebab and the
  // expansion action bar (grammar §3). Edit → detail · Enable ↔ Disable
  // (state-dependent). Clone removed per Georgi (Slack, 2026-07-30); no Delete
  // (brief §10). One place changes; every surface follows.
  const rowActions = (c: PayoutConfig): BeamRowAction[] => [
    { id: 'edit', label: 'Edit', icon: <EditIcon fontSize="small" />, onSelect: () => navigate(`/payout-configs/${c.id}`) },
    c.status === 'Enabled'
      ? { id: 'disable', label: 'Disable', icon: <BlockIcon fontSize="small" />, onSelect: () => confirmToggle(c, 'Disable') }
      : { id: 'enable', label: 'Enable', icon: <CheckCircleIcon fontSize="small" />, onSelect: () => confirmToggle(c, 'Enable') },
  ];

  return (
    <Stack spacing={3}>
      <BeamPageHeader
        title="Payout Configs"
        description="Payout tables across every MetaGame game type."
        action={
          <Button variant="contained" startIcon={<AddIcon />}>
            New config
          </Button>
        }
      />

      <BeamFilterBar
        aria-label="Payout config filters"
        searchValue={draft.q}
        onSearchChange={(q) => setDraft((d) => ({ ...d, q }))}
        searchPlaceholder="Search name or id"
        applied={isApplied}
        onFilter={() => setSearchParams(toParams(draft))}
        onClearAll={() => {
          setDraft(EMPTY);
          setSearchParams({});
        }}
      >
        <TextField
          label="Game type"
          size="small"
          select
          fullWidth
          value={draft.gameType}
          onChange={(e) => setDraft((d) => ({ ...d, gameType: e.target.value as Applied['gameType'] }))}
        >
          <MenuItem value="any">Any</MenuItem>
          {GAME_TYPES.map((g) => (
            <MenuItem key={g} value={g}>
              {g}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Status"
          size="small"
          select
          fullWidth
          value={draft.status}
          onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as Applied['status'] }))}
        >
          <MenuItem value="any">Any</MenuItem>
          {PAYOUT_STATUSES.map((s) => (
            <MenuItem key={s} value={s}>
              {s}
            </MenuItem>
          ))}
        </TextField>
      </BeamFilterBar>

      <BeamDataTable
        columns={columns}
        rows={rows}
        getRowId={(c) => c.id}
        rowActions={rowActions}
        renderExpanded={(c) => <PayoutRowsGrid rows={c.rows} />}
        onRowClick={(c) => navigate(`/payout-configs/${c.id}`)}
        LinkComponent={RouterIdentityLink}
        paginated
        defaultPageSize={20}
        emptyMessage="No payout configs match these filters."
        aria-label="Payout configs"
      />
    </Stack>
  );
}
