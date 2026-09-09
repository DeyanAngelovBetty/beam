import { Chip, BeamBadge } from '@betty/beam';
import type { BeamBadgeProps } from '@betty/beam';
import type { ChangeRequestStatus } from './changeRequests';

/**
 * CR-status grammar map — this surface's vocabulary → (hue, volume) (state-rendering-grammar.md).
 * `pending` is in-progress/LOUD: Pending is Sunlight's JOURNEY ANCHOR (maker-checker is the product's
 * essential workflow), pinned loud on every Sunlight surface — even here, where the whole queue is
 * pending. The accepted cost is a uniform-loud queue; it's bounded because uniform (a base tone, not
 * competing shouts) and because the budget still governs every OTHER status on this surface.
 * Decision-history: `approved` noted success, `rejected` noted danger. `canceled` (requester
 * retraction) and `outdated` (a sibling CR won) are silent — neither is the reviewer's danger.
 */
const CR_STATUS_TIER: Record<ChangeRequestStatus, BeamBadgeProps> = {
  pending: { hue: 'in-progress', volume: 'loud', label: 'Pending' },
  approved: { hue: 'success', volume: 'noted', label: 'Approved' },
  rejected: { hue: 'danger', volume: 'noted', label: 'Rejected' },
  canceled: { hue: 'neutral', label: 'Canceled' },
  outdated: { hue: 'neutral', label: 'Outdated' },
};

export function CRStatusChip({ status, size = 'small' }: { status: ChangeRequestStatus; size?: 'small' | 'medium' }) {
  return <BeamBadge {...CR_STATUS_TIER[status]} size={size} />;
}

/**
 * Operation chip — STATIC "Update". Our CR model is update-shaped only (a draft applied over a live
 * entity). Create / delete operations are a BACKEND-ALIGNMENT question (Tzeno's reference shows
 * them); we don't invent them here. See the alignment list in the task report.
 */
export function OperationChip({ size = 'small' }: { size?: 'small' | 'medium' }) {
  return <Chip label="Update" size={size} variant="outlined" />;
}
