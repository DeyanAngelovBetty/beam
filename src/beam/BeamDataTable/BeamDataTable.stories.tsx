import type { Meta, StoryObj } from '@storybook/react-vite';
import { BeamDataTable } from './BeamDataTable';
import type { BeamColumn } from './BeamDataTable.types';
import { BeamStatusBadge } from '../BeamStatusBadge/BeamStatusBadge';
import type { BeamStatus } from '../BeamStatusBadge/BeamStatusBadge.types';
import Stack from '@mui/material/Stack';

/** Realistic Sunlight shape: perks management list (Beam candidate page) */
interface Perk {
  id: string;
  name: string;
  loyaltyStatus: string;
  reward: string;
  status: BeamStatus;
  updated: string;
}

const columns: BeamColumn<Perk>[] = [
  { key: 'name', header: 'Perk', render: (r) => r.name },
  { key: 'loyalty', header: 'Loyalty status', render: (r) => r.loyaltyStatus },
  { key: 'reward', header: 'Reward', render: (r) => r.reward },
  { key: 'status', header: 'Status', render: (r) => <BeamStatusBadge status={r.status} /> },
  { key: 'updated', header: 'Updated', render: (r) => r.updated, align: 'right' },
];

const rows: Perk[] = [
  { id: '1', name: 'Weekly Cashback Boost', loyaltyStatus: 'Gold', reward: '5% Betty Coins', status: 'active', updated: '2026-07-01' },
  { id: '2', name: 'Birthday Mystery Box', loyaltyStatus: 'All', reward: 'Mystery Box', status: 'scheduled', updated: '2026-06-28' },
  { id: '3', name: 'Prize Wall Token Drop', loyaltyStatus: 'Platinum', reward: '3 Tokens', status: 'paused', updated: '2026-06-20' },
  { id: '4', name: 'Free Spins Friday', loyaltyStatus: 'Silver', reward: '20 Free Spins', status: 'draft', updated: '2026-06-15' },
  { id: '5', name: 'Spring LP Multiplier', loyaltyStatus: 'All', reward: '2x LP', status: 'expired', updated: '2026-05-30' },
];

const meta: Meta<typeof BeamDataTable<Perk>> = {
  title: 'Organisms/BeamDataTable',
  component: BeamDataTable,
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj<typeof BeamDataTable<Perk>>;

export const PerksList: Story = {
  args: {
    columns,
    rows,
    getRowId: (r: Perk) => r.id,
    'aria-label': 'Perks management list',
  },
};

export const WithBulkActions: Story = {
  args: {
    ...PerksList.args,
    selectable: true,
    bulkActions: [
      { id: 'pause', label: 'Pause' },
      { id: 'archive', label: 'Archive', destructive: true },
    ],
    onBulkAction: (action, ids) => console.log(action, ids),
  },
};

export const Empty: Story = {
  args: {
    ...PerksList.args,
    rows: [],
    emptyMessage: 'No perks yet — create your first one.',
  },
};

/**
 * Yoda audit, answered in one story: paytables list with sorting,
 * global search (§2.7), pagination (§3.12), bulk selection (§3.12),
 * and inline payout expansion — progressive disclosure (§2.4) with
 * Expected Avg Payout verification (§2.2).
 */
interface Paytable {
  id: string;
  name: string;
  game: string;
  avgPayout: number;
  status: BeamStatus;
  usedBy: number;
  payouts: { reward: string; amount: number; probability: number }[];
}

const PAYTABLES: Paytable[] = [
  {
    id: 'pt-1', name: 'Member — Daily Wheel', game: 'RewardsWheel', avgPayout: 1140, status: 'active', usedBy: 4,
    payouts: [
      { reward: 'Betty Coins', amount: 500, probability: 0.5 },
      { reward: 'Betty Coins', amount: 1000, probability: 0.3 },
      { reward: 'Betty Coins', amount: 2500, probability: 0.15 },
      { reward: 'Free Spins', amount: 10, probability: 0.05 },
    ],
  },
  {
    id: 'pt-2', name: 'VIP — Daily Wheel', game: 'RewardsWheel', avgPayout: 8625, status: 'active', usedBy: 2,
    payouts: [
      { reward: 'Betty Coins', amount: 5000, probability: 0.6 },
      { reward: 'Betty Coins', amount: 12500, probability: 0.3 },
      { reward: 'Mystery Box', amount: 1, probability: 0.1 },
    ],
  },
  {
    id: 'pt-3', name: 'Topaz — Daily Game Extra', game: 'Scratcher', avgPayout: 1215, status: 'paused', usedBy: 1,
    payouts: [
      { reward: 'Betty Coins', amount: 900, probability: 0.7 },
      { reward: 'Betty Coins', amount: 1950, probability: 0.3 },
    ],
  },
  {
    id: 'pt-4', name: 'Shop High Volatility', game: 'RewardsWheel', avgPayout: 4310, status: 'draft', usedBy: 0,
    payouts: [
      { reward: 'Betty Coins', amount: 100, probability: 0.9 },
      { reward: 'Betty Coins', amount: 42200, probability: 0.1 },
    ],
  },
];

const paytableColumns: BeamColumn<Paytable>[] = [
  { key: 'name', header: 'Paytable', render: (r) => r.name, getValue: (r) => r.name },
  { key: 'game', header: 'Game', render: (r) => r.game, getValue: (r) => r.game },
  {
    key: 'avg', header: 'Avg payout', align: 'right',
    render: (r) => r.avgPayout.toLocaleString(), getValue: (r) => r.avgPayout,
  },
  { key: 'status', header: 'Status', render: (r) => <BeamStatusBadge status={r.status} /> },
  { key: 'usedBy', header: 'Used by', align: 'right', render: (r) => `${r.usedBy} configs`, getValue: (r) => r.usedBy },
];

export const PaytablesYodaPatterns: StoryObj = {
  render: () => (
    <BeamDataTable<Paytable>
      columns={paytableColumns}
      rows={PAYTABLES}
      getRowId={(r) => r.id}
      selectable
      bulkActions={[
        { id: 'pause', label: 'Pause' },
        { id: 'archive', label: 'Archive', destructive: true },
      ]}
      searchable
      paginated
      renderExpanded={(r) => {
        const sum = r.payouts.reduce((s, p) => s + p.probability, 0);
        return (
          <Stack spacing={1} sx={{ maxWidth: 480 }}>
            {r.payouts.map((p, i) => (
              <Stack key={i} direction="row" justifyContent="space-between">
                <span>{p.reward} × {p.amount.toLocaleString()}</span>
                <span>{Math.round(p.probability * 100)}%</span>
              </Stack>
            ))}
            <Stack direction="row" justifyContent="space-between" sx={{ borderTop: 1, borderColor: 'divider', pt: 1 }}>
              <strong>Probabilities sum to {sum}</strong>
              <strong>Expected avg payout: {r.avgPayout.toLocaleString()}</strong>
            </Stack>
          </Stack>
        );
      }}
      aria-label="Payout tables"
    />
  ),
};
