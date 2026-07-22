import type { ReactNode } from 'react';

/**
 * BeamPageHeader — page title, optional description, a right-aligned
 * primary action (with optional secondary actions to its left), and an
 * optional entity-summary strip.
 *
 * Promoted on usage, not prediction: Sunlight's Loyalty Status and Gaspar's
 * Transactions had already duplicated the same title-plus-tabs opening
 * (BEAM.md §2).
 *
 * ⚠️ Layout is PLACEHOLDER (2026-07-20) pending the Figma pass. The props
 * are the durable part; the arrangement is not.
 */

export interface BeamPageHeaderProps {
  title: string;
  description?: ReactNode;
  /** The primary action, right-aligned — e.g. a contained "+ Add" button. */
  action?: ReactNode;
  /** Secondary actions, rendered to the left of the primary action. */
  secondaryActions?: ReactNode;
  /** Entity summary, typically a row of BeamStat */
  summary?: ReactNode;
}
