import type { ReactNode } from 'react';

/**
 * BeamStat — a labelled value ("nugget"): the smallest unit of entity
 * summary, and the smallest carrier of the spine motif (detail-page §2).
 *
 * Anatomy: left spine · key (in the `meta` voice) · value below. The spine
 * bridges view ↔ edit — a stat and an input share a skeleton.
 */

/** Tints the VALUE. Semantic, never a raw color. */
export type BeamStatTone = 'default' | 'success' | 'warning' | 'error' | 'info';

/**
 * Marks the FIELD via the spine + a paired non-color cue (icon), per
 * WCAG 1.4.1 — severity is never colour-alone.
 */
export type BeamStatSeverity = 'warning' | 'danger';

export interface BeamStatProps {
  label: string;
  value: ReactNode;
  /** Secondary line under the value, e.g. a unit or qualifier */
  caption?: ReactNode;
  /** Tints the value. */
  tone?: BeamStatTone;
  /** Switches the spine token and shows a severity icon by the key. */
  severity?: BeamStatSeverity;
}
