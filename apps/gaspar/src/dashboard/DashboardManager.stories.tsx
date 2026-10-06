import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box, Stack, Typography, useItemManager, bindItemManager, BeamItemManager } from '@betty/beam';
import { DashboardGrid, type DashboardGridItem } from './DashboardGrid';
import { DASHBOARD_WIDGETS, dashboardWidgetNode } from './dashboardWidgets';

/**
 * Dashboard widget manager — the show/hide/reorder UI (BeamItemManager, generalized from Table's column
 * manager) wired to the state/persistence (useItemManager, kind 'widgets') and the layout (DashboardGrid).
 * The dashboard owns the ordered visible list; the browser places. Reorder/hide here, reload — it persists
 * (localStorage, key beam:grid:gaspar.dashboard.demo:widgets:v1). This is NOT DashboardPage yet — a composition
 * preview so the manager UI can be judged on its own.
 */
const meta: Meta = { title: 'Lab/Bench/Dashboard Manager', parameters: { layout: 'padded' } };
export default meta;
type Story = StoryObj;

// One source: the page's real widget set (apps/gaspar/src/dashboard/dashboardWidgets).
const byId = new Map(DASHBOARD_WIDGETS.map((w) => [w.id, w]));

export const WithManager: Story = {
  render: function Render() {
    const manager = useItemManager(
      DASHBOARD_WIDGETS.map((w) => ({ id: w.id, label: w.label })),
      { storageKey: 'gaspar.dashboard.demo', kind: 'widgets' }
    );
    const bound = bindItemManager(manager, DASHBOARD_WIDGETS);

    // The grid gets the VISIBLE widgets in the manager's order, each with its named size + shelled content.
    const gridItems: DashboardGridItem[] = bound.items
      .filter((i) => i.visible)
      .map(({ id }) => {
        const w = byId.get(id)!;
        return { id, size: w.size, node: dashboardWidgetNode(w) };
      });

    return (
      <Stack spacing={1.5}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="body2" color="text.secondary">
            Show/hide + reorder via “Manage widgets”. The grid re-packs in the new order (strict); choices
            persist to localStorage.
          </Typography>
          {/* Placement under test: a page-header action (outlined). A dashboard has no table toolbar. */}
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
        </Stack>
        <Box>
          <DashboardGrid items={gridItems} />
        </Box>
      </Stack>
    );
  },
};
