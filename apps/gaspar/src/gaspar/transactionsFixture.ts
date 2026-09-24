import type { BeamBadgeProps } from '@betty/beam';

/**
 * Gaspar transactions — WIRE-SHAPED fixture store (Task 2, 2026-09-24).
 *
 * Regenerated to Konstantin's 2026-09-21 `payments` sample shape
 * (apps/gaspar/fixtures/samples/2026-09-21-konstantin-transactions.json). The store is the "server": it
 * holds 1,200 wire rows and answers `queryTransactions` with the SAME ENVELOPE the sample carries
 * ({ items, pageNumber, pageSize, totalPages, totalItems, hasPreviousPage, hasNextPage }). The port
 * consumes that 1-based, WITHOUT slicing — the convergence dividend (docs/gaspar-api-notes.md §3). The
 * page's only adapter is `toDisplayRow` (thin field rename + the ENRICHED fields), applied to the page
 * the store already sliced.
 *
 * ── INTERIM RULINGS (docs/gaspar-api-notes.md §4/§5; each cites its open-question number) ──────────────
 *  • [Q1] currency = CAD. Spec §2.4 wins; the sample's EUR is flagged test-env, pending confirm.
 *  • [Q2] amount = MAJOR units, 2 decimal places (not minor/cents).
 *  • [Q3] status vocabulary = the wire's four, PascalCase: Initiated · Processing · Succeeded · Failed.
 *         (Our old created/pending/completed vocabulary is retired.)
 *  • [Q4] eligibility anchor = Failed — INTERIM. The wire has no Pending, so Complete/Decline temporarily
 *         target Failed. Encoded ONCE in STATUS_META.eligible (not scattered literals); revisit on the
 *         real product ruling.
 *  • [Q5] customerEmail = ENRICHED (not on the wire row) — kept displayed + searchable, derived here.
 *  • [Q6] paymentMethodId = the wire integer FK, KEPT alongside an ENRICHED card summary derived from it.
 *  • [Q7] psp vocabulary = Nuvei · Worldpay (sample + spec agree; Adyen dropped).
 *  • [Q9 RESOLVED] id = the wire integer PK. The copy-id cell copies the RAW int and URLs carry the RAW id
 *         (the `pay_` display prefix is retired per the fixtures-task rider) — `id` is `String(wireId)`, so
 *         getRowId / selection / ?cr.searchId all key on the raw PK. `wireId` (number) kept alongside.
 *
 * pspTransactionId nullability follows the sample exactly: SET only for Succeeded; null for Initiated /
 * Processing / Failed (those never reached a PSP assignment in the sample). [Q10 timeline shape stays open.]
 */

// ── Wire contract (mirrors the sample's item + envelope) ─────────────────────────────────────────────
export type WireStatus = 'Initiated' | 'Processing' | 'Succeeded' | 'Failed';
export type WirePsp = 'Nuvei' | 'Worldpay';
export type WireDirection = 'Deposit' | 'Withdrawal';

/** One `items[]` row, byte-shaped like Konstantin's sample. No email / card / errorCode here — those are
 *  ENRICHED at the boundary (see `toDisplayRow`). */
export interface WireTransaction {
  id: number; // integer PK
  customerId: string;
  paymentMethodId: number; // FK int → payment-methods
  amount: number; // major units, 2dp [Q2]
  currency: string; // 'CAD' [Q1]
  direction: WireDirection;
  psp: WirePsp;
  status: WireStatus;
  threeDsStatus: string;
  pspTransactionId: string | null; // null unless Succeeded
  createdAt: string; // ISO 8601 with offset
  updatedAt: string; // == createdAt on un-progressed (Initiated) rows
}

