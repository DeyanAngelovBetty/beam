import { ALL_ROWS, type TransactionRow } from '../gaspar/transactionsFixture';
import { matchesTx, APPROVED, type TxFilter } from './txPredicate';

/**
 * MOCK aggregation layer (docs/gaspar-dashboard-notes.md §5) — stands in for Boryana's server-side aggregation
 * endpoints. Computes the contract response over the wire-shaped transaction fixtures (ALL_ROWS) through the
 * SHARED predicate (txPredicate), so a chart segment and its future drill-through resolve the same population.
 * The page consumes ONLY this contract — never ALL_ROWS directly. No real server, no network; dev scaffold.
 *
 * TIMEZONE is a stated PLACEHOLDER, labelled pending — bucketing uses the ISO calendar day of `createdAt`
 * as-stored; the real single-timezone decision is a §10 open item with BI.
 */
export const TZ_PLACEHOLDER = 'America/Toronto (pending — §10 open)';
export const STALENESS_BUDGET_MS = 60_000; // placeholder: "live" ≤ 60s (pending BI)

/**
 * FIXTURE CLOCK (2026-10-07). The fixtures are synthetic and their latest row sits in the future relative to
 * the wall clock, which made a FUTURE bucket read "in progress". So `computedAt` / "now" is PINNED to the
 * fixture's latest timestamp (a stated clock) and surfaced as "data as of …" — rather than re-anchoring the
 * shared fixture (which TransactionsPage also consumes). The partial bucket is the one containing this clock.
 */
export const FIXTURE_NOW: string = ALL_ROWS.reduce((m, r) => (r.createdAt > m ? r.createdAt : m), ALL_ROWS[0]?.createdAt ?? new Date().toISOString());

export type Bucket = 'day' | 'week' | 'month';
export interface SeriesPoint { bucket: string; value: number; count: number }
export interface Series { key: string; label: string; points: SeriesPoint[] }
export interface AggregationResponse {
  metric: string;
  currency: string;
  bucket: Bucket;
  buckets: string[]; // ordered bucket keys (x axis)
  range: { from: string; to: string; tz: string };
  partial: { bucketKey: string | null }; // the trailing in-progress bucket (marked distinctly)
  computedAt: string;
  stalenessBudgetMs: number;
  series: Series[];
  totals: Record<string, { value: number; count: number }>;
}

// ── bucketing ────────────────────────────────────────────────────────────────
const dayKey = (iso: string) => iso.slice(0, 10);
const monthKey = (iso: string) => iso.slice(0, 7);
function weekKey(iso: string): string {
  const d = new Date(iso.slice(0, 10) + 'T00:00:00Z');
  const day = (d.getUTCDay() + 6) % 7; // Mon=0
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10); // week-start (Mon)
}
const keyer: Record<Bucket, (iso: string) => string> = { day: dayKey, week: weekKey, month: monthKey };

/** Bucket size is DERIVED from the range span, never user-chosen (spec). */
function deriveBucket(fromDay: string, toDay: string): Bucket {
  const days = (Date.parse(toDay) - Date.parse(fromDay)) / 86_400_000;
  if (days <= 31) return 'day';
  if (days <= 180) return 'week';
  return 'month';
}

const approved = (f: Omit<TxFilter, 'status'>): TransactionRow[] =>
  ALL_ROWS.filter((r) => matchesTx(r, { ...f, status: APPROVED }));

export const PROVIDERS: string[] = Array.from(new Set(ALL_ROWS.map((r) => r.psp))).sort();

function frame(rows: TransactionRow[]) {
  const days = rows.map((r) => dayKey(r.createdAt)).sort();
  const from = days[0] ?? dayKey(new Date().toISOString());
  const to = days[days.length - 1] ?? from;
  const bucket = deriveBucket(from, to);
  const key = keyer[bucket];
  const buckets = Array.from(new Set(rows.map((r) => key(r.createdAt)))).sort();
  return { from, to, bucket, key, buckets };
}

function emptyPoints(buckets: string[]): SeriesPoint[] {
  return buckets.map((b) => ({ bucket: b, value: 0, count: 0 }));
}

/** Report 1 — Deposits vs Withdrawals (approved only); two series, each carrying value (sum) + count. */
export function depositsVsWithdrawals(f: Pick<TxFilter, 'createdFrom' | 'createdTo' | 'provider'> = {}): AggregationResponse {
  const rows = approved(f);
  const { from, to, bucket, key, buckets } = frame(rows);
  const byDir: Record<string, Map<string, SeriesPoint>> = {
    Deposit: new Map(emptyPoints(buckets).map((p) => [p.bucket, { ...p }])),
    Withdrawal: new Map(emptyPoints(buckets).map((p) => [p.bucket, { ...p }])),
  };
  const totals = { Deposit: { value: 0, count: 0 }, Withdrawal: { value: 0, count: 0 } };
  for (const r of rows) {
    const p = byDir[r.direction]?.get(key(r.createdAt));
    if (!p) continue;
    p.value += r.amount; p.count += 1;
    totals[r.direction].value += r.amount; totals[r.direction].count += 1;
  }
  return {
    metric: 'deposits_vs_withdrawals', currency: 'CAD', bucket, buckets,
    range: { from, to, tz: TZ_PLACEHOLDER }, partial: { bucketKey: buckets[buckets.length - 1] ?? null },
    computedAt: FIXTURE_NOW, stalenessBudgetMs: STALENESS_BUDGET_MS,
    series: [
      { key: 'Deposit', label: 'Deposits', points: buckets.map((b) => byDir.Deposit.get(b)!) },
      { key: 'Withdrawal', label: 'Withdrawals', points: buckets.map((b) => byDir.Withdrawal.get(b)!) },
    ],
    totals,
  };
}

