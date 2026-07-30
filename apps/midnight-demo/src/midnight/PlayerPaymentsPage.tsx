import { useState } from 'react';
import {
  Stack,
  Button,
  TextField,
  MenuItem,
  BeamPageHeader,
  BeamStat,
  BeamTabs,
  BeamFilterBar,
  BeamDataTable,
  BeamStatusBadge,
} from '@betty/beam';
import type { BeamColumn, BeamTabItem } from '@betty/beam';
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

const money = (amount: number, currency: string) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency }).format(amount);

export function PlayerPaymentsPage({ onBack }: PlayerPaymentsPageProps) {
  const [tab, setTab] = useState('payments');
  const [subTab, setSubTab] = useState('transactions');
  const [preset, setPreset] = useState<string | null>('7d');

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
      <BeamPageHeader
        title={`${CURRENT_PLAYER.firstName} ${CURRENT_PLAYER.lastName}`}
        back={{ label: 'Search', onClick: onBack }}
        description={`Player ID ${CURRENT_PLAYER.id}`}
        action={<Button variant="contained">Quick actions</Button>}
        summary={
          <>
            <BeamStat label="Status" value="Approved" tone="success" caption="Online" />
            <BeamStat label="Cash balance" value="$20.00" caption="CAD" />
            <BeamStat label="Betty coins" value="0" />
            <BeamStat label="Tokens balance" value="0" />
            <BeamStat label="Profit segment" value="Toddler" tone="info" />
            <BeamStat label="RG risk" value="No risk" tone="success" />
            <BeamStat label="Segment" value="Registered non-depositor" />
            <BeamStat label="Risk of churn" value="N/A" />
          </>
        }
      />

      {/* The one screen whose domain genuinely warrants nested tabs. */}
      <BeamTabs
        items={PLAYER_TABS}
        value={tab}
        onChange={setTab}
        subValue={subTab}
        onSubChange={setSubTab}
        aria-label="Player sections"
      />

      <BeamFilterBar
        aria-label="Payment transaction filters"
        presets={RANGE_PRESETS}
        activePreset={preset}
        onPresetChange={setPreset}
        applied={preset !== null}
        onFilter={() => {}}
        onClearAll={() => setPreset(null)}
      >
        <TextField label="Transaction ID" size="small" fullWidth />
        <TextField label="Start date" size="small" fullWidth />
        <TextField label="End date" size="small" fullWidth />
        <TextField label="Payment method" size="small" select fullWidth defaultValue="any">
          <MenuItem value="any">Any</MenuItem>
          <MenuItem value="card">Debit card</MenuItem>
          <MenuItem value="interac">Interac</MenuItem>
        </TextField>
        <TextField label="Status" size="small" select fullWidth defaultValue="any">
          <MenuItem value="any">Any</MenuItem>
          <MenuItem value="settled">Settled</MenuItem>
          <MenuItem value="pending">Pending</MenuItem>
          <MenuItem value="error">Failed</MenuItem>
        </TextField>
        <TextField label="Transaction type" size="small" select fullWidth defaultValue="any">
          <MenuItem value="any">Any</MenuItem>
          <MenuItem value="deposit">Deposit</MenuItem>
          <MenuItem value="withdrawal">Withdrawal</MenuItem>
        </TextField>
      </BeamFilterBar>

      <BeamDataTable
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
              tone={t.fraudRules ? 'warning' : 'default'}
            />
          </Stack>
        )}
        aria-label="Payment transactions"
      />
    </Stack>
  );
}
