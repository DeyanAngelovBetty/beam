import type { ReactNode } from 'react';
import { Paper, Box, BeamStat } from '@betty/beam';

/** One key/value cell. `value` is a ReactNode → it flows straight through BeamStat's value slot
 *  (a date, a "—", a name, or a node), no separate render fn. */
export type KeyValueItem = { label: string; value: ReactNode };

/**
 * KeyValuePanel — a labelled key/value grid in an outlined Paper. The panel OWNS THE LAYOUT
 * (responsive auto-fill columns, its own paper); each pair is a BeamStat (meta label · value · the
 * vertical keyline — the KPI/Live-Check anatomy), so the estate's stat nugget is the atom and this
 * never re-spells label/value typography. These are NEUTRAL facts — no severity (that is the Live
 * Check's business); the default spine reads calm across a grid of seven.
 *
 * State (status/operation/lifecycle chips) is NOT a fact for this panel: it lives once in the page
 * header's identity zone (detail-grammar). The panel carries identity + timestamps + attribution.
 *
 * Product-local for now (BEAM.md §2 — a pattern earns Beam on its SECOND real consumer).
 * PROMOTION SOCKET: gaspar's detail pages are the likely second consumer — graduate to
 * `@betty/beam` (types + story move with it) when that lands, not before.
 */
export function KeyValuePanel({
  items,
  minColumnWidth = 200,
  'aria-label': ariaLabel,
}: {
  items: KeyValueItem[];
  /** Columns auto-fill at ≥ this width; the grid reflows responsively. */
  minColumnWidth?: number;
  'aria-label'?: string;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Box
        role="group"
        aria-label={ariaLabel}
        sx={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${minColumnWidth}px, 1fr))`, gap: 2 }}
      >
        {items.map((item) => (
          <BeamStat key={item.label} label={item.label} value={item.value} />
        ))}
      </Box>
    </Paper>
  );
}
