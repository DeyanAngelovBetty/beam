import { useRef, type CSSProperties, type ReactNode } from 'react';
import { Box, beamPlatter, usePointerAngleTracking } from '@betty/beam';

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

// SHOWROOM RIM clearance (design-repo scope, BEAM.md §6.3a). The `rim` platter is a gradient `beamPlatter`
// whose outward extent is `--beam-ring` — a registered @property, 1px at rest → 2px at hover (createBeamTheme).
// So the rim never reaches past this many px: it's the all-sides padding the grid needs (the collapsed-nav
// gutter of 0 would otherwise let an overflow-clipping ancestor crop the leftmost widget's `::after`), and the
// gap must stay ≥ 2× it so two neighbours' rims never touch. GAP(16) ≥ 2×2 already — asserted, not re-derived.
const RIM_REACH = 2; // == --beam-ring hover max (keep in step if that @property's hover value moves)

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
  /**
   * Opt into the SHOWROOM RIM (design-repo scope, BEAM.md §6.3a) — a product gradient platter concentric
   * outside each (borderless) widget, plus the clearance padding that keeps it unclipped. Off by default, so
   * the bench stories render the plain grid; the real DashboardPage turns it on.
   */
  rim?: boolean;
}

/**
 * One grid cell. `container-type` so a widget's OWN container queries read THIS item's resolved width;
 * `minWidth: 0` so the item can shrink below its content (the grid never overflows → a wide widget's table
 * scrolls internally, not the page). `style={}` not `sx` for the span so the `min()`/`clamp()` string isn't
 * parsed/transformed. When `rim`, the gradient platter rides HERE (outside the borderless Section) and the
 * pointer hook leans its bright sector toward the cursor — the same recipe the shells shipped with before the
 * Section swap (`beamPlatter({ interaction: 'track' })`, byte-identical: offset omitted ⇒ `--beam-ring`).
 */
function GridItem({ item, rim }: { item: DashboardGridItem; rim: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  usePointerAngleTracking(ref); // no-op unless the ref is attached (rim off ⇒ ref.current null ⇒ returns early)
  return (
    <Box
      ref={rim ? ref : undefined}
      style={{ gridColumn: SIZE_SPAN[item.size] } as CSSProperties}
      sx={{
        minWidth: 0,
        containerType: 'inline-size',
        // The rim gates on --beam-chrome-platter-on (block under both platter treatments, none under
        // just-glass), so a treatment flip drops the rims with no remount (treatment-model correction 1).
        ...(rim ? (beamPlatter({ interaction: 'track', displayVar: 'var(--beam-chrome-platter-on, block)' }) as object) : {}),
      }}
    >
      {item.node}
    </Box>
  );
}

export function DashboardGrid({ items, rim = false }: DashboardGridProps) {
  return (
    // SHOWROOM clearance wrapper (rim only): all-sides padding = the rim's outward reach, so an edge widget's
    // `::after` draws INSIDE this box — safe from any overflow-clipping ancestor and from a collapsed-nav
    // gutter of 0. Kept OUTSIDE the query container below so that container's width stays byte-identical to
    // what auto-fit measures (the two track-count sources must not drift). No padding when rim is off.
    <Box sx={{ p: rim ? `calc(${RIM_REACH}px * var(--beam-chrome-platter-flag, 1))` : 0 }}>
      {/* The query container. NO padding — its width must equal the grid width auto-fit measures. */}
      <Box sx={{ containerType: 'inline-size' }}>
        <Box
          sx={{
            display: 'grid',
            // TRACK COUNT #1 — auto-fit from width + minmax. min(BASE,100%) stops a lone track overflowing a
            // sub-BASE viewport. KEEP IN SYNC with the --cols ladder (both read BASE/TRACK/GAP).
            gridTemplateColumns: `repeat(auto-fit, minmax(min(${BASE}px, 100%), 1fr))`,
            gridAutoFlow: 'row', // STRICT ORDER — not `dense`. Widgets render in the manager's order.
            gridAutoRows: 'auto', // content-sized rows
            gap: `${GAP}px`, // ≥ 2×RIM_REACH, so neighbouring rims never touch (showroom clearance)
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
            <GridItem key={item.id} item={item} rim={rim} />
          ))}
        </Box>
      </Box>
    </Box>
  );
}
