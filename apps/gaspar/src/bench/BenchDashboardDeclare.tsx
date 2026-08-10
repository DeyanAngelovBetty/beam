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
// BASE and GAP are the SINGLE source for BOTH track-count derivations below: auto-fit's
// minmax reads BASE (a track's min width); the --cols ladder reads TRACK = BASE + GAP (a
// track's full footprint — its min plus the gap after it). They can't collapse into one
// expression (one needs the min, the other the footprint), so the honest coupling is the
// shared roots + the KEEP-IN-SYNC comments at both sites. Change BASE, GAP, or add padding
// on the wrapper and the two drift silently, reintroducing the overflow the clamp prevents.
const BASE = 240; // px — one track's min useful width (== the widgets' CQ.twoCol)
const GAP = 16; // px — the grid gap (== theme.spacing(2))
const TRACK = BASE + GAP; // 256 — a track's full footprint; the number both derivations share

// The ladder's ceiling. Numeric spans clamp to this; a 'full' card bypasses it entirely
// (grid-column: 1 / -1, no --cols). 8 sits ABOVE every span any card currently declares
// (largest numeric is 3), so it is never actually hit — but it IS a ceiling: past
// trackStart(9) = 2288px the container yields 9 tracks while --cols saturates at 8 (the
// same class of bug, moved up). Raise it only if a card ever legitimately wants > 8
// tracks — and such a card probably wants 'full' instead.
const MAX_COLS = 8;

// auto-fit yields n tracks once the container is at least trackStart(n) wide (n mins +
// (n−1) gaps = TRACK·n − GAP). The --cols ladder is exactly this, inverted into min-width
// rungs, so it reports the SAME count auto-fit produced — both read TRACK/GAP.
const trackStart = (n: number) => TRACK * n - GAP;

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
          // ── TRACK COUNT, SOURCE #1 — auto-fit derives it from the width and this
          //    minmax. min(BASE,100%) stops a lone track overflowing a sub-BASE viewport.
          //    KEEP IN SYNC with the --cols ladder below — both read BASE / TRACK / GAP.
          gridTemplateColumns: `repeat(auto-fit, minmax(min(${BASE}px, 100%), 1fr))`,
          gridAutoFlow: 'dense', // backfill holes → kills the "weird empty slots" reflex
          gridAutoRows: 'auto', // content-sized rows: a card takes the height it needs
          gap: `${GAP}px`, // == theme.spacing(2); the exact GAP trackStart() assumes
          // ── TRACK COUNT, SOURCE #2 — the container PUBLISHES it as --cols, because CSS
          //    gives a card no way to ask "how many tracks do you have?" So the container
          //    answers here and each card reads it (see the item below). This ladder is
          //    trackStart() inverted into min-width rungs, so it reports the SAME number
          //    auto-fit (#1) produced — the two share TRACK/GAP and cannot drift. Default
          //    1; each rung bumps --cols up as another track fits; the widest matching
          //    min-width wins (rungs emitted ascending). Generated to MAX_COLS, never
          //    hand-typed widths. Test AT the boundaries trackStart(2..6) = 496 / 752 /
          //    1008 / 1264 / 1520 — the ±1px where a miscount would surface as overflow.
          '--cols': 1,
          ...Object.fromEntries(
            Array.from({ length: MAX_COLS - 1 }, (_, i) => {
              const n = i + 2; // rungs for 2..MAX_COLS tracks
              return [`@container (min-width: ${trackStart(n)}px)`, { '--cols': n }];
            }),
          ),
        }}
      >
        {visible.map((w) => {
          const card = WIDGETS[w.id];
          // A card makes ONE of FOUR width declarations (see the CardSpan type):
          //   1            — never spans; always a single track (the compact status card)
          //   N            — wants N tracks, takes what exists if the grid is narrower
          //   {divisor,…}  — a PROPORTION of the grid (~1/divisor), bounded [min, max]
          //   'full'       — always EVERY track, at any count (1 / -1, ladder-independent)
          //
          // In EVERY numeric form, min(var(--cols), …) is the OUTERMOST operation. --cols
          // is a hard ceiling and NOTHING may sit outside it — not even the proportional
          // clamp's --min floor — or a card overflows its grid. (The trap is putting a
          // floor outside the guard: max(3, min(--span, --cols)) at 2 tracks = max(3, 2) =
          // 3, a 3-track span in a 2-track grid. The clamp always goes INSIDE the min.)
          const { span } = card;
          let vars: CSSProperties | undefined;
          let gridColumn: string;
          if (span === 'full') {
            // 'full' can't be a number (min() needs one), so it uses the CSS-native
            // 1 / -1 = "first line to the LAST line of the explicit grid" = every track.
            // No --cols: it re-resolves at any track count, past the ladder ceiling too.
            gridColumn = '1 / -1';
          } else if (typeof span === 'object') {
            // "About 1/divisor of whatever tracks exist, never fewer than --min, never
            // more than --max." The bounds do real work ONLY because the middle value is
            // DYNAMIC (round(--cols/divisor)) — min/max around a STATIC span are inert:
            // clamp(2, 2, 4) = 2, the bounds never fire. round(down, x, 1) = floor, needed
            // because cols/divisor is fractional; round() is CSS Values 4 (modern Chrome),
            // the same support bet as min() — if it doesn't resolve in a grid span,
            // grid-column falls back to auto and the card collapses to one track.
            //
            // What is NOT here and CANNOT be: "stretch to fill the leftover on my row." A
            // card can read the grid's TOTAL track count (--cols) but NOT its own row
            // occupancy — how many tracks are still free beside it. Grid does not expose
            // that; deriving it means computing positions in JS, the exact thing this
            // model exists to avoid. Proportional-to-total is expressible; absorb-the-
            // leftover is not — and do NOT fake it with a static floor, which only moves
            // the hole to another track count (Trend floored at 3 fills 6, strands 7).
            vars = {
              '--min': span.min,
              '--max': span.max,
              '--divisor': span.divisor,
            } as CSSProperties;
            gridColumn =
              'span min(var(--cols), clamp(var(--min), round(down, var(--cols) / var(--divisor), 1), var(--max)))';
          } else {
            // Fixed: span min(--cols, --span) = "the tracks I want, or all that exist,
            // whichever is smaller." Ask for more than the grid has → just get what there
            // is, never an overflow. (min() in a grid span is the same support bet.)
            vars = { '--span': span } as CSSProperties;
            gridColumn = 'span min(var(--cols), var(--span, 1))';
          }
          return (
            <Box key={w.id} style={vars} sx={{ gridColumn, minWidth: 0 }}>
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
