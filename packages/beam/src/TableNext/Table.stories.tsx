import type { Meta, StoryObj } from '@storybook/react-vite';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { TableNext } from './Table';
import { beamCells } from './beamCells';
import { useClientPagination } from './useClientPagination';
import type { ColumnDef } from '@tanstack/react-table';
import { BeamStatusBadge } from '../BeamStatusBadge/BeamStatusBadge';
import type { BeamStatus } from '../BeamStatusBadge/BeamStatusBadge.types';
import { PAGE_TOP_GAP, CONTENT_BOTTOM, CONTENT_INLINE, PAGE_SECTION_GAP } from '../theme/tokens';
import { stickyChromeGapSx, stickyChromeExitSx } from '../Table/Table';

/**
 * The Wave-2 official-API Table port (coexists with the current organism `Table` until the migration
 * batches). Columns are raw TanStack `ColumnDef`s, authored terse via `beamCells`; pagination is the
 * official 1-based controlled contract, fed here by the `useClientPagination` demo adapter.
 */
type Person = { name: string; province: string; age: number; tier: string; coins: number };

const data: Person[] = [
  { name: 'Mara', province: 'Ontario', age: 31, tier: 'Gold', coins: 12400 },
  { name: 'Toshko', province: 'Alberta', age: 27, tier: 'Silver', coins: 8800 },
  { name: 'Goshko', province: 'Alberta', age: 19, tier: 'Bronze', coins: 3200 },
  { name: 'Bobko', province: 'Ontario', age: 57, tier: 'Platinum', coins: 21900 },
  { name: 'Zarko', province: 'Alberta', age: 32, tier: 'Bronze', coins: 700 },
];

const columns: ColumnDef<Person, unknown>[] = [
  beamCells.text({ id: 'name', header: 'Name', accessor: (p) => p.name }),
  beamCells.text({ id: 'province', header: 'Province', accessor: (p) => p.province }),
  beamCells.number({ id: 'age', header: 'Age', accessor: (p) => p.age }),
  beamCells.text({ id: 'tier', header: 'Tier', accessor: (p) => p.tier }),
  beamCells.number({ id: 'coins', header: 'Coins', accessor: (p) => p.coins }),
];

