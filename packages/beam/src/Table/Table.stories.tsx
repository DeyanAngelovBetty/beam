import type { Meta, StoryObj } from '@storybook/react-vite';
import { Table } from './Table';
import type { BeamColumn } from './Table.types';
import { BeamStatusBadge } from '../BeamStatusBadge/BeamStatusBadge';
import type { BeamStatus } from '../BeamStatusBadge/BeamStatusBadge.types';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
// The sticky-chrome bench stories moved to the Wave-2 port's story file (TableNext/Table.stories.tsx) in
// batch 2b — the port owns stickyChrome now (Gaspar migrated onto it). This file keeps the organism's
// non-sticky stories as its regression harness.

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

const meta: Meta<typeof Table<Perk>> = {
  title: 'Components/Table',
  component: Table,
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj<typeof Table<Perk>>;

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
    <Table<Perk>
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
    <Table<Perk>
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
      <Table<Perk>
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
      <Table<Perk>
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

/**
 * Column manager (bullet 3): the footer trigger (leftmost) opens a popover to show/hide + reorder columns,
 * persisted to localStorage under `beam:grid:beam.demo.perks:columns:v1`. `Updated` ships hidden
 * (`defaultHidden`); the `catalog` lists non-rendered "awaiting data" columns (option b). Reorder via
 * the ▲/▼ buttons (keyboard + pointer); "Reset to defaults" clears storage. Grids WITHOUT the prop are
 * unaffected — the capability is opt-in.
 */
const managedColumns: BeamColumn<Perk>[] = [
  { key: 'name', header: 'Perk', render: (r) => r.name, getValue: (r) => r.name },
  { key: 'loyalty', header: 'Loyalty status', render: (r) => r.loyaltyStatus, getValue: (r) => r.loyaltyStatus },
  { key: 'reward', header: 'Reward', render: (r) => r.reward, getValue: (r) => r.reward },
  { key: 'status', header: 'Status', render: (r) => <BeamStatusBadge status={r.status} />, getValue: (r) => r.status },
  { key: 'updated', header: 'Updated', render: (r) => r.updated, align: 'right', getValue: (r) => r.updated, defaultHidden: true },
];

export const ColumnManager: Story = {
  args: {
    columns: managedColumns,
    rows,
    getRowId: (r: Perk) => r.id,
    columnManager: {
      storageKey: 'beam.demo.perks',
      catalog: [
        { id: 'redemptions', label: 'Redemptions' },
        { id: 'lastRedeemed', label: 'Last redeemed' },
      ],
    },
    'aria-label': 'Perks — column manager',
  },
};

/**
 * Horizontal-overflow affordances (density installment #2). Wide columns force horizontal scroll to
 * exercise the edge affordances (matching soft gradients from one token): the RIGHT shadow at the
 * container edge (visible at start/mid, gone at end) and, on the LEFT, a crisp 1px boundary line PLUS
 * the rightward-fading gradient from the pinned rail's right edge (both appear once scrolled off start)
 * — and, via `renderExpanded`, the
 * expanded panel PINNED to the visible scroll-area width (`100cqw` + sticky), so the timeline + action
 * bar never scroll sideways. `selectable` is on so the rail renders (the left shadow's home). Narrow
 * the canvas to see shadows appear; widen past the table to see them all vanish (no overflow → none).
 */
interface WideRow {
  id: string;
  ref: string;
  customer: string;
  email: string;
  method: string;
  provider: string;
  amount: string;
  currency: string;
  status: BeamStatus;
  created: string;
  updated: string;
  note: string;
}
const wideCols: BeamColumn<WideRow>[] = [
  { key: 'ref', header: 'Reference', render: (r) => r.ref, getValue: (r) => r.ref, width: 160 },
  { key: 'customer', header: 'Customer', render: (r) => r.customer, getValue: (r) => r.customer, width: 180 },
  { key: 'email', header: 'Email', render: (r) => r.email, getValue: (r) => r.email, width: 240 },
  { key: 'method', header: 'Method', render: (r) => r.method, getValue: (r) => r.method, width: 160 },
  { key: 'provider', header: 'Provider', render: (r) => r.provider, getValue: (r) => r.provider, width: 160 },
  { key: 'amount', header: 'Amount', align: 'right', render: (r) => r.amount, getValue: (r) => r.amount, width: 140 },
  { key: 'currency', header: 'Currency', render: (r) => r.currency, getValue: (r) => r.currency, width: 120 },
  { key: 'status', header: 'Status', render: (r) => <BeamStatusBadge status={r.status} />, getValue: (r) => r.status, width: 150 },
  { key: 'created', header: 'Created', align: 'right', render: (r) => r.created, getValue: (r) => r.created, width: 170 },
  { key: 'updated', header: 'Last updated', align: 'right', render: (r) => r.updated, getValue: (r) => r.updated, width: 170 },
  { key: 'note', header: 'Note', render: (r) => r.note, getValue: (r) => r.note, width: 260 },
];
const wideRows: WideRow[] = Array.from({ length: 8 }, (_, i) => ({
  id: `w-${i}`,
  ref: `GSP-${48213 + i * 7}`,
  customer: ['A. Okafor', 'M. Tremblay', 'S. Patel', 'J. Nowak', 'R. Silva'][i % 5],
  email: `operator${i}@example.com`,
  method: ['Bank transfer', 'Card', 'e-Wallet', 'Voucher'][i % 4],
  provider: ['Interac', 'Trustly', 'Paysafe', 'Nuvei'][i % 4],
  amount: (40 + ((i * 137) % 960)).toFixed(2),
  currency: 'CAD',
  status: (['settled', 'pending', 'refunded', 'chargeback'] as BeamStatus[])[i % 4],
  created: `2026-07-${String(6 + i).padStart(2, '0')} 10:${String((i * 13) % 60).padStart(2, '0')}`,
  updated: `2026-07-${String(7 + i).padStart(2, '0')} 11:${String((i * 17) % 60).padStart(2, '0')}`,
  note: 'Routed on primary; no failover configured for this tier.',
}));

export const HorizontalOverflow: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 720 }}>
      <Table<WideRow>
        columns={wideCols}
        rows={wideRows}
        getRowId={(r) => r.id}
        selectable
        renderExpanded={(r) => (
          <Stack spacing={1}>
            <Box sx={{ fontWeight: 600 }}>Detail — {r.ref}</Box>
            <Box sx={{ color: 'text.secondary' }}>
              This panel stays pinned to the visible width; scroll the table sideways and it does not move.
            </Box>
            <Box sx={{ color: 'text.secondary' }}>{r.note}</Box>
          </Stack>
        )}
        aria-label="Wide transactions (overflow affordances)"
      />
    </div>
  ),
};

