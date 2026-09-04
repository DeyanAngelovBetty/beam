import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { editabilityBorderSx } from '../theme/tokens';
import type { BeamPaperProps } from './BeamPaper.types';

/**
 * BeamPaper — see BeamPaper.types. The sanctioned section surface: elevated Paper + the shared
 * EDITABILITY border (borderless until it contains a field), an in-surface title, and a padded or
 * full-bleed body. Reuses `editabilityBorderSx` — the SAME mechanism DetailsPanel uses, not a
 * parallel one.
 */
export function BeamPaper({ title, bleed = false, children, 'aria-label': ariaLabel }: BeamPaperProps) {
  return (
    <Paper aria-label={ariaLabel} sx={{ ...editabilityBorderSx, overflow: 'hidden', height: '100%' }}>
      {title && (
        <Box sx={{ px: 2, pt: 2, pb: bleed ? 1.5 : 1 }}>
          <Typography variant="subtitle2">{title}</Typography>
        </Box>
      )}
      {/* Full-bleed content runs to the surface edge (tables/grids own their cell padding); padded
          content gets the surface inset. When titled + padded, the title already paid the top inset. */}
      <Box sx={bleed ? undefined : { px: 2, pt: title ? 0 : 2, pb: 2 }}>{children}</Box>
    </Paper>
  );
}
