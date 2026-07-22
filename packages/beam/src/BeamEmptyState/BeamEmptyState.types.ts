import type { ReactNode } from 'react';

/**
 * BeamEmptyState — the centered "nothing here (yet)" surface: an icon, a
 * title, optional supporting copy, and an optional action.
 *
 * Used for not-built-yet screens (nav placeholders) and genuinely empty
 * lists alike. One component so "empty" reads the same everywhere.
 *
 * ⚠️ PLACEHOLDER (2026-07-22) pending the Figma pass. The props are the
 * durable part; the arrangement is not.
 */

export interface BeamEmptyStateProps {
  title: string;
  description?: ReactNode;
  /** Leading glyph, e.g. a muted MUI icon. */
  icon?: ReactNode;
  /** Optional call to action beneath the copy. */
  action?: ReactNode;
}
