import { useCallback } from 'react';
import { DockviewReact } from 'dockview-react'; // SPIKE: remove if Variant 1 wins
import type { DockviewReadyEvent, IDockviewPanelProps } from 'dockview-react';
import 'dockview-react/dist/styles/dockview.css';
import { Box } from '@betty/beam';
import { DASHBOARD_CONFIG, ALL_WIDGET_IDS } from './dashboardConfig';
import type { WidgetId } from './dashboardConfig';
import { WIDGETS, WidgetShell } from './widgets/registry';
import { useDockPersistence } from './useDockPersistence';

/**
 * VARIANT 2 — BenchDashboardDock (dockview-react).
 *
 * Aimed at the INVESTIGATION layout, not the dashboard: a dockable workspace an
 * analyst rearranges (attempt chain, card history, rules fired, provider raw
 * response). It renders the SAME six widgets keyed by id, so `visibleWidgetIds`
 * filters identically to Variant 1 — removing ids removes panels, no layout
 * code. Beam tokens are mapped onto dockview's functional CSS variables so the
 * chrome follows product / jurisdiction / mode. Layout is persisted via a stub
 * hook (toJSON on change, fromJSON on ready).
 */

// The investigation-panel titles this arrangement is aimed at, backed by the
// shared widgets. Any id without an entry keeps its registry title.
const INVESTIGATION_TITLE: Partial<Record<WidgetId, string>> = {
  table: 'Attempt chain',
  band: 'Rules fired',
  nextgem: 'Card history',
  status: 'Provider raw response',
};

/** One panel component for every widget; the id rides in params. */
function WidgetPanel(props: IDockviewPanelProps<{ widgetId: WidgetId }>) {
  const widget = WIDGETS[props.params.widgetId];
  return <WidgetShell title={widget.title}>{widget.node}</WidgetShell>;
}

const COMPONENTS = { widget: WidgetPanel };

interface BenchDashboardDockProps {
  visibleWidgetIds?: readonly WidgetId[];
}

export function BenchDashboardDock({
  visibleWidgetIds = ALL_WIDGET_IDS,
}: BenchDashboardDockProps) {
  const persistence = useDockPersistence('beam.bench.dock');

  const onReady = useCallback(
    (event: DockviewReadyEvent) => {
      const api = event.api;

      const saved = persistence.load();
      if (saved) {
        api.fromJSON(saved);
      } else {
        // Default investigation arrangement: alternate right / below off the
        // previous panel so the six widgets fan into a workspace.
        const visible = DASHBOARD_CONFIG.filter((w) => visibleWidgetIds.includes(w.id))
          .slice()
          .sort((a, b) => a.order - b.order);
        let ref: string | undefined;
        visible.forEach((w, i) => {
          api.addPanel({
            id: w.id,
            component: 'widget',
            title: INVESTIGATION_TITLE[w.id] ?? WIDGETS[w.id].title,
            params: { widgetId: w.id },
            ...(ref
              ? { position: { referencePanel: ref, direction: i % 2 === 0 ? 'right' : 'below' } }
              : {}),
          });
          ref = w.id;
        });
      }

      // Persist on any layout change (stub round-trip of toJSON).
      api.onDidLayoutChange(() => persistence.save(api.toJSON()));
    },
    [visibleWidgetIds, persistence],
  );

  return (
    <Box
      className="dockview-theme-dark"
      sx={(theme) => ({
        height: 560,
        // SPIKE: map Beam tokens onto dockview's functional CSS variables. These
        // reference --mui-palette-* vars, so panels follow mode/brand for free.
        '--dv-group-view-background-color': 'var(--mui-palette-background-paper)',
        '--dv-tabs-and-actions-container-background-color':
          'var(--mui-palette-background-default)',
        '--dv-activegroup-visiblepanel-tab-background-color':
          'var(--mui-palette-background-paper)',
        '--dv-activegroup-visiblepanel-tab-color': 'var(--mui-palette-text-primary)',
        '--dv-inactivegroup-visiblepanel-tab-background-color':
          'var(--mui-palette-background-default)',
        '--dv-inactivegroup-visiblepanel-tab-color': 'var(--mui-palette-text-secondary)',
        '--dv-separator-border': 'var(--mui-palette-divider)',
        '--dv-tab-divider-color': 'var(--mui-palette-divider)',
        '--dv-border-radius': `${theme.shape.borderRadius}px`,
      })}
    >
      <DockviewReact components={COMPONENTS} onReady={onReady} />
    </Box>
  );
}
