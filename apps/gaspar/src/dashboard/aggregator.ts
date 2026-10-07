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
    computedAt: new Date().toISOString(), stalenessBudgetMs: STALENESS_BUDGET_MS,
    series: [
      { key: 'Deposit', label: 'Deposits', points: buckets.map((b) => byDir.Deposit.get(b)!) },
      { key: 'Withdrawal', label: 'Withdrawals', points: buckets.map((b) => byDir.Withdrawal.get(b)!) },
    ],
    totals,
  };
}

/** Report 3 — Deposits by Payment Provider (approved deposits); one series per provider (value + count). */
export function depositsByProvider(f: Pick<TxFilter, 'createdFrom' | 'createdTo'> = {}): AggregationResponse {
  const rows = approved({ ...f, direction: 'Deposit' });
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
    metric: 'deposits_by_provider', currency: 'CAD', bucket, buckets,
    range: { from, to, tz: TZ_PLACEHOLDER }, partial: { bucketKey: buckets[buckets.length - 1] ?? null },
    computedAt: new Date().toISOString(), stalenessBudgetMs: STALENESS_BUDGET_MS,
    series: PROVIDERS.map((prov) => ({ key: prov, label: prov, points: buckets.map((b) => byProv[prov].get(b)!) })),
    totals,
  };
}
