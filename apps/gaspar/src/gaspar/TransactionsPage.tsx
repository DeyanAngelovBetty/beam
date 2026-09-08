import { useMemo, useState } from 'react';
import {
  Stack,
  Box,
  Chip,
  Snackbar,
  Tooltip,
  IconButton,
  MenuItem,
  BeamField,
  BeamFilterBar,
  BeamDataTable,
  BeamPageHeader,
} from '@betty/beam';
import type { BeamColumn } from '@betty/beam';
import ContentCopyIcon from '@mui/icons-material/ContentCopyRounded';

/**
 * Gaspar Transactions — the payments list grid.
 *
 * Column set per `apps/gaspar/docs/SPEC-gaspar-transactions-columns.md` (Tracer Bullet 1, v2):
 * columns and cell treatments only, against the new `payments` list response. BeamDataTable is
 * UNTOUCHED — all cell treatments here are PAGE-LOCAL helpers, no organism API change, no Beam
 * promotion (that follows usage, not prediction).
 *
 * Scope fence (spec): no column show/hide + reorder (bullet 3), no selection/export, no advanced
 * filters, no detail drawer. The leading cell gutter is left clean for a future selection checkbox,
 * and there is deliberately NO onRowClick / renderExpanded — the future detail drawer (roadmap #4,
 * fed by the payment-details `events[]`) owns that interaction.
 *
 * Two page-local copy affordances now exist in the estate (this + Sunlight's CopyUrlButton) — a Beam
 * copy molecule is a QUEUED promotion candidate, tracked separately, not built here. Likewise the
 * status-vocabulary reconciliation (API strings ↔ BeamStatus) is a separate future Beam task; this
 * page does NOT touch BeamStatus and renders badges page-locally.
 */

/**
 * Phase B seam (spec §"Payment method column"): a card summary lives on the payment-methods resource,
 * NOT in the payments list response today. The cell ACCEPTS this optional object and falls back to the
 * Phase A GUID when it is absent. No client-side joins, no per-row fetch, no faking — the branch is
 * simply unreachable until the backend embeds a card summary in the list row.
 */
interface CardSummary {
  brand: string;
  last4: string;
  bin?: string;
  expiry?: string;
  prepaid?: boolean;
}

/** Mirrors the `payments` list response row (spec §"Data source"). */
interface PaymentRow {
  id: string;
  organizationId: string; // context-scoped — not a column
  marketId: string; // context-scoped — not a column
  idempotencyKey: string; // not a column
  customerId: string;
  paymentMethodId: string;
  amount: number;
  currency: string;
  direction: string;
  psp: string;
  status: string;
  threeDsStatus: string;
  threeDsSessionReference: string | null; // detail material — not a column
  pspTransactionId: string | null;
  createdAt: string; // ISO 8601 with offset
  updatedAt: string; // ISO 8601 with offset
  cardSummary?: CardSummary; // Phase B seam — absent in the list response today
}

/**
 * CATALOG — columns known but NOT built (no data source in the `payments` list response). Documented
 * here so bullet 3's column manager inherits the full conversation; nothing below renders. Do not fake.
 *   • Transaction Type      — MN concept; new API has only `direction`. Until Konstantin answers
 *                             (is Type subsumed by direction, or a richer enum coming?), direction IS
 *                             the type column.
 *   • Name on Card          — absent from payments AND payment-methods. Backend ask.
 *   • Payment Method Details— brand/last4/etc. → becomes the Phase B card cell (above), not a column.
 *   • ProcessedBy           — no field in response. Source unknown.
 *   • Fraud Rules Matched   — no field. Presumably future rules-engine integration.
 * Also intentionally not shown: organizationId, marketId (context-scoped), idempotencyKey,
 * threeDsSessionReference (detail material).
 */

