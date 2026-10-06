import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box, Stack, Typography } from '@betty/beam';
import { DashboardGrid, type WidgetSize, type DashboardGridItem } from './DashboardGrid';
import { WIDGETS, WidgetShell } from '../bench/widgets/registry';

/**
 * Dashboard grid — the shippable layout (graduated from the bench's declarative variant). The dashboard owns
 * an ORDERED list + each widget's NAMED SIZE; the browser places. STRICT ORDER (no dense), four named sizes.
 *
 * RESIZE the canvas across the track boundaries (~496 / 752 / 1008 / 1264px) to watch spans clamp and widgets
 * re-pack IN ORDER. Because order is strict (not dense), a wide widget that doesn't fit the remaining tracks
 * wraps to the next row and leaves a BOUNDED interior gap on the row it left — that's the deliberate trade
 * (order is the contract). Narrow it all the way down: everything collapses to one column, in list order.
 */
const meta: Meta = { title: 'Lab/Bench/Dashboard Grid', parameters: { layout: 'padded' } };
export default meta;
type Story = StoryObj;

// An ordered demo set exercising every named size (content reused from the bench widgets).
const LAYOUT: { id: string; size: WidgetSize }[] = [
  { id: 'kpi', size: 'standard' },
  { id: 'status', size: 'compact' },
  { id: 'band', size: 'wide' }, // ~half the grid, [2,4] — the one that can wrap and leave a gap
  { id: 'nextgem', size: 'standard' },
  { id: 'filter', size: 'full' }, // every track, never gaps
  { id: 'table', size: 'wide' },
];

const items: DashboardGridItem[] = LAYOUT.map(({ id, size }) => {
  const w = WIDGETS[id as keyof typeof WIDGETS];
  return {
    id,
    size,
    node: (
      <WidgetShell title={`${w.title} · ${size}`}>{w.node}</WidgetShell>
    ),
  };
});

export const Grid: Story = {
  render: () => (
    <Stack spacing={1.5}>
      <Typography variant="body2" color="text.secondary">
        Strict order (no dense), four named sizes. Resize the canvas to watch the track count change; a{' '}
        <code>wide</code> widget that can't fit wraps and leaves a bounded gap — order is the contract.
      </Typography>
      <DashboardGrid items={items} />
    </Stack>
  ),
};

/** Permission/visibility: drop two widgets — the rest re-pack in the SAME order, no layout code. */
export const Filtered: Story = {
  render: () => (
    <Box>
      <DashboardGrid items={items.filter((i) => i.id !== 'band' && i.id !== 'nextgem')} />
    </Box>
  ),
};
