import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { editabilityBorderSx, FIELD_TWIN_HEIGHT, FIELD_GEOMETRY } from '../theme/tokens';
import type { SectionProps } from './Section.types';

/**
 * Section — see Section.types. The sanctioned section surface: elevated Paper + the shared
 * EDITABILITY border (borderless until it contains a field), an in-surface title, an optional lane
 * `toolbar` band (title → toolbar → body), and a padded or full-bleed body. Reuses
 * `editabilityBorderSx` — the SAME mechanism DetailsPanel uses, not a parallel one.
 */

// The EMBEDDED-TABLE CONTRACT for a bleed Section — scoped descendant styling (same mechanism as the
// 44px header enforcement; NOT the global theme density consolidation, which stays a recorded follow-up).
// Child combinators target ONLY the section's OWN direct-child table, so nested tables (a Collapse's
// sub-table) are untouched; a `.beam-detail-row` opts a row out (e.g. the expansion row itself).
//
// 1. BLEED — the table runs to the Section's edges (dividers, the header underline, and row hover span
//    full width because the table is full-width). First/last cell inline padding = the Section pad (2), so
//    text stays on the inset; inner cells get a modest gutter.
// 2. HEADER IN BOTH MODES — header cells are pinned at the field-twin datum and carry vertical column
//    separators; the page keeps the <thead> in edit as well as view.
// 3. TWIN INVARIANT — view AND edit body rows carry the field-twin height, so toggling view↔edit shifts
//    nothing below the toolbar. Derived from FIELD_GEOMETRY — no magic number.
// 4. UNLABELED INPUTS — inputs in twin rows are plain compact outlined fields (padding from
//    FIELD_GEOMETRY.paddingY), vertically centered; the column header is their label (aria-labelledby is
//    wired on the page). No per-cell notched labels in columnar field contexts.
const T = '& > .beam-section-bleed > table';
const twinRow = `${T} > tbody > tr:not(.beam-detail-row) > .MuiTableCell-root`;
const embeddedTableContractSx = {
  [T]: { width: '100%' },
  // Header row (both modes).
  [`${T} > thead > tr > .MuiTableCell-root`]: { height: FIELD_TWIN_HEIGHT, py: 0, px: 1 },
  [`${T} > thead > tr > .MuiTableCell-root:first-of-type`]: { pl: 2 },
  [`${T} > thead > tr > .MuiTableCell-root:last-of-type`]: { pr: 2 },
  [`${T} > thead > tr > .MuiTableCell-root:not(:last-of-type)`]: { borderRight: '1px solid', borderRightColor: 'divider' },
  // Twin body rows (view == edit height).
  [twinRow]: { height: FIELD_TWIN_HEIGHT, verticalAlign: 'middle', px: 1 },
  [`${twinRow}:first-of-type`]: { pl: 2 },
  [`${twinRow}:last-of-type`]: { pr: 2 },
  // Compact, vertically-centered inputs (unlabeled — header is the label).
  [`${twinRow} .MuiOutlinedInput-input`]: {
    paddingTop: `${FIELD_GEOMETRY.paddingY}px`,
    paddingBottom: `${FIELD_GEOMETRY.paddingY}px`,
  },
};

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
        ...embeddedTableContractSx,
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
      {/* Full-bleed content runs to the surface edge (a direct-child table gets the embedded-table
          contract above); padded content gets the surface inset. The title already paid the top inset. */}
      <Box className={bleed ? 'beam-section-bleed' : undefined} sx={bleed ? undefined : { px: 2, pt: 0, pb: 2 }}>
        {children}
      </Box>
    </Paper>
  );
}
