import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableFilters,
  useTableFilters,
  BeamPage,
  BeamStatusBadge,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@betty/beam';
import type { BeamColumn, BeamRowAction, TableFilterDefinition } from '@betty/beam';
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
import { LEGACY_GAME_TYPES, GAME_TYPES, PAYOUT_STATUSES, gameTypeLabel, statusBadge, type GameType, type PayoutStatus } from './payoutConfigs';
import { RouterIdentityLink } from './RouterIdentityLink';
import { PresetImagePreview } from './PresetImagePreview';

interface AppliedFilters {
  q: string;
  gameType: string;
  source: 'any' | PresetSource;
  status: 'any' | PayoutStatus;
}

const EMPTY_FILTERS: AppliedFilters = { q: '', gameType: 'any', source: 'any', status: 'any' };
const PRESET_DEFS: TableFilterDefinition<AppliedFilters>[] = [
  { key: 'q', control: 'text', label: 'Search', placeholder: 'Search Display Name or ID' },
  { key: 'gameType', control: 'select', label: 'Game Type', options: [{ label: 'Any', value: 'any' }, ...[...GAME_TYPES, ...LEGACY_GAME_TYPES].map((g) => ({ label: gameTypeLabel(g), value: g }))] },
  { key: 'source', control: 'select', label: 'Configuration Source', options: [{ label: 'Any', value: 'any' }, { label: 'Betty', value: 'Betty' }, { label: 'Yoda', value: 'Yoda' }] },
  { key: 'status', control: 'select', label: 'Status', options: [{ label: 'Any', value: 'any' }, ...PAYOUT_STATUSES.map((s) => ({ label: s, value: s }))] },
];

function gameConfigName(preset: MetaGamePreset): string {
  if (!preset.gameConfigId) return presetSource(preset) === 'Betty' ? 'Default game configuration' : preset.configCode ?? 'Not configured';
  return GAME_CONFIGS.find((config) => config.id === preset.gameConfigId)?.name ?? 'Unknown GameConfig';
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
  const [revision, setRevision] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<MetaGamePreset | null>(null);
  const filters = useTableFilters<AppliedFilters>({ initialValues: EMPTY_FILTERS, urlSync: true });
  const applied = filters.applied;

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
    { key: 'gameType', header: 'Game Type', width: 150, render: (preset) => gameTypeLabel(preset.name), getValue: (preset) => preset.name },
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
      <BeamPage
        title="MetaGame Presets"
        subtitle="Betty GameConfig and legacy Yoda presets used when awarding MetaGame experiences."
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/meta-game-presets/new')}>
            New Preset
          </Button>
        }
      />

      <TableFilters definitions={PRESET_DEFS} controller={filters} />

      <Table
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
