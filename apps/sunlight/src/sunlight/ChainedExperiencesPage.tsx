import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/EditRounded';
import { BeamPage, Button, Stack, Table, TableFilters, useTableFilters } from '@betty/beam';
import type { BeamColumn, BeamRowAction, TableFilterDefinition } from '@betty/beam';
import { CHAINED_EXPERIENCES, CHAIN_SOURCE_TYPES, formatChainDate, presetLabel, type ChainedExperience } from './chainedExperiences';
import { gameTypeLabel } from './payoutConfigs';
import { RouterIdentityLink } from './RouterIdentityLink';

interface Filters { q: string; sourceGameType: string }
const definitions: TableFilterDefinition<Filters>[] = [
  { key: 'q', control: 'text', label: 'Search', placeholder: 'Search game or preset' },
  { key: 'sourceGameType', control: 'select', label: 'Source Game',
    options: [{ label: 'Any', value: 'any' }, ...CHAIN_SOURCE_TYPES.map(type => ({ label: gameTypeLabel(type), value: type }))] },
];

export function ChainedExperiencesPage() {
  const navigate = useNavigate();
  const filters = useTableFilters<Filters>({ initialValues: { q: '', sourceGameType: 'any' }, urlSync: true });
  const { q, sourceGameType } = filters.applied;
  const query = q.trim().toLowerCase();
  const rows = CHAINED_EXPERIENCES.filter(experience =>
    (sourceGameType === 'any' || experience.sourceGameType === sourceGameType) &&
    `${gameTypeLabel(experience.sourceGameType)} ${presetLabel(experience.sourcePresetId)} ${presetLabel(experience.targetPresetId)}`.toLowerCase().includes(query));
  const columns: BeamColumn<ChainedExperience>[] = [
    { key: 'sourceGameType', header: 'Source Game', isIdentity: true,
      getValue: experience => gameTypeLabel(experience.sourceGameType),
      render: experience => gameTypeLabel(experience.sourceGameType),
      getHref: experience => `${import.meta.env.BASE_URL}chained-experiences/${experience.id}` },
    { key: 'sourcePresetId', header: 'Source Preset', render: experience => presetLabel(experience.sourcePresetId) },
    { key: 'targetPresetId', header: 'Multiplier Madness Preset', render: experience => presetLabel(experience.targetPresetId) },
    { key: 'startDate', header: 'Start (UTC)', render: experience => formatChainDate(experience.startDate) },
    { key: 'endDate', header: 'End (UTC, exclusive)', render: experience => formatChainDate(experience.endDate) },
  ];
  const create = () => navigate('/chained-experiences/new');
  const inspect = (experience: ChainedExperience) => navigate(`/chained-experiences/${experience.id}`);
  const actions = (experience: ChainedExperience): BeamRowAction[] => [
    { id: 'edit', label: 'Edit', icon: <EditIcon fontSize="small" />,
      onSelect: () => navigate(`/chained-experiences/${experience.id}`, { state: { edit: true } }) },
  ];
  return (
    <Stack spacing={3}>
      <BeamPage title="Chained Experiences" subtitle="Configure when a completed source game can continue into Multiplier Madness."
        action={<Button variant="contained" startIcon={<AddIcon />} onClick={create}>New Experience</Button>} />
      <TableFilters definitions={definitions} controller={filters} />
      <Table columns={columns} rows={rows} getRowId={experience => experience.id} rowActions={actions}
        onRowClick={inspect} LinkComponent={RouterIdentityLink} paginated defaultPageSize={20}
        emptyMessage="No chained experiences match these filters." aria-label="Chained experiences" />
    </Stack>
  );
}
