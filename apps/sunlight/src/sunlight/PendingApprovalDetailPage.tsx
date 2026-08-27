import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Stack, Typography, Alert, Button, BeamPageHeader, BeamEmptyState } from '@betty/beam';
import { backTo } from './backTo';
import { getChangeRequest, approve, reject, cancel, useChangeRequests } from './changeRequests';
import { useCurrentUser } from './currentUser';
import { ENTITY_LABEL, shortCrId, reasonMessage, crActionsFor } from './changeRequestShared';
import { CRStatusChip, OperationChip } from './changeRequestChips';
import { KeyValuePanel, type KeyValueItem } from './KeyValuePanel';
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
 * Reactive on the actor (useCurrentUser) and the store (useChangeRequests), so switching Acting-as
 * in the shell re-derives the action set live. Approve/Reject/Cancel route through the same store
 * calls as the list, so behaviour is identical wherever you act.
 */
export function PendingApprovalDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  useChangeRequests(); // re-render on any CR mutation
  const me = useCurrentUser().name; // reactive: tracks the shell's Acting-as switch
  const [notice, setNotice] = useState<Notice>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const cr = id ? getChangeRequest(id) : undefined;

  if (!cr) {
    return (
      <Stack spacing={3}>
        <BeamPageHeader title={`Approval ${id ?? ''}`} back={backTo(navigate, '/pending-approvals', 'Configuration Approvals')} />
        <BeamEmptyState title={`No change request with id ${id}`} description="It may have been cleared." />
      </Stack>
    );
  }

  const actions = crActionsFor(cr, me);

  const onApprove = () => {
    const res = approve(cr.id, me);
    if (res.ok) return navigate('/pending-approvals');
    setNotice({ severity: res.reason === 'conflict' ? 'warning' : 'error', msg: reasonMessage(res.reason, cr) });
  };
  const onReject = () => {
    const res = reject(cr.id, me);
    if (res.ok) return navigate('/pending-approvals');
    setNotice({ severity: 'error', msg: reasonMessage(res.reason, cr) });
  };
  const doCancel = () => {
    const res = cancel(cr.id, me);
    setConfirmOpen(false);
    if (res.ok) return navigate('/pending-approvals');
    setNotice({ severity: 'error', msg: 'This request can no longer be canceled.' });
  };

  // Status + Operation are NOT repeated here — they live once in the header identity zone
  // (detail-grammar). This panel carries identity, attribution, and timestamps only.
  const details: KeyValueItem[] = [
    { label: 'ID', value: shortCrId(cr.id) },
    { label: 'Entity', value: cr.entityName },
    { label: 'Type', value: ENTITY_LABEL[cr.entityType] },
    { label: 'Submitted by', value: cr.submittedBy },
    { label: 'Submitted at', value: cr.submittedAt.slice(0, 10) },
    { label: 'Reviewed by', value: cr.reviewedBy ?? '—' },
    { label: 'Reviewed at', value: cr.reviewedAt ? cr.reviewedAt.slice(0, 10) : '—' },
    // Cancellation / auto-outdate aren't reviews — their own rows, shown only when they happened.
    ...(cr.status === 'canceled' ? [{ label: 'Canceled at', value: (cr.canceledAt ?? '').slice(0, 10) }] : []),
    ...(cr.status === 'outdated' ? [{ label: 'Outdated at', value: (cr.outdatedAt ?? '').slice(0, 10) }] : []),
  ];

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
          ) : actions.includes('approve') ? (
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

      {/* The details-panel SLOT (grammar §2), filled by this read-only page's reading instrument —
          KeyValuePanel, not DetailsPanel: the slot is positional, its filling follows the page's
          nature. No heading — position is the convention. */}
      <KeyValuePanel aria-label="Request details" items={details} />

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
