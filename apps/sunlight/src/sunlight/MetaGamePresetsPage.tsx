import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  BeamDataTable,
  BeamFilterBar,
  BeamPageHeader,
  BeamStatusBadge,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@betty/beam';
import type { BeamColumn, BeamRowAction } from '@betty/beam';
import AddIcon from '@mui/icons-material/Add';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/EditRounded';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import { GAME_CONFIGS } from './gameConfigs';
import {
  META_GAME_PRESETS,
  deleteMetaGamePreset,
  updateMetaGamePresetStatus,
  type MetaGamePreset,
} from './metaGamePresets';
import { nextPresetStatusAction, presetSource, type PresetSource } from './metaGamePresetHelpers';
import { GAME_TYPES, PAYOUT_STATUSES, statusBadge, type GameType, type PayoutStatus } from './payoutConfigs';
import { RouterIdentityLink } from './RouterIdentityLink';
import { PresetImagePreview } from './PresetImagePreview';

interface AppliedFilters {
  q: string;
  gameType: 'any' | GameType;
  source: 'any' | PresetSource;
  status: 'any' | PayoutStatus;
}

const EMPTY_FILTERS: AppliedFilters = { q: '', gameType: 'any', source: 'any', status: 'any' };

function filtersToParams(filters: AppliedFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q.trim()) params.set('q', filters.q.trim());
  if (filters.gameType !== 'any') params.set('gameType', filters.gameType);
  if (filters.source !== 'any') params.set('source', filters.source);
  if (filters.status !== 'any') params.set('status', filters.status);
  return params;
}

function gameConfigName(preset: MetaGamePreset): string {
  if (!preset.gameConfigId) return preset.configCode ?? 'Not configured';
  return GAME_CONFIGS.find((config) => config.id === preset.gameConfigId)?.code ?? 'Unknown GameConfig';
}

function PresetPreview({ preset }: { preset: MetaGamePreset }) {
  const source = presetSource(preset);
  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { md: 'flex-start' } }}>
      <PresetImagePreview imageUrl={preset.imageUrl} alt={`${preset.displayName} preview`} />
      <Stack spacing={0.75}>
        <Typography variant="body2"><strong>Skin:</strong> {preset.skinId ?? 'Not set'}</Typography>
        <Typography variant="body2"><strong>Volatility:</strong> {preset.volatility ?? 'Not set'}</Typography>
        <Typography variant="body2"><strong>Use Cases:</strong> {preset.useCases.join(', ') || 'Not set'}</Typography>
        <Typography variant="body2"><strong>Source:</strong> {source === 'Betty' ? 'Betty GameConfig' : 'Legacy Yoda'}</Typography>
        <Typography variant="body2">
          <strong>Configuration:</strong> {gameConfigName(preset)}
        </Typography>
      </Stack>
    </Stack>
  );
}

