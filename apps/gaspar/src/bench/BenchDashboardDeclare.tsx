import type { CSSProperties } from 'react';
import { Box } from '@betty/beam';
import { DASHBOARD_CONFIG, ALL_WIDGET_IDS } from './dashboardConfig';
import type { WidgetId } from './dashboardConfig';
import { WIDGETS, WidgetShell } from './widgets/registry';

/**
 * VARIANT 3 — BenchDashboardDeclare: cards declare, the container satisfies.
 *
 * The inversion the bench is testing. Config keeps only what it legitimately owns —
 * WHICH cards, in what ORDER (id + order). It says NOTHING about size: this variant
 * IGNORES colSpan/rowSpan entirely. Each card declares its own width need (`span`, in
 * the widget registry — the card knows its content, the config author doesn't), and the
 * CSS grid satisfies it. No JS position math, no row units, no layout engine. If Variant
 * 3 graduates, dashboardConfig sheds colSpan/rowSpan; until then those stay for V1/V2.
 *
 * The KPI height bug dies for free here: `grid-auto-rows: auto` means a card takes the
 * height its content needs, so KPI's chart (revealed at ≥2 tracks) fits with NO rowSpan
 * declared anywhere — the two-authorities-disagreeing split that caused the bug is gone.
 *
 * Users cannot drag a card wider — the card decides its span (BEAM Appendix C).
 */

// ── The coupling constants ────────────────────────────────────────────────────────
// BASE and GAP are the SINGLE source for BOTH track-count derivations below (auto-fit's
// minmax AND the --cols container-query ladder). They agree only while both read these;
// change BASE, GAP, or add padding on the container wrapper and the two drift silently,
// reintroducing the overflow the clamp exists to prevent. See the two labelled comments.
const BASE = 240; // px — one track's min useful width (== the widgets' CQ.twoCol)
const GAP = 16; // px — the grid gap (== theme.spacing(2)); the ladder assumes exactly this
const MAX_COLS = 4; // the widest span any card declares (filter) — caps the --cols ladder

// tracks(W) = floor((W + GAP) / (BASE + GAP)). The max-width BELOW which the grid holds
// at most n tracks is (n+1)·BASE + n·GAP; −1px keeps the query strictly below the boundary.
const capAt = (n: number) => (n + 1) * BASE + n * GAP - 1;

interface BenchDashboardDeclareProps {
  /** Permission set. Defaults to every widget. */
  visibleWidgetIds?: readonly WidgetId[];
  /** Opt-in gradient-border treatment on every widget shell (product dashboard). */
  gradientBorder?: boolean;
}

export function BenchDashboardDeclare({
  visibleWidgetIds = ALL_WIDGET_IDS,
  gradientBorder = false,
}: BenchDashboardDeclareProps) {
  // Config owns ORDER (reading/DOM order = priority); nothing about size.
  const visible = DASHBOARD_CONFIG.filter((w) => visibleWidgetIds.includes(w.id))
    .slice()
    .sort((a, b) => a.order - b.order);

  return (
    // Wrapper is the query container. It carries NO padding on purpose: its width must
    // equal the grid width auto-fit measures, or the two track-count sources drift.
    <Box sx={{ containerType: 'inline-size' }}>
      <Box
        sx={{
          display: 'grid',
          // ── TRACK COUNT, SOURCE #1: auto-fit derives it from width / this minmax.
          //    min(BASE,100%) stops a lone track overflowing a sub-BASE viewport.
          //    KEEP IN SYNC with the --cols ladder below — both read BASE/GAP.
          gridTemplateColumns: `repeat(auto-fit, minmax(min(${BASE}px, 100%), 1fr))`,
          gridAutoFlow: 'dense', // backfill holes → kills the "weird empty slots" reflex
          gridAutoRows: 'auto', // content-sized rows: a card takes the height it needs
          gap: `${GAP}px`, // == theme.spacing(2); the exact GAP the ladder assumes
          // ── TRACK COUNT, SOURCE #2: the container queries DECLARE it as --cols from
          //    arithmetic on BASE/GAP (capAt). This and auto-fit (#1) agree ONLY while
          //    both read the same BASE/GAP. Narrower query wins by source order (listed
          //    widest→narrowest). Test AT the ±2px boundaries (capAt 3/2/1 = 1007/751/
          //    495), not just between them — that's where drift shows as overflow.
          '--cols': MAX_COLS,
          [`@container (max-width: ${capAt(3)}px)`]: { '--cols': 3 },
          [`@container (max-width: ${capAt(2)}px)`]: { '--cols': 2 },
          [`@container (max-width: ${capAt(1)}px)`]: { '--cols': 1 },
        }}
      >
        {visible.map((w) => {
          const card = WIDGETS[w.id];
          return (
            <Box
              key={w.id}
              // The card's OWN declaration; --cols is the container's satisfied answer.
              style={{ '--span': card.span } as CSSProperties}
              sx={{
                // TRAP 1 CLAMP: take the MIN of what the card wants (--span) and what the
                // grid actually has (--cols). span 4 on a 2-track grid → 2 — never
                // overflows. No JS, no positions: the container satisfies. min() in a grid
                // span is modern Chrome; if it doesn't resolve, grid-column falls back to
                // auto and every card collapses to one track (KPI's chart never appears).
                gridColumn: 'span min(var(--span, 1), var(--cols))',
                minWidth: 0,
              }}
            >
              <WidgetShell title={card.title} gradientBorder={gradientBorder}>
                {card.node}
              </WidgetShell>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