const meta: Meta = {
  title: 'Components/Table (Wave 2 port)',
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj;

export const Basic: Story = {
  render: () => (
    <Box sx={{ maxWidth: 720 }}>
      <TableNext data={data} columns={columns} getRowId={(p) => p.name} aria-label="People" />
    </Box>
  ),
};

export const Empty: Story = {
  render: () => (
    <Box sx={{ maxWidth: 720 }}>
      <TableNext data={[]} columns={columns} getRowId={(p) => p.name} emptyMessage="Nothing to display." aria-label="People" />
    </Box>
  ),
};

/** Sorting is an explicit lane opt-in (`sortable`) — off by default, so official-subset renders no sort. */
export const Sortable: Story = {
  render: () => (
    <Box sx={{ maxWidth: 720 }}>
      <TableNext data={data} columns={columns} getRowId={(p) => p.name} sortable aria-label="People" />
    </Box>
  ),
};

export const Actions: Story = {
  render: () => (
    <Box sx={{ maxWidth: 720 }}>
      <TableNext
        data={data}
        columns={columns}
        getRowId={(p) => p.name}
        aria-label="People"
        actionRail={{
          expand: (p) => <>Name: {p.name} · Province: {p.province} · Age: {p.age}</>,
          select: { onSelect: () => undefined, onSelectAll: () => undefined },
          menu: (p) => [
            { id: 'view', label: 'View', onSelect: () => alert(`view ${p.name}`) },
            { id: 'delete', label: 'Delete', destructive: true, onSelect: () => alert(`delete ${p.name}`) },
          ],
        }}
      />
    </Box>
  ),
};

const pageData: Person[] = Array.from({ length: 32 }, (_, i) => ({ ...data[i % data.length], name: `${data[i % data.length].name} ${i + 1}` }));

export const Paginated: Story = {
  render: function PaginatedStory() {
    const { pageRows, pagination, totalCount } = useClientPagination(pageData, { defaultPageSize: 10 });
    return (
      <Box sx={{ maxWidth: 720 }}>
        <TableNext data={pageRows} columns={columns} getRowId={(p) => p.name} pagination={pagination} totalCount={totalCount} aria-label="People" />
      </Box>
    );
  },
};

// ── Sticky-chrome bench (moved from the organism story file in 2b — the port owns stickyChrome now) ──
// The acceptance harness for `stickyChrome`: 1,200 rows, page size 500, the full column set (mono cells,
// badges, rowAccent, rail via selection+menu+expand), jumpToPage + columnManager. The wrapper is a 100vh
// overflow:auto Box — mimicking the AppShell `main` scroll owner, so the page owns the scroll and the grid
// chrome pins to ITS edges.
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
const benchColumns: ColumnDef<BenchRow, unknown>[] = [
  beamCells.timestamp({ id: 'created', header: 'Created At', accessor: (r) => r.created, width: 160 }),
  beamCells.timestamp({ id: 'updated', header: 'Last Updated', accessor: (r) => r.updated, width: 160 }),
  { id: 'id', header: 'Transaction ID', cell: ({ row }) => <Box component="span" sx={mono}>{row.original.id}</Box>, meta: { width: 168 } },
  beamCells.text({ id: 'type', header: 'Direction', accessor: (r) => r.type, width: 124 }),
  beamCells.number({ id: 'amount', header: 'Amount', accessor: (r) => r.amount, format: (n) => n.toFixed(2), width: 110 }),
  beamCells.statusBadge({ id: 'status', header: 'Status', accessor: (r) => r.status, badge: (r) => ({ status: r.status }), width: 132 }),
  beamCells.text({ id: 'customer', header: 'Customer', accessor: (r) => r.customer, width: 130 }),
  beamCells.text({ id: 'email', header: 'Customer Email', accessor: (r) => r.email, width: 220 }),
  { id: 'pspId', header: 'PSP Transaction ID', cell: ({ row }) => <Box component="span" sx={mono}>{row.original.pspId}</Box>, meta: { width: 200 } },
  beamCells.text({ id: 'provider', header: 'Provider', accessor: (r) => r.provider, width: 110 }),
  beamCells.text({ id: 'threeDs', header: '3DS Status', accessor: (r) => r.threeDs, width: 140 }),
  { id: 'errorCode', header: 'Error Code', cell: ({ row }) => <Box component="span" sx={mono}>{row.original.errorCode}</Box>, meta: { width: 120 } },
];

/**
 * Sticky-chrome bench — the eyeball harness (port gate). Scroll the 100vh page: the top BUCKET (batch strip
 * + header clone) pins to the top with dressing, the FOOTER pins to the bottom, rows scroll between. Verify:
 * clone/body columns stay width-identical through resize / column show-hide / reorder / page-size; the clone
 * tracks horizontal scroll with no lag; jump-to-page + manager work while pinned; accents / edge gradients /
 * expanded panels are unaffected; no stale paint (DevTools paint-flashing).
 *
 * THE SIZE FLIP IS THE DEMO of sticky's conditional nature: set rows-per-page to **10** — the grid is
 * shorter than the viewport, so NO chrome pins (no bucket, no footer, no ceiling/floor dressing; spacing
 * identical to a non-sticky grid). Flip to **250 / 500** and watch the chrome engage on its own. Anything
 * rendering stuck at 10 rows is a real bug, not a nit.
 *
 * The **Filters** panel above the grid scales + fades + lifts as it slides under the bucket (a `view()` exit
 * timeline, inset by the measured bucket height). Reduced-motion: the exit stops. Non-Chrome: no exit.
 */
function StickyBench({ fancyBackdrop = false }: { fancyBackdrop?: boolean }) {
  // The port is server-shaped; the demo adapter slices. Default 500, small end (10) included so the INERT
  // state is demonstrable (short grid = zero change). Internal controller (the bench has no URL sync).
  const { pageRows, pagination, totalCount } = useClientPagination(benchRows, { defaultPageSize: 500 });
  return (
    // Mimics AppShell `main`: the scroll owner, carrying CONTENT_TOP/BOTTOM/INLINE as its padding and
    // honoring the FLOOR half of the contract (gives up its bottom padding to the footer floor via :has).
    <Box
      sx={{
        height: '100vh',
        overflowY: 'auto',
        px: CONTENT_INLINE,
        pt: PAGE_TOP_GAP,
        pb: CONTENT_BOTTOM,
        ...(fancyBackdrop ? {} : { bgcolor: 'background.default' }),
        '&:has([data-beam-sticky-chrome])': { pt: 0, pb: 0, scrollSnapType: 'y proximity' },
      }}
    >
      <Stack spacing={PAGE_SECTION_GAP} sx={stickyChromeGapSx}>
        <Typography variant="h6">Sticky-chrome bench — 1,200 rows · page size 500{fancyBackdrop ? ' · fancy backdrop' : ''}</Typography>
        {/* FILTER PANEL — a page section ABOVE the grid, wearing stickyChromeExitSx (the exit-curve target). */}
        <Paper variant="outlined" sx={{ p: 2, ...stickyChromeExitSx }}>
          <Typography variant="overline" sx={{ color: 'text.secondary' }}>Filters</Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
            <TextField size="small" label="Provider" sx={{ width: 200 }} />
            <TextField size="small" label="Status" sx={{ width: 200 }} />
            <TextField size="small" label="Min amount" sx={{ width: 160 }} />
          </Box>
        </Paper>
        <TableNext
          columns={benchColumns}
          data={pageRows}
          getRowId={(r) => r.id}
          pagination={pagination}
          totalCount={totalCount}
          pageSizeOptions={[10, 50, 100, 250, 500]}
          jumpToPage
          stickyChrome
          // Estate pattern: the header expand-ALL caret is BANNED in estate UX (BEAM.md §6) — pass false, as
          // every real page does (Gaspar too). Only official-subset fidelity stories keep the caret.
          expandAll={false}
          // Bulk actions mirror Gaspar's shape (Export · Complete · Decline) so the bucket exercises its real
          // composition; passing bulkActions also drives the rail selection checkboxes (the port's model).
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
          actionRail={{
            expand: (r) => <Box sx={{ py: 1 }}>Transaction {r.id} — {r.type} {r.amount.toFixed(2)} via {r.provider}</Box>,
            menu: () => [{ id: 'view', label: 'View', onSelect: () => {} }],
          }}
          columnManager={{ storageKey: 'bench.sticky.next', catalog: [] }}
          aria-label="Sticky-chrome bench"
        />
      </Stack>
    </Box>
  );
}

export const StickyChromeBench: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => <StickyBench fancyBackdrop={false} />,
};

