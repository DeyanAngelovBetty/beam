import { useState } from 'react';
import { Stack, Alert, MenuItem, TextField, BeamPageHeader, BeamFilterBar, BeamDataTable } from '@betty/beam';
import type { BeamColumn, BeamRowAction } from '@betty/beam';
import { RouterIdentityLink } from './RouterIdentityLink';
import { listAll, approve, reject, withdraw, useChangeRequests, type ChangeRequest, type ChangeRequestStatus } from './changeRequests';
import { DEMO_USERS, useCurrentUser } from './currentUser';
import { ENTITY_LABEL, shortCrId, reasonMessage, crActionsFor } from './changeRequestShared';
import { CRStatusChip, OperationChip } from './changeRequestChips';
import { ConfirmDialog } from './ConfirmDialog';

type Notice = { severity: 'success' | 'info' | 'warning' | 'error'; msg: string } | null;

const CR_STATUSES: ChangeRequestStatus[] = ['pending', 'approved', 'rejected', 'superseded', 'withdrawn'];
type Filters = {
  status: 'any' | ChangeRequestStatus;
  type: 'any' | ChangeRequest['entityType'];
  q: string;
  by: 'any' | string;
  from: string;
  to: string;
};
const EMPTY: Filters = { status: 'any', type: 'any', q: '', by: 'any', from: '', to: '' };

/**
 * PendingApprovalsPage — the reviewer's surface (Administration nav).
 *
 * SPECULATIVE BY DESIGN: our CR model, these columns, and the Approve/Reject vocabulary are OUR
 * PROPOSAL — the backend team's actual contract is unavailable, so this is designed on our own
 * semantics with their screenshots as visual reference. Built on the existing BeamFilterBar as-is;
 * moving it to a field-schema filter API is a recorded LATER task, not this one.
 * (approval-flow.md Open questions carries the same caveat.)
 *
 * A BeamFilterBar over the FULL change-request set (the archive is browsable now, not just the
 * pending queue), reference-parity columns, Approve/Reject as one row-action definition.
 *
 * NO ROW EXPANSION (2026-08-14): the view-first DETAIL route (/pending-approvals/:id, built 08-13)
 * is now the review surface — the old expanded draft-summary was its predecessor. With no
 * expansion, the kebab is the SINGLE row-action projection (list-grammar §3 scopes the
 * both-projections rule to rows that expand — so kebab-only is conformant, not a bend). The
 * identity link opens the detail route.
 *
 * Reactive: `useChangeRequests` re-renders on any CR mutation, `useCurrentUser` on an Acting-as
 * switch (the switcher lives in the shell chrome now) — so approve/reject and actor changes update
 * live, no local tick. Filter state stays LOCAL applied-state (URL persistence is the §1 follow-up).
 */