/** The list-response envelope — the store's native return, identical to the sample's top level. */
export interface TransactionsEnvelope {
  items: WireTransaction[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// ── STATUS vocabulary — ONE source of truth (badge tier + interim eligibility + failure accent) ──────
// Keyed by the wire status [Q3]. `eligible` is the Complete/Decline anchor [Q4, INTERIM = Failed].
// `danger` drives the row severity accent. Everything downstream reads this map, never a status literal.
export interface StatusMeta {
  badge: BeamBadgeProps;
  eligible: boolean; // may be Completed/Declined (INTERIM: Failed only — [Q4])
  danger: boolean; // severity accent + the loud/scan target
}
export const STATUS_META: Record<WireStatus, StatusMeta> = {
  Initiated: { badge: { hue: 'neutral', label: 'Initiated' }, eligible: false, danger: false },
  Processing: { badge: { hue: 'neutral', label: 'Processing' }, eligible: false, danger: false },
  Succeeded: { badge: { hue: 'success', volume: 'noted', label: 'Succeeded' }, eligible: false, danger: false },
  Failed: { badge: { hue: 'danger', volume: 'loud', label: 'Failed' }, eligible: true, danger: true }, // [Q4]
};
/** Unobserved status → silent with its raw label (the estate honesty rule). */
export const statusBadge = (s: string): BeamBadgeProps => STATUS_META[s as WireStatus]?.badge ?? { hue: 'neutral', label: s };
export const isEligible = (s: string): boolean => STATUS_META[s as WireStatus]?.eligible ?? false;
export const isDanger = (s: string): boolean => STATUS_META[s as WireStatus]?.danger ?? false;

// ── ENRICHED display material (NOT wire-native — added by the adapter) ────────────────────────────────
export interface CardSummary {
  brand: 'Visa' | 'Mastercard';
  last4: string;
  bin?: string;
  expiry?: string;
  paymentMethodId: number; // the FK, KEPT alongside the summary [Q6]
}
export interface PaymentEvent {
  eventType: string;
  occurredOnUtc: string;
  details?: string;
  amountModifier?: number | null;
  pspTransactionId?: string | null;
}

/** The shape the page's columns/filters consume — wire fields (renamed for display where noted) plus the
 *  ENRICHED fields. Produced ONLY by `toDisplayRow`. */
export interface TransactionRow {
  // wire-native
  wireId: number; // the integer PK, kept [Q9]
  id: string; // = String(wireId) — the RAW PK as string; copy-id + URLs carry this [Q9 RESOLVED]
  customerId: string;
  paymentMethodId: number; // FK int, kept [Q6]
  amount: number;
  currency: string;
  direction: WireDirection;
  psp: WirePsp;
  status: WireStatus;
  threeDsStatus: string;
  pspTransactionId: string | null;
  createdAt: string;
  updatedAt: string;
  // ENRICHED (adapter-added; see the ruling ledger)
  customerEmail: string; // [Q5]
  cardSummary: CardSummary; // [Q6] — brand/last4 as if resolved from the FK
  cardType: 'Visa' | 'Mastercard'; // = cardSummary.brand (the Card Type column)
  errorCode: string | null; // PROPOSED — MTI code on Failed rows (no wire field yet)
  threeDsSessionReference: string | null; // detail material
  events: PaymentEvent[]; // [Q10] — from the payment-details resource; synthesized here
}

// ── Deterministic generator ──────────────────────────────────────────────────────────────────────────
// Seeded so the 1,200 rows are STABLE across reloads (URL pagination + selection depend on it).
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(0x9a5b);
const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)];
const int = (lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1));

// Customer population: one DOMINANT customer (the sample's 398595, most of the volume), a few MEDIUM
// customers, and a long TAIL of one-/two-shot customers. Each customer owns a small set of paymentMethodIds.
const DOMINANT = '398595';
const MEDIUM = ['728481', '512203', '883017', '640925'];
const TAIL = Array.from({ length: 220 }, (_, i) => String(300000 + i * 137));
const PM_OF: Record<string, number[]> = { [DOMINANT]: [1, 3], '728481': [2], '512203': [5, 6], '883017': [4], '640925': [7, 8] };
const pmFor = (cus: string) => PM_OF[cus] ?? [((Number(cus) % 9) + 1)];

const AMOUNTS = [3, 5, 7, 8, 11, 13, 25, 33, 47.99, 75, 149, 320, 899.5, 1200] as const;
const PSPS: WirePsp[] = ['Nuvei', 'Worldpay'];
const FAILED_MTI = ['0400', '0100', '0200', '0210', '0230', '0800', '0120', '0330'] as const;

