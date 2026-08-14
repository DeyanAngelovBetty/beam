import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button } from '@betty/beam';
import { AppAlertBar } from './AppAlertBar';
import { useCurrentUser } from './currentUser';
import { listPending, useChangeRequests } from './changeRequests';

/**
 * PendingReviewAlert — the Sunlight instance of the app-level alert bar. DERIVED, never stored
 * (approval-flow doctrine): visible iff there are pending CRs NOT submitted by the current actor
 * (the ones this reviewer can actually act on). Live via the reactive stores — a maker submits,
 * you flip Acting-as to the checker in the shell, and the bar slides in (the demo beat).
 *
 * SHOW/HIDE is a first-class transition, and it lives HERE because this is the only place that
 * knows the bar's presence (the shell can't tell whether an app-provided slot renders anything).
 * The grid `0fr ↔ 1fr` auto-height trick animates the bar's height on the move var; the inner
 * min-height:0/overflow:hidden clips the content during the slide. Because the bar is the shell's
 * in-flow first row, that single height change slides the WHOLE app (appFrame) down/up as one
 * block — no per-element rail animation. Reduced-motion zeroes the var → instant.
 *
 * The last positive count is retained through the collapse (`shown`) so the exit reads as the bar
 * sliding away with its message intact, not the text popping out a frame early.
 *
 * No dismissal in v1 — this is a STANDING condition, not an event: it disappears when the queue
 * empties, not when you wave it away. Per-session dismiss is the v2 question if it ever nags.
 */
export function PendingReviewAlert() {
  const actor = useCurrentUser(); // re-render on actor switch
  useChangeRequests(); // re-render on any CR mutation (submit / approve / reject)
  const navigate = useNavigate();

  const count = listPending().filter((cr) => cr.submittedBy !== actor.name).length;
  const open = count > 0;

  // Keep the last non-empty count on screen while the bar collapses shut.
  const [shown, setShown] = useState(count);
  useEffect(() => {
    if (count > 0) setShown(count);
  }, [count]);

  return (
    <Box
      aria-hidden={!open}
      sx={{
        display: 'grid',
        gridTemplateRows: open ? '1fr' : '0fr',
        transition: 'grid-template-rows var(--beam-motion-move-duration, 300ms) var(--beam-motion-move-easing, ease)',
      }}
    >
      <Box sx={{ minHeight: 0, overflow: 'hidden' }}>
        <AppAlertBar
          severity="info"
          aria-label="Change requests awaiting your review"
          message={`${shown} change request${shown === 1 ? '' : 's'} await${shown === 1 ? 's' : ''} your review`}
          action={
            <Button size="small" variant="outlined" tabIndex={open ? 0 : -1} onClick={() => navigate('/pending-approvals')}>
              Review
            </Button>
          }
        />
      </Box>
    </Box>
  );
}
