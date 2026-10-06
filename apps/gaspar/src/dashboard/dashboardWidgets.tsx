import type { ReactNode } from 'react';
import { Section } from '@betty/beam';
import { WIDGETS } from '../bench/widgets/registry';
import type { WidgetSize } from './DashboardGrid';

/** The operator dashboard's widget — id (into the registry) · label (manager) · named size (grid). */
export interface DashboardWidget {
  id: string;
  label: string;
  size: WidgetSize;
}

/**
 * The operator dashboard's widget set — and its DEFAULT ORDER, which SHIPS as the opinion (most users live
 * with the default). Filters FIRST: a full-width filter strip reads as the page's control band at the top.
 * Then the bench order (kpi · band · status · table · nextgem) — the arrangement that packs best at common
 * widths. Users can re-order/hide via the manager (persisted); this is just the starting point. Named sizes
 * are per-widget declarations (tuning them is a later per-widget job).
 */
export const DASHBOARD_WIDGETS: DashboardWidget[] = [
  { id: 'filter', label: 'Filters', size: 'full' },
  { id: 'kpi', label: 'KPI', size: 'standard' },
  { id: 'band', label: 'Trend', size: 'wide' },
  { id: 'status', label: 'Gateway status', size: 'compact' },
  { id: 'table', label: 'Transactions', size: 'wide' },
  { id: 'nextgem', label: 'Next settlement', size: 'standard' },
];

/**
 * Render a widget's content in its SHELL. A widget IS a Section now (BEAM.md §6.3a) — the title band is the
 * widget title, the Section border (field-driven/isEdit) is the only frame, and nothing more: the product
 * gradient rim is gone (WidgetShell survives for the bench only). The Transactions table is a `<Section bleed>`
 * so the datagrid runs to the surface edges; the Table organism owns the 44px header, the no-static-separator
 * convention (edge separators are its own overflow affordance), and the internal horizontal scroll (its scroll
 * wrapper), so a narrow track scrolls the table, not the page.
 */
export const dashboardWidgetNode = (w: DashboardWidget): ReactNode => (
  <Section title={w.label} bleed={w.id === 'table'}>
    {WIDGETS[w.id as keyof typeof WIDGETS].node}
  </Section>
);
