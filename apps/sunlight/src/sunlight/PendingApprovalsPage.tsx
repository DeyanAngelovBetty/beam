import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Stack,
  Alert,
  Box,
  Button,
  MenuItem,
  Checkbox,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  TextField,
  Typography,
  BeamPageHeader,
  BeamFilterBar,
  BeamDataTable,
} from '@betty/beam';
import type { BeamColumn, BeamRowAction } from '@betty/beam';
import { RouterIdentityLink } from './RouterIdentityLink';
import { listAll, approve, reject, cancel, useChangeRequests, type ChangeRequest, type ChangeRequestStatus } from './changeRequests';
import { DEMO_USERS, useCurrentUser } from './currentUser';
import { ENTITY_LABEL, shortCrId, reasonMessage, crActionsFor } from './changeRequestShared';
import { CRStatusChip, OperationChip } from './changeRequestChips';
import { ConfirmDialog } from './ConfirmDialog';

type Notice = { severity: 'success' | 'info' | 'warning' | 'error'; msg: string } | null;

const CR_STATUSES: ChangeRequestStatus[] = ['pending', 'approved', 'rejected', 'canceled', 'outdated'];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Status is a FILTER dimension, not tabs (grammar §5) — a multi-select (empty = all). `record`/`by`
// arrive as URL params (deep-links from the record page's alert + the app bar's maker voice).
type Filters = {
  statuses: ChangeRequestStatus[];
  type: 'any' | ChangeRequest['entityType'];
  q: string;
  by: 'any' | string;
  from: string;
  to: string;
};
const EMPTY: Filters = { statuses: [], type: 'any', q: '', by: 'any', from: '', to: '' };

/**
 * PendingApprovalsPage — the reviewer's surface (Administration nav).
 *
 * SPECULATIVE BY DESIGN: our CR model, these columns, and the Approve/Reject vocabulary are OUR
 * PROPOSAL — the backend team's actual contract is unavailable, so this is designed on our own
 * semantics with their screenshots as visual reference. Built on the existing BeamFilterBar as-is;
 * moving it to a field-schema filter API is a recorded LATER task, not this one.
 *
 * A BeamFilterBar over the FULL change-request set (the archive is browsable now, not just the
 * pending queue). Status is a FILTER (multi-select), never tabs — one queue, not five pages
 * (grammar §5). Sort: PENDING PINNED FIRST, then recency — the checker's default is "everything
 * actionable, on top." The record page's alert deep-links here with `?record=<id>` (this record's
 * requests); the app bar's maker voice with `?by=<name>` (your own).
 *
 * NO ROW EXPANSION (2026-08-14): the view-first DETAIL route (/pending-approvals/:id) is the review
 * surface. The kebab is the SINGLE row-action projection (list-grammar §3). The identity link opens
 * the detail route.
 *
 * Reactive: `useChangeRequests` re-renders on any CR mutation, `useCurrentUser` on an Acting-as
 * switch — approve/reject and actor changes update live. Filter state stays LOCAL applied-state.
 */
