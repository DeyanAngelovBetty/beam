import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import type { DetailsPanelProps } from './DetailsPanel.types';

/**
 * DetailsPanel — the unlabeled boxed field panel that opens a detail page (see DetailsPanel.types).
 * Elevated Paper · 24px padding-block · 2-spacing padding-INLINE · 24px gutters · items top-aligned ·
 * rows sized by their tallest member. It owns LAYOUT only; the page owns mode, and the field twins
 * (BeamStat / BeamField / BeamSwitchField) are passed as children — booleans sit inline as peers.
 *
 * BORDERED WHEN IT CONTAINS FIELDS. View is borderless (spines carry the read; a frame would be
 * noise); edit shows a quiet 1px divider frame marking the active region. Weight hierarchy keeps it
 * calm: the container divider is quiet, the input outlines strong. The border ALWAYS exists (1px
 * solid transparent → divider) and only its COLOUR transitions — never add/remove the border, or a
 * 1px box growth would shift every twin on the mode switch (the jarring the 44px system prevents).
 * Mode is detected STRUCTURALLY via `:has(.MuiInputBase-root)` (contains fields ⇔ edit) — no prop,
 * no call-site wiring, nothing to forget.
 *
 * The inline padding is the SPACING VAR literally (`calc(2 * var(--mui-spacing))`), not a baked 16px,
 * so ThemeLab spacing edits ride through — and it puts the panel's text column at the same inset as
 * a datagrid cell's text (one vertical scan line per page).
 *
 * Spanning: a wide item wraps in `<Box sx={{ gridColumn: '1 / -1' }}>` (full row) or `'span 2'`.
 */
export function DetailsPanel({ children, minColumnWidth = 220, 'aria-label': ariaLabel }: DetailsPanelProps) {
  return (
    <Paper
      sx={{
        py: 3,
        px: 'calc(2 * var(--mui-spacing))',
        // Constant geometry: the border is always here (transparent in view), so nothing moves on the
        // mode switch — only the colour transitions. `:has(.MuiInputBase-root)` = "contains fields".
        border: '1px solid transparent',
        transition: 'border-color var(--beam-motion-move)',
        '&:has(.MuiInputBase-root)': { borderColor: 'divider' },
      }}
    >
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
