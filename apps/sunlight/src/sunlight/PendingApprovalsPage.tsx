import { useState } from 'react';
import {
  Stack,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  BeamPageHeader,
  BeamFilterBar,
  BeamDataTable,
} from '@betty/beam';
import type { BeamColumn, BeamRowAction } from '@betty/beam';
import { RouterIdentityLink } from './RouterIdentityLink';
import { listAll, approve, reject, type ChangeRequest, type ChangeRequestStatus } from './changeRequests';
import { DEMO_USERS, getCurrentUser, setCurrentUser } from './currentUser';
import { ENTITY_LABEL, shortCrId, reasonMessage } from './changeRequestShared';
import { CRStatusChip, OperationChip } from './changeRequestChips';
import { ProposedConfigSummary } from './ProposedConfigSummary';

type Notice = { severity: 'success' | 'info' | 'warning' | 'error'; msg: string } | null;

const CR_STATUSES: ChangeRequestStatus[] = ['pending', 'approved', 'rejected', 'superseded'];
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
 * PendingApprovalsPage — the reviewer's surface (Administration nav). Grammar-complete: a
 * BeamFilterBar over the FULL change-request set (the archive is browsable now, not just the
 * pending queue), Tzeno-parity columns, Approve/Reject as one row-action definition (kebab +
 * expanded bar, 08-13 repair; disabled on your own request — four-eyes). The row expands to the
 * read-only ProposedConfigSummary; the identity link opens the CR's view-first detail route.
 *
 * NOTE: filter state is LOCAL applied-state this pass; URL persistence (list-grammar §1, as the
 * config pages do) is the flagged follow-up. Live reads via listAll() + a local tick after actions;
 * a useSyncExternalStore subscription is the clean future shape (and the app-level indicator).
 */
export function PendingApprovalsPage() {
  const [actorId, setActorId] = useState(getCurrentUser().id);
  const [, setTick] = useState(0);
  const [notice, setNotice] = useState<Notice>(null);
  const [draft, setDraft] = useState<Filters>(EMPTY);
  const [applied, setApplied] = useState<Filters>(EMPTY);
  const refresh = () => setTick((t) => t + 1);
  const me = getCurrentUser().name;

  // Computed inline (not memoized) so it reflects the store after every approve/reject tick.
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
    const res = approve(cr.id, getCurrentUser().name);
    setNotice(
      res.ok
        ? { severity: 'success', msg: `Approved — ${cr.entityName} updated to a new revision.` }
        : { severity: res.reason === 'conflict' ? 'warning' : 'error', msg: reasonMessage(res.reason, cr) },
    );
    refresh();
  };
  const onReject = (cr: ChangeRequest) => {
    const res = reject(cr.id, getCurrentUser().name);
    setNotice(
      res.ok
        ? { severity: 'info', msg: `Rejected — ${cr.entityName} left unchanged.` }
        : { severity: 'error', msg: reasonMessage(res.reason, cr) },
    );
    refresh();
  };

  const columns: BeamColumn<ChangeRequest>[] = [
    { key: 'id', header: 'ID', getValue: (cr) => cr.id, render: (cr) => shortCrId(cr.id), width: 96 },
    {
      key: 'entity',
      header: 'Entity',
      getValue: (cr) => cr.entityName,
      // Identity → the CR's own record page (view-first), NOT the entity — the row IS the request.
      isIdentity: true,
      getHref: (cr) => `${import.meta.env.BASE_URL}pending-approvals/${cr.id}`,
      render: (cr) => cr.entityName,
    },
    { key: 'type', header: 'Type', getValue: (cr) => ENTITY_LABEL[cr.entityType], render: (cr) => ENTITY_LABEL[cr.entityType], width: 150 },
    { key: 'op', header: 'Operation', render: () => <OperationChip />, width: 130 },
    { key: 'status', header: 'Status', getValue: (cr) => cr.status, render: (cr) => <CRStatusChip status={cr.status} />, width: 130 },
    { key: 'by', header: 'Submitted by', getValue: (cr) => cr.submittedBy, render: (cr) => cr.submittedBy, width: 160 },
    { key: 'at', header: 'Submitted', getValue: (cr) => cr.submittedAt, render: (cr) => cr.submittedAt.slice(0, 10), align: 'right', width: 130 },
    {
      key: 'action',
      header: 'Last action',
      getValue: (cr) => cr.reviewedAt ?? '',
      render: (cr) => (cr.reviewedBy ? `${cr.reviewedBy} · ${(cr.reviewedAt ?? '').slice(0, 10)}` : '—'),
      width: 180,
    },
  ];

  // Approve/Reject only exist for PENDING requests; archive rows carry no actions (browse-only).
  const rowActions = (cr: ChangeRequest): BeamRowAction[] => {
    if (cr.status !== 'pending') return [];
    const own = cr.submittedBy === me;
    return [
      { id: 'approve', label: 'Approve', onSelect: () => onApprove(cr), disabled: own, disabledReason: own ? 'A different reviewer must approve your own change.' : undefined },
      { id: 'reject', label: 'Reject', destructive: true, onSelect: () => onReject(cr), disabled: own, disabledReason: own ? 'A different reviewer must review your own change.' : undefined },
    ];
  };

  const isApplied = JSON.stringify(applied) !== JSON.stringify(EMPTY);

  return (
    <Stack spacing={3}>
      <BeamPageHeader
        title="Configuration Approvals"
        description="Change requests awaiting a second pair of eyes — and the decision history."
        action={
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="acting-as">Acting as (demo)</InputLabel>
            <Select
              labelId="acting-as"
              label="Acting as (demo)"
              value={actorId}
              onChange={(e) => {
                setCurrentUser(e.target.value);
                setActorId(e.target.value);
                setNotice(null);
              }}
            >
              {DEMO_USERS.map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {u.name} · {u.role}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        }
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
        renderExpanded={(cr) => <ProposedConfigSummary cr={cr} />}
        rowActions={rowActions}
        emptyMessage="No change requests match these filters."
        aria-label="Change requests"
      />
    </Stack>
  );
}
