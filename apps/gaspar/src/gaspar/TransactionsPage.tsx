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
  TextField,
  Paper,
  Divider,
  ListItemText,
  useTableFilters,
  TableNext,
  beamCells,
  BeamPage,
  stickyChromeGapSx,
  stickyChromeExitSx,
  PAGE_SECTION_GAP,
} from '@betty/beam';
import type { TableFilterDefinition, ActionMenuItem } from '@betty/beam';
import type { ColumnDef } from '@tanstack/react-table';
import ContentCopyIcon from '@mui/icons-material/ContentCopyRounded';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { useMilestone } from './milestone';
// The WIRE-shaped fixture store (Task 2) — the "server". The page's only data adapter is the store's
// `toDisplayRow`; pagination is the store's native envelope, consumed 1-based without slicing. Interim
// rulings + their open-question numbers are ledgered in transactionsFixture.ts.
import {
  type TransactionRow,
  type PaymentEvent,
  queryTransactions,
  toDisplayRow,
  findTransactions,
  statusBadge,
  isEligible,
  isDanger,
  STATUS_OPTIONS,
  DIRECTION_OPTIONS,
  PROVIDER_OPTIONS,
  CURRENCY_OPTIONS,
  THREEDS_OPTIONS,
  ERROR_CODE_OPTIONS,
} from './transactionsFixture';

// Pagination lives in the URL (source of truth) via useTableFilters — survives the nav-toggle remount +
// refresh; back/forward + link-sharing work. Defaults stay OUT of the URL (clean URL at 10 / page 1, the
// hook's DEFAULT_TABLE_PAGE_SIZE). 1-based `page`; the store's envelope is 1-based too (no seam).

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
 * Data source (Task 2, 2026-09-24): the WIRE-shaped fixture store in `transactionsFixture.ts` — 1,200
 * rows in Konstantin's `payments` shape, served through its envelope. `TransactionRow` (imported) is the
 * ENRICHED display shape the columns/filters below consume; the store's `toDisplayRow` is the only
 * adapter. All interim rulings (currency CAD, amount 2dp, the wire's four PascalCase statuses, Failed as
 * the interim eligibility anchor, ENRICHED email + card summary, Nuvei/Worldpay, `pay_`-prefixed display
 * id over the int PK) are ledgered there with their open-question numbers.
 *
 * CATALOG — columns known but NOT built (no data source in the `payments` list response). Documented so
 * bullet 3's column manager inherits the full conversation; nothing below renders them. Do not fake.
 *   • Transaction Type — RESOLVED (terminology 2026-09-24): the USER-FACING LABEL for the `direction`
 *                        field, so it's the renamed `direction` column below (not a catalog entry).
 *                        DISPLAY-ONLY — field, filter key `direction`, cr.* URL param unchanged.
 *   • Name on Card / ProcessedBy / Fraud Rules Matched — no field in payments; backend asks.
 *   • Payment Method Details — brand/last4 → the ENRICHED card cell (kept, [Q6]), not a column of its own.
 * Also intentionally not shown: threeDsSessionReference (detail material), the wire int id (surfaced via
 * the display id).
 */

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

// The optional (v1.2 `[+]`) filter KEYS — the concrete TxFilters fields an addable maps to. The page owns
// which are ACTIVE, folds their definitions into the array, and renders each active field with an inline ×.
const OPTIONAL_KEYS = ['currency', 'threeDs', 'errorCode', 'amountMin', 'amountMax'] as const;
type OptionalKey = (typeof OPTIONAL_KEYS)[number];
const OPTIONAL_LABEL: Record<OptionalKey, string> = {
  currency: 'Currency', threeDs: '3DS status', errorCode: 'Error code', amountMin: 'Min amount', amountMax: 'Max amount',
};