/** No horizontal overflow → shadows must NEVER appear (acceptance). Same columns, roomy canvas. */
export const NoOverflowNoShadows: StoryObj = {
  render: () => (
    <Table<Perk>
      columns={columns}
      rows={rows}
      getRowId={(r) => r.id}
      selectable
      aria-label="No overflow — no shadows"
    />
  ),
};

/**
 * Row severity accent (`rowAccent`) — a thin colored bar at the row's LEADING edge, redundant
 * reinforcement of the status chip (chip names, accent locates; state-rendering-grammar spatial-accents
 * note). Status-truth: scroll sideways and it holds at every position (not scroll-conditional). Here
 * `chargeback` rows accent `danger`. Decorative / `aria-hidden`; grids without `rowAccent` are
 * unchanged.
 */
const accentRows: WideRow[] = wideRows.map((r, i) => (i === 2 || i === 6 ? { ...r, status: 'chargeback' as BeamStatus } : r));

export const SeverityAccent: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 720 }}>
      <Typography variant="overline" color="text.secondary">Leading-edge danger accent (chargeback rows)</Typography>
      <Table<WideRow>
        columns={wideCols}
        rows={accentRows}
        getRowId={(r) => r.id}
        selectable
        rowAccent={(r) => (r.status === 'chargeback' ? 'danger' : undefined)}
        aria-label="Severity accent — leading edge"
      />
    </div>
  ),
};
