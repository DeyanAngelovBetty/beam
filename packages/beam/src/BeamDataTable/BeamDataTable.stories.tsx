import type { Meta, StoryObj } from '@storybook/react-vite';
import { BeamDataTable } from './BeamDataTable';
import type { BeamColumn } from './BeamDataTable.types';
import { BeamStatusBadge } from '../BeamStatusBadge/BeamStatusBadge';
import type { BeamStatus } from '../BeamStatusBadge/BeamStatusBadge.types';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { CONTENT_TOP, CONTENT_BOTTOM, CONTENT_INLINE, PAGE_SECTION_GAP } from '../theme/tokens';
import { stickyChromeGapSx } from './BeamDataTable';

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
      <BeamDataTable<WideRow>
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
    <BeamDataTable<Perk>
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
      <BeamDataTable<WideRow>
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

// ── Sticky-chrome bench ─────────────────────────────────────────────────────────────────────────────
// The acceptance harness for `stickyChrome`: 1,200 rows, page size 500, the full column set (mono/copy
// cells, badges, rowAccent, rail via selectable+rowActions+renderExpanded), jumpToPage + columnManager.
// The wrapper is a 100vh overflow:auto Box — mimicking the AppShell `main` scroll owner, so the page
// (this Box) owns the scroll and the grid chrome pins to ITS edges.
interface BenchRow {
  id: string;
  created: string;
  updated: string;
  type: string;
  amount: number;
  status: BeamStatus;
  customer: string;
  email: string;
  pspId: string;
  provider: string;
  threeDs: string;
  errorCode: string;
}

const BENCH_STATUSES: BeamStatus[] = ['active', 'scheduled', 'paused', 'expired', 'draft'];
const BENCH_PROVIDERS = ['Nuvei', 'Adyen'];
const BENCH_TYPES = ['Deposit', 'Withdrawal'];
const BENCH_3DS = ['Authenticated', 'NotRequired'];
const BENCH_MTI = ['0100', '0200', '0210', '0400', '0800'];
const benchRows: BenchRow[] = Array.from({ length: 1200 }, (_, i) => {
  const bucket = i % 10;
  const status = bucket <= 3 ? 'active' : bucket <= 5 ? 'scheduled' : bucket === 6 ? 'paused' : bucket === 7 ? 'draft' : 'expired';
  const token = (100000 + i * 37).toString(36).toUpperCase().padStart(10, '0');
  const created = new Date(Date.UTC(2026, 7, 20, 8, 0, 0) + ((i * 13) % 40) * 86_400_000 + (i % 24) * 3_600_000);
  return {
    id: `pay_${token}`,
    created: created.toISOString().slice(0, 16).replace('T', ' '),
    updated: new Date(created.getTime() + 3_600_000).toISOString().slice(0, 16).replace('T', ' '),
    type: BENCH_TYPES[i % 2],
    amount: Number((12.5 + (i % 50) * 7.25).toFixed(2)),
    status: status as BeamStatus,
    customer: `cus_${74120 + i}`,
    email: `player${74120 + i}@example.com`,
    pspId: `${BENCH_PROVIDERS[i % 2].toLowerCase()}_txn_${88213400 + i * 7}`,
    provider: BENCH_PROVIDERS[i % 2],
    threeDs: BENCH_3DS[i % 6 === 0 ? 0 : 1],
    errorCode: status === 'expired' ? BENCH_MTI[i % BENCH_MTI.length] : '—',
  };
});

const mono = { fontFamily: 'monospace', whiteSpace: 'nowrap' } as const;
const benchColumns: BeamColumn<BenchRow>[] = [
  { key: 'created', header: 'Created At', align: 'right', width: 160, getValue: (r) => r.created, render: (r) => <Box component="span" sx={{ whiteSpace: 'nowrap' }}>{r.created}</Box> },
  { key: 'updated', header: 'Last Updated', align: 'right', width: 160, getValue: (r) => r.updated, render: (r) => <Box component="span" sx={{ whiteSpace: 'nowrap' }}>{r.updated}</Box> },
  { key: 'id', header: 'Transaction ID', width: 168, getValue: (r) => r.id, render: (r) => <Box component="span" sx={mono}>{r.id}</Box> },
  { key: 'type', header: 'Direction', width: 124, getValue: (r) => r.type, render: (r) => r.type },
  { key: 'amount', header: 'Amount', align: 'right', width: 110, getValue: (r) => r.amount, render: (r) => r.amount.toFixed(2) },
  { key: 'status', header: 'Status', width: 132, getValue: (r) => r.status, render: (r) => <BeamStatusBadge status={r.status} size="small" /> },
  { key: 'customer', header: 'Customer', width: 130, getValue: (r) => r.customer, render: (r) => r.customer },
  { key: 'email', header: 'Customer Email', width: 220, getValue: (r) => r.email, render: (r) => <Box component="span" sx={{ whiteSpace: 'nowrap' }}>{r.email}</Box> },
  { key: 'pspId', header: 'PSP Transaction ID', width: 200, getValue: (r) => r.pspId, render: (r) => <Box component="span" sx={mono}>{r.pspId}</Box> },
  { key: 'provider', header: 'Provider', width: 110, getValue: (r) => r.provider, render: (r) => r.provider },
  { key: 'threeDs', header: '3DS Status', width: 140, getValue: (r) => r.threeDs, render: (r) => r.threeDs },
  { key: 'errorCode', header: 'Error Code', width: 120, getValue: (r) => r.errorCode, render: (r) => <Box component="span" sx={mono}>{r.errorCode}</Box> },
];

