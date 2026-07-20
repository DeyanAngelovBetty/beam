import type { ReactNode } from 'react';

/**
 * BeamStat — a labelled value ("nugget"): the smallest unit of entity
 * summary, used in headers, cards, and detail panels.
 *
 * ⚠️ PLACEHOLDER (2026-07-20). Deliberately minimal: the real design pass
 * happens in Figma. This exists so screens can be built against a stable
 * name and shape now, and so the eventual design has one place to land
 * rather than a dozen inline label/value pairs to hunt down.
 */

/** Semantic emphasis — never a color. The theme decides rendering. */
export type BeamStatTone = 'default' | 'success' | 'warning' | 'error' | 'info';

export interface BeamStatProps {
  label: string;
  value: ReactNode;
  /** Secondary line under the value, e.g. a unit or qualifier */
  caption?: ReactNode;
  tone?: BeamStatTone;
}
