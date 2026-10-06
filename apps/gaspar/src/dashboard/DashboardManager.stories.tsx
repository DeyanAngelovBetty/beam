import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box, Stack, Typography, useItemManager, bindItemManager, BeamItemManager } from '@betty/beam';
import { DashboardGrid, type WidgetSize, type DashboardGridItem } from './DashboardGrid';
import { WIDGETS, WidgetShell } from '../bench/widgets/registry';

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

// The dashboard's widget set: id · label (for the manager) · named size (for the grid).
const WIDGET_SET: { id: string; label: string; size: WidgetSize }[] = [
  { id: 'kpi', label: 'KPI', size: 'standard' },
  { id: 'band', label: 'Trend', size: 'wide' },
  { id: 'status', label: 'Gateway status', size: 'compact' },
  { id: 'nextgem', label: 'Next settlement', size: 'standard' },
  { id: 'filter', label: 'Filters', size: 'full' },
  { id: 'table', label: 'Transactions', size: 'wide' },
];
const SIZE_OF = Object.fromEntries(WIDGET_SET.map((w) => [w.id, w.size])) as Record<string, WidgetSize>;

export const WithManager: Story = {
  render: function Render() {
    const manager = useItemManager(
      WIDGET_SET.map((w) => ({ id: w.id, label: w.label })),
      { storageKey: 'gaspar.dashboard.demo', kind: 'widgets' }
    );
    const bound = bindItemManager(manager, WIDGET_SET);

    // The grid gets the VISIBLE widgets in the manager's order, each with its named size + shelled content.
    const gridItems: DashboardGridItem[] = bound.items
      .filter((i) => i.visible)
      .map(({ id, label }) => ({
        id,
        size: SIZE_OF[id],
        node: <WidgetShell title={label}>{WIDGETS[id as keyof typeof WIDGETS].node}</WidgetShell>,
      }));

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
