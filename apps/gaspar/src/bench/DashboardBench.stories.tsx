import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box } from '@betty/beam';
import { DashboardBench } from './DashboardBench';
import { BenchDashboardStatic } from './BenchDashboardStatic';
import { BenchDashboardDock } from './BenchDashboardDock';
import { BenchDashboardDeclare } from './BenchDashboardDeclare';

/**
 * Lab/Bench — head-to-head dashboard layout spike (Gaspar). Two implementations
 * of the same config + permission set. Not shipped; a decision aid.
 * Toggle the toolbar globals (mode / product / jurisdiction) — both variants
 * are token-driven and should hold up in every corner.
 */
const meta: Meta<typeof DashboardBench> = {
  title: 'Lab/Bench/Dashboard',
  component: DashboardBench,
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj<typeof DashboardBench>;

/** The head-to-head host: variant toggle + shared visibleWidgetIds control. */
export const Comparison: Story = {};

/** Variant 1 in isolation — resize the canvas to watch container queries fire. */
export const StaticGrid: StoryObj<typeof BenchDashboardStatic> = {
  render: () => <BenchDashboardStatic />,
};

/** Variant 2 in isolation — drag panels; layout persists via the stub hook. */
export const Dockview: StoryObj<typeof BenchDashboardDock> = {
  render: () => <BenchDashboardDock />,
};

/**
 * Variant 3 in isolation — cards declare, container satisfies. Resize the canvas
 * across the track-count boundaries (~495 / 751 / 1007px) to watch spans clamp and
 * cards re-pack with no empty slots (mind the residual 1-track gap at 2–3 cols — see
 * the component). KPI's chart appears at ≥2 tracks and the row grows to fit it.
 */
export const Declarative: StoryObj<typeof BenchDashboardDeclare> = {
  render: () => <BenchDashboardDeclare />,
};

/**
 * Permission filtering: two ids removed. Same call on both variants — no layout
 * code changes, widgets simply drop and the grid repacks.
 */
export const PermissionFiltered: StoryObj<typeof BenchDashboardStatic> = {
  render: () => (
    <Box>
      <BenchDashboardStatic visibleWidgetIds={['kpi', 'band', 'table', 'status']} />
    </Box>
  ),
};
