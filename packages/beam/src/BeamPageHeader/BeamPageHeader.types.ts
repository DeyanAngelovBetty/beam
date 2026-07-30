import type { ReactNode } from 'react';

/**
 * BeamPageHeader — an optional back link (breadcrumb row), page title, optional
 * description, a right-aligned primary action (with optional secondary actions
 * to its left), and an optional entity-summary strip.
 *
 * Promoted on usage, not prediction: Sunlight's Loyalty Status and Gaspar's
 * Transactions had already duplicated the same title-plus-tabs opening
 * (BEAM.md §2).
 *
 * ⚠️ Layout is PLACEHOLDER (2026-07-20) pending the Figma pass. The props
 * are the durable part; the arrangement is not.
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
  description?: ReactNode;
  /** The primary action, right-aligned — e.g. a contained "+ Add" button. */
  action?: ReactNode;
  /** Secondary actions, rendered to the left of the primary action. */
  secondaryActions?: ReactNode;
  /** Entity summary, typically a row of BeamStat */
  summary?: ReactNode;
}
