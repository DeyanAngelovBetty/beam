import { useState } from 'react';
import {
  Stack,
  Button,
  Chip,
  BeamPage,
  BeamStat,
  DetailsPanel,
  BeamTabs,
  TableFilters,
  useTableFilters,
  Table,
  BeamStatusBadge,
} from '@betty/beam';
import type { BeamColumn, BeamTabItem, TableFilterDefinition } from '@betty/beam';
import { CURRENT_PLAYER, TRANSACTIONS, type PaymentTransaction } from './players';

/**
 * The player Payments tab, retrofitted — the marquee slice of this demo.
 *
 * This is the one screen in the repo whose domain genuinely has two levels
 * of tabs (player section, then payments sub-section), which is why
 * BeamTabs supports nesting at all. Sunlight and Gaspar deliberately don't
 * use it.
 *
 * The entity summary is a row of BeamStat rather than a bespoke header
 * block — the same nuggets Midnight shows, in a component other screens
 * can reuse.
 */

interface PlayerPaymentsPageProps {
  onBack: () => void;
}

const PLAYER_TABS: BeamTabItem[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'details', label: 'Player Details' },
  {
    id: 'payments',
    label: 'Payments',
    children: [
      { id: 'transactions', label: 'Payment Transactions' },
      { id: 'methods', label: 'Payment Methods' },
      { id: 'interac', label: 'Interac Emails' },
      { id: 'prepaid', label: 'Prepaid Limits' },
    ],
  },
  { id: 'purchases', label: 'Purchases' },
  { id: 'promotions', label: 'Promotions' },
  { id: 'journey', label: 'Journey History' },
  { id: 'gameplay', label: 'Gameplay' },
  { id: 'sessions', label: 'Sessions' },
  { id: 'loyalty', label: 'Loyalty' },
  { id: 'rg', label: 'Responsible Gambling' },
  { id: 'kyc', label: 'KYC Checks' },
  { id: 'aml', label: 'AML' },
  { id: 'notes', label: 'Notes' },
  { id: 'audit', label: 'Audit' },
];

const RANGE_PRESETS = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: '7d', label: 'Last 7 days' },
  { id: 'month', label: 'This month' },
  { id: '30d', label: 'Last 30 days' },
  { id: '60d', label: 'Last 60 days' },
];

// Retrofit demo: these fields are illustrative (the Table shows all TRANSACTIONS; nothing filters yet).
// Modelled as definitions to exercise the ported bar. Dates kept as plain text (matching the original
// placeholder fields — the dateTime-sliced ruling is for Gaspar's live date filters).
interface TxFilters {
  transactionId: string;
  startDate: string;
  endDate: string;
  method: string;
  status: string;
  type: string;
}
const EMPTY: TxFilters = { transactionId: '', startDate: '', endDate: '', method: 'any', status: 'any', type: 'any' };
const TX_DEFS: TableFilterDefinition<TxFilters>[] = [
  { key: 'transactionId', control: 'text', label: 'Transaction ID' },
  { key: 'startDate', control: 'text', label: 'Start date' },
  { key: 'endDate', control: 'text', label: 'End date' },
  { key: 'method', control: 'select', label: 'Payment method', options: [{ label: 'Any', value: 'any' }, { label: 'Debit card', value: 'card' }, { label: 'Interac', value: 'interac' }] },
  { key: 'status', control: 'select', label: 'Status', options: [{ label: 'Any', value: 'any' }, { label: 'Settled', value: 'settled' }, { label: 'Pending', value: 'pending' }, { label: 'Failed', value: 'error' }] },
  { key: 'type', control: 'select', label: 'Transaction type', options: [{ label: 'Any', value: 'any' }, { label: 'Deposit', value: 'deposit' }, { label: 'Withdrawal', value: 'withdrawal' }] },
];

const money = (amount: number, currency: string) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency }).format(amount);

