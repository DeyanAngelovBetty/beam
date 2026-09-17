import type { ReactNode } from 'react';

/**
 * Section — the ONE sanctioned SECTION SURFACE on detail pages. An elevated Paper carrying an
 * optional section title INSIDE it (headings never free-float above a surface) and the
 * EDITABILITY border (the shared `editabilityBorderSx`): borderless until the surface contains a
 * field, then a quiet divider frame. Because the border is per-surface and field-driven, a surface
 * whose content is view-only (e.g. a child-list summary) stays borderless even in edit mode.
 */
export interface SectionProps {
  /** Section heading, rendered INSIDE the surface at the top (headings never free-float). REQUIRED,
   *  matching official Beam's `Section`. */
  title: string;
  /** Actions rendered under the title (official parity). */
  actions?: ReactNode;
  /**
   * Editability border. Official semantics by default: `true` = a `divider` frame, `false`/omitted =
   * borderless (constant 1px geometry either way; only the colour changes). Our lane behaviour — the
   * per-surface `:has(field)` auto-derivation (borderless until the surface actually contains a field) —
   * survives ONLY as the explicit opt-in `isEdit="auto"`; it is no longer the silent default. So with
   * official's subset of props, our Section behaves exactly like official's.
   */
  isEdit?: boolean | 'auto';
  /**
   * Content mode. Default (false) = padded body. `true` = FULL-BLEED: content runs to the Paper's
   * edge (grids / tables / lists own their own cell padding, so the surface must not double it).
   */
  bleed?: boolean;
  children: ReactNode;
  'aria-label'?: string;
}
