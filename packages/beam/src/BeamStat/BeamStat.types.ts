import type { ReactNode } from 'react';

/**
 * BeamStat — a labelled value ("nugget"): the smallest unit of entity summary, the smallest carrier
 * of the spine motif (detail-page §2), and the VIEW half of the field twin (44px floor — the same
 * geometry an outlined field wears in edit mode; FIELD_GEOMETRY in tokens.ts).
 *
 * Anatomy: left spine · key (in the `meta` voice) · value below. `severity` is the ONLY alarm
 * channel — never inferred from the value. Fill marks a family's notable state: severity
 * (WarningAmber outlined → Error filled), and the boolean value pair (CheckCircle filled / Cancel
 * outlined). There is deliberately NO positive/neutral tint channel (v2 dropped `tone`).
 */

/**
 * Marks the FIELD via the spine + a paired non-color cue (icon), per WCAG 1.4.1 — severity is never
 * colour-alone. `error` is the highest severity (filled icon); `warning` is outlined.
 */
export type BeamStatSeverity = 'warning' | 'error';

export interface BeamStatProps {
  label: string;
  /** The value slot. Text by default; a `boolean` renders the yes/no icon pair (see BeamBool). */
  value: ReactNode;
  /** Secondary line under the value, e.g. a unit or qualifier. */
  caption?: ReactNode;
  /** The alarm channel (spine token + paired icon). Absent = no alarm. */
  severity?: BeamStatSeverity;
}