// Mock of the server-paginated payments response (no real endpoint reachable in this app). Deliberate
// variety proves the acceptance criteria: a null pspTransactionId (→ em-dash), and unseen enum values
// (→ neutral badge + raw string, never an error).
const PAYMENTS: PaymentRow[] = [
  { id: 'pay_01H9Z3K7A2QF4M8N', organizationId: 'org_betty', marketId: 'mkt_ca', idempotencyKey: 'idm_9f21', customerId: 'cus_74126', paymentMethodId: 'pm_01H9Z3K7A2QF4M8N', amount: 149.0, currency: 'USD', direction: 'Deposit', psp: 'Nuvei', status: 'Succeeded', threeDsStatus: 'NotRequired', threeDsSessionReference: null, pspTransactionId: 'nuvei_txn_88213445', createdAt: '2026-09-04T13:32:11Z', updatedAt: '2026-09-04T13:32:14Z' },
  { id: 'pay_01H9Z3M0BX7T5P2R', organizationId: 'org_betty', marketId: 'mkt_ca', idempotencyKey: 'idm_a0b2', customerId: 'cus_74127', paymentMethodId: 'pm_01H9Z3M0BX7T5P2R', amount: 32.5, currency: 'EUR', direction: 'Withdrawal', psp: 'Adyen', status: 'Succeeded', threeDsStatus: 'Authenticated', threeDsSessionReference: 'tds_ref_5521', pspTransactionId: 'adyen_8853120019', createdAt: '2026-09-04T14:01:47Z', updatedAt: '2026-09-04T14:02:03Z' },
  { id: 'pay_01H9Z3N4CQ9W6D1S', organizationId: 'org_betty', marketId: 'mkt_ca', idempotencyKey: 'idm_c3d4', customerId: 'cus_74131', paymentMethodId: 'pm_01H9Z3N4CQ9W6D1S', amount: 1200.0, currency: 'USD', direction: 'Deposit', psp: 'Nuvei', status: 'Pending', threeDsStatus: 'NotRequired', threeDsSessionReference: null, pspTransactionId: null, createdAt: '2026-09-04T14:22:09Z', updatedAt: '2026-09-04T14:22:09Z' },
  { id: 'pay_01H9Z3P8DR2K7F5T', organizationId: 'org_betty', marketId: 'mkt_ca', idempotencyKey: 'idm_e5f6', customerId: 'cus_74140', paymentMethodId: 'pm_01H9Z3P8DR2K7F5T', amount: 75.99, currency: 'CAD', direction: 'Deposit', psp: 'Adyen', status: 'Failed', threeDsStatus: 'NotRequired', threeDsSessionReference: null, pspTransactionId: 'adyen_8853120044', createdAt: '2026-09-04T15:10:33Z', updatedAt: '2026-09-04T15:10:58Z' },
  { id: 'pay_01H9Z3Q1EF3M8G6V', organizationId: 'org_betty', marketId: 'mkt_ca', idempotencyKey: 'idm_0102', customerId: 'cus_74155', paymentMethodId: 'pm_01H9Z3Q1EF3M8G6V', amount: 500.0, currency: 'USD', direction: 'Withdrawal', psp: 'Nuvei', status: 'Succeeded', threeDsStatus: 'NotRequired', threeDsSessionReference: null, pspTransactionId: 'nuvei_txn_88213502', createdAt: '2026-09-04T16:44:20Z', updatedAt: '2026-09-04T16:44:25Z' },
  { id: 'pay_01H9Z3R5FG4N9H7W', organizationId: 'org_betty', marketId: 'mkt_ca', idempotencyKey: 'idm_0304', customerId: 'cus_74161', paymentMethodId: 'pm_01H9Z3R5FG4N9H7W', amount: 18.25, currency: 'EUR', direction: 'Deposit', psp: 'Nuvei', status: 'Succeeded', threeDsStatus: 'NotRequired', threeDsSessionReference: null, pspTransactionId: 'nuvei_txn_88213560', createdAt: '2026-09-05T09:03:12Z', updatedAt: '2026-09-05T09:03:15Z' },
];

