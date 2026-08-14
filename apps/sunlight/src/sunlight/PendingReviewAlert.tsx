import { useNavigate } from 'react-router-dom';
import { Button } from '@betty/beam';
import { AppAlertBar } from './AppAlertBar';
import { useCurrentUser } from './currentUser';
import { listPending, useChangeRequests } from './changeRequests';

/**
 * PendingReviewAlert — the Sunlight instance of the app-level alert bar. DERIVED, never stored
 * (approval-flow doctrine): visible iff there are pending CRs NOT submitted by the current actor
 * (the ones this reviewer can actually act on). Live via the reactive stores — a maker submits,
 * you flip Acting-as to the checker in the shell, and the bar is JUST THERE (the demo beat).
 *
 * No dismissal in v1 — this is a STANDING condition, not an event: it disappears when the queue
 * empties, not when you wave it away. Per-session dismiss is the v2 question if it ever nags.
 */
export function PendingReviewAlert() {
  const actor = useCurrentUser(); // re-render on actor switch
  useChangeRequests(); // re-render on any CR mutation (submit / approve / reject)
  const navigate = useNavigate();

  const count = listPending().filter((cr) => cr.submittedBy !== actor.name).length;
  if (count === 0) return null;

  return (
    <AppAlertBar
      severity="info"
      aria-label="Change requests awaiting your review"
      message={`${count} change request${count === 1 ? '' : 's'} await${count === 1 ? 's' : ''} your review`}
      action={
        <Button size="small" variant="outlined" onClick={() => navigate('/pending-approvals')}>
          Review
        </Button>
      }
    />
  );
}
