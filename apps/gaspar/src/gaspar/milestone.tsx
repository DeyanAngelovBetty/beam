import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Milestone switcher ("view as version") — the demo control that shapeshifts the Transactions page to
 * a release phase, so Boryana can show what's available per phase from the London deck. Precedent:
 * Sunlight's "Acting as" switcher — a global chrome control (shell footer) fed by a tiny reactive
 * source. Here the source is the URL (`?milestone=`) so every phase is directly linkable
 * (`#/transactions?milestone=v1_0`); the footer select and the URL stay in sync.
 *
 * Gating is EXISTENCE, not disablement: each capability maps to *not passing* an already-opt-in prop
 * on BeamDataTable / BeamFilterBar. The switcher shows what a version IS, not what it's missing —
 * hidden means absent. Zero organism changes. The caps→prop map and the derivation source (Boryana's
 * `gaspar-transactions-requirements-v1.md`, cumulative) are recorded in
 * `docs/NOTES-gaspar-transactions-milestones.md`, along with the v-spec gap list.
 *
 * DEMO SCAFFOLDING, not architecture: real access control is server-side (the requirements doc says so
 * explicitly — "hiding a control is not access control"). This gates a demo, nothing else.
 */

export type Milestone = 'v1_0' | 'v1_1' | 'v1_2' | 'beyond';

/** Canonical order + display metadata for the switcher rows: `badge` is the circle's version number,
 *  `label` the primary line, `sub` the release-date sub-line (Beyond has none — it's the open-ended top). */
export const MILESTONES: { id: Milestone; badge: string; label: string; sub?: string }[] = [
  { id: 'v1_0', badge: '1.0', label: 'v1.0', sub: '5 October' },
  { id: 'v1_1', badge: '1.1', label: 'v1.1', sub: '1 November (TBC)' },
  { id: 'v1_2', badge: '1.2', label: 'v1.2', sub: 'date TBD' },
  { id: 'beyond', badge: '2.0', label: 'Beyond v1.2' },
];

/** The four capabilities the switcher gates, each = an opt-in prop the page passes (or doesn't). */
export interface MilestoneCaps {
  /** Checkboxes + bulk-action strip + the bulk Export menu. (v1.1) */
  selection: boolean;
  /** The filter bar's advanced `[+]` addable-field menu. (v1.2) */
  advancedFilters: boolean;
  /** Column show/hide + reorder manager. (v1.2) */
  columnManager: boolean;
  /** Heavy page sizes (up to 500) + jump-to-page. (v1.2 — Ruslan's pagination-at-500 feedback) */
  paginationAt500: boolean;
  /** Complete / Decline — bulk-strip options AND the row kebab. (Beyond) */
  actions: boolean;
}

const RANK: Record<Milestone, number> = { v1_0: 0, v1_1: 1, v1_2: 2, beyond: 3 };

// Cumulative, per the requirements doc: each phase assumes everything before it. Note the row kebab
// (rowActions) lives ONLY at Beyond — it houses Complete/Decline, and per-row Export folds in there
// too (the spec's export scope is filtered-set-or-selection, i.e. bulk-only, at v1.1/v1.2).
export const capsFor = (m: Milestone): MilestoneCaps => ({
  selection: RANK[m] >= RANK.v1_1,
  advancedFilters: RANK[m] >= RANK.v1_2,
  columnManager: RANK[m] >= RANK.v1_2,
  paginationAt500: RANK[m] >= RANK.v1_2,
  actions: RANK[m] >= RANK.beyond,
});

const parse = (raw: string | null): Milestone =>
  raw && raw in RANK ? (raw as Milestone) : 'beyond'; // default = Beyond (everything, today's behavior)

interface MilestoneContextValue {
  milestone: Milestone;
  setMilestone: (m: Milestone) => void;
  caps: MilestoneCaps;
}

const MilestoneContext = createContext<MilestoneContextValue | null>(null);

export function MilestoneProvider({ children }: { children: ReactNode }) {
  const [params, setParams] = useSearchParams();
  const milestone = parse(params.get('milestone'));
  const value = useMemo<MilestoneContextValue>(
    () => ({
      milestone,
      caps: capsFor(milestone),
      setMilestone: (m) =>
        // Functional update → no stale-closure on the current params. `replace` keeps the demo's phase
        // hops out of the back-button history. Beyond is the default, so it stays absent from the URL.
        setParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            if (m === 'beyond') next.delete('milestone');
            else next.set('milestone', m);
            return next;
          },
          { replace: true },
        ),
    }),
    [milestone, setParams],
  );
  return <MilestoneContext.Provider value={value}>{children}</MilestoneContext.Provider>;
}

export function useMilestone(): MilestoneContextValue {
  const ctx = useContext(MilestoneContext);
  if (!ctx) throw new Error('useMilestone must be used within MilestoneProvider');
  return ctx;
}