/** Reports 3 & 4 — {Deposits|Withdrawals} by Payment Provider (approved); one series per provider. */
function byProvider(direction: 'Deposit' | 'Withdrawal', f: Pick<TxFilter, 'createdFrom' | 'createdTo'>): AggregationResponse {
  const rows = approved({ ...f, direction });
  const { from, to, bucket, key, buckets } = frame(rows);
  const byProv: Record<string, Map<string, SeriesPoint>> = {};
  const totals: Record<string, { value: number; count: number }> = {};
  for (const prov of PROVIDERS) {
    byProv[prov] = new Map(emptyPoints(buckets).map((p) => [p.bucket, { ...p }]));
    totals[prov] = { value: 0, count: 0 };
  }
  for (const r of rows) {
    const p = byProv[r.psp]?.get(key(r.createdAt));
    if (!p) continue;
    p.value += r.amount; p.count += 1;
    totals[r.psp].value += r.amount; totals[r.psp].count += 1;
  }
  return {
    metric: `${direction.toLowerCase()}s_by_provider`, currency: 'CAD', bucket, buckets,
    range: { from, to, tz: TZ_PLACEHOLDER }, partial: { bucketKey: buckets[buckets.length - 1] ?? null },
    computedAt: FIXTURE_NOW, stalenessBudgetMs: STALENESS_BUDGET_MS,
    series: PROVIDERS.map((prov) => ({ key: prov, label: prov, points: buckets.map((b) => byProv[prov].get(b)!) })),
    totals,
  };
}
export const depositsByProvider = (f: Pick<TxFilter, 'createdFrom' | 'createdTo'> = {}) => byProvider('Deposit', f);
export const withdrawalsByProvider = (f: Pick<TxFilter, 'createdFrom' | 'createdTo'> = {}) => byProvider('Withdrawal', f); // Report 4

/** Report 2 — AVG Deposits & Withdrawals per Transaction (approved only): mean value = Σamount / count. */
export function avgPerTransaction(f: Pick<TxFilter, 'createdFrom' | 'createdTo' | 'provider'> = {}): AggregationResponse {
  const base = depositsVsWithdrawals(f); // reuse the sum+count buckets, then divide
  const toAvg = (pts: SeriesPoint[]): SeriesPoint[] => pts.map((p) => ({ bucket: p.bucket, value: p.count ? p.value / p.count : 0, count: p.count }));
  return {
    ...base, metric: 'avg_per_transaction',
    series: base.series.map((s) => ({ ...s, points: toAvg(s.points) })),
    totals: Object.fromEntries(Object.entries(base.totals).map(([k, t]) => [k, { value: t.count ? t.value / t.count : 0, count: t.count }])),
  };
}

/**
 * Report 5 — Deposits Approval Rate vs Total, by Payment Provider. Rate = approved / denominator, per bucket,
 * per provider, PLUS a `Total` series that is the AGGREGATE (Σapproved / Σdenominator across providers) — NOT
 * the mean of the provider rates (they differ when volumes are uneven). Denominator is OPEN (§10): `denom`
 * picks 'broad' (all deposit rows) or 'submitted' (excludes Initiated as pre-submission). PROVISIONAL default
 * is 'broad', surfaced as provisional in the UI; the notes compute both for a sample period.
 */
export type ApprovalDenominator = 'broad' | 'submitted';
export function depositApprovalRateByProvider(denom: ApprovalDenominator = 'broad', f: Pick<TxFilter, 'createdFrom' | 'createdTo'> = {}): AggregationResponse {
  const all = ALL_ROWS.filter((r) => matchesTx(r, { ...f, direction: 'Deposit' }));
  const inDenom = (r: TransactionRow) => (denom === 'broad' ? true : r.status !== 'Initiated');
  const { from, to, bucket, key, buckets } = frame(all);
  // accumulate approved + denominator per provider (and overall) per bucket
  const acc: Record<string, Map<string, { ok: number; den: number }>> = {};
  const seed = () => new Map(buckets.map((b) => [b, { ok: 0, den: 0 }]));
  for (const prov of [...PROVIDERS, '__total__']) acc[prov] = seed();
  for (const r of all) {
    if (!inDenom(r)) continue;
    const b = key(r.createdAt); const ok = r.status === APPROVED ? 1 : 0;
    for (const p of [r.psp, '__total__']) { const c = acc[p].get(b); if (c) { c.ok += ok; c.den += 1; } }
  }
  const rate = (prov: string): SeriesPoint[] => buckets.map((b) => { const c = acc[prov].get(b)!; return { bucket: b, value: c.den ? (c.ok / c.den) * 100 : 0, count: c.den }; });
  return {
    metric: 'deposit_approval_rate_by_provider', currency: 'CAD', bucket, buckets,
    range: { from, to, tz: TZ_PLACEHOLDER }, partial: { bucketKey: buckets[buckets.length - 1] ?? null },
    computedAt: FIXTURE_NOW, stalenessBudgetMs: STALENESS_BUDGET_MS,
    series: [
      ...PROVIDERS.map((prov) => ({ key: prov, label: prov, points: rate(prov) })),
      { key: 'Total', label: 'Total (aggregate)', points: rate('__total__') },
    ],
    totals: Object.fromEntries([...PROVIDERS, 'Total'].map((prov) => {
      const c = [...acc[prov === 'Total' ? '__total__' : prov].values()].reduce((s, x) => ({ ok: s.ok + x.ok, den: s.den + x.den }), { ok: 0, den: 0 });
      return [prov, { value: c.den ? (c.ok / c.den) * 100 : 0, count: c.den }];
    })),
  };
}