// One "session" for a customer at a base time: a burst of same-method rows minutes apart. RETRY sessions
// repeat one amount with mostly-Initiated rows and an occasional Failed (the sample's ids 1–7 character);
// NORMAL sessions run a short deposit/withdrawal flow that mostly Succeeds.
type Draft = Omit<WireTransaction, 'id'>;
function emitSession(clockMs: number): { rows: Draft[]; nextClockMs: number } {
  // Weighted customer pick — dominant ~46%, medium ~24%, tail ~30%.
  const r = rand();
  const customer = r < 0.46 ? DOMINANT : r < 0.7 ? pick(MEDIUM) : pick(TAIL);
  const pmId = pick(pmFor(customer));
  const direction: WireDirection = rand() < 0.7 ? 'Deposit' : 'Withdrawal';
  const amount = pick(AMOUNTS);
  const psp = pick(PSPS);
  const retry = customer === DOMINANT ? rand() < 0.4 : rand() < 0.15;
  const burst = retry ? int(3, 8) : int(1, 3);

  const rows: Draft[] = [];
  let t = clockMs;
  for (let k = 0; k < burst; k++) {
    // Status: retry bursts stay mostly Initiated (with a late Failed); normal flows lean Succeeded.
    let status: WireStatus;
    if (retry) {
      status = k === burst - 1 && rand() < 0.5 ? 'Failed' : rand() < 0.25 ? 'Processing' : 'Initiated';
    } else {
      const p = rand();
      status = p < 0.55 ? 'Succeeded' : p < 0.72 ? 'Failed' : p < 0.85 ? 'Processing' : 'Initiated';
    }
    const created = new Date(t);
    // Un-progressed (Initiated) rows: updatedAt == createdAt (sample rule). Others: a few sec–min later.
    const progressed = status !== 'Initiated';
    const updated = new Date(t + (progressed ? int(2, 70) * 1000 : 0));
    const threeDs = rand() < 0.15 ? 'Authenticated' : 'NotRequired';
    rows.push({
      customerId: customer,
      paymentMethodId: pmId,
      amount,
      currency: 'CAD', // [Q1]
      direction,
      psp,
      status,
      threeDsStatus: threeDs,
      // psp id only for Succeeded (sample) — Nuvei numeric-ish, Worldpay alphanumeric.
      pspTransactionId:
        status === 'Succeeded'
          ? psp === 'Nuvei'
            ? `711000000003${String(int(1000000, 9999999)).padStart(7, '0')}`
            : `pay${Math.floor(rand() * 1e9).toString(36)}${Math.floor(rand() * 1e9).toString(36)}`.slice(0, 24)
          : null,
      createdAt: created.toISOString(),
      updatedAt: updated.toISOString(),
    });
    t += int(20, 220) * 1000; // 20s–~4min between retries in a burst
  }
  // Gap to the next session: usually minutes–hours, sometimes a day jump.
  const gap = rand() < 0.15 ? int(6, 40) * 3_600_000 : int(3, 180) * 60_000;
  return { rows, nextClockMs: t + gap };
}

// Build chronologically (oldest→newest) until we have 1,200, then assign integer ids in that order and
// return NEWEST-FIRST (id desc), the sample's natural order. The final session is forced to a dominant-
// customer failure retry burst so page one leads with the severity story (demo character, not a sort).
function generate(count: number): WireTransaction[] {
  const START = Date.UTC(2026, 7, 18, 7, 30, 0); // ~5 weeks before the sample window
  const drafts: Draft[] = [];
  let clock = START;
  while (drafts.length < count - 6) {
    const { rows, nextClockMs } = emitSession(clock);
    drafts.push(...rows);
    clock = nextClockMs;
  }
  // Recent failure retry burst (dominant customer) → the newest rows.
  for (let k = 0; drafts.length < count; k++) {
    const created = new Date(clock);
    const status: WireStatus = k % 2 === 0 ? 'Failed' : 'Initiated';
    drafts.push({
      customerId: DOMINANT,
      paymentMethodId: 1,
      amount: 25,
      currency: 'CAD',
      direction: 'Deposit',
      psp: 'Worldpay',
      status,
      threeDsStatus: 'NotRequired',
      pspTransactionId: null,
      createdAt: created.toISOString(),
      updatedAt: new Date(clock + (status === 'Failed' ? 42_000 : 0)).toISOString(),
    });
    clock += int(30, 150) * 1000;
  }
  const trimmed = drafts.slice(0, count);
  // Assign ids in chronological order, then reverse to newest-first.
  return trimmed.map((d, i) => ({ ...d, id: i + 1 })).reverse();
}

const WIRE_ROWS: WireTransaction[] = generate(1200);

// ── The adapter (thin rename + ENRICHED fields) ──────────────────────────────────────────────────────
const emailFor = (customerId: string) => `player${customerId}@example.com`; // [Q5] ENRICHED
const cardFor = (paymentMethodId: number): CardSummary => {
  const brand: 'Visa' | 'Mastercard' = paymentMethodId % 2 === 1 ? 'Visa' : 'Mastercard';
  const last4 = String(4000 + paymentMethodId * 111).slice(-4);
  return { brand, last4, bin: String(411111 + paymentMethodId), expiry: `0${(paymentMethodId % 9) + 1}/29`, paymentMethodId }; // [Q6]
};

