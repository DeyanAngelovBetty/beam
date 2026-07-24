/**
 * Category-rule text styles — the code twin of Figma TEXT STYLES.
 * One definition, several bindings (BEAM.md §1, category-rule lane).
 */

/**
 * `meta` — one caps voice for KEYS everywhere: datagrid headers, BeamStat
 * keys, form-field labels (InputLabel), permission-box headers, page-section
 * headers. Keys only — never values, never helper text.
 *
 * Bindings: theme `components` overrides (MuiTableCell.head, MuiInputLabel,
 * MuiTablePagination labels) + organisms spreading this object into `sx`.
 * Supersedes the table-local `tableMetaText`.
 *
 * ⚠️ a11y watch item (accepted deliberately, 2026-07-24): 300-weight at 12px
 * caps on dark surfaces sits at the legibility floor. It reads right on the
 * canvas; if it goes wispy on real back-office monitors, **weight is the one
 * knob** — bump 300 → 400 here and every binding follows (detail-page §3).
 * fontFamily is intentionally omitted so it inherits the brand typeface.
 */
export const meta = {
  textTransform: 'uppercase',
  fontSize: '0.75rem', // 12px
  lineHeight: '12px', // 12 / 12
  fontWeight: 300,
  letterSpacing: '0.07em', // 7%
  color: 'var(--mui-palette-text-secondary)',
} as const;
