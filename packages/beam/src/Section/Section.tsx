import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { editabilityBorderSx, FIELD_TWIN_HEIGHT, TWIN_ROW_HEIGHT } from '../theme/tokens';
import type { SectionProps } from './Section.types';

/**
 * Section — see Section.types. The sanctioned section surface: elevated Paper + the shared
 * EDITABILITY border (borderless until it contains a field), an in-surface title, an optional lane
 * `toolbar` band (title → toolbar → body), and a padded or full-bleed body. Reuses
 * `editabilityBorderSx` — the SAME mechanism DetailsPanel uses, not a parallel one.
 */

// The EMBEDDED-TABLE CONTRACT for a bleed Section — scoped descendant styling (same mechanism as the
// 44px header enforcement; NOT the global theme density consolidation, which stays a recorded follow-up —
// this contract makes its future shape clearer: TWO constants, TWO contexts). Child combinators target
// ONLY the section's OWN direct-child table (bleed is a FIRST-LEVEL privilege), so nested tables (a
// Collapse's sub-table) are untouched; a `.beam-detail-row` opts a row out (e.g. the expansion row itself).
//
// 1. BLEED — the table runs to the Section's edges (dividers, the header underline, and row hover span
//    full width because the table is full-width). First/last cell inline padding = the Section pad (2), so
//    text stays on the inset; inner cells get a modest gutter.
// 2. HEADER IN BOTH MODES — header cells stay at the field-twin datum (44, a chrome band, not content) and
//    carry vertical column separators; the page keeps the <thead> in edit as well as view.
// 3. TWO-TIER ROW HEIGHT (the twin invariant, recomputed) —
//    • Density rows (a plain, never-editable embedded datagrid, e.g. Winners): FIELD_TWIN_HEIGHT (44);
//      content may stretch.
//    • Twin rows (`.beam-twin-table` — rows that swap to fields in edit, e.g. Rewards Strategy): the
//      composed TWIN_ROW_HEIGHT (57) in BOTH modes, so a FULL-height field twin fits and view↔edit reflows
//      nothing below the toolbar.
// 4. FULL-HEIGHT INPUTS — inputs in twin rows render at the full field height (matching DetailsPanel), no
//    compact/squished variant. They are UNLABELED (the column header is the label, wired via
//    aria-labelledby on the page); alignment is the page's (twin/field-list tables left-align — BEAM.md §6).
// 5. NESTED CONTAINMENT — a table inside an expansion row (`.beam-detail-row` content) is NOT first-level,
//    so it does not bleed: it reads as a bordered, rounded, inset card within its parent region.
// 6. HEADER has NO vertical column separators (v2.1) — the estate convention is Gaspar transactions: no
//    static TH separators; edge separators are only the horizontal-scroll overflow affordance (Table's
//    own `data-overflow-*` mechanism, untouched). The Figma TH's border-right is a component artifact.
// 7. ROW BOTTOM BORDERS (v2.1) — a bottom border exists ONLY when something renders below it inside the
//    table. Non-last rows keep it; the last rendered row drops it (the Section edge closes the table); an
//    expandable row's border follows its expansion (gone while collapsed, restored while expanded).
const T = '& > .beam-section-bleed > table';
const bodyCell = `${T} > tbody > tr:not(.beam-detail-row) > .MuiTableCell-root`;
const embeddedTableContractSx = {
  [T]: { width: '100%' },
  // Header row (both modes) — chrome band at 44. No vertical column separators (rule 6).
  [`${T} > thead > tr > .MuiTableCell-root`]: { height: FIELD_TWIN_HEIGHT, py: 0, px: 1 },
  [`${T} > thead > tr > .MuiTableCell-root:first-of-type`]: { pl: 2 },
  [`${T} > thead > tr > .MuiTableCell-root:last-of-type`]: { pr: 2 },
  // Density body rows (default) — 44; content may stretch.
  [bodyCell]: { height: FIELD_TWIN_HEIGHT, verticalAlign: 'middle', px: 1 },
  [`${bodyCell}:first-of-type`]: { pl: 2 },
  [`${bodyCell}:last-of-type`]: { pr: 2 },
  // Twin body rows — 57 both modes (the extra `.beam-twin-table` specificity wins over the density rule).
  [`${T}.beam-twin-table > tbody > tr:not(.beam-detail-row) > .MuiTableCell-root`]: { height: TWIN_ROW_HEIGHT },
  // Nested containment — an expansion row's own table is a contained card (bordered, rounded, inset),
  // never bleeding. Depth-scoped: it lives BELOW `.beam-detail-row`, so no child combinator reaches it.
  '& .beam-detail-row table': {
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: '8px',
    borderCollapse: 'separate',
    borderSpacing: 0,
    overflow: 'hidden',
    my: 0.5,
  },
  // Row bottom borders (rule 7) — "a border only when something renders below it inside the table":
  //  • Last rendered row (a plain table's last row, or an expandable table's last detail row — collapsed
  //    or expanded): the Section edge closes it → no border.
  [`${T} > tbody > tr:last-child > .MuiTableCell-root`]: { borderBottom: 0 },
  //  • Last main row whose expansion is COLLAPSED (nothing below it either): no border.
  [`${T} > tbody > tr:has(+ .beam-detail-row:last-child:not([data-expanded])) > .MuiTableCell-root`]: { borderBottom: 0 },
  //  • Expansion rows: none by default (collapsed = nothing below) …
  [`${T} > tbody > .beam-detail-row > .MuiTableCell-root`]: { borderBottom: 0 },
  //    … restored only while EXPANDED and a sibling row still follows (separates it from the next row).
  [`${T} > tbody > .beam-detail-row[data-expanded]:not(:last-child) > .MuiTableCell-root`]: {
    borderBottom: '1px solid',
    borderBottomColor: 'divider',
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
        {/* Section title = `subtitle1` (16px/600 via the theme scale — a step above the 16/regular
            BeamStat values; v2.2). A deliberate visual delta on a shared organism, flagged for upstream. */}
        <Typography variant="subtitle1">{title}</Typography>
      </Box>
      {actions && <Box sx={{ px: 2, pb: 1 }}>{actions}</Box>}
      {/* Toolbar band — between header and body, at the field-twin datum (title → toolbar → body). Hosts
          the section's add-CTAs (canonical: the small `+` text button). Inert when absent.
          NEW PATTERN — the TOOLBAR STATS LANE (Payout Sectors, 2026-09-25): a toolbar may split into
          ACTIONS (left) + derived STATS (right) — pass a flex row that justifies space-between, actions
          leading, `BeamStat`s (meta scale) trailing. The stats are the table's live derived readouts (e.g.
          TOTAL PROBABILITY / REMAINING); a validation stat (REMAINING ≠ 0 → danger) reads here while the
          Save gate stays the form's own (the stat surfaces the gate, it does not add one). View mode drops
          the edit-only actions + edit-only stats (e.g. shows TOTAL only). */}
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