// LOGICAL addables shown in the `[+]` menu. Each maps to one or two keys; "Amount" is a SINGLE entry that
// adds the min+max pair (and its × removes both). The awaiting-data catalog mirrors the column manager's:
// known dimensions with no data source yet, shown as disabled items with an "awaiting data" subtitle.
type Addable = 'threeDs' | 'errorCode' | 'amount' | 'currency';
const ADDABLE_ORDER: Addable[] = ['threeDs', 'errorCode', 'amount', 'currency'];
const ADDABLE_LABEL: Record<Addable, string> = { threeDs: '3DS status', errorCode: 'Error code', amount: 'Amount', currency: 'Currency' };
const ADDABLE_KEYS: Record<Addable, OptionalKey[]> = { threeDs: ['threeDs'], errorCode: ['errorCode'], amount: ['amountMin', 'amountMax'], currency: ['currency'] };
const KEY_ADDABLE: Record<OptionalKey, Addable> = { threeDs: 'threeDs', errorCode: 'errorCode', amountMin: 'amount', amountMax: 'amount', currency: 'currency' };
// 'Transaction Type' dropped 2026-09-24 — it's now the `direction` filter's label, not an awaiting-data field.
const AWAITING_DATA_FIELDS = ['Name on Card', 'ProcessedBy', 'Fraud Rules Matched'];

const ERROR_CODE_NONE = '__none__'; // sentinel value for "rows with no error code"

const EM_DASH = '—';

// Mono cells (PSP ID / error code / timeline) use Roboto Mono Variable via the theme's --beam-mono-* vars,
// which FOLLOW the body weight — so the grid reads as ONE weight at any body wght (no mono-clamps-heavier
// split at 240) and the wght slider thins mono in lockstep. Fallback = system monospace (theme without the
// mono seam); font-weight simply inherits when --beam-mono-wght is unset.
const MONO_SX = { fontFamily: 'var(--beam-mono-family, monospace)', fontWeight: 'var(--beam-mono-wght)' } as const;

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
      <Box component="span" tabIndex={0} sx={{ ...MONO_SX, cursor: 'help', borderRadius: 0.5 }}>
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
            ...(mono ? MONO_SX : {}),
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

// The status grammar map (vocabulary → hue/volume, plus the eligibility + danger flags) now lives ONCE in
// transactionsFixture.ts's STATUS_META — read via `statusBadge` / `isEligible` / `isDanger` here — so the
// wire vocabulary [Q3] and the interim Failed eligibility anchor [Q4] have a single source, not literals
// scattered across the badge, the accent, and the action guards.

/** The card summary is now ENRICHED onto every row [Q6]: brand •••• last4, with the FK kept in the reveal
 *  (Payment method column). The former Phase-A GUID fallback is retired — the summary is always present. */
function PaymentMethodCell({ row }: { row: TransactionRow }) {
  const { brand, last4, bin, expiry, paymentMethodId } = row.cardSummary;
  const detail = [`pm #${paymentMethodId} (FK)`, bin && `BIN ${bin}`, expiry && `exp ${expiry}`].filter(Boolean).join(' · ');
  return (
    <Tooltip title={detail}>
      <Box component="span" sx={{ whiteSpace: 'nowrap' }}>{brand} •••• {last4}</Box>
    </Tooltip>
  );
}

