import type { TransactionRow, WireStatus } from '../gaspar/transactionsFixture';

/**
 * The SHARED transaction predicate (docs/gaspar-dashboard-notes.md §5) — the single filter logic that the
 * mock aggregator computes over AND that the Transactions drill-through must apply, so a chart segment's count
 * equals the rows the drill-through lands on. Mirrors TransactionsPage's applied-filter rules
 * (direction / provider / date-by-calendar-day / status). Drill-through wiring + refactoring TransactionsPage
 * to import this is the later drill-through step; for the spike, the aggregator is the consumer.
 */
export interface TxFilter {
  direction?: 'Deposit' | 'Withdrawal';
  provider?: string; // psp
  status?: WireStatus;
  createdFrom?: string | null; // ISO or yyyy-mm-dd; compared by calendar day
  createdTo?: string | null;
}

/** APPROVED = Succeeded (the one terminal success). Reports 1–4 are "approved transactions only" (spec). */
export const APPROVED: WireStatus = 'Succeeded';

export function matchesTx(r: TransactionRow, f: TxFilter): boolean {
  const day = r.createdAt.slice(0, 10);
  if (f.createdFrom && day < f.createdFrom.slice(0, 10)) return false;
  if (f.createdTo && day > f.createdTo.slice(0, 10)) return false;
  if (f.status && r.status !== f.status) return false;
  if (f.direction && r.direction !== f.direction) return false;
  if (f.provider && r.psp !== f.provider) return false;
  return true;
}
