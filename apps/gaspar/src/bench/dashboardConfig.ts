/**
 * Dashboard bench — shared config (Lab/Bench, not shipped).
 *
 * The whole point of the bench: layout is DATA, never code. A widget's size
 * is a config row `{ id, order, colSpan, rowSpan }`; permission filtering is a
 * separate `visibleWidgetIds` list. Removing two ids must not touch layout code
 * — both variants (static grid, dockview) consume the same two inputs so the
 * filtering contract is tested identically.
 */

export type WidgetId = 'kpi' | 'band' | 'status' | 'filter' | 'table' | 'nextgem';

export interface WidgetConfig {
  id: WidgetId;
  /** Placement order (dense grid flow + dock default arrangement). */
  order: number;
  /** Grid columns spanned, 1–12. */
  colSpan: number;
  /** Grid rows spanned. */
  rowSpan: number;
}

/**
 * Per-role config constant. This one is the "operator" role. A different role
 * is a different constant with the same shape — no layout code changes.
 * colSpans are chosen so the SAME config stays legible at 1280 / 1900 / 2560:
 * dense flow repacks, and each widget's internals adapt to its own resolved
 * width via container queries (see CQ below), not to the viewport.
 */
export const DASHBOARD_CONFIG: readonly WidgetConfig[] = [
  { id: 'kpi', order: 1, colSpan: 3, rowSpan: 1 },
  { id: 'band', order: 2, colSpan: 6, rowSpan: 2 },
  { id: 'status', order: 3, colSpan: 3, rowSpan: 1 },
  { id: 'filter', order: 4, colSpan: 12, rowSpan: 1 },
  { id: 'table', order: 5, colSpan: 8, rowSpan: 2 },
  { id: 'nextgem', order: 6, colSpan: 4, rowSpan: 2 },
] as const;

/**
 * Container-query breakpoints (px, widget INLINE size — its own width, never
 * the viewport). The widget grammar under test:
 *   < twoCol            → value only        (1-col)
 *   twoCol .. threeCol  → value + delta      (2-col)
 *   ≥ threeCol          → value + delta + chart (3-col)
 * A colSpan-3 widget lands in the 2-col band at 1280 and the 3-col band at
 * 2560 — same config, richer internals as the estate gets more room.
 */
export const CQ = { twoCol: 240, threeCol: 400 } as const;

/** Default permission set — every widget visible. Stories/route pass subsets. */
export const ALL_WIDGET_IDS: readonly WidgetId[] = DASHBOARD_CONFIG.map((w) => w.id);
