import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { editabilityBorderSx } from '../theme/tokens';
import type { SectionProps } from './Section.types';

/**
 * Section — see Section.types. The sanctioned section surface: elevated Paper + the shared
 * EDITABILITY border (borderless until it contains a field), an in-surface title, and a padded or
 * full-bleed body. Reuses `editabilityBorderSx` — the SAME mechanism DetailsPanel uses, not a
 * parallel one.
 */
export function Section({ title, actions, isEdit, bleed = false, children, 'aria-label': ariaLabel }: SectionProps) {
  // Border: official semantics for the boolean (divider when true, else transparent); the `:has(field)`
  // auto-derivation is the opt-in `isEdit="auto"` path. Constant 1px geometry either way — only colour moves.
  const borderSx =
    isEdit === 'auto'
      ? editabilityBorderSx
      : { border: '1px solid', borderColor: isEdit ? 'divider' : 'transparent', transition: 'border-color var(--beam-motion-move)' };
  return (
    <Paper aria-label={ariaLabel} sx={{ ...borderSx, overflow: 'hidden', height: '100%' }}>
      <Box sx={{ px: 2, pt: 2, pb: bleed ? 1.5 : 1 }}>
        <Typography variant="subtitle2">{title}</Typography>
      </Box>
      {actions && <Box sx={{ px: 2, pb: 1 }}>{actions}</Box>}
      {/* Full-bleed content runs to the surface edge (tables/grids own their cell padding); padded
          content gets the surface inset. The title already paid the top inset. */}
      <Box sx={bleed ? undefined : { px: 2, pt: 0, pb: 2 }}>{children}</Box>
    </Paper>
  );
}
