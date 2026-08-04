import type { Meta, StoryObj } from '@storybook/react-vite';
import { BeamDataTable } from './BeamDataTable';
import type { BeamColumn } from './BeamDataTable.types';
import { BeamStatusBadge } from '../BeamStatusBadge/BeamStatusBadge';
import type { BeamStatus } from '../BeamStatusBadge/BeamStatusBadge.types';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';

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

/**
 * The row-controls rail: expand + select + kebab in one pinned first column,
 * fixed order. Extra wide columns force horizontal scroll so the sticky rail
 * (and its hover/selected background) can be seen holding its ground. The
 * kebab is dim until the row is hovered or focused.
 */
const wideColumns: BeamColumn<Perk>[] = [
  { key: 'name', header: 'Perk', render: (r) => r.name, width: 260 },
  { key: 'loyalty', header: 'Loyalty status', render: (r) => r.loyaltyStatus, width: 200 },
  { key: 'reward', header: 'Reward', render: (r) => r.reward, width: 220 },
  { key: 'status', header: 'Status', render: (r) => <BeamStatusBadge status={r.status} />, width: 160 },
  { key: 'updated', header: 'Updated', render: (r) => r.updated, align: 'right', width: 200 },
];

export const RowControlsRail: StoryObj = {
  render: () => (
    <BeamDataTable<Perk>
      columns={wideColumns}
      rows={rows}
      getRowId={(r) => r.id}
      selectable
      onRowClick={(r) => console.log('inspect', r.id)}
      renderExpanded={(r) => (
        <Stack sx={{ px: 1, py: 1 }}>Reward: {r.reward}</Stack>
      )}
      rowActions={(r) => [
        { id: 'edit', label: 'Edit', onSelect: () => console.log('edit', r.id) },
        { id: 'duplicate', label: 'Duplicate', onSelect: () => console.log('dup', r.id) },
        {
          id: 'pause',
          label: 'Pause',
          onSelect: () => {},
          disabled: r.status !== 'active',
          disabledReason: 'Only active perks can be paused.',
        },
        { id: 'archive', label: 'Archive', destructive: true, onSelect: () => console.log('archive', r.id) },
      ]}
      aria-label="Perks with row controls rail"
    />
  ),
};

/**
 * Row actions as data (grammar §3): ONE `rowActions` definition, projected to
 * every surface. Open the kebab AND expand a row — the menu and the appended
 * action bar render the SAME set, so they can't drift. Exercises a
 * state-dependent label (Pause ↔ Resume), a destructive action (Archive), and a
 * disabled action with a reason (Schedule — only drafts).
 */
export const RowActionsProjection: StoryObj = {
  render: () => (
    <BeamDataTable<Perk>
      columns={wideColumns}
      rows={rows}
      getRowId={(r) => r.id}
      renderExpanded={(r) => <Stack sx={{ px: 1, py: 1 }}>Reward: {r.reward}</Stack>}
      rowActions={(r) => [
        { id: 'edit', label: 'Edit', onSelect: () => console.log('edit', r.id) },
        r.status === 'paused'
          ? { id: 'resume', label: 'Resume', onSelect: () => console.log('resume', r.id) }
          : { id: 'pause', label: 'Pause', onSelect: () => console.log('pause', r.id) },
        {
          id: 'schedule',
          label: 'Schedule',
          onSelect: () => {},
          disabled: r.status !== 'draft',
          disabledReason: 'Only drafts can be scheduled.',
        },
        { id: 'archive', label: 'Archive', destructive: true, onSelect: () => console.log('archive', r.id) },
      ]}
      aria-label="Row actions projected to kebab + expansion bar"
    />
  ),
};

/**
 * Rail scroll affordance: a deliberately narrow container forces horizontal
 * scroll so the bench can exercise the pinned rail's elevation cue. At
 * scrollLeft 0 the rail is flush — no divider, no shadow; scroll right and a
 * rightward shadow + an inset right-edge divider fade in (geometry never moves).
 * Chrome drives it with the scroll-state container query; Safari/Firefox via the
 * JS base. Shadow/divider values are plain — Deyan tunes them on the bench.
 */
export const RailScrollAffordance: StoryObj = {
  render: () => (
    <Box sx={{ maxWidth: 480 }}>
      <BeamDataTable<Perk>
        columns={wideColumns}
        rows={rows}
        getRowId={(r) => r.id}
        selectable
        rowActions={(r) => [{ id: 'edit', label: 'Edit', onSelect: () => console.log('edit', r.id) }]}
        aria-label="Rail scroll affordance demo"
      />
    </Box>
  ),
};

/**
 * Identity link + inspect: the Perk name is a true link to the record's
 * canonical page (real <a> — middle-click, new-tab), while a click anywhere
 * else on the row inspects it. The rail never navigates.
 */
export const IdentityLink: StoryObj = {
  render: () => {
    const linkedColumns: BeamColumn<Perk>[] = [
      {
        key: 'name',
        header: 'Perk',
        render: (r) => r.name,
        isIdentity: true,
        getHref: (r) => `#/perks/${r.id}`,
      },
      ...columns.slice(1),
    ];
    return (
      <BeamDataTable<Perk>
        columns={linkedColumns}
        rows={rows}
        getRowId={(r) => r.id}
        onRowClick={(r) => console.log('inspect', r.id)}
        rowActions={(r) => [
          { id: 'edit', label: 'Edit', onSelect: () => console.log('edit', r.id) },
          { id: 'delete', label: 'Delete', destructive: true, onSelect: () => console.log('delete', r.id) },
        ]}
        aria-label="Perks with identity link"
      />
    );
  },
};

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
              <Stack key={i} direction="row" sx={{ justifyContent: 'space-between' }}>
                <span>{p.reward} × {p.amount.toLocaleString()}</span>
                <span>{Math.round(p.probability * 100)}%</span>
              </Stack>
            ))}
            <Stack direction="row" sx={{ justifyContent: 'space-between', borderTop: 1, borderColor: 'divider', pt: 1 }}>
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