const buildEvents = (w: WireTransaction): PaymentEvent[] => {
  const t0 = new Date(w.createdAt).getTime();
  const at = (min: number) => new Date(t0 + min * 60_000).toISOString();
  const initiated: PaymentEvent = { eventType: 'Initiated', occurredOnUtc: at(0), details: `${w.direction} initiated` };
  const assigned: PaymentEvent = { eventType: 'PspAssigned', occurredOnUtc: at(1), details: `Routed to ${w.psp}` };
  const submitted: PaymentEvent = { eventType: 'SubmittedToProvider', occurredOnUtc: at(2), details: `Submitted to ${w.psp}`, pspTransactionId: w.pspTransactionId };
  const approved: PaymentEvent = { eventType: 'Approved', occurredOnUtc: w.updatedAt, amountModifier: w.amount, pspTransactionId: w.pspTransactionId };
  // Observed types only, increasing depth. Failed STOPS at PspAssigned — the sample's Failed rows carry no
  // pspTransactionId (never submitted), and no failure event type has been observed ([Q10], honest gap).
  switch (w.status) {
    case 'Succeeded': return [initiated, assigned, submitted, approved];
    case 'Processing': return [initiated, assigned, submitted];
    case 'Failed': return [initiated, assigned];
    default: return [initiated]; // Initiated
  }
};

/** THE fixture-boundary adapter: one wire row → the page's display row (rename + ENRICHED). */
export function toDisplayRow(w: WireTransaction): TransactionRow {
  const failedIdx = w.id % FAILED_MTI.length;
  const card = cardFor(w.paymentMethodId);
  return {
    wireId: w.id,
    id: String(w.id), // [Q9 RESOLVED] the RAW integer PK — copy-id cell + URLs carry this, not a pay_ prefix
    customerId: w.customerId,
    paymentMethodId: w.paymentMethodId,
    amount: w.amount,
    currency: w.currency,
    direction: w.direction,
    psp: w.psp,
    status: w.status,
    threeDsStatus: w.threeDsStatus,
    pspTransactionId: w.pspTransactionId,
    createdAt: w.createdAt,
    updatedAt: w.updatedAt,
    customerEmail: emailFor(w.customerId), // [Q5] ENRICHED
    cardSummary: card, // [Q6] ENRICHED
    cardType: card.brand,
    errorCode: w.status === 'Failed' ? FAILED_MTI[failedIdx] : null, // PROPOSED
    threeDsSessionReference: w.threeDsStatus === 'Authenticated' ? `tds_ref_${5500 + w.id}` : null,
    events: buildEvents(w),
  };
}

// The full enriched set — the page's cross-page needs (eligibility, export, derived filter options). Kept
// alongside the envelope query (both are the store exposing its data); NOT how the port paginates.
export const ALL_ROWS: TransactionRow[] = WIRE_ROWS.map(toDisplayRow);
const BY_ID = new Map(ALL_ROWS.map((r) => [r.id, r]));
export const findTransactions = (ids: string[]): TransactionRow[] => ids.map((id) => BY_ID.get(id)).filter((r): r is TransactionRow => Boolean(r));

// ── The server-shaped query: filter (server-side, over the enriched view) → paginate → ENVELOPE ───────
export interface TransactionsQuery {
  pageNumber: number; // 1-based
  pageSize: number;
  /** Optional row predicate over the DISPLAY shape (the store enriches internally to evaluate it — the
   *  interim stand-in for real server-side filter params; see the email-provenance flag [Q5]). */
  match?: (row: TransactionRow) => boolean;
}
export function queryTransactions({ pageNumber, pageSize, match }: TransactionsQuery): TransactionsEnvelope {
  const filtered = match ? WIRE_ROWS.filter((w) => match(toDisplayRow(w))) : WIRE_ROWS;
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = Math.min(Math.max(1, pageNumber), totalPages);
  const start = (page - 1) * pageSize;
  return {
    items: filtered.slice(start, start + pageSize),
    pageNumber: page,
    pageSize,
    totalPages,
    totalItems,
    hasPreviousPage: page > 1,
    hasNextPage: page < totalPages,
  };
}

// Derived option lists — the filter offers exactly the values present (never a hardcoded vocabulary).
const uniqueSorted = (values: string[]) => Array.from(new Set(values)).sort();
export const STATUS_OPTIONS = uniqueSorted(ALL_ROWS.map((r) => r.status));
export const DIRECTION_OPTIONS = uniqueSorted(ALL_ROWS.map((r) => r.direction));
export const PROVIDER_OPTIONS = uniqueSorted(ALL_ROWS.map((r) => r.psp));
export const CURRENCY_OPTIONS = uniqueSorted(ALL_ROWS.map((r) => r.currency));
export const THREEDS_OPTIONS = uniqueSorted(ALL_ROWS.map((r) => r.threeDsStatus));
export const ERROR_CODE_OPTIONS = uniqueSorted(ALL_ROWS.map((r) => r.errorCode).filter((c): c is string => Boolean(c)));
