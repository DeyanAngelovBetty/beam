import type { ReactNode } from 'react';

/**
 * DetailsPanel — the estate's first content region below the page header (detail-page-grammar,
 * "the details panel"). An UNLABELED boxed field panel: it holds the field twins — `BeamStat` in
 * view, `BeamField`/`BeamSwitchField` in edit — morphing in place per the field-twins rule.
 *
 * NO title, NO heading slot: its POSITION is the convention (one title per page — the page title is
 * the title). It does NOT own mode (the page owns view/edit) and has NO buttons (Edit/Save/Cancel
 * stay in `BeamPageHeader`). It renders what it's given.
 *
 * Figma: Beam MUI v9 → node 12743:68281. Deyan's ratified panel: elevated Paper (no border), 24px
 * padding-block · 2-spacing padding-inline (the spacing var, so the text column lands on the datagrid
 * cell-text scan line and rides ThemeLab), 24px gutters, items TOP-aligned, rows sized by their
 * tallest member, booleans inline as peers.
 */
export interface DetailsPanelProps {
  /** The field twins (view: BeamStat · edit: BeamField/BeamSwitchField). Mixed modes are normal. */
  children: ReactNode;
  /**
   * Columns auto-fill at ≥ this width, reflowing responsively. A WIDE item (e.g. a multiline
   * description) spans by wrapping it: `<Box sx={{ gridColumn: '1 / -1' }}>…</Box>` (full row) or
   * `'span 2'` (two columns) — the documented spanning convention (BeamStat takes no `sx`; BeamField
   * forwards it, but wrap either for consistency).
   */
  minColumnWidth?: number;
  'aria-label'?: string;
}