/**
 * Sticky-chrome over the FANCY page backdrop — the PROOF SURFACE. The scroll owner is transparent so the
 * theme's FIXED mesh + Betty-star backdrop shows. Both edges read as opaque page bands (pageBackdropSx,
 * background-attachment: fixed) — seamless with the section gaps AND no ghosting (rows always occluded).
 */
export const StickyChromeFancyBackdrop: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => <StickyBench fancyBackdrop />,
};

/**
 * Tiered disengagement on SHORT viewports (stickyChrome hardening). The tiers are VIEWPORT-height media
 * queries (+ a matchMedia for tier 3), so each frame below is a real `<iframe>` — its own viewport — loading
 * the sticky bench. Thresholds (strict `<`, composed from constants, no literals): T1 340 · T2 272 · T3 264.
 * (Density rework 2026-09-23: the pin offset shrank 64→8, so the tiers dropped — T1 396→340, T2 328→272 —
 * and the T2 "ceiling collapses" window is now only ~8px, the pin-offset height.)
 *   • Tier 1 (frame 300px, in 272–340): the FOOTER unsticks; ceiling + bucket still pinned.
 *   • Tier 2 (frame 268px, in 264–272): the 8px CEILING band collapses to 0 — chrome pins at the true top.
 *   • Tier 3 (frame 240px, < 264): stickyChrome DISENGAGES — the grid renders as the plain card.
 * The **normal-height** frame (900px) is the PIN_REACHABLE check: at page size 10 the grid fits the viewport,
 * its pin is unreachable, so it renders as the PLAIN CARD; flip to 50/500 and the chrome engages. Expanding a
 * row never toggles engagement — the gate is arithmetic from ROWS-ON-PAGE, not measured height.
 */
export const StickyChromeShortViewport: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => {
    // Load the sticky bench in each frame — a real viewport per iframe. The relative `iframe.html?id=…`
    // resolves the same in dev and the static gh-pages build.
    // NOTE: iframe-URL story ID — a STRING, invisible to typecheck. On any story rename/move it silently 404s
    // the frames. Title is `Components/Table (Wave 2 port)`, so the ID slug is `components-table-wave-2-port`.
    const src = 'iframe.html?id=components-table-wave-2-port--sticky-chrome-bench&viewMode=story';
    const tiers = [
      { h: 900, label: 'Normal 900px — PIN_REACHABLE: page size 10 → plain card; 50/500 → chrome engages' },
      { h: 300, label: 'Tier 1 · frame 300px (272–340) — footer unsticks' },
      { h: 268, label: 'Tier 2 · frame 268px (264–272) — 8px ceiling collapses to 0' },
      { h: 240, label: 'Tier 3 · frame 240px (<264) — sticky disengages → plain card' },
    ];
    return (
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Each frame is its own viewport, so the viewport-height tiers + pin-reachability fire per frame. Flip
          the footer page-size select (10 ↔ 50/500) inside each. Thresholds (strict &lt;): T1 340 · T2 272 · T3
          264px; PIN_REACHABLE engages once the grid overflows the frame.
        </Typography>
        {tiers.map((t) => (
          <Box key={t.h}>
            <Typography variant="overline" sx={{ color: 'text.secondary' }}>{t.label}</Typography>
            <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden', mt: 0.5 }}>
              <iframe src={src} title={t.label} style={{ display: 'block', width: '100%', height: t.h, border: 0 }} />
            </Box>
          </Box>
        ))}
      </Box>
    );
  },
};
