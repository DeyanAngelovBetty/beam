import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Stack, Typography, Alert, Button, Tooltip, BeamPageHeader, BeamEmptyState } from '@betty/beam';
import { backTo } from './backTo';
import { getChangeRequest, approve, reject } from './changeRequests';
import { getCurrentUser } from './currentUser';
import { ENTITY_LABEL, shortCrId, reasonMessage } from './changeRequestShared';
import { CRStatusChip, OperationChip } from './changeRequestChips';
import { KeyValuePanel, type KeyValueItem } from './KeyValuePanel';
import { ProposedConfigSummary } from './ProposedConfigSummary';

type Notice = { severity: 'success' | 'info' | 'warning' | 'error'; msg: string } | null;

/**
 * PendingApprovalDetailPage — /pending-approvals/:id. A change request is a RECORD, so the estate's
 * view-first rule applies: this is a read-only record page. PENDING CRs carry header actions
 * [Reject] [Approve] (approve primary; disabled on your own request; conflict surfaced inline,
 * matching the list's vocabulary exactly). Archived CRs (approved/rejected/superseded) render the
 * SAME page with no actions — the decision history is browsable.
 *
 * Approve/Reject route through the same store calls as the list, so supersede/conflict behaviour is
 * identical wherever you act.
 */
export function PendingApprovalDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [, setTick] = useState(0);
  const [notice, setNotice] = useState<Notice>(null);
  const cr = id ? getChangeRequest(id) : undefined;

  if (!cr) {
    return (
      <Stack spacing={3}>
        <BeamPageHeader title={`Approval ${id ?? ''}`} back={backTo(navigate, '/pending-approvals', 'Configuration Approvals')} />
        <BeamEmptyState title={`No change request with id ${id}`} description="It may have been cleared." />
      </Stack>
    );
  }

  const me = getCurrentUser().name;
  const own = cr.submittedBy === me;
  const isPending = cr.status === 'pending';

  const onApprove = () => {
    const res = approve(cr.id, me);
    if (res.ok) return navigate('/pending-approvals');
    setNotice({ severity: res.reason === 'conflict' ? 'warning' : 'error', msg: reasonMessage(res.reason, cr) });
    setTick((t) => t + 1);
  };
  const onReject = () => {
    const res = reject(cr.id, me);
    if (res.ok) return navigate('/pending-approvals');
    setNotice({ severity: 'error', msg: reasonMessage(res.reason, cr) });
    setTick((t) => t + 1);
  };

  const details: KeyValueItem[] = [
    { label: 'ID', value: shortCrId(cr.id) },
    { label: 'Entity', value: cr.entityName },
    { label: 'Type', value: ENTITY_LABEL[cr.entityType] },
    { label: 'Operation', value: <OperationChip /> },
    { label: 'Status', value: <CRStatusChip status={cr.status} /> },
    { label: 'Submitted by', value: cr.submittedBy },
    { label: 'Submitted at', value: cr.submittedAt.slice(0, 10) },
    { label: 'Reviewed by', value: cr.reviewedBy ?? '—' },
    { label: 'Reviewed at', value: cr.reviewedAt ? cr.reviewedAt.slice(0, 10) : '—' },
  ];

  const ownReason = 'A different reviewer must review your own change.';

  return (
    <Stack spacing={3}>
      <BeamPageHeader
        title={`${cr.entityName} approval #${shortCrId(cr.id)}`}
        back={backTo(navigate, '/pending-approvals', 'Configuration Approvals')}
        // Status badge + operation chip under the title (reference parity).
        status={
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <CRStatusChip status={cr.status} />
            <OperationChip />
          </Stack>
        }
        // Actions only on a PENDING record; [Reject] [Approve] (approve primary), disabled-own.
        action={
          isPending ? (
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Tooltip title={own ? ownReason : ''}>
                <span>
                  <Button variant="outlined" color="error" aria-disabled={own || undefined} sx={own ? { opacity: 0.5 } : undefined} onClick={() => { if (!own) onReject(); }}>
                    Reject
                  </Button>
                </span>
              </Tooltip>
              <Tooltip title={own ? ownReason : ''}>
                <span>
                  <Button variant="contained" aria-disabled={own || undefined} sx={own ? { opacity: 0.5 } : undefined} onClick={() => { if (!own) onApprove(); }}>
                    Approve
                  </Button>
                </span>
              </Tooltip>
            </Stack>
          ) : undefined
        }
      />

      {notice && (
        <Alert severity={notice.severity} onClose={() => setNotice(null)}>
          {notice.msg}
        </Alert>
      )}

      <Stack spacing={1}>
        <Typography variant="subtitle2" color="text.secondary">
          Request details
        </Typography>
        <KeyValuePanel aria-label="Request details" items={details} />
      </Stack>

      <Stack spacing={1}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'baseline' }}>
          <Typography variant="subtitle2" color="text.secondary">
            Proposed configuration
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Proposed state; comparison view planned.
          </Typography>
        </Stack>
        <ProposedConfigSummary cr={cr} />
      </Stack>
    </Stack>
  );
}
