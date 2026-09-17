import { useMemo, useState } from 'react';
import {
  Stack,
  Box,
  Typography,
  Snackbar,
  Tooltip,
  IconButton,
  MenuItem,
  Menu,
  Button,
  Chip,
  BeamBadge,
  TableFilters,
  useTableFilters,
  Table,
  BeamPage,
  stickyChromeGapSx,
  stickyChromeExitSx,
  PAGE_SECTION_GAP,
} from '@betty/beam';
import type { BeamColumn, BeamBadgeProps, TableFilterDefinition } from '@betty/beam';
import type { PaginationState } from '@tanstack/react-table';
import ContentCopyIcon from '@mui/icons-material/ContentCopyRounded';
import AddIcon from '@mui/icons-material/Add';
import { useMilestone } from './milestone';

// Pagination persisted in the URL (the source of truth) — survives the nav-toggle remount + refresh, and
// back/forward + link-sharing work. Defaults stay OUT of the URL (clean URL at 10 / page 1). 1-based `page`
// for humans; `pageSize` matches the grid's default. See Table's controlled `pagination` prop.
const DEFAULT_PAGE_SIZE = 10;

/**
 * Gaspar Transactions — the payments list grid.
 *
 * Column set per `apps/gaspar/docs/SPEC-gaspar-transactions-columns.md` (Tracer Bullet 1, v2):
 * columns and cell treatments only, against the new `payments` list response. Table is
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

/**
 * One entry of the payment-details `events[]` timeline (Task B, interim details-as-expandable-row).
 * Observed event types only — see `buildEvents`. Shape mirrors the payment-details resource.
 */
interface PaymentEvent {
  eventType: string;
  occurredOnUtc: string;
  details?: string;
  amountModifier?: number | null;
  pspTransactionId?: string | null;
}

