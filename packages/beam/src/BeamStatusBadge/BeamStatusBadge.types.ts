/**
 * BeamStatusBadge — the shared status grammar (Beam doc: "shared status
 * badge grammar across Sunlight and Midnight").
 *
 * Statuses are SEMANTIC, not colors: components reference intent, the
 * theme decides rendering per mode. Extend the union deliberately —
 * every new status is a vocabulary decision, not a one-off color.
 */

export type BeamStatus =
  | 'active'
  | 'scheduled'
  | 'draft'
  | 'paused'
  | 'expired'
  | 'error';

export interface BeamStatusBadgeProps {
  status: BeamStatus;
  /** Override the default label (e.g. localized copy). Defaults to the status name. */
  label?: string;
  size?: 'small' | 'medium';
}
