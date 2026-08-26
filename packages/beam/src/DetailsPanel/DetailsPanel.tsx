import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import type { DetailsPanelProps } from './DetailsPanel.types';

/**
 * DetailsPanel — the unlabeled boxed field panel that opens a detail page (see DetailsPanel.types).
 * Paper container · 24px padding · 24px gutters · items top-aligned · rows sized by their tallest
 * member. It owns LAYOUT only; the page owns mode, and the field twins (BeamStat / BeamField /
 * BeamSwitchField) are passed as children — booleans sit inline as peers.
 *
 * Spanning: a wide item wraps in `<Box sx={{ gridColumn: '1 / -1' }}>` (full row) or `'span 2'`.
 */
export function DetailsPanel({ children, minColumnWidth = 220, 'aria-label': ariaLabel }: DetailsPanelProps) {
  return (
    <Paper sx={{ p: 3 }}>
      <Box
        role="group"
        aria-label={ariaLabel}
        sx={{
          display: 'grid',
          gap: 3, // 24px gutters
          gridTemplateColumns: `repeat(auto-fill, minmax(${minColumnWidth}px, 1fr))`,
          alignItems: 'start', // items top-aligned; each row's height = its tallest member
        }}
      >
        {children}
      </Box>
    </Paper>
  );
}
