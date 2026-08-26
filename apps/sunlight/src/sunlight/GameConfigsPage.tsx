import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  BeamDataTable,
  BeamFilterBar,
  BeamPageHeader,
  BeamStatusBadge,
  Button,
  MenuItem,
  Stack,
  TextField,
} from '@betty/beam';
import type { BeamColumn, BeamRowAction } from '@betty/beam';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/EditRounded';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { GAME_TYPES, PAYOUT_STATUSES, statusBadge } from './payoutConfigs';
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

function toParams(filters: Applied): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q.trim()) params.set('q', filters.q.trim());
  if (filters.gameType !== 'any') params.set('gameType', filters.gameType);
  if (filters.status !== 'any') params.set('status', filters.status);
  return params;
}

function confirmToggle(config: GameConfig, next: 'Enable' | 'Disable') {
  if (typeof window === 'undefined') return;
  if (window.confirm(`${next} "${config.code}"?`)) {
    console.log(next.toLowerCase(), config.id);
  }
}

export function GameConfigsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const gameTypeParam = searchParams.get('gameType');
  const statusParam = searchParams.get('status');
  const applied: Applied = {
    q: searchParams.get('q') ?? '',
    gameType: GAME_TYPES.includes(gameTypeParam as GameType) ? (gameTypeParam as GameType) : 'any',
    status: PAYOUT_STATUSES.includes(statusParam as PayoutStatus) ? (statusParam as PayoutStatus) : 'any',
  };
  const [draft, setDraft] = useState<Applied>(applied);

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
      render: (config) => config.gameType,
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
      <BeamPageHeader
        title="Game Configs"
        subtitle="Targeted payout configurations across MetaGame game types."
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/game-configs/new')}>
            New Config
          </Button>
        }
      />

      <BeamFilterBar
        aria-label="Game config filters"
        searchValue={draft.q}
        onSearchChange={(q) => setDraft((current) => ({ ...current, q }))}
        searchPlaceholder="Search name or ID"
        applied={isApplied}
        onFilter={() => setSearchParams(toParams(draft))}
        onClearAll={() => {
          setDraft(EMPTY);
          setSearchParams({});
        }}
      >
        <TextField
          label="Game Type"
          size="small"
          select
          fullWidth
          value={draft.gameType}
          onChange={(event) =>
            setDraft((current) => ({ ...current, gameType: event.target.value as Applied['gameType'] }))
          }
        >
          <MenuItem value="any">Any</MenuItem>
          {GAME_TYPES.map((gameType) => (
            <MenuItem key={gameType} value={gameType}>
              {gameType}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Status"
          size="small"
          select
          fullWidth
          value={draft.status}
          onChange={(event) =>
            setDraft((current) => ({ ...current, status: event.target.value as Applied['status'] }))
          }
        >
          <MenuItem value="any">Any</MenuItem>
          {PAYOUT_STATUSES.map((status) => (
            <MenuItem key={status} value={status}>
              {status}
            </MenuItem>
          ))}
        </TextField>
      </BeamFilterBar>

      <BeamDataTable
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
