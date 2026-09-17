import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableFilters,
  useTableFilters,
  BeamPage,
  BeamStatusBadge,
  Button,
  Stack,
} from '@betty/beam';
import type { BeamColumn, BeamRowAction, TableFilterDefinition } from '@betty/beam';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/EditRounded';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { GAME_TYPES, PAYOUT_STATUSES, gameTypeLabel, statusBadge } from './payoutConfigs';
import type { GameType, PayoutStatus } from './payoutConfigs';
import { GAME_CONFIGS } from './gameConfigs';
import type { GameConfig } from './gameConfigs';
import { RouterIdentityLink } from './RouterIdentityLink';
import { TargetingRulesGrid } from './TargetingRulesGrid';

interface Applied {
  q: string;
  gameType: 'any' | GameType;
  status: 'any' | PayoutStatus;
}

const EMPTY: Applied = { q: '', gameType: 'any', status: 'any' };
const GAME_CONFIG_DEFS: TableFilterDefinition<Applied>[] = [
  { key: 'q', control: 'text', label: 'Search', placeholder: 'Search name or ID' },
  { key: 'gameType', control: 'select', label: 'Game Type', options: [{ label: 'Any', value: 'any' }, ...GAME_TYPES.map((g) => ({ label: gameTypeLabel(g), value: g }))] },
  { key: 'status', control: 'select', label: 'Status', options: [{ label: 'Any', value: 'any' }, ...PAYOUT_STATUSES.map((s) => ({ label: s, value: s }))] },
];

function confirmToggle(config: GameConfig, next: 'Enable' | 'Disable') {
  if (typeof window === 'undefined') return;
  if (window.confirm(`${next} "${config.code}"?`)) {
    console.log(next.toLowerCase(), config.id);
  }
}

export function GameConfigsPage() {
  const navigate = useNavigate();
  const filters = useTableFilters<Applied>({ initialValues: EMPTY, urlSync: true });
  const applied = filters.applied;

  const rows = useMemo(() => {
    const query = applied.q.trim().toLowerCase();
    return GAME_CONFIGS.filter((config) => {
      if (query && !`${config.code} ${config.id}`.toLowerCase().includes(query)) return false;
      if (applied.gameType !== 'any' && config.gameType !== applied.gameType) return false;
      if (applied.status !== 'any' && config.status !== applied.status) return false;
      return true;
    });
  }, [applied.gameType, applied.q, applied.status]);

  const columns: BeamColumn<GameConfig>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (config) => config.code,
      getValue: (config) => config.code,
      isIdentity: true,
      getHref: (config) => `${import.meta.env.BASE_URL}game-configs/${config.id}`,
    },
    {
      key: 'gameType',
      header: 'Game Type',
      render: (config) => gameTypeLabel(config.gameType),
      getValue: (config) => config.gameType,
      width: 170,
    },
    {
      key: 'status',
      header: 'Status',
      width: 130,
      getValue: (config) => config.status,
      render: (config) => {
        const badge = statusBadge(config.status);
        return <BeamStatusBadge status={badge.status} label={badge.label} size="small" />;
      },
    },
    {
      key: 'targetingRules',
      header: 'Targeting Rules',
      align: 'right',
      width: 150,
      getValue: (config) => config.targetingRules.length,
      render: (config) => config.targetingRules.length,
    },
  ];

  // Name (identity) opens VIEW; Edit LEADS the kebab (write intent, deep-link to edit mode).
  const rowActions = (config: GameConfig): BeamRowAction[] => [
    { id: 'edit', label: 'Edit', icon: <EditIcon fontSize="small" />, onSelect: () => navigate(`/game-configs/${config.id}`, { state: { edit: true } }) },
    config.status === 'Enabled'
      ? {
          id: 'disable',
          label: 'Disable',
          icon: <BlockIcon fontSize="small" />,
          onSelect: () => confirmToggle(config, 'Disable'),
        }
      : {
          id: 'enable',
          label: 'Enable',
          icon: <CheckCircleIcon fontSize="small" />,
          onSelect: () => confirmToggle(config, 'Enable'),
        },
  ];

  const isApplied = applied.q !== '' || applied.gameType !== 'any' || applied.status !== 'any';

  return (
    <Stack spacing={3}>
      <BeamPage
        title="Game Configs"
        subtitle="Targeted payout configurations across MetaGame game types."
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/game-configs/new')}>
            New Config
          </Button>
        }
      />

      <TableFilters definitions={GAME_CONFIG_DEFS} controller={filters} />

      <Table
        columns={columns}
        rows={rows}
        getRowId={(config) => config.id}
        rowActions={rowActions}
        renderExpanded={(config) => <TargetingRulesGrid rules={config.targetingRules} />}
        onRowClick={(config) => navigate(`/game-configs/${config.id}`)}
        LinkComponent={RouterIdentityLink}
        paginated
        defaultPageSize={20}
        emptyMessage="No game configs match these filters."
        aria-label="Game configs"
      />
    </Stack>
  );
}
