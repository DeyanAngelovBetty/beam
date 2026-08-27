import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button } from '@betty/beam';
import { AppAlertBar } from './AppAlertBar';
import { useCurrentUser } from './currentUser';
import { unseenPendingForChecker, unseenOutcomesForRequester, markSeen, useChangeRequests } from './changeRequests';

/**
 * PendingReviewAlert — the Sunlight instance of the app-level alert bar. DERIVED, never stored
 * (approval-grammar §5): the bar renders the actor's UNSEEN items, in one of two voices:
 *   - CHECKER: unseen pending CRs NOT authored by you (work you can act on).
 *   - MAKER: your own CRs with unseen terminal outcomes (rejected / outdated), aggregated.
 * The actionable review voice wins when both apply (a person who both reviews and submits sees the
 * do-something-now item first; the informational outcome surfaces once the queue is clear).
 *
 * DISMISSAL (§5, supersedes the 2026-08-14 no-dismissal ruling): the ✕ and *viewing* are the SAME
 * transition — both call markSeen on the shown items. "Seen" is the only flag, so the bar is still
 * fully derived: it reappears only when genuinely NEW unseen items exist (a new CR, a new outcome),
 * never re-nagging about seen ones. No arbitrary per-session dismiss state.
 *
 * SHOW/HIDE is a first-class transition owned HERE (the shell can't observe whether an app slot
 * renders anything). The grid `0fr ↔ 1fr` auto-height animates the bar in/out on the move var; the
 * inner min-height:0/overflow:hidden clips during the slide. Because the bar is the shell's in-flow
 * first row, that one height change slides the WHOLE app down/up as a block. Reduced-motion → instant.
 * The last view-model is retained through the collapse (`shown`) so the exit reads as the bar sliding
 * away with its message intact, not the text popping a frame early.
 */

type BarVoice = {
  severity: 'info' | 'warning';
  message: string;
  ids: string[]; // the CRs this message covers — dismissal/viewing marks exactly these seen
  actionLabel: string;
  to: string;
  ariaLabel: string;
};

export function PendingReviewAlert() {
  const actor = useCurrentUser(); // re-render on actor switch
  useChangeRequests(); // re-render on any CR mutation (submit / approve / reject / cancel / markSeen)
  const navigate = useNavigate();

  const review = unseenPendingForChecker(actor.name);
  const outcomes = unseenOutcomesForRequester(actor.name);

  let voice: BarVoice | null = null;
  if (review.length > 0) {
    // Checker voice — actionable, so it wins over the maker's informational outcome.
    voice = {
      severity: 'info',
      message: `${review.length} change request${review.length === 1 ? '' : 's'} ${
        review.length === 1 ? 'awaits' : 'await'
      } your review`,
      ids: review.map((cr) => cr.id),
      actionLabel: 'Review',
      to: '/pending-approvals',
      ariaLabel: 'Change requests awaiting your review',
    };
  } else if (outcomes.length > 0) {
    // Maker voice — your own CRs that reached a terminal outcome you haven't seen. Aggregated when
    // several ("2 rejected · 1 outdated"); a single one names the record.
    const rejected = outcomes.filter((cr) => cr.status === 'rejected');
    const outdated = outcomes.filter((cr) => cr.status === 'outdated');
    let message: string;
    if (outcomes.length === 1) {
      const cr = outcomes[0];
      message =
        cr.status === 'rejected'
          ? `Your change request on ${cr.entityName} was rejected`
          : `Your change request on ${cr.entityName} became outdated`;
    } else {
      const parts: string[] = [];
      if (rejected.length) parts.push(`${rejected.length} rejected`);
      if (outdated.length) parts.push(`${outdated.length} outdated`);
      message = `Your change requests: ${parts.join(' · ')}`;
    }
    voice = {
      // Outcomes are NEWS, not alarms — severity is the alarm channel, so info (not warning). Also
      // sidesteps the flagged light-scheme warning-fill contrast gap until the palette-seed fix.
      severity: 'info',
      message,
      ids: outcomes.map((cr) => cr.id),
      actionLabel: 'View',
      to: `/pending-approvals?by=${encodeURIComponent(actor.name)}`,
      ariaLabel: 'Outcomes of your change requests',
    };
  }

  const open = voice !== null;
  // Keep the last non-empty voice on screen while the bar collapses shut. Depend on a stable
  // signature (not the object) so the effect doesn't loop on each render.
  const sig = voice ? `${voice.severity}|${voice.message}|${voice.ids.join(',')}` : '';
  const [shown, setShown] = useState<BarVoice | null>(voice);
  useEffect(() => {
    if (voice) setShown(voice);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  const markShownSeen = () => {
    if (shown) markSeen(shown.ids, actor.name);
  };

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
        {shown && (
          <AppAlertBar
            severity={shown.severity}
            aria-label={shown.ariaLabel}
            message={shown.message}
            // Dismiss and view are the SAME transition — both mark the shown items seen.
            onDismiss={markShownSeen}
            action={
              <Button
                size="small"
                variant="outlined"
                tabIndex={open ? 0 : -1}
                onClick={() => {
                  markShownSeen();
                  navigate(shown.to);
                }}
              >
                {shown.actionLabel}
              </Button>
            }
          />
        )}
      </Box>
    </Box>
  );
}
