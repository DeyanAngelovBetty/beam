import type { ReactNode } from 'react';

/**
 * BeamPageHeader — page title, optional description, optional action slot,
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
  /** Right-aligned controls — primary action, overflow menu */
  actions?: ReactNode;
  /** Entity summary, typically a row of BeamStat */
  summary?: ReactNode;
}
