import { useState } from 'react';
import {
  Stack,
  Box,
  Typography,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  BeamPageHeader,
  BeamDataTable,
} from '@betty/beam';
import type { BeamColumn, BeamRowAction } from '@betty/beam';
import { RouterIdentityLink } from './RouterIdentityLink';
import { listPending, approve, reject, type ChangeRequest } from './changeRequests';
import { DEMO_USERS, getCurrentUser, setCurrentUser } from './currentUser';
import type { LoyaltyStatusDraft, StatusReward } from './loyaltyStatuses';

const ENTITY_LABEL: Record<ChangeRequest['entityType'], string> = { loyaltyStatus: 'Loyalty status' };

type Notice = { severity: 'success' | 'info' | 'warning' | 'error'; msg: string } | null;

function reasonMessage(reason: string, cr: ChangeRequest): string {
  switch (reason) {
    case 'conflict':
      return `The live ${ENTITY_LABEL[cr.entityType].toLowerCase()} changed since this request was made; it can't be applied. Ask the submitter to redo it.`;
    case 'forbidden':
      return 'You submitted this change — a different reviewer must approve it.';
    case 'unregistered':
      return 'This entity type is not registered (the entity store was not imported). A dev-wiring gap, not a data problem.';
    default:
      return 'This request is no longer pending.';
  }
}

/**
 * PendingApprovalsPage — the reviewer's surface (Administration nav; sits with Users/Roles,
 * same audience). A grammar-conformant list of pending change requests. Row expands to a
 * READ-ONLY draft summary; Approve / Reject live in the expanded action bar (grammar §3 —
 * never on the row surface), disabled on your own requests (four-eyes).
 *
 * No diff / side-by-side here by design — the read-only summary is the tracer's ceiling.
 * Live-vs-proposed diffing is a parked, Figma-first design round; the CR already carries
 * baseVersion + draft + history(), so it lands later with zero store changes.
 *
 * NOTE: this page reads live via listPending() and refreshes with a local tick after each
 * action. A useSyncExternalStore subscription is the clean future shape (and powers the
 * out-of-scope app-level pending indicator) — not built now.
 */
export function PendingApprovalsPage() {
  const [actorId, setActorId] = useState(getCurrentUser().id);
  const [, setTick] = useState(0);
  const [notice, setNotice] = useState<Notice>(null);
  const refresh = () => setTick((t) => t + 1);

  const me = getCurrentUser().name;
  const rows = listPending();

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
    {
      key: 'entity',
      header: 'Entity',
      getValue: (cr) => cr.entityName,
      isIdentity: true,
      getHref: (cr) => `${import.meta.env.BASE_URL}loyalty-status/${cr.entityId}`,
      render: (cr) => cr.entityName,
    },
    { key: 'type', header: 'Type', getValue: (cr) => ENTITY_LABEL[cr.entityType], render: (cr) => ENTITY_LABEL[cr.entityType], width: 160 },
    { key: 'by', header: 'Submitted by', getValue: (cr) => cr.submittedBy, render: (cr) => cr.submittedBy, width: 180 },
    { key: 'at', header: 'Submitted', getValue: (cr) => cr.submittedAt, render: (cr) => cr.submittedAt.slice(0, 10), align: 'right', width: 140 },
  ];

  const rowActions = (cr: ChangeRequest): BeamRowAction[] => {
    const own = cr.submittedBy === me;
    return [
      {
        id: 'approve',
        label: 'Approve',
        onSelect: () => onApprove(cr),
        disabled: own,
        disabledReason: own ? 'A different reviewer must approve your own change.' : undefined,
      },
      {
        id: 'reject',
        label: 'Reject',
        destructive: true,
        onSelect: () => onReject(cr),
        disabled: own,
        disabledReason: own ? 'A different reviewer must review your own change.' : undefined,
      },
    ];
  };

  return (
    <Stack spacing={3}>
      <BeamPageHeader
        title="Pending Approvals"
        description="Change requests awaiting a second pair of eyes."
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
        renderExpanded={(cr) => <DraftSummary cr={cr} />}
        rowActions={rowActions}
        emptyMessage="No pending change requests."
        aria-label="Pending change requests"
      />
    </Stack>
  );
}

/** Read-only summary of what a request proposes. No diff (see page header). */
function DraftSummary({ cr }: { cr: ChangeRequest }) {
  if (cr.entityType !== 'loyaltyStatus') return null;
  const d = cr.draft as LoyaltyStatusDraft;
  const fields: [string, string | number][] = [
    ['Name', d.name],
    ['Max days', d.maxDays],
    ['Gems', d.boxes],
    ['Retain status after gem #', d.keepGems],
    ['Retain boxes after', d.keepBoxes],
    ['Multiplier', d.multiplier],
  ];
  return (
    <Stack spacing={2} sx={{ maxWidth: 720 }}>
      {cr.note && (
        <Typography variant="body2" color="text.secondary">
          {cr.note}
        </Typography>
      )}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'max-content 1fr',
          columnGap: 3,
          rowGap: 0.5,
        }}
      >
        {fields.map(([label, value]) => (
          <Box key={label} sx={{ display: 'contents' }}>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="body2">{value}</Typography>
          </Box>
        ))}
      </Box>
      <Divider />
      <Typography variant="subtitle2" color="text.secondary">
        Proposed rewards ({d.rewards.length})
      </Typography>
      <Stack spacing={0.5}>
        {d.rewards.map((r: StatusReward) => (
          <Typography key={r.id} variant="body2">
            {r.pointsToClaim.toLocaleString()} pts → {r.rewardAmount.toLocaleString()} {r.rewardType} · {r.expiryHours}h
          </Typography>
        ))}
      </Stack>
    </Stack>
  );
}
