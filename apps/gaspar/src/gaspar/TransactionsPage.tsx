import { useState } from 'react';
import {
  Typography,
  Paper,
  Tabs,
  Tab,
  Stack,
  Box,
  Divider,
  BeamDataTable,
  BeamStatusBadge,
} from '@betty/beam';
import type { BeamColumn, BeamStatus } from '@betty/beam';

/**
 * The Payment Orchestrator's list screen, built entirely from Beam organisms
 * already shipped for Sunlight — no new components, no product fork. The
 * settlement half of the status vocabulary was added for this screen
 * (BEAM.md §6.4).
 *
 * Patterns carried over from the Yoda audit (§8): status + search on every
 * list, pagination rather than an endless page, and progressive disclosure
 * via row expansion instead of a detail-page round trip.
 */

interface Transaction {
  id: string;
  reference: string;
  player: string;
  method: string;
  provider: string;
  amount: number;
  currency: string;
  status: BeamStatus;
  createdAt: string;
  /** Routing decisions taken for this transaction — shown on expansion */
  route: { step: string; detail: string }[];
}

const PROVIDERS = ['Interac', 'Trustly', 'Paysafe', 'Nuvei', 'Adyen'];
const METHODS = ['Bank transfer', 'Card', 'e-Wallet', 'Voucher'];
const STATUSES: BeamStatus[] = ['settled', 'pending', 'refunded', 'chargeback', 'error'];

const TRANSACTIONS: Transaction[] = Array.from({ length: 24 }, (_, i) => {
  const provider = PROVIDERS[i % PROVIDERS.length];
  const status = STATUSES[i % STATUSES.length];
  const method = METHODS[i % METHODS.length];
  return {
    id: `tx-${1000 + i}`,
    reference: `GSP-${(48213 + i * 7).toString()}`,
    player: ['A. Okafor', 'M. Tremblay', 'S. Patel', 'J. Nowak', 'R. Silva'][i % 5],
    method,
    provider,
    amount: 40 + ((i * 137) % 960),
    currency: 'CAD',
    status,
    createdAt: `2026-07-${String(6 + (i % 14)).padStart(2, '0')} 1${i % 10}:${String((i * 13) % 60).padStart(2, '0')}`,
    route: [
      { step: 'Rule matched', detail: `${method} · amount tier ${i % 3 === 0 ? 'high' : 'standard'}` },
      { step: 'Primary provider', detail: provider },
      {
        step: 'Outcome',
        detail:
          status === 'error'
            ? `Declined by ${provider} — failover not configured`
            : status === 'chargeback'
              ? `Disputed after settlement via ${provider}`
              : `Completed via ${provider}`,
      },
    ],
  };
});

const money = (amount: number, currency: string) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency }).format(amount);

const TABS = ['All', 'Deposits', 'Withdrawals', 'Disputes', 'Reconciliation'];

export function TransactionsPage() {
  const [tab, setTab] = useState(0);

  const columns: BeamColumn<Transaction>[] = [
    { key: 'reference', header: 'Reference', render: (t) => t.reference, getValue: (t) => t.reference, width: 130 },
    { key: 'player', header: 'Player', render: (t) => t.player, getValue: (t) => t.player },
    { key: 'method', header: 'Method', render: (t) => t.method, getValue: (t) => t.method },
    { key: 'provider', header: 'Provider', render: (t) => t.provider, getValue: (t) => t.provider },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (t) => money(t.amount, t.currency),
      getValue: (t) => t.amount,
      width: 130,
    },
    {
      key: 'status',
      header: 'Status',
      render: (t) => <BeamStatusBadge status={t.status} />,
      getValue: (t) => t.status,
      width: 140,
    },
    { key: 'createdAt', header: 'Created', align: 'right', render: (t) => t.createdAt, getValue: (t) => t.createdAt, width: 150 },
  ];

  return (
    <Stack spacing={3}>
      <Typography variant="h4" component="h1">
        Transactions
      </Typography>

      <Paper variant="outlined" sx={{ px: 1 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="Transaction views"
        >
          {TABS.map((t) => (
            <Tab key={t} label={t} />
          ))}
        </Tabs>
      </Paper>

      <BeamDataTable
        columns={columns}
        rows={TRANSACTIONS}
        getRowId={(t) => t.id}
        searchable
        paginated
        renderExpanded={(t) => <RoutePanel transaction={t} />}
        aria-label="Payment transactions"
      />
    </Stack>
  );
}

/**
 * Progressive disclosure: the routing decision trail, inline. The node-graph
 * Rule Builder will eventually render this same data as a graph — this list
 * is the honest placeholder until that library choice is made.
 */
function RoutePanel({ transaction }: { transaction: Transaction }) {
  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={6}>
      <Stack spacing={1} sx={{ minWidth: 260 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Routing trail
        </Typography>
        <Stack
          spacing={0}
          divider={<Divider flexItem />}
          sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}
        >
          {transaction.route.map((step) => (
            <Box key={step.step} sx={{ px: 1.5, py: 1 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                {step.step}
              </Typography>
              <Typography variant="body2">{step.detail}</Typography>
            </Box>
          ))}
        </Stack>
      </Stack>

      <Stack spacing={1}>
        <Typography variant="subtitle2" color="text.secondary">
          Settlement
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <BeamStatusBadge status={transaction.status} />
          <Typography variant="body2" color="text.secondary">
            {money(transaction.amount, transaction.currency)} · {transaction.createdAt}
          </Typography>
        </Stack>
      </Stack>
    </Stack>
  );
}
