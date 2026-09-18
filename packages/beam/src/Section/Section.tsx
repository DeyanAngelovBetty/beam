import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { editabilityBorderSx, FIELD_TWIN_HEIGHT } from '../theme/tokens';
import type { SectionProps } from './Section.types';

/**
 * Section — see Section.types. The sanctioned section surface: elevated Paper + the shared
 * EDITABILITY border (borderless until it contains a field), an in-surface title, an optional lane
 * `toolbar` band (title → toolbar → body), and a padded or full-bleed body. Reuses
 * `editabilityBorderSx` — the SAME mechanism DetailsPanel uses, not a parallel one.
 */
export function Section({ title, actions, toolbar, isEdit, bleed = false, children, 'aria-label': ariaLabel }: SectionProps) {
  // Border: official semantics for the boolean (divider when true, else transparent); the `:has(field)`
  // auto-derivation is the opt-in `isEdit="auto"` path. Constant 1px geometry either way — only colour moves.
  const borderSx =
    isEdit === 'auto'
      ? editabilityBorderSx
      : { border: '1px solid', borderColor: isEdit ? 'divider' : 'transparent', transition: 'border-color var(--beam-motion-move)' };
  return (
    <Paper
      aria-label={ariaLabel}
      sx={{
        ...borderSx,
        overflow: 'hidden',
        height: '100%',
        // LANE (scoped descendant styling, NOT the theme consolidation — that stays a recorded follow-up):
        // an embedded table's HEADER rows sit at the field-twin datum WITHIN a Section, so child-list
        // tables read at one density regardless of how the global theme evolves.
        '& thead .MuiTableCell-root': { height: FIELD_TWIN_HEIGHT, py: 0 },
      }}
    >
      <Box sx={{ px: 2, pt: 2, pb: toolbar ? 1 : bleed ? 1.5 : 1 }}>
        <Typography variant="subtitle2">{title}</Typography>
      </Box>
      {actions && <Box sx={{ px: 2, pb: 1 }}>{actions}</Box>}
      {/* Toolbar band — between header and body, at the field-twin datum (title → toolbar → body). Hosts
          the section's add-CTAs (canonical: the small `+` text button). Inert when absent. */}
      {toolbar && (
        <Box sx={{ px: 2, pb: 1, minHeight: FIELD_TWIN_HEIGHT, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          {toolbar}
        </Box>
      )}
      {/* Full-bleed content runs to the surface edge (tables/grids own their cell padding); padded
          content gets the surface inset. The title already paid the top inset. */}
      <Box sx={bleed ? undefined : { px: 2, pt: 0, pb: 2 }}>{children}</Box>
    </Paper>
  );
}
