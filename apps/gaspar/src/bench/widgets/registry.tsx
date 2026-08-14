import { useRef, type ReactNode } from 'react';
import {
  Box,
  Stack,
  Paper,
  Typography,
  Chip,
  BeamStatusBadge,
  BeamDataTable,
  BeamFilterBar,
  beamGradientBorder,
  usePointerAngleTracking,
} from '@betty/beam';
import type { BeamColumn } from '@betty/beam';
import type { WidgetId } from '../dashboardConfig';
import { BandWidget } from './BandWidget';
import { KpiCardWidget } from './KpiCardWidget';
import { NextGemStandIn } from './NextGemStandIn';

/**
 * The six dummy widgets, keyed by id. Both variants render from this one map so
 * the widget set (and thus `visibleWidgetIds` filtering) is identical across
 * them. Dummy data only — no API calls.
 *
 * `WidgetShell` carries the SETTLED BORDER GRAMMAR (outlined Paper) and, load-
 * bearing for the bench, establishes a `container-type: inline-size` context so
 * each widget's internals respond to its OWN resolved width — in the static
 * grid AND inside a dockview panel, unchanged.
 */

export function WidgetShell({
  title,
  children,
  gradientBorder = false,
}: {
  title: string;
  children: ReactNode;
  gradientBorder?: boolean;
}) {
  // Pointer-tracked rim: the hook writes --beam-track-angle on this element; the ref is only
  // attached on the gradient variant, so on the plain variant ref.current is null and the hook
  // no-ops (no listeners on unrimmed widgets).
  const shellRef = useRef<HTMLDivElement>(null);
  usePointerAngleTracking(shellRef);
  return (
    <Paper
      ref={gradientBorder ? shellRef : undefined}
      variant="outlined"
      sx={{
        height: '100%',
        p: 1.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        containerType: 'inline-size',
        // NO `overflow: hidden` here — it would CLIP the outward gradient rim
        // (beamGradientBorder draws it on an `::after` that sits OUTSIDE this box).
        // The rounded bg/border still self-clip to the squircle without it; content is
        // inset by `p: 1.5`. If a widget's content ever bleeds past the corner, clip it
        // on the INNER content Box below — never restore overflow:hidden here or the rim
        // silently disappears.
        // Opt-in lit-edge treatment. surface = paper (= surface 1, correct for a widget
        // shell); `track` so the bright sector LEANS toward the pointer on hover (the
        // usePointerAngleTracking above drives it) and the rim grows 1px → 2px OUTWARD. It sets
        // border:none and carries the whole rim on the pseudo (no reflow — the box never changes
        // size); squircle is matched explicitly on the rim.
        ...(gradientBorder ? (beamGradientBorder({ track: true }) as object) : {}),
      }}
    >
      <Typography
        variant="overline"
        color="text.secondary"
        sx={{ lineHeight: 1, letterSpacing: 0.4 }}
      >
        {title}
      </Typography>
      <Box sx={{ flex: 1, minHeight: 0 }}>{children}</Box>
    </Paper>
  );
}

// ---- dummy data for the organism-backed widgets ------------------------------

interface TxnRow {
  id: string;
  provider: string;
  amount: string;
  status: 'active' | 'error' | 'scheduled';
}

const TXN_ROWS: TxnRow[] = [
  { id: 'tx_9f21', provider: 'Stripe', amount: '£1,240.00', status: 'active' },
  { id: 'tx_9f18', provider: 'Adyen', amount: '£880.50', status: 'scheduled' },
  { id: 'tx_9f0c', provider: 'Checkout', amount: '£3,010.00', status: 'error' },
  { id: 'tx_9ef7', provider: 'Stripe', amount: '£420.00', status: 'active' },
];

const TXN_COLUMNS: BeamColumn<TxnRow>[] = [
  { key: 'provider', header: 'Provider', render: (r) => r.provider, getValue: (r) => r.provider },
  {
    key: 'amount',
    header: 'Amount',
    align: 'right',
    render: (r) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{r.amount}</span>,
  },
  { key: 'status', header: 'Status', render: (r) => <BeamStatusBadge status={r.status} size="small" /> },
];

// ---- the registry ------------------------------------------------------------

/**
 * A card's OWN width declaration for Variant 3 ("cards declare, container satisfies").
 * FOUR forms:
 *   1            — never spans; always a single track (a compact card)
 *   N            — wants N tracks, but takes what exists if the grid is narrower
 *   {divisor,…}  — a PROPORTION of the grid (~1/divisor), bounded [min, max]; responds
 *                  to track count — the ONLY dynamic input a card has
 *   'full'       — always EVERY track, at any count (grid-column: 1 / -1; ceiling-free)
 */
export type CardSpan = number | 'full' | { divisor: number; min: number; max: number };

/**
 * `span` lives HERE, in the widget definition, NOT in dashboardConfig — the card knows its
 * content, the config author doesn't. Variant 3 reads it (numeric/proportional spans
 * clamped to the real track count); Variants 1 & 2 ignore it and use colSpan/rowSpan from
 * config. A card cannot be dragged wider — the card decides its span (BEAM Appendix C).
 */
export const WIDGETS: Record<WidgetId, { title: string; node: ReactNode; span: CardSpan }> = {
  kpi: { title: 'KPI', node: <KpiCardWidget />, span: 2 }, // ≥2 tracks reveals its chart (CQ.threeCol)
  // Proportional: ~half the grid, never < 2, never > 4. Responds to track count — a wider
  // grid gives the trend chart more room. (Bench finding: it RELOCATES the parity hole
  // 6→7, does not reduce it — a monotonic span can't fix a parity gap. See BEAM App. C.)
  band: { title: 'Trend', node: <BandWidget />, span: { divisor: 2, min: 2, max: 4 } },
  status: {
    title: 'Gateway status',
    span: 1, // three badges, compact
    node: (
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
        <BeamStatusBadge status="active" label="Routing" />
        <BeamStatusBadge status="scheduled" label="Settlement" />
        <BeamStatusBadge status="error" label="Adyen" />
      </Stack>
    ),
  },
  filter: {
    title: 'Filters',
    span: 'full', // a filter bar owns its whole row at every width (1 / -1) — "span 4" was a proxy for this
    node: (
      <BeamFilterBar
        aria-label="Dashboard filters"
        searchValue=""
        onSearchChange={() => {}}
        searchPlaceholder="Search transactions…"
      >
        <Chip label="Last 24h" size="small" />
        <Chip label="All providers" size="small" variant="outlined" />
      </BeamFilterBar>
    ),
  },
  table: {
    title: 'Recent transactions',
    span: 3, // a data table wants width
    node: (
      <BeamDataTable<TxnRow>
        aria-label="Recent transactions"
        columns={TXN_COLUMNS}
        rows={TXN_ROWS}
        getRowId={(r) => r.id}
      />
    ),
  },
  nextgem: { title: 'Cutoff', node: <NextGemStandIn />, span: 2 }, // progress + figures
};