export function PlayerPaymentsPage({ onBack }: PlayerPaymentsPageProps) {
  const [tab, setTab] = useState('payments');
  const [subTab, setSubTab] = useState('transactions');
  // Range presets are a page-owned affordance — official TableFilters has no `presets` shape, so (per
  // the [+]-style ruling) they stay page-level composition around the unmodified bar. No urlSync on the
  // demo; App mounts a MemoryRouter only so the controller's useSearchParams has a Router.
  const [preset, setPreset] = useState<string | null>('7d');
  const filters = useTableFilters<TxFilters>({ initialValues: EMPTY });

  const columns: BeamColumn<PaymentTransaction>[] = [
    { key: 'createdAt', header: 'Created at', render: (t) => t.createdAt, getValue: (t) => t.createdAt, width: 170 },
    { key: 'transactionId', header: 'Transaction ID', render: (t) => t.transactionId, getValue: (t) => t.transactionId, width: 130 },
    { key: 'type', header: 'Type', render: (t) => t.type, getValue: (t) => t.type, width: 110 },
    { key: 'method', header: 'Method', render: (t) => t.method, getValue: (t) => t.method },
    { key: 'provider', header: 'Provider', render: (t) => t.provider, getValue: (t) => t.provider, width: 110 },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (t) => money(t.amount, t.currency),
      getValue: (t) => t.amount,
      width: 120,
    },
    {
      key: 'status',
      header: 'Status',
      render: (t) => <BeamStatusBadge status={t.status} />,
      getValue: (t) => t.status,
      width: 130,
    },
  ];

  return (
    <Stack spacing={3}>
      <BeamPage
        title={`${CURRENT_PLAYER.firstName} ${CURRENT_PLAYER.lastName}`}
        back={{ label: 'Search', onClick: onBack }}
        subtitle={`Player ID ${CURRENT_PLAYER.id}`}
        action={<Button variant="contained">Quick actions</Button>}
      />
      {/* Record summary — a DetailsPanel below the header (grammar §4; the outlined-Paper summary
          strip is retired). Read-only stats: view-mode field twins. */}
      <DetailsPanel aria-label="Player summary">
        <BeamStat label="Status" value="Approved" caption="Online" />
        <BeamStat label="Cash balance" value="$20.00" caption="CAD" />
        <BeamStat label="Betty coins" value="0" />
        <BeamStat label="Tokens balance" value="0" />
        <BeamStat label="Profit segment" value="Toddler" />
        <BeamStat label="RG risk" value="No risk" />
        <BeamStat label="Segment" value="Registered non-depositor" />
        <BeamStat label="Risk of churn" value="N/A" />
      </DetailsPanel>

      {/* The one screen whose domain genuinely warrants nested tabs. */}
      <BeamTabs
        items={PLAYER_TABS}
        value={tab}
        onChange={setTab}
        subValue={subTab}
        onSubChange={setSubTab}
        aria-label="Player sections"
      />

      {/* Range presets: page-owned quick-picks above the definition-driven bar (official has no `presets`
          shape). Illustrative on the demo — they toggle emphasis but don't yet narrow the rows. */}
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
        {RANGE_PRESETS.map((p) => (
          <Chip
            key={p.id}
            label={p.label}
            size="small"
            variant={preset === p.id ? 'filled' : 'outlined'}
            color={preset === p.id ? 'primary' : 'default'}
            onClick={() => setPreset(preset === p.id ? null : p.id)}
          />
        ))}
      </Stack>

      <TableFilters definitions={TX_DEFS} controller={filters} />

      <Table
        columns={columns}
        rows={TRANSACTIONS}
        getRowId={(t) => t.id}
        paginated
        renderExpanded={(t) => (
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={6}>
            <BeamStat label="Balance before" value={money(t.balanceBefore, t.currency)} />
            <BeamStat label="Balance after" value={money(t.balanceAfter, t.currency)} />
            <BeamStat label="Processed by" value="N/A" />
            <BeamStat
              label="Fraud rules matched"
              value={t.fraudRules ?? 'None'}
              severity={t.fraudRules ? 'warning' : undefined}
            />
          </Stack>
        )}
        aria-label="Payment transactions"
      />
    </Stack>
  );
}
