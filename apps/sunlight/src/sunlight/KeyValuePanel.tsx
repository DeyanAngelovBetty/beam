import type { ReactNode } from 'react';
import { Paper, Box, Stack, Typography } from '@betty/beam';

/** One key/value cell. `value` is a ReactNode, so a chip/badge/link renders as easily as text
 *  (that is the "optional custom render" — no separate render fn needed). */
export type KeyValueItem = { label: string; value: ReactNode };

/**
 * KeyValuePanel — a labelled key/value grid in an outlined Paper: meta-voice labels (overline)
 * over values, responsive auto-fill columns. This is the little panel the "triple-build episode"
 * kept re-inventing per page; built ONCE here, properly, with a story.
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
          <Stack key={item.label} spacing={0.25}>
            <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.4 }}>
              {item.label}
            </Typography>
            <Box sx={{ typography: 'body2' }}>{item.value}</Box>
          </Stack>
        ))}
      </Box>
    </Paper>
  );
}
