import type { CSSProperties, ReactNode } from 'react';
import { Box } from '@betty/beam';

/**
 * DashboardGrid — the dashboard's LAYOUT (2026-10-06). The browser places; the dashboard only owns the
 * ORDERED list of widgets (from the widget manager) and each widget's NAMED SIZE. No absolute positioning,
 * no drag-resize, no gridstack — this is the "cards declare, container satisfies" model graduated from the
 * bench's Variant 3, with two rulings baked in:
 *   • STRICT ORDER — `grid-auto-flow: row`, NOT `dense`. Order is the contract (a manager whose order isn't
 *     honoured feels broken); the cost is a bounded interior gap where a multi-track widget wraps. No
 *     last-item stretch (a widget growing because it's last is a surprise; inconsistent sizing beats a gap).
 *   • FOUR NAMED SIZES (grid terms, not px) — a widget declares one; the grid clamps it to the live track
 *     count. The widget owns its size; the browser owns placement.
 *
 * Track count has TWO sources that must agree: auto-fit derives it from width + `minmax`, and the container
 * republishes the same count as `--cols` via an `@container` min-width ladder (CSS gives a child no way to ask
 * "how many tracks do I have?"). Both read BASE/GAP/TRACK, so they can't drift — keep the KEEP-IN-SYNC sites
 * aligned if you touch BASE, GAP, or add padding on the wrapper.
 */

// Coupling constants — the single source for BOTH track-count derivations (see the bench's long note).
const BASE = 240; // px — one track's min useful width (== widgets' CQ.twoCol)
const GAP = 16; // px — grid gap (== theme.spacing(2))
const TRACK = BASE + GAP; // 256 — a track's full footprint; shared by both derivations
const MAX_COLS = 8; // ladder ceiling; a 'full' widget bypasses it (1 / -1)
const trackStart = (n: number) => TRACK * n - GAP; // auto-fit yields n tracks at ≥ this width

export type WidgetSize = 'compact' | 'standard' | 'wide' | 'full';

/**
 * Named size → a `grid-column` span. `min(var(--cols), …)` is the OUTERMOST op in every numeric form so a
 * widget can never ask for more tracks than exist (overflow guard). `wide` is proportional (~half the grid,
 * bounded [2,4]) — the clamp does real work only because the middle value is dynamic (`round(down, cols/2)`).
 * `full` is CSS-native `1 / -1` (every track, ladder-independent).
 */
const SIZE_SPAN: Record<WidgetSize, string> = {
  compact: 'span min(var(--cols, 1), 1)',
  standard: 'span min(var(--cols, 1), 2)',
  wide: 'span min(var(--cols, 1), clamp(2, round(down, var(--cols, 1) / 2, 1), 4))',
  full: '1 / -1',
};

export interface DashboardGridItem {
  id: string;
  size: WidgetSize;
  node: ReactNode;
}

export interface DashboardGridProps {
  /** Widgets in the order the manager fixed — rendered strictly in this order (no dense repack). */
  items: DashboardGridItem[];
}

export function DashboardGrid({ items }: DashboardGridProps) {
  return (
    // The query container. NO padding — its width must equal the grid width auto-fit measures, or the two
    // track-count sources drift.
    <Box sx={{ containerType: 'inline-size' }}>
      <Box
        sx={{
          display: 'grid',
          // TRACK COUNT #1 — auto-fit from width + minmax. min(BASE,100%) stops a lone track overflowing a
          // sub-BASE viewport. KEEP IN SYNC with the --cols ladder (both read BASE/TRACK/GAP).
          gridTemplateColumns: `repeat(auto-fit, minmax(min(${BASE}px, 100%), 1fr))`,
          gridAutoFlow: 'row', // STRICT ORDER — not `dense`. Widgets render in the manager's order.
          gridAutoRows: 'auto', // content-sized rows
          gap: `${GAP}px`,
          // TRACK COUNT #2 — the container publishes it as --cols (the ladder is trackStart() inverted into
          // min-width rungs, reporting the SAME count auto-fit produced). Each item reads --cols for its span.
          '--cols': 1,
          ...Object.fromEntries(
            Array.from({ length: MAX_COLS - 1 }, (_, i) => {
              const n = i + 2; // rungs for 2..MAX_COLS tracks
              return [`@container (min-width: ${trackStart(n)}px)`, { '--cols': n }];
            }),
          ),
        }}
      >
        {items.map((item) => (
          // container-type so a widget's OWN container queries read this item's resolved width; minWidth:0 so
          // the item can shrink below its content (the grid never overflows). style={} not sx so the span
          // string isn't parsed/transformed.
          <Box
            key={item.id}
            style={{ gridColumn: SIZE_SPAN[item.size] } as CSSProperties}
            sx={{ minWidth: 0, containerType: 'inline-size' }}
          >
            {item.node}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
