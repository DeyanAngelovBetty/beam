import {
  Stack,
  Button,
  BeamPage,
  TableFilters,
  useTableFilters,
  Table,
  BeamStatusBadge,
} from '@betty/beam';
import type { BeamColumn, TableFilterDefinition } from '@betty/beam';
import { PLAYERS, type Player } from './players';

/**
 * Player Search, retrofitted.
 *
 * Same job as Midnight's screen — find a player by identity or registration
 * facts, then open them. The differences are the point: filters live in one
 * TableFilters (the official definition-driven bar) rather than a loose field
 * grid, status is the shared badge vocabulary rather than bare text, and the row
 * opens the player instead of requiring a separate action column.
 */

interface PlayerSearchPageProps {
  onOpenPlayer: (playerId: string) => void;
}

const STATUS_OPTIONS = ['Any', 'Approved', 'Pending'];

// Retrofit demo: the identity fields are illustrative (the Table's own `searchable` box does the live
// filtering); only Status is a bound control. Modelled as definitions to exercise the ported bar.
interface PlayerFilters {
  playerId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  registrationIp: string;
  status: string;
}
const EMPTY: PlayerFilters = { playerId: '', email: '', firstName: '', lastName: '', phone: '', registrationIp: '', status: 'Any' };
const PLAYER_DEFS: TableFilterDefinition<PlayerFilters>[] = [
  { key: 'playerId', control: 'text', label: 'Player ID' },
  { key: 'email', control: 'text', label: 'Email' },
  { key: 'firstName', control: 'text', label: 'First name' },
  { key: 'lastName', control: 'text', label: 'Last name' },
  { key: 'phone', control: 'text', label: 'Phone' },
  { key: 'registrationIp', control: 'text', label: 'Registration IP' },
  { key: 'status', control: 'select', label: 'Status', options: STATUS_OPTIONS.map((o) => ({ label: o, value: o })) },
];

export function PlayerSearchPage({ onOpenPlayer }: PlayerSearchPageProps) {
  // No urlSync on the retrofit demo (App mounts a MemoryRouter only so the controller's useSearchParams
  // has a Router). The bar is illustrative; the Table's `searchable` box does the real filtering.
  const filters = useTableFilters<PlayerFilters>({ initialValues: EMPTY });

  const columns: BeamColumn<Player>[] = [
    { key: 'id', header: 'Player ID', render: (p) => p.id, getValue: (p) => p.id, width: 110 },
    { key: 'email', header: 'Email', render: (p) => p.email, getValue: (p) => p.email },
    { key: 'firstName', header: 'First name', render: (p) => p.firstName, getValue: (p) => p.firstName },
    { key: 'lastName', header: 'Last name', render: (p) => p.lastName, getValue: (p) => p.lastName },
    { key: 'dob', header: 'DOB', render: (p) => p.dob, align: 'right', width: 120 },
    { key: 'registeredAt', header: 'Registered', render: (p) => p.registeredAt, align: 'right', width: 160 },
    {
      key: 'status',
      header: 'Status',
      render: (p) => <BeamStatusBadge status={p.status} />,
      getValue: (p) => p.status,
      width: 120,
    },
    {
      key: 'open',
      header: '',
      align: 'right',
      width: 100,
      render: (p) => (
        <Button size="small" onClick={() => onOpenPlayer(p.id)}>
          Open
        </Button>
      ),
    },
  ];

  return (
    <Stack spacing={3}>
      <BeamPage
        title="Player Search"
        subtitle="Find a player by identity or registration facts."
      />

      <TableFilters definitions={PLAYER_DEFS} controller={filters} />

      <Table
        columns={columns}
        rows={PLAYERS}
        getRowId={(p) => p.id}
        searchable
        paginated
        aria-label="Players"
      />
    </Stack>
  );
}
