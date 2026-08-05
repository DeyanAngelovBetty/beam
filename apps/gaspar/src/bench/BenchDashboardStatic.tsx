import { Box } from '@betty/beam';
import { DASHBOARD_CONFIG, ALL_WIDGET_IDS } from './dashboardConfig';
import type { WidgetId } from './dashboardConfig';
import { WIDGETS, WidgetShell } from './widgets/registry';

/**
 * VARIANT 1 — BenchDashboardStatic (the null hypothesis, no layout engine).
 *
 * A 12-column CSS grid with `grid-auto-flow: dense`. Every widget's size comes
 * from the config row (`colSpan` / `rowSpan`); placement order from `order`.
 * Permission filtering is `visibleWidgetIds` — removing ids drops cells and
 * dense flow repacks, with zero layout code touched.
 *
 * Rows are a fixed height and columns scale with the viewport, so the SAME
 * config stays legible at 1280 / 1900 / 2560: widgets get wider (not taller),
 * and their internals reveal more via container queries (see the widgets' CQ).
 *
 * No drag, no resize, no persistence — deliberately. That's the baseline the
 * dockview variant has to beat.
 */

interface BenchDashboardStaticProps {
  /** Permission set. Defaults to every widget. */
  visibleWidgetIds?: readonly WidgetId[];
  /** Opt-in gradient-border treatment on every widget shell (product dashboard). */
  gradientBorder?: boolean;
}

export function BenchDashboardStatic({
  visibleWidgetIds = ALL_WIDGET_IDS,
  gradientBorder = false,
}: BenchDashboardStaticProps) {
  const visible = DASHBOARD_CONFIG.filter((w) => visibleWidgetIds.includes(w.id)).slice().sort(
    (a, b) => a.order - b.order,
  );

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gridAutoFlow: 'dense',
        gridAutoRows: '140px',
        gap: 2, // Beam spacing token (theme.spacing(2))
      }}
    >
      {visible.map((w) => {
        const widget = WIDGETS[w.id];
        return (
          <Box
            key={w.id}
            sx={{
              gridColumn: `span ${w.colSpan}`,
              gridRow: `span ${w.rowSpan}`,
              minWidth: 0, // let cells shrink so the grid never overflows
            }}
          >
            <WidgetShell title={widget.title} gradientBorder={gradientBorder}>
              {widget.node}
            </WidgetShell>
          </Box>
        );
      })}
    </Box>
  );
}