// Select options DERIVED from the mock rows — the filter offers exactly the values present, never a
// hardcoded vocabulary. (Direction happens to be Deposit/Withdrawal today; still derived, not assumed.)
const uniqueSorted = (values: string[]) => Array.from(new Set(values)).sort();
const STATUS_OPTIONS = uniqueSorted(PAYMENTS.map((r) => r.status));
const DIRECTION_OPTIONS = uniqueSorted(PAYMENTS.map((r) => r.direction));
const PROVIDER_OPTIONS = uniqueSorted(PAYMENTS.map((r) => r.psp));

/**
 * BeamFilterBar's apply model (bar v1 spec; UsersPage is the estate reference): the bar edits a
 * `draft`; the grid filters by `applied`; the Filter CTA commits draft → applied. We keep BOTH stores
 * page-local — no URL/query-param persistence (this page's own constraint), which is the one deviation
 * from UsersPage (it persists `applied` in the URL).
 */
interface Filters {
  q: string;
  start: string; // yyyy-mm-dd, inclusive lower bound on createdAt
  end: string; // yyyy-mm-dd, inclusive upper bound on createdAt
  status: string;
  direction: string;
  provider: string;
}
const EMPTY_FILTERS: Filters = { q: '', start: '', end: '', status: '', direction: '', provider: '' };
const isActive = (f: Filters) => f.q !== '' || f.start !== '' || f.end !== '' || f.status !== '' || f.direction !== '' || f.provider !== '';

const EM_DASH = '—';

/** Local time, sortable/comparable form `YYYY-MM-DD HH:mm`; full ISO-with-offset in the tooltip. No
 *  relative time (spec: ops need sortable, comparable values). */
function TimestampCell({ iso }: { iso: string }) {
  const local = new Date(iso).toLocaleString('sv-SE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  return (
    <Tooltip title={iso}>
      <Box component="span" sx={{ whiteSpace: 'nowrap' }}>{local}</Box>
    </Tooltip>
  );
}

const middleTruncate = (s: string, head = 8, tail = 6) =>
  s.length <= head + tail + 1 ? s : `${s.slice(0, head)}…${s.slice(-tail)}`;

/** GUID / PSP-id cell: middle-truncated, full value in tooltip, click-to-copy with confirmation.
 *  PAGE-LOCAL (spec §"Shared cell treatments": no Beam copy pattern exists — flagged, not invented). */
function TruncateCopyCell({ value, mono, onCopied }: { value: string | null; mono?: boolean; onCopied: () => void }) {
  if (!value) return <Box component="span" sx={{ color: 'text.disabled' }}>{EM_DASH}</Box>;
  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', minWidth: 0 }}>
      <Tooltip title={value}>
        <Box component="span" sx={{ fontFamily: mono ? 'monospace' : undefined, whiteSpace: 'nowrap' }}>
          {middleTruncate(value)}
        </Box>
      </Tooltip>
      <Tooltip title="Copy">
        <IconButton
          size="small"
          aria-label={`Copy ${value}`}
          onClick={() => {
            void navigator.clipboard?.writeText(value);
            onCopied();
          }}
          sx={{ flexShrink: 0 }}
        >
          <ContentCopyIcon fontSize="inherit" />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}

// Observed-only positive map (spec enum rule): the ONLY value seen in sample payloads that reads as a
// success signal. Everything else — Direction, 3DS, and any unseen status — renders NEUTRAL + raw
// string. No invented enum→color table; unseen values never crash and never get a color.
const POSITIVE_STATUSES = new Set(['Succeeded']);

/** Page-local badge: raw string label always; positive tone only for observed positives, else neutral.
 *  Colors route through theme palette tokens (Chip color), never hardcoded. Does NOT touch BeamStatus. */
function TxBadge({ value }: { value: string }) {
  return (
    <Chip
      size="small"
      variant="outlined"
      color={POSITIVE_STATUSES.has(value) ? 'success' : 'default'}
      label={value}
    />
  );
}

/** Phase A: the payment-method GUID. Phase B (unreachable today): a composite card cell when the row
 *  carries an embedded card summary — falls back to Phase A when absent (spec §"two phases"). */
