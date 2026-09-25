import { payoutConfigDisableReason } from './gameConfigs';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stack,
  Button,
  Typography,
  BeamPage,
  TableFilters,
  useTableFilters,
  Table,
  BeamStatusBadge,
} from '@betty/beam';
import type { BeamColumn, BeamRowAction, TableFilterDefinition } from '@betty/beam';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/EditRounded';
import BlockIcon from '@mui/icons-material/Block';
import { RouterIdentityLink } from './RouterIdentityLink';
import { PayoutRowsGrid } from './PayoutRowsGrid';
import { MultiplierRowsGrid } from './MultiplierRowsGrid';
import {
  GAME_TYPES,
  PAYOUT_CONFIGS,
  PAYOUT_STATUSES,
  getPayoutRows,
  gameTypeLabel,
  statusBadge,
  type GameType,
  type PayoutConfig,
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
const PAYOUT_CONFIG_DEFS: TableFilterDefinition<Applied>[] = [
  { key: 'q', control: 'text', label: 'Search', placeholder: 'Search name or ID' },
  { key: 'gameType', control: 'select', label: 'Game Type', options: [{ label: 'Any', value: 'any' }, ...GAME_TYPES.map((g) => ({ label: gameTypeLabel(g), value: g }))] },
  { key: 'status', control: 'select', label: 'Status', options: [{ label: 'Any', value: 'any' }, ...PAYOUT_STATUSES.map((s) => ({ label: s, value: s }))] },
];


function ExpandedConfig({ config }: { config: PayoutConfig }) {
  if (config.gameType === 'BettyMultiplierMadness') return <Typography>RTP: {config.rtp * 100}%</Typography>;
  if (config.gameType !== 'BettyWheelOfWins') return <PayoutRowsGrid rows={config.rows} showSectorPositions={config.gameType === 'BettyWheel'} showTopPrize={config.gameType === 'BettyScratcher'} />;
  return (
    <Stack spacing={2}>
      <Stack spacing={0.75}>
        <Typography variant="subtitle2" color="text.secondary">
          Payout sectors
        </Typography>
        <PayoutRowsGrid rows={config.payoutRows} showSectorPositions />
      </Stack>
      <Stack spacing={0.75}>
        <Typography variant="subtitle2" color="text.secondary">
          Multiplier sectors
        </Typography>
        <MultiplierRowsGrid rows={config.multiplierRows} />
      </Stack>
    </Stack>
  );
}

export function PayoutConfigsPage() {
  const navigate = useNavigate();
  const [revision, setRevision] = useState(0);
function confirmToggle(config: PayoutConfig, next: 'Enable' | 'Disable') {
  if (next === 'Disable' && payoutConfigDisableReason(config.id)) return;
  if (window.confirm(`${next} "${config.name}"?`)) {
    config.status = next === 'Enable' ? 'Enabled' : 'Disabled';
    setRevision(current => current + 1);
  }
}

  // Applied filters + URL sync are owned by useTableFilters (shareable, refresh-proof).
  const filters = useTableFilters<Applied>({ initialValues: EMPTY, urlSync: true });
  const applied = filters.applied;

  const rows = useMemo(() => {
    const q = applied.q.trim().toLowerCase();
    return PAYOUT_CONFIGS.filter((c) => {
      if (q && !`${c.name} ${c.id}`.toLowerCase().includes(q)) return false;
      if (applied.gameType !== 'any' && c.gameType !== applied.gameType) return false;
      if (applied.status !== 'any' && c.status !== applied.status) return false;
      return true;
    });
  }, [applied.q, applied.gameType, applied.status, revision]);

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
    {
      key: 'gameType',
      header: 'Game type',
      render: (c) => gameTypeLabel(c.gameType),
      getValue: (c) => c.gameType,
      width: 170,
    },
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
    // Rows | Actions (the rail kebab). Avg Payout (our enhancement) was
    // vetoed; Updated dropped — see metagame-pages.md.
    {
      key: 'rows',
      header: 'Configuration',
      align: 'right',
      getValue: (c) => getPayoutRows(c).length + (c.gameType === 'BettyWheelOfWins' ? c.multiplierRows.length : 0),
      render: (c) => c.gameType === 'BettyMultiplierMadness' ? `RTP ${c.rtp * 100}%` : c.gameType === 'BettyWheelOfWins'
        ? `${c.payoutRows.length} payout · ${c.multiplierRows.length} multiplier`
        : c.rows.length,
    },
  ];

  // Name (identity link) opens VIEW; Edit LEADS the kebab as the write-intent action
  // (list-page-grammar §3, 2026-08-13), deep-linking to edit mode via nav state. Then the
  // state-dependent Enable/Disable. Expanded payout rows remain read-only.
  const rowActions = (c: PayoutConfig): BeamRowAction[] => [
    { id: 'edit', label: 'Edit', icon: <EditIcon fontSize="small" />, onSelect: () => navigate(`/payout-configs/${c.id}`, { state: { edit: true } }) },
    c.status === 'Enabled'
      ? { id: 'disable', disabled: Boolean(payoutConfigDisableReason(c.id)), disabledReason: payoutConfigDisableReason(c.id), label: 'Disable', icon: <BlockIcon fontSize="small" />, onSelect: () => confirmToggle(c, 'Disable') }
      : { id: 'enable', label: 'Enable', icon: <CheckCircleIcon fontSize="small" />, onSelect: () => confirmToggle(c, 'Enable') },
  ];

  return (
    <Stack spacing={3}>
      <BeamPage
        title="Payout Configs"
        subtitle="Payout tables across every MetaGame game type."
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/payout-configs/new')}>
            New config
          </Button>
        }
      />

      <TableFilters definitions={PAYOUT_CONFIG_DEFS} controller={filters} />

      <Table
        columns={columns}
        rows={rows}
        getRowId={(c) => c.id}
        rowActions={rowActions}
        renderExpanded={(c) => <ExpandedConfig config={c} />}
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
