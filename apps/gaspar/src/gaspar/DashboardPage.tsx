import { useMemo } from 'react';
import { Stack, BeamPage, useItemManager, bindItemManager, BeamItemManager } from '@betty/beam';
import { DashboardGrid, type DashboardGridItem } from '../dashboard/DashboardGrid';
import { DASHBOARD_WIDGETS, dashboardWidgetNode } from '../dashboard/dashboardWidgets';

/**
 * Dashboard — Gaspar's landing page. A read-only operator overview of payment health. The dashboard is a
 * WIDGET MANAGER + a CSS grid: it owns which widgets show and in what order (useItemManager, kind 'widgets',
 * persisted to localStorage); the browser owns layout (DashboardGrid — strict order, named sizes); each widget
 * owns its size + internal responsiveness. No layout engine (BEAM §9 lane; docs/beam-alignment.md §4).
 *
 * The manager lives in the page-header ACTION slot — a labelled "Manage widgets" button, not an icon-only
 * kebab (discoverability ruling 2026-09-23). The DEFAULT order (Filters first, then the bench order) ships as
 * the opinion; users re-order/hide from here. The dashboard-bench (Lab/Bench/Dashboard) stays as the record.
 */
export function DashboardPage() {
  const manager = useItemManager(
    DASHBOARD_WIDGETS.map((w) => ({ id: w.id, label: w.label })),
    { storageKey: 'gaspar.dashboard', kind: 'widgets' }
  );
  const bound = bindItemManager(manager, DASHBOARD_WIDGETS);

  const byId = useMemo(() => new Map(DASHBOARD_WIDGETS.map((w) => [w.id, w])), []);
  const gridItems: DashboardGridItem[] = bound.items
    .filter((i) => i.visible)
    .map(({ id }) => {
      const w = byId.get(id)!;
      return { id, size: w.size, node: dashboardWidgetNode(w) };
    });

  return (
    <Stack spacing={3}>
      <BeamPage
        title="Dashboard"
        subtitle="Routing, settlement, and gateway health at a glance."
        action={
          <BeamItemManager
            items={bound.items}
            catalog={[]}
            onToggle={bound.onToggle}
            onMove={bound.onMove}
            onReorder={bound.onReorder}
            onReset={bound.onReset}
            title="widgets"
            triggerVariant="outlined"
          />
        }
      />
      <DashboardGrid items={gridItems} rim />
    </Stack>
  );
}