/**
 * Sticky-chrome bench — the eyeball harness (organism gate). Scroll the 100vh page: the top BUCKET
 * (batch strip + header clone) pins to the top with dressing, the FOOTER pins to the bottom, rows
 * scroll between. Verify: clone/body columns stay width-identical through resize / column show-hide /
 * reorder / page-size; the clone tracks horizontal scroll with no lag; jump-to-page + manager work
 * while pinned; accents / edge gradients / expanded panels are unaffected; no stale paint (DevTools
 * paint-flashing). Toggle `stickyChrome` off in Controls to confirm byte-identity.
 *
 * THE SIZE FLIP IS THE DEMO of sticky's conditional nature: set rows-per-page to **10** — the grid is
 * shorter than the viewport, so NO chrome pins (no bucket, no footer, no ceiling/floor dressing; spacing
 * identical to a non-sticky grid). Flip to **250 / 500** and watch the chrome engage on its own. Anything
 * rendering stuck at 10 rows is a real bug, not a nit.
 */
// Shared bench render — `fancyBackdrop` drops the scroll-owner's flat `background.default` so the theme's
// FIXED page backdrop (mesh + star, body::before/after) shows through, proving the chrome ceiling/floor
// outers are transparent (they reveal the backdrop, not a color). Both variants otherwise identical.
function renderStickyBench(fancyBackdrop: boolean) {
  return (
    // Mimics AppShell `main`: the scroll owner, carrying CONTENT_TOP/BOTTOM/INLINE as its padding and
    // honoring the FLOOR half of the contract (gives up its bottom padding to the footer floor via :has).
    <Box
      sx={{
        height: '100vh',
        overflowY: 'auto',
        px: CONTENT_INLINE,
        pt: CONTENT_TOP,
        pb: CONTENT_BOTTOM,
        // Flat variant paints `background.default`; the fancy variant leaves it transparent so the theme's
        // fixed mesh/star backdrop shows — the ceiling/floor outers must reveal it seamlessly.
        ...(fancyBackdrop ? {} : { bgcolor: 'background.default' }),
        // Mirror the shell contract: donate BOTH top + bottom padding to the sticky grid's ceiling/floor
        // (the Stack re-adopts the top via stickyChromeGapSx).
        '&:has([data-beam-sticky-chrome])': { pt: 0, pb: 0 },
      }}
    >
      {/* The page's section container — the CEILING half: spacing from the shared token + the gap-surgery
          sx, so the heading→grid seam is donated to the bucket ceiling when the grid is sticky. */}
      <Stack spacing={PAGE_SECTION_GAP} sx={stickyChromeGapSx}>
        <Typography variant="h6">Sticky-chrome bench — 1,200 rows · page size 500{fancyBackdrop ? ' · fancy backdrop' : ''}</Typography>
        <BeamDataTable<BenchRow>
          columns={benchColumns}
          rows={benchRows}
          getRowId={(r) => r.id}
          paginated
          defaultPageSize={500}
          // Includes the small end (10) so the INERT state is demonstrable: at 10 rows the grid is shorter
          // than the viewport and NO chrome pins — the "short grid = zero change" line exercised, not
          // asserted. Flip to 250/500 and the chrome engages on its own. (Bench-only; Gaspar's set differs.)
          pageSizeOptions={[10, 50, 100, 250, 500]}
          jumpToPage
          stickyChrome
          selectable
          // Bulk actions mirror Gaspar's shape (Export · Complete · Decline; disabled/destructive/confirm)
          // so the bucket exercises its real composition — the strip pins ABOVE the header clone.
          bulkActions={(selectedRows) => {
            const noEligible = selectedRows.every((r) => r.status !== 'scheduled');
            return [
              { id: 'export', label: 'Export' },
              { id: 'complete', label: 'Complete', confirm: true, disabled: noEligible, disabledReason: 'Only Scheduled rows can be completed (bench).' },
              { id: 'decline', label: 'Decline', destructive: true, disabled: noEligible, disabledReason: 'Only Scheduled rows can be declined (bench).' },
            ];
          }}
          onBulkAction={() => {}}
          rowAccent={(r) => (r.status === 'expired' ? 'danger' : undefined)}
          rowActions={() => [{ id: 'view', label: 'View', onSelect: () => {} }]}
          renderExpanded={(r) => <Box sx={{ py: 1 }}>Transaction {r.id} — {r.type} {r.amount.toFixed(2)} via {r.provider}</Box>}
          columnManager={{ storageKey: 'bench.sticky', catalog: [] }}
          aria-label="Sticky-chrome bench"
        />
      </Stack>
    </Box>
  );
}

export const StickyChromeBench: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => renderStickyBench(false),
};

/**
 * Sticky-chrome over the FANCY page backdrop — the PROOF SURFACE. The scroll owner is transparent so the
 * theme's FIXED mesh + Betty-star backdrop (body::before/after) shows. The ceiling/floor bands PAINT a
 * copy of that backdrop (base + mesh, background-attachment: fixed), so scrolling through the pins must
 * show: (1) the bands **indistinguishable from the section gaps** — same viewport-fixed mesh, no seam; AND
 * (2) **no ghosting** — rows scroll under the pinned chrome and nothing shows through (the opaque painted
 * band + the paper inners occlude them).
 *
 * This story exists because TRANSPARENCY WAS TRIED AND FALSIFIED: transparent bands sit over content that
 * transits them as it scrolls off, so rows ghosted through. The fix is opaque-by-composition (paint the
 * backdrop), seamless-by-construction (fixed attachment samples the same viewport pixels). (The Betty star
 * is a mask, not a fixed-attachable image, so it isn't in the bands — imperceptible at band height; see
 * pageBackdropSx.)
 */
export const StickyChromeFancyBackdrop: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => renderStickyBench(true),
};
