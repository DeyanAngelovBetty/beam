import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Stack, Box, Typography, Alert, Button, BeamPageHeader, BeamEmptyState, DetailsPanel, BeamStat, BeamField } from '@betty/beam';
import { backTo } from './backTo';
import { getChangeRequest, approve, reject, cancel, pendingOnRecord, markSeen, useChangeRequests } from './changeRequests';
import { useCurrentUser } from './currentUser';
import { ENTITY_LABEL, shortCrId, reasonMessage, crActionsFor, ENTITY_TYPE_PARAM } from './changeRequestShared';
import { CRStatusChip, OperationChip } from './changeRequestChips';
import { ConfigDiffPanel } from './ConfigDiffPanel';
import { ConfirmDialog } from './ConfirmDialog';

type Notice = { severity: 'success' | 'info' | 'warning' | 'error'; msg: string } | null;

/**
 * PendingApprovalDetailPage — /pending-approvals/:id. A change request is a RECORD, so the estate's
 * view-first rule applies: this is a read-only record page. Its actions follow the ACTOR'S
 * RELATIONSHIP to the CR (crActionsFor — the vocabulary ruling), not a fixed reviewer toolbar:
 * the requester viewing their own pending CR gets [Cancel] (there is NO greyed-out Approve/Reject
 * — the page offers what the actor can do); anyone else gets [Reject] [Approve]. Archived CRs
 * (approved/rejected/canceled/outdated) render the same page read-only with no actions.
 *
 * VIEWING = SEEN (grammar §5): landing here marks THIS CR seen for the actor — the same transition
 * as dismissing the app bar. A checker opening a pending clears it from their review bar; a requester
 * opening a rejected/outdated outcome clears it from their outcome bar.
 *
 * The checker's DECISION NOTE (§4) is a FIELD-TWIN: the full-width first row of the request
 * DetailsPanel (mirroring the maker's "Change description" in the editor), actor- and state-relative
 * — an editable field while the CR is decidable by this actor, a stat once decided (or on your own
 * CR, where you get no decision voice). Constant geometry: the row is present in all three states,
 * field⇄stat swapping in place. Approve/Reject read its value. Reactive on the actor + store, so
 * switching Acting-as re-derives both the action set and the twin.
 */