/** Mirrors the `payments` list response row (spec §"Data source"). */
interface PaymentRow {
  id: string;
  organizationId: string; // context-scoped — not a column
  marketId: string; // context-scoped — not a column
  idempotencyKey: string; // not a column
  customerId: string;
  customerEmail: string;
  paymentMethodId: string;
  amount: number;
  currency: string;
  // PROPOSED column — card brand lives on the payment-methods resource, NOT the payments list response
  // today (rides the embedded-card-summary ask; see SPEC ledger). Rendered proposal with real data TBD.
  cardType: 'Visa' | 'Mastercard';
  direction: string;
  psp: string;
  status: string;
  threeDsStatus: string;
  threeDsSessionReference: string | null; // detail material — not a column
  pspTransactionId: string | null;
  // PROPOSED column — no such field in the payments API today (vocabulary TBD: MTI vs response/decline
  // vs PSP codes, an open backend question). Optional/nullable; null or absent renders an em-dash.
  errorCode?: string | null;
  createdAt: string; // ISO 8601 with offset
  updatedAt: string; // ISO 8601 with offset
  cardSummary?: CardSummary; // Phase B seam — absent in the list response today
  events: PaymentEvent[]; // detail timeline (Task B) — seeded from status, observed types only
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

// Mock of the server-paginated payments response (no real endpoint reachable in this app). Real status
// vocabulary (phase-3 reseed): created/processing/pending/failed/completed; providers Nuvei/Adyen.
// Currency is CAD everywhere — Boryana's MCP is single-currency CAD (spec §2.4). Mostly-completed;
// created/pending carry a null pspTransactionId (pre-submit); failed rows carry distinct MTI errorCodes;
// amounts span magnitudes; createdAt spreads across ~3 weeks.
const AMOUNT_MAGNITUDES = [12.5, 47.99, 149, 320, 899.5, 1200, 2450, 4800, 75, 18.25];
const FAILED_MTI = ['0400', '0100', '0200', '0210', '0230', '0800', '0120', '0330']; // distinct observed codes
// ~1,200 rows (was 40) so 500-per-page and jump-to-page demo across multiple pages (Ruslan's v1.2
// pagination feedback). Same generator, same enum discipline — NO new vocabulary; stageForDemo still
// leads page one with the severity story at the default size.
const RAW_PAYMENTS: Omit<PaymentRow, 'events'>[] = Array.from({ length: 1200 }, (_, i) => {
  // Real vocabulary (phase-3 reseed): completed 0–3 · pending 4–5 · processing 6 · created 7 · failed
  // 8–9 → mostly-completed, pending prominent (the loud/actionable one), 8 failed rows (distinct codes).
  const bucket = i % 10;
  const status =
    bucket <= 3 ? 'completed'
    : bucket <= 5 ? 'pending'
    : bucket === 6 ? 'processing'
    : bucket === 7 ? 'created'
    : 'failed';
  const psp = i % 2 === 0 ? 'Nuvei' : 'Adyen';
  const currency = 'CAD'; // single-currency CAD (spec §2.4); the filter/[+] selects collapse to one option
  const cardType: 'Visa' | 'Mastercard' = i % 2 === 0 ? 'Visa' : 'Mastercard'; // ~half/half, stable per row
  const direction = i % 3 === 0 ? 'Withdrawal' : 'Deposit';
  const amount = Number((AMOUNT_MAGNITUDES[i % AMOUNT_MAGNITUDES.length] + (i % 5) * 3.5).toFixed(2));
  const created = new Date(Date.UTC(2026, 7, 20, 8, 0, 0) + ((i * 13) % 21) * 86_400_000 + (i % 24) * 3_600_000);
  const updated = new Date(created.getTime() + (2 + (i % 40)) * 1_000);
  const failedIdx = Math.floor(i / 10) * 2 + (bucket - 8); // 0,1,2,3,… across the failed rows
  const token = (100000 + i * 37).toString(36).toUpperCase().padStart(10, '0');
  return {
    id: `pay_${token}`,
    organizationId: 'org_betty',
    marketId: 'mkt_ca',
    idempotencyKey: `idm_${(4000 + i * 7).toString(16)}`,
    customerId: `cus_${74120 + i}`,
    customerEmail: `player${74120 + i}@example.com`, // stable, derived from the customer id

    paymentMethodId: `pm_${token}`,
    amount,
    currency,
    cardType,
    direction,
    psp,
    status,
    threeDsStatus: i % 6 === 0 ? 'Authenticated' : 'NotRequired',
    threeDsSessionReference: i % 6 === 0 ? `tds_ref_${5500 + i}` : null,
    // No PSP transaction id before submit — created/pending are pre-SubmittedToProvider.
    pspTransactionId: status === 'created' || status === 'pending' ? null : `${psp.toLowerCase()}_txn_${88213400 + i * 7}`,
    errorCode: status === 'failed' ? FAILED_MTI[failedIdx % FAILED_MTI.length] : null,
    createdAt: created.toISOString(),
    updatedAt: updated.toISOString(),
  };
});

/**
 * Seed a row's event timeline using ONLY observed event types (Initiated, PspAssigned,
 * SubmittedToProvider, Approved), increasing depth per status: created → Initiated; pending →
 * +PspAssigned; processing → +SubmittedToProvider; completed → +Approved. failed stops at
 * SubmittedToProvider — no failure event type has ever been observed, so the visibly incomplete
 * timeline is the honest rendering (a deliberate open question, not a bug).
 */
const buildEvents = (r: Omit<PaymentRow, 'events'>): PaymentEvent[] => {
  const t0 = new Date(r.createdAt).getTime();
  const at = (min: number) => new Date(t0 + min * 60_000).toISOString();
  const initiated: PaymentEvent = { eventType: 'Initiated', occurredOnUtc: at(0), details: `${r.direction} initiated` };
  const assigned: PaymentEvent = { eventType: 'PspAssigned', occurredOnUtc: at(1), details: `Routed to ${r.psp}` };
  const submitted: PaymentEvent = { eventType: 'SubmittedToProvider', occurredOnUtc: at(2), details: `Submitted to ${r.psp}`, pspTransactionId: r.pspTransactionId };
  const approved: PaymentEvent = { eventType: 'Approved', occurredOnUtc: r.updatedAt, amountModifier: r.amount, pspTransactionId: r.pspTransactionId };
  // Observed event types only; increasing depth (ASSUMPTION — see the SPEC backend ledger, incl. the
  // open question of whether `pending` is pre-submit (awaiting ops) or post-submit (awaiting PSP)).
  if (r.status === 'completed') return [initiated, assigned, submitted, approved];
  if (r.status === 'processing') return [initiated, assigned, submitted];
  if (r.status === 'pending') return [initiated, assigned];
  if (r.status === 'failed') return [initiated, assigned, submitted]; // STOP — no failure event observed
  if (r.status === 'created') return [initiated];
  return [initiated]; // any other status: only what we can honestly assert
};

// DEMO STAGING (not a sort feature): reorder the mock so page one leads with the severity story
// top-down — ~4 failed, ~3 pending, a processing, a created, a completed — then the remainder tapers
// severity-descending across later pages. This is mock-data ordering only; the grid has no default-sort
// state and no sort logic — a real product sort is not being claimed here.
const stageForDemo = (rows: Omit<PaymentRow, 'events'>[]): Omit<PaymentRow, 'events'>[] => {
  const of = (s: string) => rows.filter((r) => r.status === s);
  const failed = of('failed'), pending = of('pending'), processing = of('processing'), created = of('created'), completed = of('completed');
  return [
    // Page one — the headline mix.
    ...failed.slice(0, 4), ...pending.slice(0, 3), ...processing.slice(0, 1), ...created.slice(0, 1), ...completed.slice(0, 1),
    // Onward — remaining rows, severity-descending (completed dominates the tail).
    ...failed.slice(4), ...pending.slice(3), ...processing.slice(1), ...created.slice(1), ...completed.slice(1),
  ];
};
const PAYMENTS: PaymentRow[] = stageForDemo(RAW_PAYMENTS).map((r) => ({ ...r, events: buildEvents(r) }));

// Select options DERIVED from the mock rows — the filter offers exactly the values present, never a
// hardcoded vocabulary. (Direction happens to be Deposit/Withdrawal today; still derived, not assumed.)
const uniqueSorted = (values: string[]) => Array.from(new Set(values)).sort();
const STATUS_OPTIONS = uniqueSorted(PAYMENTS.map((r) => r.status));
const DIRECTION_OPTIONS = uniqueSorted(PAYMENTS.map((r) => r.direction));
const PROVIDER_OPTIONS = uniqueSorted(PAYMENTS.map((r) => r.psp));
const CURRENCY_OPTIONS = uniqueSorted(PAYMENTS.map((r) => r.currency));
const THREEDS_OPTIONS = uniqueSorted(PAYMENTS.map((r) => r.threeDsStatus));
const ERROR_CODE_OPTIONS = uniqueSorted(PAYMENTS.map((r) => r.errorCode).filter((c): c is string => Boolean(c)));

/**
 * Filter model — official TableFilters + useTableFilters (Wave 1): the controller owns `draft` (edited by
 * the bar) and `applied` (what the grid filters by); the Filter button commits draft → applied. `urlSync`
 * mirrors applied filters + page/pageSize to the URL and restores on load / back-forward.
 */
// Wave-1: the typed filter shape consumed by official TableFilters + useTableFilters. dateTime fields are
// `string | null` (the control's contract); everything else is a string. Amount is two TEXT defs, parsed
// leniently in the row filter (upstream gap: official ships MoneyTextField but the definitions model has no
// money/number/range control — pitch a `money` definition). Dates are `dateTime` defs (upstream gap: no
// `date` control though official ships DatePicker), sliced to yyyy-mm-dd in the filter to preserve behaviour.
interface TxFilters {
  q: string; // COMPOUND search (v1.1+): id / PSP id / customer / email.
  searchId: string;
  searchPsp: string;
  searchCustomer: string;
  searchEmail: string;
  createdFrom: string | null;
  createdTo: string | null;
  status: string;
  direction: string;
  provider: string;
  currency: string;
  threeDs: string;
  errorCode: string; // '' = any; '__none__' = rows with no error code
  amountMin: string;
  amountMax: string;
}
const EMPTY_TX_FILTERS: TxFilters = {
  q: '', searchId: '', searchPsp: '', searchCustomer: '', searchEmail: '',
  createdFrom: null, createdTo: null,
  status: '', direction: '', provider: '', currency: '', threeDs: '', errorCode: '', amountMin: '', amountMax: '',
};

// The optional (v1.2 `[+]`) filter keys — the page owns which are ACTIVE and renders the `[+]` menu, then
// includes their definitions in the array. official TableFilters stays unmodified (page-level composition).
const OPTIONAL_KEYS = ['currency', 'threeDs', 'errorCode', 'amountMin', 'amountMax'] as const;
type OptionalKey = (typeof OPTIONAL_KEYS)[number];
const OPTIONAL_LABEL: Record<OptionalKey, string> = {
  currency: 'Currency', threeDs: '3DS status', errorCode: 'Error code', amountMin: 'Min amount', amountMax: 'Max amount',
};

const ERROR_CODE_NONE = '__none__'; // sentinel value for "rows with no error code"

const EM_DASH = '—';

/**
 * ISO 8583 MTI dictionary — DATA, not logic. Verbatim from the pasted table; keyed by code. A code
 * absent here is unknown: the cell shows the code and the reveal says "Unknown code" — no invented
 * meanings (the same honesty rule as the badges). Entries with a meaning but no usage note (0420,
 * 0430) omit the usage line entirely.
 */
const MTI_CODES: Record<string, { meaning: string; usage?: string }> = {
  '0100': { meaning: 'Authorization Request', usage: 'Request from a point-of-sale terminal for authorization for a cardholder purchase' },
  '0110': { meaning: 'Authorization Response', usage: 'Request response to a point-of-sale terminal for authorization for a cardholder purchase' },
  '0120': { meaning: 'Authorization Advice', usage: 'When the point-of-sale device breaks down and you have to sign a voucher' },
  '0121': { meaning: 'Authorization Advice Repeat', usage: 'If the advice times out' },
  '0130': { meaning: 'Acquirer Response to Authorization Advice', usage: 'Confirmation of receipt of authorization advice' },
  '0200': { meaning: 'Acquirer Financial Request', usage: 'Request for funds, typically from an ATM or pinned point-of-sale device' },
  '0210': { meaning: 'Acquirer Response to Financial Request', usage: 'Issuer response to request for funds' },
  '0220': { meaning: 'Acquirer Financial Advice', usage: 'e.g. Checkout at a hotel. Used to complete transaction initiated with authorization request' },
  '0221': { meaning: 'Acquirer Financial Advice Repeat', usage: 'If the advice times out' },
  '0230': { meaning: 'Acquirer Response to Financial Advice', usage: 'Confirmation of receipt of financial advice' },
  '0320': { meaning: 'Batch Upload', usage: 'File update/transfer advice' },
  '0330': { meaning: 'Batch Upload Response', usage: 'File update/transfer advice response' },
  '0400': { meaning: 'Acquirer Reversal Request', usage: 'Reverses a transaction' },
  '0420': { meaning: 'Acquirer Reversal Advice' },
  '0430': { meaning: 'Acquirer Reversal Advice Response' },
  '0510': { meaning: 'Batch Settlement Response', usage: 'Card acceptor reconciliation request response' },
  '0800': { meaning: 'Network Management Request', usage: 'Hypercom terminals initialize request. Echo test, logon, logoff etc.' },
  '0810': { meaning: 'Network Management Response', usage: 'Hypercom terminals initialize response. Echo test, logon, logoff etc.' },
  '0820': { meaning: 'Network Management Advice', usage: 'Key change' },
};

/**
 * ErrorCodeCell — mono code text; hover OR keyboard focus reveals the code's meaning (+ usage note if
 * present) from MTI_CODES. Tooltip (estate precedent for reveal-on-hover/focus; Popover is click-only).
 * The trigger is a focusable span (tabIndex 0) so keyboard users get the reveal. Null/absent → em-dash.
 * Unknown code → the code plus a "Unknown code" reveal (no invented meaning).
 */
function ErrorCodeCell({ code }: { code: string | null | undefined }) {
  if (!code) return <Box component="span" sx={{ color: 'text.disabled' }}>{EM_DASH}</Box>;
  const entry = MTI_CODES[code];
  const title = entry ? (
    <>
      <Typography variant="body2">{entry.meaning}</Typography>
      {entry.usage && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
          {entry.usage}
        </Typography>
      )}
    </>
  ) : (
    'Unknown code'
  );
  return (
    <Tooltip title={title}>
      <Box component="span" tabIndex={0} sx={{ fontFamily: 'monospace', cursor: 'help', borderRadius: 0.5 }}>
        {code}
      </Box>
    </Tooltip>
  );
}

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
function TruncateCopyCell({ value, mono, mode = 'middle', onCopied }: { value: string | null; mono?: boolean; mode?: 'middle' | 'auto'; onCopied: () => void }) {
  if (!value) return <Box component="span" sx={{ color: 'text.disabled' }}>{EM_DASH}</Box>;
  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', minWidth: 0 }}>
      <Tooltip title={value}>
        <Box
          component="span"
          sx={{
            fontFamily: mono ? 'monospace' : undefined,
            whiteSpace: 'nowrap',
            // 'middle' (IDs): char-based middle-truncate always. 'auto' (emails): full value in the
            // normal face, CSS end-ellipsis ONLY when the column is too narrow.
            ...(mode === 'auto' && { flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }),
          }}
        >
          {mode === 'auto' ? value : middleTruncate(value)}
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

/**
 * Status grammar map — this page's vocabulary → (hue, volume) via BeamBadge (state-rendering-grammar.md;
 * the grammar's Gaspar worked example, now OPS-VALIDATED — Boryana/PM confirmed the read). One LOUD
 * state: `failed` — failures are what ops SCANS for and acts on (investigate / retry); `pending` is
 * noted because it largely resolves itself. Note the loud slot (scan-target = failed) is NOT the bulk-
 * action eligibility target (pending) — scan-target and action-target differ by design. `pending` is
 * `warning` here (payment awaiting ops) — a HOMONYM of Sunlight's in-progress `Pending` anchor, not the
 * same word; word-hue consistency scopes per product vocabulary. created/processing are silent.
 */
const STATUS_TIER: Record<string, BeamBadgeProps> = {
  created: { hue: 'neutral', label: 'Created' },
  processing: { hue: 'neutral', label: 'Processing' },
  pending: { hue: 'warning', volume: 'noted', label: 'Pending' },
  failed: { hue: 'danger', volume: 'loud', label: 'Failed' },
  completed: { hue: 'success', volume: 'noted', label: 'Completed' },
};
/** Unobserved status → silent with its raw label (the estate's honesty rule, now canonical). */
const statusTier = (s: string): BeamBadgeProps => STATUS_TIER[s] ?? { hue: 'neutral', label: s };

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

// Eligibility for Complete/Decline is an ASSUMPTION (Pending only) — validate with backend.
const ELIGIBILITY_REASON = 'Only Pending transactions can be completed or declined (assumption — backend eligibility rules TBD).';

/** Client-side file download (no backend). */
function triggerDownload(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
function downloadJson(filename: string, data: unknown) {
  triggerDownload(filename, new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
}

// Export FORMATS — a rendered ledger (formats-as-open-questions): JSON + CSV are REAL client-side
// downloads; PDF + Excel are PROPOSALS (design-proposal snackbar, no fake file) pending an export-service
// decision. Order = menu order.
const EXPORT_FORMATS = [
  { id: 'json', label: 'JSON' },
  { id: 'csv', label: 'CSV' },
  { id: 'pdf', label: 'PDF' },
  { id: 'excel', label: 'Excel' },
];
const EXPORT_LABEL: Record<string, string> = Object.fromEntries(EXPORT_FORMATS.map((f) => [f.id, f.label]));

// CSV of the visible-catalog fields (the 13 default columns, in order). Real, RFC-4180 quoting.
const CSV_FIELDS: { header: string; get: (r: PaymentRow) => string | number }[] = [
  { header: 'Created At', get: (r) => r.createdAt },
  { header: 'Last Updated', get: (r) => r.updatedAt },
  { header: 'Transaction ID', get: (r) => r.id },
  { header: 'Direction', get: (r) => r.direction },
  { header: 'Amount', get: (r) => r.amount.toFixed(2) },
  { header: 'Status', get: (r) => r.status },
  { header: 'Customer', get: (r) => r.customerId },
  { header: 'Customer Email', get: (r) => r.customerEmail },
  { header: 'PSP Transaction ID', get: (r) => r.pspTransactionId ?? '' },
  { header: 'Payment method', get: (r) => r.paymentMethodId },
  { header: 'Currency', get: (r) => r.currency },
  { header: 'Card Type', get: (r) => r.cardType },
  { header: 'Error Code', get: (r) => r.errorCode ?? '' },
  { header: 'Provider', get: (r) => r.psp },
  { header: '3DS Status', get: (r) => r.threeDsStatus },
];
const csvCell = (v: string | number) => {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; // quote + escape only when needed (RFC 4180)
};
function downloadCsv(filename: string, rows: PaymentRow[]) {
  const lines = [CSV_FIELDS.map((f) => csvCell(f.header)).join(','), ...rows.map((r) => CSV_FIELDS.map((f) => csvCell(f.get(r))).join(','))];
  triggerDownload(filename, new Blob([`${lines.join('\r\n')}\r\n`], { type: 'text/csv;charset=utf-8' }));
}

const fmtEventTime = (iso: string) =>
  new Date(iso).toLocaleString('sv-SE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });

/**
 * PaymentTimeline — INTERIM details-as-expandable-row (Task B). A light event list: time · type ·
 * details. Deliberately not over-invested — a richer detail surface (drawer/page) is a queued topic.
 * A Failed row's timeline stops at SubmittedToProvider because no failure event type has been observed.
 */
function PaymentTimeline({ events }: { events: PaymentEvent[] }) {
  return (
    <Box sx={{ py: 1 }}>
      <Typography variant="overline" color="text.secondary">Event timeline</Typography>
      <Stack spacing={1} sx={{ mt: 0.5 }}>
        {events.map((e, i) => (
          <Stack key={i} direction="row" spacing={2} sx={{ alignItems: 'baseline' }}>
            <Box component="span" sx={{ fontFamily: 'monospace', color: 'text.secondary', whiteSpace: 'nowrap', minWidth: 148 }}>
              {fmtEventTime(e.occurredOnUtc)}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2">{e.eventType}</Typography>
              {e.details && <Typography variant="caption" color="text.secondary">{e.details}</Typography>}
            </Box>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

export function TransactionsPage() {
  // Milestone gate ("view as version"). Each capability = an opt-in prop passed (or not) below —
  // existence, not disablement (docs/NOTES-gaspar-transactions-milestones.md). Default (Beyond) is
  // today's full behavior: every cap true.
  const { caps } = useMilestone();

  // Pagination + filter URL sync are now owned by `useTableFilters` (below) — one controller, one writer,
  // page/pageSize + filter params coexisting in the hash query without clobbering ?milestone.

  // One snackbar for all transient notices (copy confirmations + the action proposals).
  const [snack, setSnack] = useState<string | null>(null);
  const onCopied = () => setSnack('Copied to clipboard');

  // Filter state — official useTableFilters controller (draft/applied/apply/clear + pagination). urlSync
  // mirrors applied filters + page/pageSize to the URL and restores on load / back-forward.
  const filters = useTableFilters<TxFilters>({ initialValues: EMPTY_TX_FILTERS, urlSync: true });
  // Convert the controller's 1-based pagination to the Table's 0-based `pagination`/`onPaginationChange`
  // (Wave-2 will align these). One writer — the hook — owns the URL.
  const tablePagination: PaginationState = { pageIndex: filters.pagination.page - 1, pageSize: filters.pagination.pageSize };
  const onTablePaginationChange = (updater: PaginationState | ((p: PaginationState) => PaginationState)) => {
    const next = typeof updater === 'function' ? updater(tablePagination) : updater;
    filters.pagination.onChange({ page: next.pageIndex + 1, pageSize: next.pageSize });
  };

  // v1.2 `[+]` advanced fields — page-level composition around the official component (which stays static):
  // the page owns WHICH optional definitions are active and renders the [+] / remove menu; active keys are
  // folded into the `definitions` array. (Was the Legacy bar's advanced addable-field menu.)
  const [activeOptional, setActiveOptional] = useState<OptionalKey[]>([]);
  const [addAnchor, setAddAnchor] = useState<HTMLElement | null>(null);
  const removeOptional = (key: OptionalKey) => {
    setActiveOptional((prev) => prev.filter((k) => k !== key));
    filters.setDraftValue(key, '');
  };

  // Definitions — search (compound at v1.1+, else the four id/psp/customer/email text fields), the date
  // range, the base selects, then the active v1.2 optional fields.
  const definitions = useMemo<TableFilterDefinition<TxFilters>[]>(() => {
    const search: TableFilterDefinition<TxFilters>[] = caps.compoundSearch
      ? [{ key: 'q', control: 'text', label: 'Search', placeholder: 'Search ID, PSP ID, customer, email' }]
      : [
          { key: 'searchId', control: 'text', label: 'ID' },
          { key: 'searchPsp', control: 'text', label: 'PSP ID' },
          { key: 'searchCustomer', control: 'text', label: 'Customer' },
          { key: 'searchEmail', control: 'text', label: 'Customer Email' },
        ];
    const opt = (key: OptionalKey): TableFilterDefinition<TxFilters> => {
      if (key === 'currency') return { key, control: 'select', label: 'Currency', options: [{ label: 'Any', value: '' }, ...CURRENCY_OPTIONS.map((c) => ({ label: c, value: c }))] };
      if (key === 'threeDs') return { key, control: 'select', label: '3DS status', options: [{ label: 'Any', value: '' }, ...THREEDS_OPTIONS.map((t) => ({ label: t, value: t }))] };
      if (key === 'errorCode') return { key, control: 'select', label: 'Error code', options: [{ label: 'Any', value: '' }, { label: 'None', value: ERROR_CODE_NONE }, ...ERROR_CODE_OPTIONS.map((c) => ({ label: c, value: c }))] };
      return { key, control: 'text', label: OPTIONAL_LABEL[key] }; // amountMin / amountMax
    };
    return [
      ...search,
      { key: 'createdFrom', control: 'dateTime', label: 'Created from' },
      { key: 'createdTo', control: 'dateTime', label: 'Created to' },
      { key: 'status', control: 'select', label: 'Status', options: [{ label: 'All', value: '' }, ...STATUS_OPTIONS.map((s) => ({ label: s, value: s }))] },
      { key: 'direction', control: 'select', label: 'Direction', options: [{ label: 'All', value: '' }, ...DIRECTION_OPTIONS.map((d) => ({ label: d, value: d }))] },
      { key: 'provider', control: 'select', label: 'Provider', options: [{ label: 'All', value: '' }, ...PROVIDER_OPTIONS.map((p) => ({ label: p, value: p }))] },
      ...activeOptional.map(opt),
    ];
  }, [caps.compoundSearch, activeOptional]);

  const applied = filters.applied;

  const rows = useMemo(() => {
    const q = applied.q.trim().toLowerCase();
    return PAYMENTS.filter((r) => {
      // Search: id, pspTransactionId, customerId, customerEmail (email added 2026-09-10 — ops flow).
      // COMPOUND (v1.1+): one field across all four. Empty at v1.0.
      if (q) {
        const hay = `${r.id} ${r.pspTransactionId ?? ''} ${r.customerId} ${r.customerEmail}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      // v1.0 INDIVIDUAL searches — each its own column (contains, case-insensitive). Empty at v1.1+.
      if (applied.searchId && !r.id.toLowerCase().includes(applied.searchId.trim().toLowerCase())) return false;
      if (applied.searchPsp && !(r.pspTransactionId ?? '').toLowerCase().includes(applied.searchPsp.trim().toLowerCase())) return false;
      if (applied.searchCustomer && !r.customerId.toLowerCase().includes(applied.searchCustomer.trim().toLowerCase())) return false;
      if (applied.searchEmail && !r.customerEmail.toLowerCase().includes(applied.searchEmail.trim().toLowerCase())) return false;
      // Date range — the dateTime controls yield yyyy-mm-ddThh:mm; SLICE to the calendar date to keep the
      // original date-granularity behaviour (upstream gap: no `date` control). Inclusive.
      const day = r.createdAt.slice(0, 10);
      if (applied.createdFrom && day < applied.createdFrom.slice(0, 10)) return false;
      if (applied.createdTo && day > applied.createdTo.slice(0, 10)) return false;
      // Exact-match selects (defaults).
      if (applied.status && r.status !== applied.status) return false;
      if (applied.direction && r.direction !== applied.direction) return false;
      if (applied.provider && r.psp !== applied.provider) return false;
      // Advanced (v1.2 [+]) — each inert when empty.
      if (applied.currency && r.currency !== applied.currency) return false;
      if (applied.threeDs && r.threeDsStatus !== applied.threeDs) return false;
      if (applied.errorCode) {
        if (applied.errorCode === ERROR_CODE_NONE) {
          if (r.errorCode) return false; // want rows WITHOUT an error code
        } else if (r.errorCode !== applied.errorCode) {
          return false;
        }
      }
      // Amount range — LENIENT parse (upstream gap: no number/money control): non-numeric input filters as
      // empty rather than erroring.
      const min = Number(applied.amountMin);
      const max = Number(applied.amountMax);
      if (applied.amountMin.trim() !== '' && Number.isFinite(min) && r.amount < min) return false;
      if (applied.amountMax.trim() !== '' && Number.isFinite(max) && r.amount > max) return false;
      return true;
    });
  }, [applied]);

  // TASK A — selection + batch actions. Export is REAL (client-side JSON download); Complete/Decline
  // are PROPOSALS (confirm → snackbar, no mutation). Eligibility: Pending only (assumption).
  // Bulk actions are a FACTORY (Option C) so disabled/reason reflect the live selection.
  const bulkActions = (selectedRows: PaymentRow[]) => {
    // Export is present whenever the bulk strip is (v1.1+); Complete/Decline join the SAME strip only
    // at Beyond (caps.actions). Export is a FORMAT MENU (JSON/CSV real, PDF/Excel proposals).
    const noEligible = selectedRows.every((r) => r.status !== 'pending');
    return [
      { id: 'export', label: 'Export', options: EXPORT_FORMATS },
      ...(caps.actions
        ? [
            { id: 'complete', label: 'Complete', confirm: true, disabled: noEligible, disabledReason: ELIGIBILITY_REASON },
            { id: 'decline', label: 'Decline', destructive: true, disabled: noEligible, disabledReason: ELIGIBILITY_REASON },
          ]
        : []),
    ];
  };
  const onBulkAction = (actionId: string, selectedIds: string[], optionId?: string) => {
    const selected = PAYMENTS.filter((r) => selectedIds.includes(r.id));
    if (actionId === 'export') {
      if (optionId === 'json') { downloadJson(`transactions-${selected.length}.json`, selected); setSnack(`Exported ${selected.length} transaction(s) to JSON.`); }
      else if (optionId === 'csv') { downloadCsv(`transactions-${selected.length}.csv`, selected); setSnack(`Exported ${selected.length} transaction(s) to CSV.`); }
      else { setSnack(`${EXPORT_LABEL[optionId ?? '']} export — design proposal, no backend. Nothing was generated.`); }
      return;
    }
    // Complete/Decline already passed the organism's confirm (confirm / destructive).
    const eligible = selected.filter((r) => r.status === 'pending').length;
    const verb = actionId === 'complete' ? 'Complete' : 'Decline';
    setSnack(`${verb} — design proposal, no backend. ${eligible} eligible transaction(s) would be affected. Nothing was changed.`);
  };

  // Same three actions on the row kebab (rail grammar) — Export as a format SUBMENU (JSON/CSV real per
  // row, PDF/Excel proposal snackbar); Complete/Decline proposals with a per-row confirm. Disabled +
  // reason when the row isn't Pending (BeamRowAction doctrine).
  const exportProposal = (fmt: string) => setSnack(`${EXPORT_LABEL[fmt]} export — design proposal, no backend.`);
  const rowActions = (row: PaymentRow) => {
    const notPending = row.status !== 'pending';
    return [
      {
        id: 'export', label: 'Export', options: [
          { id: 'json', label: 'JSON', onSelect: () => { downloadJson(`payment-${row.id}.json`, row); setSnack('Exported 1 transaction to JSON.'); } },
          { id: 'csv', label: 'CSV', onSelect: () => { downloadCsv(`payment-${row.id}.csv`, [row]); setSnack('Exported 1 transaction to CSV.'); } },
          { id: 'pdf', label: 'PDF', onSelect: () => exportProposal('pdf') },
          { id: 'excel', label: 'Excel', onSelect: () => exportProposal('excel') },
        ],
      },
      {
        id: 'complete', label: 'Complete', disabled: notPending, disabledReason: ELIGIBILITY_REASON,
        onSelect: () => { if (window.confirm(`Complete transaction ${row.id}?`)) setSnack('Complete — design proposal, no backend. Nothing was changed.'); },
      },
      {
        id: 'decline', label: 'Decline', destructive: true, disabled: notPending, disabledReason: ELIGIBILITY_REASON,
        onSelect: () => { if (window.confirm(`Decline transaction ${row.id}?`)) setSnack('Decline — design proposal, no backend. Nothing was changed.'); },
      },
    ];
  };

  // Default-visible set, in spec order. (When bullet 3 lands, the CATALOG above joins these as the
  // column manager's contents.)
  const columns: BeamColumn<PaymentRow>[] = [
    // Declared default order (2026-09-10 meeting): timestamps lead, then the transaction essentials,
    // then customer + the rest. Persisted arrangements are untouched by the column-manager merge rule —
    // browsers with a saved order need "Reset to defaults" to adopt this ORDER (the new Customer Email
    // column alone appears via the merge, at its declared position after Customer).
    { key: 'createdAt', header: 'Created At', align: 'right', getValue: (r) => r.createdAt, width: 150, render: (r) => <TimestampCell iso={r.createdAt} /> },
    { key: 'updatedAt', header: 'Last Updated', align: 'right', getValue: (r) => r.updatedAt, width: 150, render: (r) => <TimestampCell iso={r.updatedAt} /> },
    { key: 'id', header: 'Transaction ID', getValue: (r) => r.id, width: 168, render: (r) => <TruncateCopyCell value={r.id} onCopied={onCopied} /> },
    // Direction is a CATEGORY, not a state — plain text, no badge (grammar: semantic hues are for states only).
    { key: 'direction', header: 'Direction', getValue: (r) => r.direction, width: 124, render: (r) => r.direction },
    { key: 'amount', header: 'Amount', align: 'right', getValue: (r) => r.amount, width: 110, render: (r) => r.amount.toFixed(2) },
    { key: 'status', header: 'Status', getValue: (r) => r.status, width: 132, render: (r) => <BeamBadge {...statusTier(r.status)} size="small" /> },
    { key: 'customerId', header: 'Customer', getValue: (r) => r.customerId, width: 130, render: (r) => r.customerId },
    // Customer Email — copy-able like the ID cells, normal face, ellipsis only when width-constrained.
    { key: 'customerEmail', header: 'Customer Email', getValue: (r) => r.customerEmail, width: 200, render: (r) => <TruncateCopyCell value={r.customerEmail} mode="auto" onCopied={onCopied} /> },
    { key: 'pspTransactionId', header: 'PSP Transaction ID', getValue: (r) => r.pspTransactionId ?? '', width: 184, render: (r) => <TruncateCopyCell value={r.pspTransactionId} mono onCopied={onCopied} /> },
    { key: 'paymentMethodId', header: 'Payment method', getValue: (r) => r.paymentMethodId, width: 168, render: (r) => <PaymentMethodCell row={r} onCopied={onCopied} /> },
    { key: 'currency', header: 'Currency', getValue: (r) => r.currency, width: 96, render: (r) => r.currency },
    // Card Type is a CATEGORY, not a state — plain text, no badge (Direction/3DS grammar ruling).
    // PROPOSED column — card brand lives on payment-methods, not the payments list (SPEC ledger). Persisted
    // column arrangements gain it AT THIS POSITION via the manager's merge rule; nothing else moves, so no
    // Reset needed (Reset only to adopt a changed default ORDER — unchanged here).
    { key: 'cardType', header: 'Card Type', getValue: (r) => r.cardType, width: 120, render: (r) => r.cardType },
    // PROPOSED column — errorCode has no data source in the payments API yet (see SPEC build-notes).
    { key: 'errorCode', header: 'Error Code', getValue: (r) => r.errorCode ?? '', width: 110, render: (r) => <ErrorCodeCell code={r.errorCode} /> },
    { key: 'psp', header: 'Provider', getValue: (r) => r.psp, width: 110, render: (r) => r.psp },
    // 3DS status is a CATEGORY, not a state — plain text, no badge.
    { key: 'threeDsStatus', header: '3DS Status', getValue: (r) => r.threeDsStatus, width: 132, render: (r) => r.threeDsStatus },
  ];

  // Section gap from the shared token; the gap-surgery sx is inert until this grid opts into stickyChrome
  // (then it donates the pre-grid seam to the header ceiling).
  return (
    <Stack spacing={PAGE_SECTION_GAP} sx={stickyChromeGapSx}>
      <BeamPage title="Transactions" />

      {/* Filters — official TableFilters (typed `definitions` + `useTableFilters` controller: draft → apply →
          applied, Filter/Clear built in). Milestone gating is PAGE-LEVEL (the definitions array per phase),
          never a component concern: v1.0 shows four id/psp/customer/email text fields, v1.1+ the compound
          search. The v1.2 `[+]` advanced menu is PAGE-LOCAL composition around the static component (the page
          owns which optional definitions are active). Wrapped in the stickyChromeExitSx Box so the exit
          animation + snap geometry are unchanged (the Box is still the pre-grid section). */}
      <Box sx={stickyChromeExitSx}>
        {caps.advancedFilters && (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1, flexWrap: 'wrap' }}>
            {activeOptional.map((k) => (
              <Chip key={k} label={OPTIONAL_LABEL[k]} size="small" onDelete={() => removeOptional(k)} />
            ))}
            {activeOptional.length < OPTIONAL_KEYS.length && (
              <>
                <Button size="small" variant="text" startIcon={<AddIcon />} onClick={(e) => setAddAnchor(e.currentTarget)}>
                  Add filter
                </Button>
                <Menu anchorEl={addAnchor} open={Boolean(addAnchor)} onClose={() => setAddAnchor(null)}>
                  {OPTIONAL_KEYS.filter((k) => !activeOptional.includes(k)).map((k) => (
                    <MenuItem
                      key={k}
                      onClick={() => {
                        setActiveOptional((prev) => [...prev, k]);
                        setAddAnchor(null);
                      }}
                    >
                      {OPTIONAL_LABEL[k]}
                    </MenuItem>
                  ))}
                </Menu>
              </>
            )}
          </Box>
        )}
        <TableFilters definitions={definitions} controller={filters} />
      </Box>

      <Table
        columns={columns}
        rows={rows}
        getRowId={(r) => r.id}
        paginated
        // Pagination is owned by useTableFilters (URL source of truth, coexisting with filter params). The
        // controller is 1-based; converted to the Table's 0-based `pagination`/`onPaginationChange` here.
        pagination={tablePagination}
        onPaginationChange={onTablePaginationChange}
        // Sticky chrome — the header bucket pins to the top, the footer to the bottom, the page owns the
        // scroll. NOT milestone-gated (layout is baseline UX). The Stack's stickyChromeGapSx + the shell's
        // main:has() contract are already in place and activate off this grid's data-beam-sticky-chrome.
        stickyChrome
        // Pagination-at-500 (v1.2+, Ruslan's feedback): heavy page sizes + jump-to-page are opt-in and
        // milestone-gated. v1.0/v1.1 keep the organism's light default ([5,10,25]); default size stays
        // 10 so the severity story leads page one.
        pageSizeOptions={caps.paginationAt500 ? [10, 25, 50, 100, 250, 500] : undefined}
        jumpToPage={caps.paginationAt500}
        // MILESTONE GATE — existence, not disablement. selection (checkboxes + bulk strip) is v1.1+;
        // the row kebab (rowActions: Complete/Decline + per-row Export folded in) is Beyond-only; the
        // column manager is v1.2+. Beyond = every cap true = today's full behavior.
        selectable={caps.selection}
        // Severity accent — failed rows get a leading danger bar (redundant reinforcement of the
        // Status chip; the chip names, the accent locates). Grammar spatial-accents note.
        rowAccent={(r) => (r.status === 'failed' ? 'danger' : undefined)}
        bulkActions={caps.selection ? bulkActions : undefined}
        onBulkAction={caps.selection ? onBulkAction : undefined}
        rowActions={caps.actions ? rowActions : undefined}
        renderExpanded={(r) => <PaymentTimeline events={r.events} />}
        emptyMessage="No transactions match these filters."
        // Column manager (bullet 3, v1.2+). Catalog = the bullet-1 columns with no data source yet —
        // shown in the manager disabled/"awaiting data" (option b). Payment Method Details is excluded:
        // it's the Phase B card cell inside Payment method, not a column of its own.
        columnManager={
          caps.columnManager
            ? {
                storageKey: 'gaspar.transactions',
                catalog: [
                  { id: 'transactionType', label: 'Transaction Type' },
                  { id: 'nameOnCard', label: 'Name on Card' },
                  { id: 'processedBy', label: 'ProcessedBy' },
                  { id: 'fraudRulesMatched', label: 'Fraud Rules Matched' },
                ],
              }
            : undefined
        }
        aria-label="Payment transactions"
      />

      <Snackbar
        open={snack !== null}
        autoHideDuration={3000}
        onClose={() => setSnack(null)}
        message={snack ?? ''}
      />
    </Stack>
  );
}