function PaymentMethodCell({ row, onCopied }: { row: PaymentRow; onCopied: () => void }) {
  if (row.cardSummary) {
    const { brand, last4, bin, expiry, prepaid } = row.cardSummary;
    const detail = [bin && `BIN ${bin}`, expiry && `exp ${expiry}`, prepaid && 'prepaid'].filter(Boolean).join(' · ');
    return (
      <Tooltip title={detail || ''}>
        <Box component="span" sx={{ whiteSpace: 'nowrap' }}>{brand} •••• {last4}</Box>
      </Tooltip>
    );
  }
  return <TruncateCopyCell value={row.paymentMethodId} onCopied={onCopied} />;
}

export function TransactionsPage() {
  const [copied, setCopied] = useState(false);
  const onCopied = () => setCopied(true);

  // Filter state — page-local (no persistence, no query-param model). `draft` is what the bar's fields
  // edit; `applied` is what the grid filters by. The Filter CTA (and Enter in a date field) commits.
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS);
  const patchDraft = (p: Partial<Filters>) => setDraft((d) => ({ ...d, ...p }));

  const apply = () => setApplied(draft);
  const clearAll = () => {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
  };
  // Enter in a date field commits (search-field Enter can't — see the note by the bar).
  const applyOnEnter = (e: { key: string }) => {
    if (e.key === 'Enter') apply();
  };

  // isApplied reflects the COMMITTED filters (drives the bar's Filter-CTA fill + Clear-all enablement),
  // never the uncommitted draft.
  const isApplied = isActive(applied);

  const rows = useMemo(() => {
    const q = applied.q.trim().toLowerCase();
    return PAYMENTS.filter((r) => {
      // Search: id, pspTransactionId, customerId (spec §1).
      if (q) {
        const hay = `${r.id} ${r.pspTransactionId ?? ''} ${r.customerId}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      // Date range on createdAt — compared as the UTC calendar date (createdAt is ...Z); inclusive.
      const day = r.createdAt.slice(0, 10);
      if (applied.start && day < applied.start) return false;
      if (applied.end && day > applied.end) return false;
      // Exact-match selects.
      if (applied.status && r.status !== applied.status) return false;
      if (applied.direction && r.direction !== applied.direction) return false;
      if (applied.provider && r.psp !== applied.provider) return false;
      return true;
    });
  }, [applied]);

  // Default-visible set, in spec order. (When bullet 3 lands, the CATALOG above joins these as the
  // column manager's contents.)
  const columns: BeamColumn<PaymentRow>[] = [
    { key: 'id', header: 'Transaction ID', getValue: (r) => r.id, width: 168, render: (r) => <TruncateCopyCell value={r.id} onCopied={onCopied} /> },
    { key: 'pspTransactionId', header: 'PSP Transaction ID', getValue: (r) => r.pspTransactionId ?? '', width: 184, render: (r) => <TruncateCopyCell value={r.pspTransactionId} mono onCopied={onCopied} /> },
    { key: 'customerId', header: 'Customer', getValue: (r) => r.customerId, width: 130, render: (r) => r.customerId },
    { key: 'paymentMethodId', header: 'Payment method', getValue: (r) => r.paymentMethodId, width: 168, render: (r) => <PaymentMethodCell row={r} onCopied={onCopied} /> },
    { key: 'amount', header: 'Amount', align: 'right', getValue: (r) => r.amount, width: 110, render: (r) => r.amount.toFixed(2) },
    { key: 'currency', header: 'Currency', getValue: (r) => r.currency, width: 96, render: (r) => r.currency },
    { key: 'direction', header: 'Direction', getValue: (r) => r.direction, width: 124, render: (r) => <TxBadge value={r.direction} /> },
    { key: 'status', header: 'Status', getValue: (r) => r.status, width: 132, render: (r) => <TxBadge value={r.status} /> },
    { key: 'psp', header: 'Provider', getValue: (r) => r.psp, width: 110, render: (r) => r.psp },
    { key: 'threeDsStatus', header: '3DS Status', getValue: (r) => r.threeDsStatus, width: 132, render: (r) => <TxBadge value={r.threeDsStatus} /> },
    { key: 'createdAt', header: 'Created At', align: 'right', getValue: (r) => r.createdAt, width: 150, render: (r) => <TimestampCell iso={r.createdAt} /> },
    { key: 'updatedAt', header: 'Last Updated', align: 'right', getValue: (r) => r.updatedAt, width: 150, render: (r) => <TimestampCell iso={r.updatedAt} /> },
  ];

  return (
    <Stack spacing={3}>
      <BeamPageHeader title="Transactions" />

      {/* Filters — BeamFilterBar's designed apply model (bar v1; UsersPage is the reference): the bar
          edits `draft`, the grid filters by `applied`, the Filter CTA commits. Search is the bar's
          built-in field; the date range and the three selects are promoted fields passed as `children`
          (the bar's composition API — a first-class dateRange prop waits for a 2nd consumer, per
          promotion-follows-usage). Select options are DERIVED from the data.
          NOTE: Enter-to-apply is wired on the date fields (page-local). The SEARCH field is the bar's
          built-in input with no key-event hook exposed, so Enter there cannot commit without a
          BeamFilterBar API addition — deliberately NOT done (no component change); the Filter CTA
          commits search. UsersPage, the reference, likewise has no Enter-to-apply. */}
      <BeamFilterBar
        aria-label="Transaction filters"
        searchValue={draft.q}
        onSearchChange={(q) => patchDraft({ q })}
        searchPlaceholder="Search ID, PSP ID, customer"
        applied={isApplied}
        onFilter={apply}
        onClearAll={clearAll}
      >
        <BeamField
          label="Created from"
          type="date"
          value={draft.start}
          onChange={(e) => patchDraft({ start: e.target.value })}
          onKeyDown={applyOnEnter}
          slotProps={{ inputLabel: { shrink: true } }}
          fullWidth
        />
        <BeamField
          label="Created to"
          type="date"
          value={draft.end}
          onChange={(e) => patchDraft({ end: e.target.value })}
          onKeyDown={applyOnEnter}
          slotProps={{ inputLabel: { shrink: true } }}
          fullWidth
        />
        <BeamField select label="Status" value={draft.status} onChange={(e) => patchDraft({ status: e.target.value })} fullWidth>
          <MenuItem value="">All</MenuItem>
          {STATUS_OPTIONS.map((s) => (
            <MenuItem key={s} value={s}>{s}</MenuItem>
          ))}
        </BeamField>
        <BeamField select label="Direction" value={draft.direction} onChange={(e) => patchDraft({ direction: e.target.value })} fullWidth>
          <MenuItem value="">All</MenuItem>
          {DIRECTION_OPTIONS.map((dir) => (
            <MenuItem key={dir} value={dir}>{dir}</MenuItem>
          ))}
        </BeamField>
        <BeamField select label="Provider" value={draft.provider} onChange={(e) => patchDraft({ provider: e.target.value })} fullWidth>
          <MenuItem value="">All</MenuItem>
          {PROVIDER_OPTIONS.map((p) => (
            <MenuItem key={p} value={p}>{p}</MenuItem>
          ))}
        </BeamField>
      </BeamFilterBar>

      <BeamDataTable
        columns={columns}
        rows={rows}
        getRowId={(r) => r.id}
        paginated
        emptyMessage="No transactions match these filters."
        // Column manager (bullet 3). Catalog = the bullet-1 columns with no data source yet — shown in
        // the manager disabled/"awaiting data" (option b). Payment Method Details is excluded: it's the
        // Phase B card cell inside Payment method, not a column of its own.
        columnManager={{
          storageKey: 'gaspar.transactions',
          catalog: [
            { id: 'transactionType', label: 'Transaction Type' },
            { id: 'nameOnCard', label: 'Name on Card' },
            { id: 'processedBy', label: 'ProcessedBy' },
            { id: 'fraudRulesMatched', label: 'Fraud Rules Matched' },
          ],
        }}
        aria-label="Payment transactions"
      />

      <Snackbar
        open={copied}
        autoHideDuration={2000}
        onClose={() => setCopied(false)}
        message="Copied to clipboard"
      />
    </Stack>
  );
}
