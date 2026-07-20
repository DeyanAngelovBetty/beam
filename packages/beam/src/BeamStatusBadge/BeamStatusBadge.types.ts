/**
 * BeamStatusBadge — the shared status grammar (Beam doc: "shared status
 * badge grammar across Sunlight and Midnight").
 *
 * Statuses are SEMANTIC, not colors: components reference intent, the
 * theme decides rendering per mode. Extend the union deliberately —
 * every new status is a vocabulary decision, not a one-off color.
 */

export type BeamStatus =
  // Lifecycle — configuration objects (promotions, campaigns, paytables)
  | 'active'
  | 'scheduled'
  | 'draft'
  | 'paused'
  | 'expired'
  | 'error'
  // Settlement — money movement (Gaspar transactions, Midnight payments).
  // Added 2026-07-20 as a deliberate vocabulary decision when Gaspar's
  // transactions table needed words the lifecycle set could not express:
  // 'active' is not 'settled', and a chargeback is not an 'error'.
  // 'error' already covers a failed payment, so it is not duplicated here.
  | 'settled'
  | 'pending'
  | 'refunded'
  | 'chargeback';

export interface BeamStatusBadgeProps {
  status: BeamStatus;
  /** Override the default label (e.g. localized copy). Defaults to the status name. */
  label?: string;
  size?: 'small' | 'medium';
}
