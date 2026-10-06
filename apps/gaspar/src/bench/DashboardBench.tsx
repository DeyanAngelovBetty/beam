import { useState } from 'react';
import { Box, Stack, Typography, Tabs, Tab, Chip } from '@betty/beam';
import { ALL_WIDGET_IDS } from './dashboardConfig';
import type { WidgetId } from './dashboardConfig';
import { WIDGETS } from './widgets/registry';
import { BenchDashboardStatic } from './BenchDashboardStatic';
import { BenchDashboardDeclare } from './BenchDashboardDeclare';

/**
 * DashboardBench — the head-to-head host (Lab/Bench + the Gaspar
 * /dashboard-bench route). One variant toggle, one shared visibleWidgetIds
 * control. Toggling a widget chip removes it from WHICHEVER variant is shown,
 * proving the same permission-filter contract with zero layout code — the whole
 * point of the bench.
 *
 * Variant 2 (dockview, a DRAG workspace) was RETIRED 2026-10-06: Variant 1 (static grid) won and graduated
 * to DashboardPage, and the dashboard-is-not-a-layout-engine thesis rules out drag/dockview entirely. The
 * record is the two CSS-grid variants — static (ships) + declarative (cards-declare exploration).
 */
export function DashboardBench() {
  const [variant, setVariant] = useState<'static' | 'declare'>('static');
  const [hidden, setHidden] = useState<ReadonlySet<WidgetId>>(new Set());

  const visibleWidgetIds = ALL_WIDGET_IDS.filter((id) => !hidden.has(id));

  const toggle = (id: WidgetId) =>
    setHidden((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <Stack spacing={2}>
      <Stack spacing={0.5}>
        <Typography variant="h5">Dashboard bench</Typography>
        <Typography variant="body2" color="text.secondary">
          Three layout implementations, one config and one permission set. Variant 1 is a static
          12-column grid; Variant 2 is a dockview workspace aimed at the investigation layout;
          Variant 3 inverts the authority — cards declare their width, the auto-fit container
          satisfies it (config keeps only which cards, in what order).
        </Typography>
      </Stack>

      <Tabs value={variant} onChange={(_e, v) => setVariant(v as 'static' | 'declare')}>
        <Tab value="static" label="Variant 1 · Static grid (ships)" />
        <Tab value="declare" label="Variant 3 · Declarative" />
      </Tabs>

      {/* Shared permission control — same ids feed both variants. */}
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          visibleWidgetIds:
        </Typography>
        {ALL_WIDGET_IDS.map((id) => {
          const on = !hidden.has(id);
          return (
            <Chip
              key={id}
              size="small"
              label={WIDGETS[id].title}
              variant={on ? 'filled' : 'outlined'}
              color={on ? 'primary' : 'default'}
              onClick={() => toggle(id)}
            />
          );
        })}
      </Stack>

      <Box sx={{ mt: 1 }}>
        {variant === 'static' ? (
          <BenchDashboardStatic visibleWidgetIds={visibleWidgetIds} />
        ) : (
          <BenchDashboardDeclare visibleWidgetIds={visibleWidgetIds} />
        )}
      </Box>
    </Stack>
  );
}