export function PendingApprovalDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  useChangeRequests(); // re-render on any CR mutation
  const me = useCurrentUser().name; // reactive: tracks the shell's Acting-as switch
  const [notice, setNotice] = useState<Notice>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [decisionReason, setDecisionReason] = useState(''); // checker's optional note (§4)
  const cr = id ? getChangeRequest(id) : undefined;

  // Viewing marks this CR seen for the actor (same transition as bar dismissal). Keyed on the actor
  // too, so switching Acting-as while here marks it seen for the new actor.
  useEffect(() => {
    if (cr) markSeen([cr.id], me);
  }, [cr?.id, me]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!cr) {
    return (
      <Stack spacing={3}>
        <BeamPageHeader title={`Approval ${id ?? ''}`} back={backTo(navigate, '/pending-approvals', 'Configuration Approvals')} />
        <BeamEmptyState title={`No change request with id ${id}`} description="It may have been cleared." />
      </Stack>
    );
  }

  const actions = crActionsFor(cr, me);
  const isChecker = actions.includes('approve'); // eligible reviewer (pending + not the submitter)
  const isPending = cr.status === 'pending';
  const note = decisionReason.trim() || undefined;
  const siblings = pendingOnRecord(cr.entityId).filter((r) => r.id !== cr.id).length;

  const onApprove = () => {
    const res = approve(cr.id, me, note);
    if (res.ok) return navigate('/pending-approvals');
    setNotice({ severity: res.reason === 'conflict' ? 'warning' : 'error', msg: reasonMessage(res.reason, cr) });
  };
  const onReject = () => {
    const res = reject(cr.id, me, note);
    if (res.ok) return navigate('/pending-approvals');
    setNotice({ severity: 'error', msg: reasonMessage(res.reason, cr) });
  };
  const doCancel = () => {
    const res = cancel(cr.id, me);
    setConfirmOpen(false);
    if (res.ok) return navigate('/pending-approvals');
    setNotice({ severity: 'error', msg: 'This request can no longer be canceled.' });
  };

  return (
    <Stack spacing={3}>
      <BeamPageHeader
        title={`${cr.entityName} approval #${shortCrId(cr.id)}`}
        back={backTo(navigate, '/pending-approvals', 'Configuration Approvals')}
        subtitle={
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <CRStatusChip status={cr.status} />
            <OperationChip />
          </Stack>
        }
        // Actor-relative: requester → [Cancel]; approver → [Reject] [Approve]; archived → none.
        action={
          actions.includes('cancel') ? (
            <Button variant="outlined" color="inherit" onClick={() => setConfirmOpen(true)}>
              Cancel request
            </Button>
          ) : isChecker ? (
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Button variant="outlined" color="error" onClick={onReject}>
                Reject
              </Button>
              <Button variant="contained" onClick={onApprove}>
                Approve
              </Button>
            </Stack>
          ) : undefined
        }
      />

      {notice && (
        <Alert severity={notice.severity} onClose={() => setNotice(null)}>
          {notice.msg}
        </Alert>
      )}

      {/* Outdated CRs (grammar §5): an explicit banner; the diff below is a historical record, not an
          actionable comparison (a sibling CR was approved, so this one's base no longer holds). */}
      {cr.status === 'outdated' && (
        <Alert severity="warning" role="status">
          This request became outdated — another change on this record was approved, so its base no
          longer holds. Shown for history; it can't be approved.
        </Alert>
      )}

      {/* Sibling awareness at decision time (grammar §5) — only while this CR is still pending. The
          link is TYPE-filtered (no record-filter links anywhere user-facing, 2026-08-28); the count
          itself is the record-specific signal. */}
      {cr.status === 'pending' && siblings > 0 && (
        <Alert
          severity="info"
          action={
            <Button size="small" variant="text" onClick={() => navigate(`/pending-approvals?type=${ENTITY_TYPE_PARAM[cr.entityType]}`)}>
              View change requests
            </Button>
          }
        >
          {siblings} other pending request{siblings === 1 ? '' : 's'} on this record.
        </Alert>
      )}

      {/* The request DetailsPanel (grammar §2). Status + Operation are NOT repeated — they live once
          in the header identity zone. First row (full-width, gridColumn convention) is the DECISION
          NOTE field-twin: editable while this actor can decide, a stat otherwise — the twins rule
          holding constant geometry as you switch actors. The rest is attribution + timestamps as
          stats (the note joins Reviewed by / Reviewed at as the review record once decided). */}
      <DetailsPanel aria-label="Request details">
        {isPending && isChecker ? (
          <BeamField
            sx={{ gridColumn: '1 / -1' }}
            label="Decision note"
            placeholder="Optional — recorded on the request and shown to the maker."
            multiline
            minRows={2}
            value={decisionReason}
            onChange={(e) => setDecisionReason(e.target.value)}
          />
        ) : (
          // Own pending → no decision voice on your own CR ("—", matching the action-set rule);
          // terminal → the recorded note (or "—"), joining the review record.
          <Box sx={{ gridColumn: '1 / -1' }}>
            <BeamStat label="Decision note" value={isPending ? '—' : cr.decisionReason || '—'} />
          </Box>
        )}
        <BeamStat label="ID" value={shortCrId(cr.id)} />
        <BeamStat label="Entity" value={cr.entityName} />
        <BeamStat label="Type" value={ENTITY_LABEL[cr.entityType]} />
        <BeamStat label="Submitted by" value={cr.submittedBy} />
        <BeamStat label="Submitted at" value={cr.submittedAt.slice(0, 10)} />
        <BeamStat label="Reviewed by" value={cr.reviewedBy ?? '—'} />
        <BeamStat label="Reviewed at" value={cr.reviewedAt ? cr.reviewedAt.slice(0, 10) : '—'} />
        {cr.status === 'canceled' && <BeamStat label="Canceled at" value={(cr.canceledAt ?? '').slice(0, 10)} />}
        {cr.status === 'outdated' && <BeamStat label="Outdated at" value={(cr.outdatedAt ?? '').slice(0, 10)} />}
      </DetailsPanel>

      <Stack spacing={1}>
        <Typography variant="subtitle2" color="text.secondary">
          Review changes
        </Typography>
        {/* The diff shows this CR's FROZEN before-state vs its proposal — historically stable for
            archived records. No snapshot → the panel falls back to proposed-only with a notice. */}
        <ConfigDiffPanel cr={cr} />
      </Stack>

      <ConfirmDialog
        open={confirmOpen}
        title="Cancel change request?"
        body="Cancel this change request? It will be archived."
        confirmLabel="Cancel request"
        onConfirm={doCancel}
        onClose={() => setConfirmOpen(false)}
      />
    </Stack>
  );
}
