import type { ReactNode } from 'react';
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
  return (
    <Paper
      variant="outlined"
      sx={{
        height: '100%',
        p: 1.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        containerType: 'inline-size',
        overflow: 'hidden',
        // Opt-in lit-edge treatment. surface = paper (= surface 1, correct for a
        // widget shell); interactive so hover resumes the rotation. It replaces
        // the outlined 1px border (same 1px → no reflow); the squircle from
        // MuiPaper.rounded is left intact (its clipping vs the gradient is the
        // visual check).
        ...(gradientBorder ? (beamGradientBorder({ interactive: true }) as object) : {}),
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

export const WIDGETS: Record<WidgetId, { title: string; node: ReactNode }> = {
  kpi: { title: 'KPI', node: <KpiCardWidget /> },
  band: { title: 'Trend', node: <BandWidget /> },
  status: {
    title: 'Gateway status',
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
    node: (
      <BeamDataTable<TxnRow>
        aria-label="Recent transactions"
        columns={TXN_COLUMNS}
        rows={TXN_ROWS}
        getRowId={(r) => r.id}
      />
    ),
  },
  nextgem: { title: 'Cutoff', node: <NextGemStandIn /> },
};