// Complete/Decline eligibility — INTERIM anchor = Failed ([Q4], flag-5 pending; the wire has no Pending
// state). Encoded in STATUS_META.eligible, surfaced via isEligible; this string is the disabled reason.
const ELIGIBILITY_REASON = 'INTERIM: eligibility anchored to Failed pending the product ruling (the wire has no Pending state) — see gaspar-api-notes.md flag 5.';

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
const CSV_FIELDS: { header: string; get: (r: TransactionRow) => string | number }[] = [
  { header: 'Created At', get: (r) => r.createdAt },
  { header: 'Last Updated', get: (r) => r.updatedAt },
  { header: 'Transaction ID', get: (r) => r.id },
  { header: 'Transaction Type', get: (r) => r.direction }, // user-facing CSV header (terminology 2026-09-24); field unchanged
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
function downloadCsv(filename: string, rows: TransactionRow[]) {
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
            <Box component="span" sx={{ ...MONO_SX, color: 'text.secondary', whiteSpace: 'nowrap', minWidth: 148 }}>
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

  // CONTROLLED selection (server-shaped): the page owns the selection set keyed by row id, so it survives
  // paging — the port renders one page at a time, but the bulk bucket counts + acts across pages, and
  // eligibility resolves from the full PAYMENTS set. (Restores the pre-port cross-page selection as the
  // correct server-shaped pattern, not a parity hack — see the wave2 ledger.)
  const [selection, setSelection] = useState<Record<string, boolean>>({});

  // Filter state — official useTableFilters controller (draft/applied/apply/clear + pagination). urlSync
  // mirrors applied filters + page/pageSize to the URL and restores on load / back-forward.
  const filters = useTableFilters<TxFilters>({ initialValues: EMPTY_TX_FILTERS, urlSync: true });

  // v1.2 `[+]` advanced fields — PAGE-LEVEL COMPOSITION. Official TableFilters has no addable-fields / `[+]` /
  // per-field-× shape (verified against beam-alex @ b40e815 — it's a plain definition-driven bar), so to
  // reproduce the Gaspar screenshot exactly (the `[+]` as an in-grid cell after the last field; each added
  // field carrying an inline ×) the whole bar is composed page-side below, mirroring official's Paper + grid
  // geometry and driven by the SAME `useTableFilters` controller. The strongest case for the folded upstream
  // pitch: native addable-fields support (see the wave-end doctrine note). The page owns which LOGICAL
  // addables are active; their keys fold into the `definitions` array.
  const [activeAddables, setActiveAddables] = useState<Addable[]>([]);
  const [addAnchor, setAddAnchor] = useState<HTMLElement | null>(null);
  const activeOptional = useMemo<OptionalKey[]>(() => activeAddables.flatMap((a) => ADDABLE_KEYS[a]), [activeAddables]);
  const addAddable = (a: Addable) => {
    setActiveAddables((prev) => [...prev, a]);
    setAddAnchor(null);
  };
  const removeAddable = (a: Addable) => {
    setActiveAddables((prev) => prev.filter((x) => x !== a));
    // Orphan rule: drop each mapped key's draft + applied + URL value together (one × removes the pair).
    ADDABLE_KEYS[a].forEach((k) => filters.clearValue(k));
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
      { key: 'direction', control: 'select', label: 'Transaction Type', options: [{ label: 'All', value: '' }, ...DIRECTION_OPTIONS.map((d) => ({ label: d, value: d }))] }, // label renamed 2026-09-24; key 'direction' (cr.* URL param) UNCHANGED
      { key: 'provider', control: 'select', label: 'Provider', options: [{ label: 'All', value: '' }, ...PROVIDER_OPTIONS.map((p) => ({ label: p, value: p }))] },
      ...activeOptional.map(opt),
    ];
  }, [caps.compoundSearch, activeOptional]);

  const applied = filters.applied;

  // Server-side filter predicate over the DISPLAY shape — handed to the store's query. (In the real API
  // these are server params; the fixture store enriches internally to evaluate it — the interim stand-in
  // while email provenance is open, flag [Q5].)
  const matchRow = useMemo(() => {
    const q = applied.q.trim().toLowerCase();
    return (r: TransactionRow): boolean => {
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
    };
  }, [applied]);

  // Pagination is the STORE'S NATIVE ENVELOPE — the "server" filters + slices and returns
  // { items, pageNumber, pageSize, totalItems, … } (Konstantin's shape). The port consumes it 1-based with
  // NO slicing here; the only per-page work is mapping the wire items through the adapter. `pagination` is
  // the same URL-owned 1-based useTableFilters controller (no 0↔1 seam). THIS is the convergence dividend
  // (gaspar-api-notes.md §3) — swap the store for the real endpoint and this block is unchanged.
  const pagination = filters.pagination;
  const envelope = useMemo(
    () => queryTransactions({ pageNumber: pagination.page, pageSize: pagination.pageSize, match: matchRow }),
    [pagination.page, pagination.pageSize, matchRow],
  );
  const pageRows = useMemo(() => envelope.items.map(toDisplayRow), [envelope]);
  const totalCount = envelope.totalItems;

  // TASK A — selection + batch actions. Export is REAL (client-side JSON download); Complete/Decline
  // are PROPOSALS (confirm → snackbar, no mutation). Eligibility: Pending only (assumption).
  // Bulk actions are a FACTORY (Option C) so disabled/reason reflect the live selection.
  const bulkActions = () => {
    // Export is present whenever the bulk strip is (v1.1+); Complete/Decline join the SAME strip only
    // at Beyond (caps.actions). Export is a FORMAT MENU (JSON/CSV real, PDF/Excel proposals). Eligibility
    // resolves from the FULL set by the owned selection (cross-page), not the port's current-page arg.
    const selectedRows = findTransactions(Object.keys(selection).filter((id) => selection[id]));
    const noEligible = selectedRows.every((r) => !isEligible(r.status)); // [Q4] interim anchor = Failed
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
    const selected = findTransactions(selectedIds);
    if (actionId === 'export') {
      if (optionId === 'json') { downloadJson(`transactions-${selected.length}.json`, selected); setSnack(`Exported ${selected.length} transaction(s) to JSON.`); }
      else if (optionId === 'csv') { downloadCsv(`transactions-${selected.length}.csv`, selected); setSnack(`Exported ${selected.length} transaction(s) to CSV.`); }
      else { setSnack(`${EXPORT_LABEL[optionId ?? '']} export — design proposal, no backend. Nothing was generated.`); }
      return;
    }
    // Complete/Decline already passed the organism's confirm (confirm / destructive).
    const eligible = selected.filter((r) => isEligible(r.status)).length;
    const verb = actionId === 'complete' ? 'Complete' : 'Decline';
    setSnack(`${verb} — design proposal, no backend. ${eligible} eligible transaction(s) would be affected. Nothing was changed.`);
  };

  // Same three actions on the row kebab (rail grammar), as the port's ActionMenuItem[] — Export as a format
  // SUBMENU via the `options` lane (JSON/CSV real per row, PDF/Excel proposal snackbar); Complete/Decline
  // proposals with a per-row confirm. Disabled + `disabledTooltip` reason when the row isn't Pending.
  const exportProposal = (fmt: string) => setSnack(`${EXPORT_LABEL[fmt]} export — design proposal, no backend.`);
  const menuItems = (row: TransactionRow): ActionMenuItem[] => {
    const notEligible = !isEligible(row.status); // [Q4] interim anchor = Failed
    return [
      {
        id: 'export', label: 'Export', onSelect: () => undefined, options: [
          { id: 'json', label: 'JSON', onSelect: () => { downloadJson(`payment-${row.id}.json`, row); setSnack('Exported 1 transaction to JSON.'); } },
          { id: 'csv', label: 'CSV', onSelect: () => { downloadCsv(`payment-${row.id}.csv`, [row]); setSnack('Exported 1 transaction to CSV.'); } },
          { id: 'pdf', label: 'PDF', onSelect: () => exportProposal('pdf') },
          { id: 'excel', label: 'Excel', onSelect: () => exportProposal('excel') },
        ],
      },
      {
        id: 'complete', label: 'Complete', disabled: notEligible, disabledTooltip: ELIGIBILITY_REASON,
        onSelect: () => { if (window.confirm(`Complete transaction ${row.id}?`)) setSnack('Complete — design proposal, no backend. Nothing was changed.'); },
      },
      {
        id: 'decline', label: 'Decline', destructive: true, disabled: notEligible, disabledTooltip: ELIGIBILITY_REASON,
        onSelect: () => { if (window.confirm(`Decline transaction ${row.id}?`)) setSnack('Decline — design proposal, no backend. Nothing was changed.'); },
      },
    ];
  };

  // Default-visible set, in spec order — Wave-2 raw `ColumnDef`s: `beamCells` where a cell maps to a helper
  // (text / number / badge / timestamp), a bespoke display column (raw `cell`) where it doesn't (the
  // copy-able IDs carry the page's `onCopied` snackbar; the MTI ErrorCodeCell; the Phase-B PaymentMethodCell).
  // (When bullet 3 lands, the CATALOG above joins these as the column manager's contents.)
  const columns: ColumnDef<TransactionRow, unknown>[] = [
    // Declared default order (2026-09-10 meeting): timestamps lead, then the transaction essentials,
    // then customer + the rest. Persisted arrangements are untouched by the column-manager merge rule.
    beamCells.timestamp({ id: 'createdAt', header: 'Created At', accessor: (r) => r.createdAt, format: (iso) => <TimestampCell iso={iso} />, width: 150 }),
    beamCells.timestamp({ id: 'updatedAt', header: 'Last Updated', accessor: (r) => r.updatedAt, format: (iso) => <TimestampCell iso={iso} />, width: 150 }),
    { id: 'id', header: 'Transaction ID', cell: ({ row }) => <TruncateCopyCell value={row.original.id} onCopied={onCopied} />, meta: { width: 168 } },
    // "Transaction Type" (terminology 2026-09-24) = the user-facing label for the `direction` field. The
    // column `id` stays 'direction' (column-manager key + persisted arrangements). A CATEGORY, not a state —
    // plain text, no badge (grammar: semantic hues are for states only).
    beamCells.text({ id: 'direction', header: 'Transaction Type', accessor: (r) => r.direction, width: 140 }),
    beamCells.number({ id: 'amount', header: 'Amount', accessor: (r) => r.amount, format: (n) => n.toFixed(2), width: 110 }),
    beamCells.badge({ id: 'status', header: 'Status', accessor: (r) => r.status, tier: (r) => statusBadge(r.status), width: 132 }),
    beamCells.text({ id: 'customerId', header: 'Customer', accessor: (r) => r.customerId, width: 130 }),
    // Customer Email — copy-able like the ID cells, normal face, ellipsis only when width-constrained.
    { id: 'customerEmail', header: 'Customer Email', cell: ({ row }) => <TruncateCopyCell value={row.original.customerEmail} mode="auto" onCopied={onCopied} />, meta: { width: 200 } },
    { id: 'pspTransactionId', header: 'PSP Transaction ID', cell: ({ row }) => <TruncateCopyCell value={row.original.pspTransactionId} mono onCopied={onCopied} />, meta: { width: 184 } },
    { id: 'paymentMethodId', header: 'Payment method', cell: ({ row }) => <PaymentMethodCell row={row.original} />, meta: { width: 168 } },
    beamCells.text({ id: 'currency', header: 'Currency', accessor: (r) => r.currency, width: 96 }),
    // Card Type is a CATEGORY, not a state — plain text, no badge (Direction/3DS grammar ruling).
    // PROPOSED column — card brand lives on payment-methods, not the payments list (SPEC ledger).
    beamCells.text({ id: 'cardType', header: 'Card Type', accessor: (r) => r.cardType, width: 120 }),
    // PROPOSED column — errorCode has no data source in the payments API yet (see SPEC build-notes).
    { id: 'errorCode', header: 'Error Code', cell: ({ row }) => <ErrorCodeCell code={row.original.errorCode} />, meta: { width: 110 } },
    beamCells.text({ id: 'psp', header: 'Provider', accessor: (r) => r.psp, width: 110 }),
    // 3DS status is a CATEGORY, not a state — plain text, no badge.
    beamCells.text({ id: 'threeDsStatus', header: '3DS Status', accessor: (r) => r.threeDsStatus, width: 132 }),
  ];

  // Page-composed field twins — mirror official TableFilters' renderFilter (text / dateTime / select) EXACTLY
  // so the composed bar is visually identical to the component; values + onChange run through the controller.
  const draft = filters.draft;
  const renderControl = (def: TableFilterDefinition<TxFilters>) => {
    const value = draft[def.key];
    if (def.control === 'text') {
      return (
        <TextField
          placeholder={def.placeholder || def.label}
          value={value as string}
          disabled={def.disabled}
          size="small"
          fullWidth
          onChange={(e) => filters.setDraftValue(def.key, e.target.value as TxFilters[typeof def.key])}
        />
      );
    }
    if (def.control === 'dateTime') {
      return (
        <TextField
          type="datetime-local"
          label={def.label}
          value={(value as string | null) ?? ''}
          disabled={def.disabled}
          size="small"
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
          onChange={(e) => filters.setDraftValue(def.key, e.target.value as TxFilters[typeof def.key])}
        />
      );
    }
    return (
      <TextField
        select
        label={def.label}
        value={value as string}
        disabled={def.disabled}
        size="small"
        fullWidth
        onChange={(e) => filters.setDraftValue(def.key, e.target.value as TxFilters[typeof def.key])}
      >
        {def.options.map((opt) => (
          <MenuItem key={String(opt.value)} value={opt.value as string}>
            {opt.label}
          </MenuItem>
        ))}
      </TextField>
    );
  };

  const remainingAddables = ADDABLE_ORDER.filter((a) => !activeAddables.includes(a));

  // Section gap from the shared token; the gap-surgery sx is inert until this grid opts into stickyChrome
  // (then it donates the pre-grid seam to the header ceiling).
  return (
    <Stack spacing={PAGE_SECTION_GAP} sx={stickyChromeGapSx}>
      <BeamPage title="Transactions" />

      {/* Filters — PAGE-COMPOSED bar (mirrors official TableFilters' Paper + grid + Filter/Clear geometry,
          driven by the same `useTableFilters` controller). It is composed page-side rather than rendering
          <TableFilters> because the Gaspar screenshot puts the `[+]` IN the grid (a square outlined button
          after the last field) and hangs an inline × on each added field — neither of which the unmodified
          official component can express (it has no addable-fields shape; verified against beam-alex). Base
          fields still come from the typed `definitions` array; milestone gating stays PAGE-LEVEL (the array
          per phase: v1.0 four id/psp/customer/email text fields, v1.1+ the compound search). Wrapped in the
          stickyChromeExitSx Box so the exit animation + snap geometry are unchanged (still the pre-grid
          section). */}
      <Box sx={stickyChromeExitSx}>
        <Paper
          component="form"
          variant="outlined"
          onSubmit={(e) => {
            e.preventDefault();
            filters.apply();
          }}
          sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}
          aria-label="Payment transaction filters"
        >
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' },
            }}
          >
            {definitions.map((def) => {
              const optional = (OPTIONAL_KEYS as readonly string[]).includes(def.key);
              if (!optional) return <Box key={def.key}>{renderControl(def)}</Box>;
              // Added field: an inline × at the top-right (orphan rule — removes the parent addable's key(s)).
              const addable = KEY_ADDABLE[def.key as OptionalKey];
              return (
                <Box key={def.key} sx={{ position: 'relative' }}>
                  {renderControl(def)}
                  <Tooltip title={`Remove ${ADDABLE_LABEL[addable]}`}>
                    <IconButton
                      size="small"
                      aria-label={`Remove ${ADDABLE_LABEL[addable]} filter`}
                      onClick={() => removeAddable(addable)}
                      sx={{
                        position: 'absolute',
                        top: -10,
                        right: -10,
                        p: 0.25,
                        bgcolor: 'background.paper',
                        border: 1,
                        borderColor: 'divider',
                        '&:hover': { bgcolor: 'background.paper' },
                      }}
                    >
                      <CloseIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              );
            })}
            {/* The `[+]` — a square outlined IconButton flowing as the grid cell AFTER the last field (it
                moves as fields are added). Its menu lists the addable-not-active fields (clickable) then the
                awaiting-data catalog (disabled, "awaiting data" subtitle — the column-manager pattern). */}
            {caps.advancedFilters && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Tooltip title="Add filter">
                  <IconButton
                    aria-label="Add filter"
                    onClick={(e) => setAddAnchor(e.currentTarget)}
                    sx={{ border: 1, borderColor: 'divider', borderRadius: 1, width: 40, height: 40 }}
                  >
                    <AddIcon />
                  </IconButton>
                </Tooltip>
                <Menu anchorEl={addAnchor} open={Boolean(addAnchor)} onClose={() => setAddAnchor(null)}>
                  {remainingAddables.map((a) => (
                    <MenuItem key={a} onClick={() => addAddable(a)}>
                      {ADDABLE_LABEL[a]}
                    </MenuItem>
                  ))}
                  {remainingAddables.length > 0 && <Divider />}
                  {AWAITING_DATA_FIELDS.map((label) => (
                    <MenuItem key={label} disabled>
                      <ListItemText primary={label} secondary="awaiting data" />
                    </MenuItem>
                  ))}
                </Menu>
              </Box>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button variant={filters.isDraft ? 'contained' : 'outlined'} type="submit">
              Filter
            </Button>
            <Button variant="text" onClick={filters.clear} disabled={!filters.canClear} type="button">
              Clear All
            </Button>
          </Box>
        </Paper>
      </Box>

      <TableNext
        columns={columns}
        // Server-shaped: the Table renders the page the store's envelope already sliced (no client slicing).
        data={pageRows}
        getRowId={(r) => r.id}
        // Pagination is owned by useTableFilters (URL source of truth). The port takes the 1-based controller
        // directly (no more 0-based↔1-based seam) plus totalCount (the port never slices).
        pagination={pagination}
        totalCount={totalCount}
        // Sticky chrome — the header bucket pins to the top, the footer to the bottom, the page owns the
        // scroll. NOT milestone-gated (layout is baseline UX). The Stack's stickyChromeGapSx + the shell's
        // main:has() contract activate off this grid's data-beam-sticky-chrome.
        stickyChrome
        // Pagination-at-500 (v1.2+, Ruslan's feedback): heavy page sizes + jump-to-page are opt-in and
        // milestone-gated. v1.0/v1.1 keep the light default; default size stays 10 so the severity story
        // leads page one.
        pageSizeOptions={caps.paginationAt500 ? [10, 25, 50, 100, 250, 500] : undefined}
        jumpToPage={caps.paginationAt500}
        // Severity accent — failed rows get a leading danger bar (redundant reinforcement of the Status
        // chip; the chip names, the accent locates). Grammar spatial-accents note.
        rowAccent={(r) => (isDanger(r.status) ? 'danger' : undefined)}
        // MILESTONE GATE — existence, not disablement. selection (checkboxes + bulk strip) is v1.1+ and is
        // DRIVEN BY bulkActions in the port (passing it enables the rail checkboxes); the row kebab
        // (actionRail.menu: Complete/Decline + Export ▸ submenu) is Beyond-only; expand (the timeline) is
        // always on; the column manager is v1.2+. Beyond = every cap true = today's full behavior.
        bulkActions={caps.selection ? bulkActions : undefined}
        onBulkAction={caps.selection ? onBulkAction : undefined}
        // Controlled selection so it spans pages (server-shaped). Only wired when selection is enabled.
        rowSelection={caps.selection ? selection : undefined}
        onRowSelectionChange={caps.selection ? setSelection : undefined}
        // Estate ban: the header-rail expand-ALL affordance is banned in estate UX (BEAM.md §6). The rail is
        // always leading (official's placement) — not a prop.
        expandAll={false}
        actionRail={{
          expand: (r) => <PaymentTimeline events={r.events} />,
          ...(caps.actions ? { menu: menuItems } : {}),
        }}
        emptyMessage="No transactions match these filters."
        // Column manager (bullet 3, v1.2+). Catalog = the bullet-1 columns with no data source yet —
        // shown in the manager disabled/"awaiting data" (option b). Payment Method Details is excluded:
        // it's the Phase B card cell inside Payment method, not a column of its own.
        columnManager={
          caps.columnManager
            ? {
                storageKey: 'gaspar.transactions',
                catalog: [
                  // 'Transaction Type' dropped 2026-09-24 — it's now the `direction` column's label (real,
                  // rendered), not an awaiting-data catalog entry (would have double-listed otherwise).
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