export function PendingApprovalsPage() {
  useChangeRequests(); // re-render on any CR mutation (approve/reject here, submit anywhere)
  const me = useCurrentUser().name; // reactive: tracks the shell's Acting-as switch
  const [notice, setNotice] = useState<Notice>(null);
  const [withdrawTarget, setWithdrawTarget] = useState<ChangeRequest | null>(null);
  const [draft, setDraft] = useState<Filters>(EMPTY);
  const [applied, setApplied] = useState<Filters>(EMPTY);

  const q = applied.q.trim().toLowerCase();
  const rows = listAll().filter((cr) => {
    if (applied.status !== 'any' && cr.status !== applied.status) return false;
    if (applied.type !== 'any' && cr.entityType !== applied.type) return false;
    if (applied.by !== 'any' && cr.submittedBy !== applied.by) return false;
    if (q && !cr.entityName.toLowerCase().includes(q)) return false;
    const day = cr.submittedAt.slice(0, 10);
    if (applied.from && day < applied.from) return false;
    if (applied.to && day > applied.to) return false;
    return true;
  });

  const onApprove = (cr: ChangeRequest) => {
    const res = approve(cr.id, me); // emit → this page (and the app alert) re-render live
    setNotice(
      res.ok
        ? { severity: 'success', msg: `Approved — ${cr.entityName} updated to a new revision.` }
        : { severity: res.reason === 'conflict' ? 'warning' : 'error', msg: reasonMessage(res.reason, cr) },
    );
  };
  const onReject = (cr: ChangeRequest) => {
    const res = reject(cr.id, me);
    setNotice(
      res.ok
        ? { severity: 'info', msg: `Rejected — ${cr.entityName} left unchanged.` }
        : { severity: 'error', msg: reasonMessage(res.reason, cr) },
    );
  };
  const doWithdraw = () => {
    if (!withdrawTarget) return;
    const res = withdraw(withdrawTarget.id, me);
    setNotice(
      res.ok
        ? { severity: 'info', msg: `Withdrawn — ${withdrawTarget.entityName} proposal archived.` }
        : { severity: 'error', msg: 'This request can no longer be withdrawn.' },
    );
    setWithdrawTarget(null);
  };

  // Columns per Tzeno reference (round 2): ID · Feature/Entity (identity) · Record ID · Operation ·
  // Status · Created by/at · Last action. Speculative — our proposal pending his team's contract.
  const columns: BeamColumn<ChangeRequest>[] = [
    { key: 'id', header: 'ID', getValue: (cr) => cr.id, render: (cr) => shortCrId(cr.id), width: 88 },
    {
      key: 'entity',
      header: 'Feature / Entity',
      getValue: (cr) => cr.entityName,
      // Identity → the CR's own record page (view-first), NOT the entity — the row IS the request.
      isIdentity: true,
      getHref: (cr) => `${import.meta.env.BASE_URL}pending-approvals/${cr.id}`,
      render: (cr) => `${ENTITY_LABEL[cr.entityType]} · ${cr.entityName}`,
    },
    { key: 'record', header: 'Record ID', getValue: (cr) => cr.entityId, render: (cr) => cr.entityId, width: 110 },
    { key: 'op', header: 'Operation', render: () => <OperationChip />, width: 120 },
    { key: 'status', header: 'Status', getValue: (cr) => cr.status, render: (cr) => <CRStatusChip status={cr.status} />, width: 120 },
    { key: 'by', header: 'Created by', getValue: (cr) => cr.submittedBy, render: (cr) => cr.submittedBy, width: 150 },
    { key: 'at', header: 'Created', getValue: (cr) => cr.submittedAt, render: (cr) => cr.submittedAt.slice(0, 10), align: 'right', width: 120 },
    {
      key: 'action',
      header: 'Last action',
      // Reviewer action, else a withdrawal (shaped "— · <date>": no reviewer, but a dated event).
      getValue: (cr) => cr.reviewedAt ?? cr.withdrawnAt ?? '',
      render: (cr) =>
        cr.reviewedBy
          ? `${cr.reviewedBy} · ${(cr.reviewedAt ?? '').slice(0, 10)}`
          : cr.withdrawnAt
            ? `— · ${cr.withdrawnAt.slice(0, 10)}`
            : '—',
      width: 170,
    },
  ];

  // Actions follow the actor's RELATIONSHIP to the CR (crActionsFor — the vocabulary ruling): the
  // requester's own-pending rows offer Withdraw; everyone else's pending rows offer Approve/Reject;
  // archived rows carry none. No disabled Approve/Reject on your own request — it isn't offered.
  const rowActions = (cr: ChangeRequest): BeamRowAction[] =>
    crActionsFor(cr, me).map((kind) => {
      if (kind === 'approve') return { id: 'approve', label: 'Approve', onSelect: () => onApprove(cr) };
      if (kind === 'reject') return { id: 'reject', label: 'Reject', destructive: true, onSelect: () => onReject(cr) };
      return { id: 'withdraw', label: 'Withdraw', onSelect: () => setWithdrawTarget(cr) };
    });

  const isApplied = JSON.stringify(applied) !== JSON.stringify(EMPTY);

  return (
    <Stack spacing={3}>
      {/* Acting-as moved to the shell chrome (global) — see ShellFooter / ActingAsSwitcher. */}
      <BeamPageHeader
        title="Configuration Approvals"
        description="Change requests awaiting a second pair of eyes — and the decision history."
      />

      <BeamFilterBar
        aria-label="Change request filters"
        searchValue={draft.q}
        onSearchChange={(q) => setDraft((d) => ({ ...d, q }))}
        searchPlaceholder="Search entity name"
        applied={isApplied}
        onFilter={() => setApplied(draft)}
        onClearAll={() => {
          setDraft(EMPTY);
          setApplied(EMPTY);
        }}
      >
        <TextField select fullWidth size="small" label="Status" value={draft.status} onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as Filters['status'] }))}>
          <MenuItem value="any">Any</MenuItem>
          {CR_STATUSES.map((s) => (
            <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s}</MenuItem>
          ))}
        </TextField>
        <TextField select fullWidth size="small" label="Type" value={draft.type} onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value as Filters['type'] }))}>
          <MenuItem value="any">Any</MenuItem>
          <MenuItem value="loyaltyStatus">Loyalty status</MenuItem>
        </TextField>
        <TextField select fullWidth size="small" label="Submitted by" value={draft.by} onChange={(e) => setDraft((d) => ({ ...d, by: e.target.value as Filters['by'] }))}>
          <MenuItem value="any">Any</MenuItem>
          {DEMO_USERS.map((u) => (
            <MenuItem key={u.id} value={u.name}>{u.name}</MenuItem>
          ))}
        </TextField>
        <TextField fullWidth size="small" type="date" label="From" value={draft.from} onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} />
        <TextField fullWidth size="small" type="date" label="To" value={draft.to} onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} />
      </BeamFilterBar>

      {notice && (
        <Alert severity={notice.severity} onClose={() => setNotice(null)}>
          {notice.msg}
        </Alert>
      )}

      <BeamDataTable
        columns={columns}
        rows={rows}
        getRowId={(cr) => cr.id}
        LinkComponent={RouterIdentityLink}
        rowActions={rowActions}
        emptyMessage="No change requests match these filters."
        aria-label="Change requests"
      />

      <ConfirmDialog
        open={withdrawTarget !== null}
        title="Withdraw change request?"
        body="Withdraw this change request? It will be archived."
        confirmLabel="Withdraw"
        onConfirm={doWithdraw}
        onClose={() => setWithdrawTarget(null)}
      />
    </Stack>
  );
}
