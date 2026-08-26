import type { ReactNode } from 'react';

/**
 * BeamPageHeader — a breadcrumb back link, page title, one sub-title slot, and a right-aligned
 * primary action (with optional secondary actions to its left).
 *
 * Layout is the ratified Figma pass (Beam MUI v9 → PageHeader, node 12745:68663): three fixed rows —
 * breadcrumb 26px (ALWAYS reserved, back hidden when absent → constant title Y), title 41px (title |
 * actions, actions pinned to the title line), sub-title 24px (rendered only when present). The title
 * treatment (gradient / halo / underline) is ratified as-is.
 */

/**
 * The back link — header anatomy (detail-grammar §4), owned by the organism,
 * never hand-rolled. Beam stays router-agnostic: pass `href` for real anchor
 * semantics (middle-click, new-tab, copy-address) and/or `onClick` for SPA
 * interception. The organism intercepts only a plain left-click, letting
 * modified/middle clicks reach the browser. `onClick` with no `href` (a
 * screen-state callback, no URL) renders an accessible button instead.
 */
export interface BeamBackLink {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface BeamPageHeaderProps {
  title: string;
  /** Back link, rendered as the breadcrumb row above the title (§4). */
  back?: BeamBackLink;
  /**
   * The ONE sub-title slot (24px row, not reserved): text, a Chip, or a composed row. The row
   * carries the description voice (body2/secondary), so text inherits it and chips render as-is.
   */
  subtitle?: ReactNode;
  /** @deprecated Use `subtitle`. Renders into the sub-title row (status then description, inline). */
  status?: ReactNode;
  /** @deprecated Use `subtitle`. Renders into the sub-title row. */
  description?: ReactNode;
  /** The primary action, right-aligned — e.g. a contained "+ Add" button. */
  action?: ReactNode;
  /** Secondary actions, rendered to the left of the primary action. */
  secondaryActions?: ReactNode;
  /** @deprecated The outlined-Paper strip violates the container ruling — move stats to a
   *  `DetailsPanel` below the header. Kept working this release. */
  summary?: ReactNode;
}
