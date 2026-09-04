import type { ReactNode } from 'react';

/**
 * BeamPaper — the ONE sanctioned SECTION SURFACE on detail pages. An elevated Paper carrying an
 * optional section title INSIDE it (headings never free-float above a surface) and the
 * EDITABILITY border (the shared `editabilityBorderSx`): borderless until the surface contains a
 * field, then a quiet divider frame. Because the border is per-surface and field-driven, a surface
 * whose content is view-only (e.g. a child-list summary) stays borderless even in edit mode.
 */
export interface BeamPaperProps {
  /** Section heading, rendered INSIDE the surface at the top. Omit for an untitled surface. */
  title?: string;
  /**
   * Content mode. Default (false) = padded body. `true` = FULL-BLEED: content runs to the Paper's
   * edge (grids / tables / lists own their own cell padding, so the surface must not double it).
   */
  bleed?: boolean;
  children: ReactNode;
  'aria-label'?: string;
}
