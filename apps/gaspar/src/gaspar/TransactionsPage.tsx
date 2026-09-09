import { useMemo, useState } from 'react';
import {
  Stack,
  Box,
  Typography,
  Snackbar,
  Tooltip,
  IconButton,
  MenuItem,
  BeamField,
  BeamBadge,
  BeamFilterBar,
  BeamDataTable,
  BeamPageHeader,
} from '@betty/beam';
import type { BeamColumn, AddableField, BeamBadgeProps } from '@betty/beam';
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
  paymentMethodId: string;
  amount: number;
  currency: string;
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

// Mock of the server-paginated payments response (no real endpoint reachable in this app). Generated
// (~40 rows) — real status vocabulary (phase-3 reseed): created/processing/pending/failed/completed;
// providers Nuvei/Adyen; currencies USD/EUR/CAD. Mostly-completed; created/pending carry a null
// pspTransactionId (pre-submit); failed rows carry distinct MTI errorCodes; amounts span magnitudes;
// createdAt spreads across ~3 weeks.
const CURRENCIES = ['USD', 'EUR', 'CAD'] as const;
const AMOUNT_MAGNITUDES = [12.5, 47.99, 149, 320, 899.5, 1200, 2450, 4800, 75, 18.25];
const FAILED_MTI = ['0400', '0100', '0200', '0210', '0230', '0800', '0120', '0330']; // distinct observed codes
const RAW_PAYMENTS: Omit<PaymentRow, 'events'>[] = Array.from({ length: 40 }, (_, i) => {
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
  const currency = CURRENCIES[i % 3];
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
    paymentMethodId: `pm_${token}`,
    amount,
    currency,
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
 * BeamFilterBar's apply model (bar v1 spec; UsersPage is the estate reference): the bar edits a
 * `draft`; the grid filters by `applied`; the Filter CTA commits draft → applied. We keep BOTH stores
 * page-local — no URL/query-param persistence (this page's own constraint), which is the one deviation
 * from UsersPage (it persists `applied` in the URL).
 */
interface Filters {
  // Default (always-present) fields.
  q: string;
  start: string; // yyyy-mm-dd, inclusive lower bound on createdAt
  end: string; // yyyy-mm-dd, inclusive upper bound on createdAt
  status: string;
  direction: string;
  provider: string;
  // Addable-field VALUE slots (empty unless the field is added AND filled — empty filters nothing).
  // The bar owns whether these fields are shown; the page always owns their values.
  currency: string;
  threeDs: string;
  errorCode: string; // '' = any; '__none__' = rows with no error code
  amountMin: string;
  amountMax: string;
}
const EMPTY_FILTERS: Filters = { q: '', start: '', end: '', status: '', direction: '', provider: '', currency: '', threeDs: '', errorCode: '', amountMin: '', amountMax: '' };
const isActive = (f: Filters) =>
  f.q !== '' || f.start !== '' || f.end !== '' || f.status !== '' || f.direction !== '' || f.provider !== '' ||
  f.currency !== '' || f.threeDs !== '' || f.errorCode !== '' || f.amountMin !== '' || f.amountMax !== '';

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

/** Serialize to a downloaded .json (the one REAL action — client-side blob, no backend). */
function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
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
  // One snackbar for all transient notices (copy confirmations + the action proposals).
  const [snack, setSnack] = useState<string | null>(null);
  const onCopied = () => setSnack('Copied to clipboard');

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

  // ADVANCED filters (bar owns structure + persistence; page owns these controls' values in `draft`).
  // Each control is a page-wired input rendered by the bar only when the field is added. Selects offer
  // observed values only. Amount is one field, two inputs.
  const addableFields: AddableField[] = [
    {
      id: 'currency',
      label: 'Currency',
      control: (
        <BeamField select label="Currency" value={draft.currency} onChange={(e) => patchDraft({ currency: e.target.value })} fullWidth>
          <MenuItem value="">Any</MenuItem>
          {CURRENCY_OPTIONS.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
        </BeamField>
      ),
    },
    {
      id: 'threeDs',
      label: '3DS status',
      control: (
        <BeamField select label="3DS status" value={draft.threeDs} onChange={(e) => patchDraft({ threeDs: e.target.value })} fullWidth>
          <MenuItem value="">Any</MenuItem>
          {THREEDS_OPTIONS.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
        </BeamField>
      ),
    },
    {
      id: 'errorCode',
      label: 'Error code',
      control: (
        <BeamField select label="Error code" value={draft.errorCode} onChange={(e) => patchDraft({ errorCode: e.target.value })} fullWidth>
          <MenuItem value="">Any</MenuItem>
          <MenuItem value={ERROR_CODE_NONE}>None</MenuItem>
          {ERROR_CODE_OPTIONS.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
        </BeamField>
      ),
    },
    {
      id: 'amount',
      label: 'Amount',
      control: (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <BeamField label="Min" type="number" value={draft.amountMin} onChange={(e) => patchDraft({ amountMin: e.target.value })} onKeyDown={applyOnEnter} slotProps={{ inputLabel: { shrink: true } }} fullWidth />
          <BeamField label="Max" type="number" value={draft.amountMax} onChange={(e) => patchDraft({ amountMax: e.target.value })} onKeyDown={applyOnEnter} slotProps={{ inputLabel: { shrink: true } }} fullWidth />
        </Box>
      ),
    },
    // Disabled "awaiting data" ledger — the third rendered ledger (columns manager, error codes, now
    // the filter [+] menu). Never addable; sourced from the bullet-1 catalog.
    { id: 'transactionType', label: 'Transaction Type', control: null, disabled: true, disabledReason: 'awaiting data' },
    { id: 'nameOnCard', label: 'Name on Card', control: null, disabled: true, disabledReason: 'awaiting data' },
    { id: 'processedBy', label: 'ProcessedBy', control: null, disabled: true, disabledReason: 'awaiting data' },
    { id: 'fraudRulesMatched', label: 'Fraud Rules Matched', control: null, disabled: true, disabledReason: 'awaiting data' },
  ];
  // Removing a field clears its draft value(s); the grid updates only on the next FILTER (doctrine).
  const onFieldRemoved = (id: string) => {
    if (id === 'amount') patchDraft({ amountMin: '', amountMax: '' });
    else if (id === 'currency' || id === 'threeDs' || id === 'errorCode') patchDraft({ [id]: '' } as Partial<Filters>);
  };

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
      // Exact-match selects (defaults).
      if (applied.status && r.status !== applied.status) return false;
      if (applied.direction && r.direction !== applied.direction) return false;
      if (applied.provider && r.psp !== applied.provider) return false;
      // Addable fields — each inert when empty (i.e. not added, or added-but-unfilled).
      if (applied.currency && r.currency !== applied.currency) return false;
      if (applied.threeDs && r.threeDsStatus !== applied.threeDs) return false;
      if (applied.errorCode) {
        if (applied.errorCode === ERROR_CODE_NONE) {
          if (r.errorCode) return false; // want rows WITHOUT an error code
        } else if (r.errorCode !== applied.errorCode) {
          return false;
        }
      }
      if (applied.amountMin && r.amount < Number(applied.amountMin)) return false;
      if (applied.amountMax && r.amount > Number(applied.amountMax)) return false;
      return true;
    });
  }, [applied]);

  // TASK A — selection + batch actions. Export is REAL (client-side JSON download); Complete/Decline
  // are PROPOSALS (confirm → snackbar, no mutation). Eligibility: Pending only (assumption).
  // Bulk actions are a FACTORY (Option C) so disabled/reason reflect the live selection.
  const bulkActions = (selectedRows: PaymentRow[]) => {
    const noEligible = selectedRows.every((r) => r.status !== 'pending');
    return [
      { id: 'export', label: 'Export' },
      { id: 'complete', label: 'Complete', confirm: true, disabled: noEligible, disabledReason: ELIGIBILITY_REASON },
      { id: 'decline', label: 'Decline', destructive: true, disabled: noEligible, disabledReason: ELIGIBILITY_REASON },
    ];
  };
  const onBulkAction = (actionId: string, selectedIds: string[]) => {
    const selected = PAYMENTS.filter((r) => selectedIds.includes(r.id));
    if (actionId === 'export') {
      downloadJson(`transactions-${selected.length}.json`, selected);
      setSnack(`Exported ${selected.length} transaction(s) to JSON.`);
      return;
    }
    // Complete/Decline already passed the organism's confirm (confirm / destructive).
    const eligible = selected.filter((r) => r.status === 'pending').length;
    const verb = actionId === 'complete' ? 'Complete' : 'Decline';
    setSnack(`${verb} — design proposal, no backend. ${eligible} eligible transaction(s) would be affected. Nothing was changed.`);
  };

  // Same three actions on the row kebab (rail grammar) — Export real per-row, Complete/Decline
  // proposals with a per-row confirm (row-level confirm lives in onSelect). Disabled + reason when the
  // row isn't Pending (BeamRowAction doctrine).
  const rowActions = (row: PaymentRow) => {
    const notPending = row.status !== 'pending';
    return [
      { id: 'export', label: 'Export', onSelect: () => { downloadJson(`payment-${row.id}.json`, row); setSnack('Exported 1 transaction to JSON.'); } },
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
    // Declared default order (2026-09-09): Status promoted to 3rd (after the IDs, before Customer) so
    // the severity read leads. Persisted arrangements are untouched by the column-manager merge rule —
    // browsers with saved order need "Reset to defaults" to adopt this.
    { key: 'id', header: 'Transaction ID', getValue: (r) => r.id, width: 168, render: (r) => <TruncateCopyCell value={r.id} onCopied={onCopied} /> },
    { key: 'pspTransactionId', header: 'PSP Transaction ID', getValue: (r) => r.pspTransactionId ?? '', width: 184, render: (r) => <TruncateCopyCell value={r.pspTransactionId} mono onCopied={onCopied} /> },
    { key: 'status', header: 'Status', getValue: (r) => r.status, width: 132, render: (r) => <BeamBadge {...statusTier(r.status)} size="small" /> },
    { key: 'customerId', header: 'Customer', getValue: (r) => r.customerId, width: 130, render: (r) => r.customerId },
    { key: 'paymentMethodId', header: 'Payment method', getValue: (r) => r.paymentMethodId, width: 168, render: (r) => <PaymentMethodCell row={r} onCopied={onCopied} /> },
    { key: 'amount', header: 'Amount', align: 'right', getValue: (r) => r.amount, width: 110, render: (r) => r.amount.toFixed(2) },
    { key: 'currency', header: 'Currency', getValue: (r) => r.currency, width: 96, render: (r) => r.currency },
    // Direction is a CATEGORY, not a state — plain text, no badge (grammar: semantic hues are for states only).
    { key: 'direction', header: 'Direction', getValue: (r) => r.direction, width: 124, render: (r) => r.direction },
    // PROPOSED column — errorCode has no data source in the payments API yet (see SPEC build-notes).
    { key: 'errorCode', header: 'Error Code', getValue: (r) => r.errorCode ?? '', width: 110, render: (r) => <ErrorCodeCell code={r.errorCode} /> },
    { key: 'psp', header: 'Provider', getValue: (r) => r.psp, width: 110, render: (r) => r.psp },
    // 3DS status is a CATEGORY, not a state — plain text, no badge.
    { key: 'threeDsStatus', header: '3DS Status', getValue: (r) => r.threeDsStatus, width: 132, render: (r) => r.threeDsStatus },
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
        advanced={{ addableFields, storageKey: 'gaspar.transactions', onFieldRemoved }}
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
        selectable
        // Severity accent — failed rows get a leading danger bar (redundant reinforcement of the
        // Status chip; the chip names, the accent locates). Grammar spatial-accents note.
        rowAccent={(r) => (r.status === 'failed' ? 'danger' : undefined)}
        bulkActions={bulkActions}
        onBulkAction={onBulkAction}
        rowActions={rowActions}
        renderExpanded={(r) => <PaymentTimeline events={r.events} />}
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
        open={snack !== null}
        autoHideDuration={3000}
        onClose={() => setSnack(null)}
        message={snack ?? ''}
      />
    </Stack>
  );
}
