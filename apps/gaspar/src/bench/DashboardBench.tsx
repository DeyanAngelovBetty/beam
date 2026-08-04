import { useState } from 'react';
import { Box, Stack, Typography, Tabs, Tab, Chip } from '@betty/beam';
import { ALL_WIDGET_IDS } from './dashboardConfig';
import type { WidgetId } from './dashboardConfig';
import { WIDGETS } from './widgets/registry';
import { BenchDashboardStatic } from './BenchDashboardStatic';
import { BenchDashboardDock } from './BenchDashboardDock';

/**
 * DashboardBench — the head-to-head host (Lab/Bench + the Gaspar
 * /dashboard-bench route). One variant toggle, one shared visibleWidgetIds
 * control. Toggling a widget chip removes it from WHICHEVER variant is shown,
 * proving the same permission-filter contract with zero layout code — the whole
 * point of the bench.
 */
export function DashboardBench() {
  const [variant, setVariant] = useState<'static' | 'dock'>('static');
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
          Two layout implementations, one config and one permission set. Variant 1 is a static
          12-column grid; Variant 2 is a dockview workspace aimed at the investigation layout.
        </Typography>
      </Stack>

      <Tabs value={variant} onChange={(_e, v) => setVariant(v as 'static' | 'dock')}>
        <Tab value="static" label="Variant 1 · Static grid" />
        <Tab value="dock" label="Variant 2 · Dockview" />
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
          // key forces a fresh dockview when the visible set changes (bench:
          // simplest correct behaviour; a real impl would diff panels).
          <BenchDashboardDock
            key={visibleWidgetIds.join(',')}
            visibleWidgetIds={visibleWidgetIds}
          />
        )}
      </Box>
    </Stack>
  );
}
