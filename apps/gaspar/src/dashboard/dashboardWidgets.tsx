import type { ReactNode } from 'react';
import { Section } from '@betty/beam';
import { WIDGETS } from '../bench/widgets/registry';
import { REPORTS, reportById, ReportControls, reportBody } from './reports';
import type { WidgetSize } from './DashboardGrid';

/** The operator dashboard's widget — id · label (manager) · named size (grid). */
export interface DashboardWidget {
  id: string;
  label: string;
  size: WidgetSize;
}

/**
 * The operator dashboard's widget set — Boryana's v1.1 scaffold (2026-10-07). FILTERS first (the control-row
 * placeholder, left exactly as-is — the spec's date-range + provider control row is its own later step), then
 * the FIVE v1.1 reports in spec order (docs/gaspar-dashboard-notes.md). The bench widgets (KPI · Trend ·
 * Gateway status · Transactions mini · Next settlement) are no longer on the page: KPI + Trend become the v1.2
 * tile + a report later and stay bench-only; Gateway status / Transactions mini / Next settlement have no spec
 * home, so they move to the BENCH (Lab/Bench/Dashboard) rather than behind a "beyond" milestone — the
 * Dashboard's milestone gating isn't wired yet (a later step), so the bench is the cleaner home for now.
 */
export const DASHBOARD_WIDGETS: DashboardWidget[] = [
  { id: 'filter', label: 'Filters', size: 'full' },
  ...REPORTS.map((r) => ({ id: r.id, label: r.title, size: r.size })),
];

/**
 * Render a widget in its Section shell (BEAM.md §6.3a — a widget IS a Section; the title band is the title).
 * A REPORT renders the spec's title-band controls (disabled toggle + "definition pending" info) over an honest
 * draft body that keeps the chart footprint — no invented data, no chart that looks real. FILTERS renders the
 * existing filter widget unchanged (the real control row is a later step).
 */
export const dashboardWidgetNode = (w: DashboardWidget): ReactNode => {
  const report = reportById.get(w.id);
  if (report) {
    return (
      <Section title={report.title} actions={<ReportControls report={report} />}>
        {reportBody(report)}
      </Section>
    );
  }
  return <Section title={w.label}>{WIDGETS[w.id as keyof typeof WIDGETS].node}</Section>;
};