export function MetaGamePresetsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [revision, setRevision] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<MetaGamePreset | null>(null);
  const gameTypeParam = searchParams.get('gameType');
  const sourceParam = searchParams.get('source');
  const statusParam = searchParams.get('status');
  const applied: AppliedFilters = {
    q: searchParams.get('q') ?? '',
    gameType: GAME_TYPES.includes(gameTypeParam as GameType) ? (gameTypeParam as GameType) : 'any',
    source: sourceParam === 'Betty' || sourceParam === 'Yoda' ? sourceParam : 'any',
    status: PAYOUT_STATUSES.includes(statusParam as PayoutStatus) ? (statusParam as PayoutStatus) : 'any',
  };
  const [draft, setDraft] = useState<AppliedFilters>(applied);

  const rows = useMemo(() => {
    const query = applied.q.trim().toLowerCase();
    return META_GAME_PRESETS.filter((preset) => {
      if (query && !`${preset.displayName} ${preset.id}`.toLowerCase().includes(query)) return false;
      if (applied.gameType !== 'any' && preset.name !== applied.gameType) return false;
      if (applied.source !== 'any' && presetSource(preset) !== applied.source) return false;
      if (applied.status !== 'any' && preset.status !== applied.status) return false;
      return true;
    });
  }, [applied.gameType, applied.q, applied.source, applied.status, revision]);

  const columns: BeamColumn<MetaGamePreset>[] = [
    {
      key: 'displayName',
      header: 'Display Name',
      render: (preset) => preset.displayName,
      getValue: (preset) => preset.displayName,
      isIdentity: true,
      getHref: (preset) => `${import.meta.env.BASE_URL}meta-game-presets/${preset.id}`,
    },
    { key: 'gameType', header: 'Game Type', width: 150, render: (preset) => preset.name, getValue: (preset) => preset.name },
    { key: 'source', header: 'Source', width: 100, render: presetSource, getValue: presetSource },
    { key: 'configuration', header: 'Configuration', width: 220, render: gameConfigName, getValue: gameConfigName },
    {
      key: 'status',
      header: 'Status',
      width: 120,
      getValue: (preset) => preset.status,
      render: (preset) => {
        const badge = statusBadge(preset.status);
        return <BeamStatusBadge status={badge.status} label={badge.label} size="small" />;
      },
    },
    {
      key: 'expiry',
      header: 'Expiry',
      width: 120,
      render: (preset) => (preset.expiryHours === null ? 'Default' : `${preset.expiryHours} hours`),
      getValue: (preset) => preset.expiryHours ?? -1,
    },
  ];

  const rowActions = (preset: MetaGamePreset): BeamRowAction[] => {
    const statusAction = nextPresetStatusAction(preset.status);
    return [
      // Edit LEADS (write intent, deep-link to edit mode); Enable/Disable; Delete stays last.
      // Exactly §5's `Edit / … / Delete` shape. Name (identity) opens view.
      { id: 'edit', label: 'Edit', icon: <EditIcon fontSize="small" />, onSelect: () => navigate(`/meta-game-presets/${preset.id}`, { state: { edit: true } }) },
      {
        id: statusAction.toLowerCase(),
        label: statusAction,
        icon: statusAction === 'Enable' ? <CheckCircleIcon fontSize="small" /> : <BlockIcon fontSize="small" />,
        onSelect: () => {
          updateMetaGamePresetStatus(preset.id, statusAction === 'Enable' ? 'Enabled' : 'Disabled');
          setRevision((current) => current + 1);
        },
      },
      {
        id: 'delete',
        label: 'Delete',
        icon: <DeleteOutlineIcon fontSize="small" />,
        destructive: true,
        onSelect: () => setDeleteTarget(preset),
      },
    ];
  };

  const isApplied =
    applied.q !== '' || applied.gameType !== 'any' || applied.source !== 'any' || applied.status !== 'any';

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteMetaGamePreset(deleteTarget.id);
    setDeleteTarget(null);
    setRevision((current) => current + 1);
  };

  return (
    <Stack spacing={3}>
      <BeamPageHeader
        title="MetaGame Presets"
        subtitle="Betty GameConfig and legacy Yoda presets used when awarding MetaGame experiences."
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/meta-game-presets/new')}>
            New Preset
          </Button>
        }
      />

      <BeamFilterBar
        aria-label="MetaGame preset filters"
        searchValue={draft.q}
        onSearchChange={(q) => setDraft((current) => ({ ...current, q }))}
        searchPlaceholder="Search Display Name or ID"
        applied={isApplied}
        onFilter={() => setSearchParams(filtersToParams(draft))}
        onClearAll={() => {
          setDraft(EMPTY_FILTERS);
          setSearchParams({});
        }}
      >
        <TextField select fullWidth size="small" label="Game Type" value={draft.gameType} onChange={(event) => setDraft((current) => ({ ...current, gameType: event.target.value as AppliedFilters['gameType'] }))}>
          <MenuItem value="any">Any</MenuItem>
          {GAME_TYPES.map((gameType) => <MenuItem key={gameType} value={gameType}>{gameType}</MenuItem>)}
        </TextField>
        <TextField select fullWidth size="small" label="Configuration Source" value={draft.source} onChange={(event) => setDraft((current) => ({ ...current, source: event.target.value as AppliedFilters['source'] }))}>
          <MenuItem value="any">Any</MenuItem>
          <MenuItem value="Betty">Betty</MenuItem>
          <MenuItem value="Yoda">Yoda</MenuItem>
        </TextField>
        <TextField select fullWidth size="small" label="Status" value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as AppliedFilters['status'] }))}>
          <MenuItem value="any">Any</MenuItem>
          {PAYOUT_STATUSES.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
        </TextField>
      </BeamFilterBar>

      <BeamDataTable
        columns={columns}
        rows={rows}
        getRowId={(preset) => preset.id}
        rowActions={rowActions}
        renderExpanded={(preset) => <PresetPreview preset={preset} />}
        onRowClick={(preset) => navigate(`/meta-game-presets/${preset.id}`)}
        LinkComponent={RouterIdentityLink}
        paginated
        defaultPageSize={20}
        emptyMessage="No presets match these filters."
        aria-label="MetaGame presets"
      />

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete preset?</DialogTitle>
        <DialogContent>
          <Typography>
            Delete “{deleteTarget?.displayName}”? This removes the preset from the visual demo.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button color="error" onClick={confirmDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