export function PendingApprovalsPage() {
  useChangeRequests(); // re-render on any CR mutation (approve/reject here, submit anywhere)
  const me = useCurrentUser().name; // reactive: tracks the shell's Acting-as switch
  const [searchParams, setSearchParams] = useSearchParams();
  const recordParam = searchParams.get('record') ?? '';
  const byParam = searchParams.get('by') ?? '';

  const [notice, setNotice] = useState<Notice>(null);
  const [cancelTarget, setCancelTarget] = useState<ChangeRequest | null>(null);
  const [draft, setDraft] = useState<Filters>({ ...EMPTY, by: byParam || 'any' });
  const [applied, setApplied] = useState<Filters>({ ...EMPTY, by: byParam || 'any' });

  // A `?by=` deep-link (the app bar's maker voice) seeds the submitter filter live, even when the
  // page is already mounted (react-router keeps it, only the params change).
  useEffect(() => {
    if (byParam) {
      setDraft((d) => ({ ...d, by: byParam }));
      setApplied((a) => ({ ...a, by: byParam }));
    }
  }, [byParam]);

  const q = applied.q.trim().toLowerCase();
  const filtered = listAll().filter((cr) => {
    if (recordParam && cr.entityId !== recordParam) return false; // URL-driven, layered on the bar filters
    if (applied.statuses.length > 0 && !applied.statuses.includes(cr.status)) return false;
    if (applied.type !== 'any' && cr.entityType !== applied.type) return false;
    if (applied.by !== 'any' && cr.submittedBy !== applied.by) return false;
    if (q && !cr.entityName.toLowerCase().includes(q)) return false;
    const day = cr.submittedAt.slice(0, 10);
    if (applied.from && day < applied.from) return false;
    if (applied.to && day > applied.to) return false;
    return true;
  });
  // Pending pinned first, then the rest by recency. listAll() is already recency-sorted and the
  // filter preserves order, so a stable pending-first partition is all we need.
  const rows = [...filtered.filter((cr) => cr.status === 'pending'), ...filtered.filter((cr) => cr.status !== 'pending')];
  const recordName = recordParam ? listAll().find((cr) => cr.entityId === recordParam)?.entityName : undefined;

  const onApprove = (cr: ChangeRequest) => {
    const res = approve(cr.id, me); // emit → this page (and the app bar) re-render live
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
  const doCancel = () => {
    if (!cancelTarget) return;
    const res = cancel(cancelTarget.id, me);
    setNotice(
      res.ok
        ? { severity: 'info', msg: `Canceled — ${cancelTarget.entityName} proposal archived.` }
        : { severity: 'error', msg: 'This request can no longer be canceled.' },
    );
    setCancelTarget(null);
  };

  // Columns per Tzeno reference (round 2): ID · Feature/Entity (identity) · Record ID · Operation ·
  // Status · Reason · Created by/at · Last action. Speculative — our proposal pending his contract.
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
    {
      key: 'reason',
      header: 'Reason',
      // Submit reason is captured once, displayed everywhere (grammar §4). Here, truncated.
      getValue: (cr) => cr.submitReason,
      render: (cr) => (
        <Typography variant="body2" color="text.secondary" title={cr.submitReason} sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {cr.submitReason}
        </Typography>
      ),
      width: 220,
    },
    { key: 'by', header: 'Created by', getValue: (cr) => cr.submittedBy, render: (cr) => cr.submittedBy, width: 150 },
    { key: 'at', header: 'Created', getValue: (cr) => cr.submittedAt, render: (cr) => cr.submittedAt.slice(0, 10), align: 'right', width: 120 },
    {
      key: 'action',
      header: 'Last action',
      // Reviewer action, else a system/own event — cancel or auto-outdate (shaped "— · <date>": no
      // reviewer, but a dated event).
      getValue: (cr) => cr.reviewedAt ?? cr.canceledAt ?? cr.outdatedAt ?? '',
      render: (cr) =>
        cr.reviewedBy
          ? `${cr.reviewedBy} · ${(cr.reviewedAt ?? '').slice(0, 10)}`
          : cr.canceledAt
            ? `— · ${cr.canceledAt.slice(0, 10)}`
            : cr.outdatedAt
              ? `— · ${cr.outdatedAt.slice(0, 10)}`
              : '—',
      width: 170,
    },
  ];

  // Actions follow the actor's RELATIONSHIP to the CR (crActionsFor — the vocabulary ruling): the
  // requester's own-pending rows offer Cancel; everyone else's pending rows offer Approve/Reject;
  // archived rows carry none. No disabled Approve/Reject on your own request — it isn't offered.
  const rowActions = (cr: ChangeRequest): BeamRowAction[] =>
    crActionsFor(cr, me).map((kind) => {
      if (kind === 'approve') return { id: 'approve', label: 'Approve', onSelect: () => onApprove(cr) };
      if (kind === 'reject') return { id: 'reject', label: 'Reject', destructive: true, onSelect: () => onReject(cr) };
      return { id: 'cancel', label: 'Cancel request', onSelect: () => setCancelTarget(cr) };
    });

  const isApplied =
    applied.statuses.length > 0 ||
    applied.type !== 'any' ||
    applied.by !== 'any' ||
    Boolean(applied.q) ||
    Boolean(applied.from) ||
    Boolean(applied.to);

  const clearRecord = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('record');
    setSearchParams(next, { replace: true });
  };
  const clearAll = () => {
    setDraft({ ...EMPTY });
    setApplied({ ...EMPTY });
    setSearchParams(new URLSearchParams(), { replace: true }); // drop record + by
  };

  return (
    <Stack spacing={3}>
      {/* Acting-as moved to the shell chrome (global) — see ShellFooter / ActingAsSwitcher. */}
      <BeamPageHeader
        title="Configuration Approvals"
        subtitle="Change requests awaiting a second pair of eyes — and the decision history."
      />

      {/* URL-driven record filter (deep-link from a record page) — layered above the bar filters,
          with its own clear so it reads as a distinct scope, not a buried filter chip. */}
      {recordParam && (
        <Alert
          severity="info"
          action={
            <Button size="small" variant="text" onClick={clearRecord}>
              Clear
            </Button>
          }
        >
          Showing change requests for {recordName ?? `record ${recordParam}`}.
        </Alert>
      )}

      <BeamFilterBar
        aria-label="Change request filters"
        searchValue={draft.q}
        onSearchChange={(q) => setDraft((d) => ({ ...d, q }))}
        searchPlaceholder="Search entity name"
        applied={isApplied}
        onFilter={() => setApplied(draft)}
        onClearAll={clearAll}
      >
        <FormControl size="small" fullWidth>
          <InputLabel id="cr-status-filter-label">Status</InputLabel>
          <Select
            multiple
            labelId="cr-status-filter-label"
            label="Status"
            value={draft.statuses}
            onChange={(e) => setDraft((d) => ({ ...d, statuses: e.target.value as ChangeRequestStatus[] }))}
            renderValue={(sel) => ((sel as string[]).length ? (sel as string[]).map(cap).join(', ') : 'Any')}
          >
            {CR_STATUSES.map((s) => (
              <MenuItem key={s} value={s}>
                <Checkbox size="small" checked={draft.statuses.includes(s)} />
                <ListItemText primary={cap(s)} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
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

      <Box>
        <BeamDataTable
          columns={columns}
          rows={rows}
          getRowId={(cr) => cr.id}
          LinkComponent={RouterIdentityLink}
          rowActions={rowActions}
          emptyMessage="No change requests match these filters."
          aria-label="Change requests"
        />
      </Box>

      <ConfirmDialog
        open={cancelTarget !== null}
        title="Cancel change request?"
        body="Cancel this change request? It will be archived."
        confirmLabel="Cancel request"
        onConfirm={doCancel}
        onClose={() => setCancelTarget(null)}
      />
    </Stack>
  );
}
