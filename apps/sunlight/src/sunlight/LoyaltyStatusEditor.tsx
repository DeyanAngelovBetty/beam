import { useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation, useBlocker } from 'react-router-dom';
import {
  Stack,
  Box,
  Paper,
  Button,
  TextField,
  Tooltip,
  Typography,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  BeamPageHeader,
  BeamEmptyState,
  GemIcon,
} from '@betty/beam';
import EditIcon from '@mui/icons-material/EditRounded';
import FileDownloadIcon from '@mui/icons-material/FileDownloadRounded';
import UploadFileIcon from '@mui/icons-material/UploadFileRounded';
import { backTo } from './backTo';
import { LoyaltyRewardsEditor } from './LoyaltyRewardsEditor';
import { NextGemPanel } from './NextGemPanel';
import { ExpandedLoyaltyPanel } from './LoyaltyExpandedPanel';
import { getLoyaltyStatus, LOYALTY_STATUSES, toDraft, type LoyaltyStatus, type LoyaltyStatusDraft } from './loyaltyStatuses';
import { submit, getPendingFor, withdraw, useChangeRequests } from './changeRequests';
import { getCurrentUser, useCurrentUser } from './currentUser';
import { ConfirmDialog } from './ConfirmDialog';
import { pageAlertActionSx, PAGE_ALERT_ACTION_GAP } from './pageAlert';
import { serializeStatus, validateStatusImport, mergeOntoLive, downloadAndCopy, slugifyName } from './loyaltyImportExport';
import {
  MAX_NAME,
  toEditorModel,
  toDomainDraft,
  serializeModel,
  validateModel,
  type EditorModel,
} from './loyaltyStatusForm';

type Notice = { severity: 'success' | 'info' | 'warning' | 'error'; msg: string } | null;

/**
 * LoyaltyStatusEditor — the detail page for a governed entity, so it opens VIEW-FIRST
 * (approval-flow.md §6): read-only rendering of the same anatomy, and an explicit **Edit** action
 * flips to the editor. "Edit is deliberate" — you don't land in an editable form for an entity
 * whose changes need a second pair of eyes. Direct-write editors (payout/game) stay always-edit
 * until they onboard governance via §8; this is a documented conditional rule, not a split.
 *
 * Edit mode is the existing editor EXACTLY: Submit-for-approval (a pending CR; nothing applies
 * live), dirty-gated, useBlocker discard guard, and the §6 pending-draft rule (seed from the
 * pending draft on entering edit + banner). A row IMPORT deep-links straight into edit mode with
 * the imported payload as a dirty draft.
 */
export function LoyaltyStatusEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const existing = id ? getLoyaltyStatus(id) : undefined;
  // A row import (from the list kebab) navigates here with the validated payload → open straight
  // in edit mode. An in-VIEW import is held in local state and flips to edit the same way.
  const navState = location.state as { importedDraft?: LoyaltyStatusDraft; edit?: boolean } | null;
  // One imported-draft state (seeded from a row-import navigation, or set by an in-view import),
  // so Cancel can CLEAR it → view of the live official, no draft residue.
  const [importedDraft, setImportedDraft] = useState<LoyaltyStatusDraft | undefined>(navState?.importedDraft);
  // Edit intent (kebab Edit / imported draft) → open in edit; otherwise view-first.
  const [mode, setMode] = useState<'view' | 'edit'>(navState?.importedDraft || navState?.edit ? 'edit' : 'view');
  // Cancel exits edit → view of the same entity, discarding any imported draft (never the list).
  const exitToView = () => {
    setImportedDraft(undefined);
    setMode('view');
  };

  if (!existing) {
    return (
      <Stack spacing={3}>
        <BeamPageHeader title={`Status ${id ?? ''}`} back={backTo(navigate, '/', 'Loyalty Status')} />
        <BeamEmptyState title={`No loyalty status with id ${id}`} description="It may have been removed." />
      </Stack>
    );
  }

  if (mode === 'view')
    return (
      <ViewForm
        key={existing.id}
        status={existing}
        onEdit={() => setMode('edit')}
        onImport={(draft) => {
          setImportedDraft(draft);
          setMode('edit');
        }}
      />
    );
  return <EditorForm key={existing.id} status={existing} imported={importedDraft} onCancel={exitToView} />;
}

// ── VIEW mode — the row's record page: read-only anatomy + the row's non-edit actions ───────────
function ViewForm({ status, onEdit, onImport }: { status: LoyaltyStatus; onEdit: () => void; onImport: (draft: LoyaltyStatusDraft) => void }) {
  const navigate = useNavigate();
  const me = useCurrentUser(); // reactive: flip Acting-as → the alert voice flips
  useChangeRequests(); // reactive: withdraw here (or approve/reject elsewhere) re-renders → alert clears
  const pending = getPendingFor(String(status.id));
  const isRequester = !!pending && pending.submittedBy === me.name;
  const [notice, setNotice] = useState<Notice>(null);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const doWithdraw = () => {
    if (!pending) return;
    const res = withdraw(pending.id, me.name);
    setConfirmWithdraw(false);
    // Success: the pending alert simply disappears (pending → null on re-render); the notice confirms.
    setNotice(
      res.ok
        ? { severity: 'success', msg: `Withdrawn — “${status.name}” proposal archived.` }
        : { severity: 'error', msg: 'This request can no longer be withdrawn.' },
    );
  };
  const nextTier = LOYALTY_STATUSES[LOYALTY_STATUSES.findIndex((s) => s.id === status.id) + 1];

  // In-view import panel — the same single-status flow as the list kebab's Import…, but in place:
  // validate → hand the merged draft up, which flips to edit (dirty, "Imported" banner).
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const doImport = () => {
    const res = validateStatusImport(importText);
    if (!res.ok) return setImportErrors(res.errors);
    onImport(mergeOntoLive(res.draft, status));
  };

  const readField = (label: string, value: string | number) => (
    <Stack spacing={0.25} sx={{ minWidth: 160 }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2">{value}</Typography>
    </Stack>
  );

  return (
    <Stack spacing={3}>
      <BeamPageHeader
        title={status.name}
        back={backTo(navigate, '/', 'Loyalty Status')}
        status={<GemIcon gem={status.gem} size={20} />}
        // The view is the row's record page → it carries the row's NON-EDIT actions (§6):
        // [Export] [Import…] [Edit], Edit primary + last. In edit mode these hide — the editor's
        // pair stays exactly [Cancel] [Submit for approval] (importing over a live draft is a
        // collision we don't invite; the row/view paths cover import).
        action={
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={() => downloadAndCopy(`${slugifyName(status.name)}.json`, serializeStatus(status))}>
              Export
            </Button>
            <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={() => setImportOpen((o) => !o)}>
              Import…
            </Button>
            <Button variant="contained" startIcon={<EditIcon />} onClick={onEdit}>
              Edit
            </Button>
          </Stack>
        }
      />

      {notice && (
        <Alert severity={notice.severity} onClose={() => setNotice(null)}>
          {notice.msg}
        </Alert>
      )}

      {/* A pending CR is a NOTICE in view mode (not a draft to edit; it becomes a seeded draft only
          on entering edit — §6). Its voice + actions follow the ACTOR'S RELATIONSHIP to the CR
          (approval-flow "Actor → action-set"): the REQUESTER gets a pending-approval line + Withdraw
          (an own-request action, no second pair of eyes); everyone ELSE gets an awaiting-review line
          + Review → the CR page, where the reviewer meets the diff (Approve/Reject deliberately not
          inline). Derived-only, so flipping Acting-as flips the voice. */}
      {pending &&
        (isRequester ? (
          <Alert
            severity="info"
            action={
              // Flat only, order = emphasis (Withdraw rightmost = primary); cluster never wraps.
              <Stack direction="row" spacing={PAGE_ALERT_ACTION_GAP} sx={pageAlertActionSx}>
                <Button size="small" variant="text" onClick={() => navigate(`/pending-approvals/${pending.id}`)}>
                  View request
                </Button>
                <Button size="small" variant="text" onClick={() => setConfirmWithdraw(true)}>
                  Withdraw
                </Button>
              </Stack>
            }
          >
            You submitted a change request for this status on {pending.submittedAt.slice(0, 10)} — it's pending
            approval. To make further changes, withdraw it and submit a new one.
          </Alert>
        ) : (
          <Alert
            severity="info"
            action={
              <Stack direction="row" spacing={PAGE_ALERT_ACTION_GAP} sx={pageAlertActionSx}>
                <Button size="small" variant="text" onClick={() => navigate(`/pending-approvals/${pending.id}`)}>
                  Review
                </Button>
              </Stack>
            }
          >
            {pending.submittedBy} submitted a change request for this status on {pending.submittedAt.slice(0, 10)} —
            it's awaiting review.
          </Alert>
        ))}

      {importOpen && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={1.5}>
            <Typography variant="subtitle2">Import onto “{status.name}” (single status JSON)</Typography>
            <TextField
              size="small"
              multiline
              minRows={4}
              placeholder="Paste JSON…"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              fullWidth
            />
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Button size="small" component="label" variant="text">
                Choose file…
                <input hidden type="file" accept="application/json" onChange={(e) => e.target.files?.[0]?.text().then(setImportText)} />
              </Button>
              <Box sx={{ flex: 1 }} />
              <Button size="small" onClick={() => { setImportOpen(false); setImportErrors([]); }}>Cancel</Button>
              <Button size="small" variant="contained" disabled={!importText.trim()} onClick={doImport}>
                Import → edit
              </Button>
            </Stack>
            {importErrors.length > 0 && (
              <Paper variant="outlined" sx={{ p: 1.5, borderColor: 'error.main' }}>
                <Typography variant="caption" color="error.main" sx={{ fontWeight: 600 }}>
                  {importErrors.length} problem{importErrors.length > 1 ? 's' : ''} — nothing was imported:
                </Typography>
                <Stack component="ul" sx={{ m: 0, pl: 2 }}>
                  {importErrors.map((err, i) => (
                    <Typography key={i} component="li" variant="caption" color="text.secondary">
                      {err}
                    </Typography>
                  ))}
                </Stack>
              </Paper>
            )}
          </Stack>
        </Paper>
      )}

      <Stack spacing={2}>
        <Typography variant="subtitle2" color="text.secondary">
          Status fields
        </Typography>
        <Stack direction="row" spacing={4} sx={{ flexWrap: 'wrap', rowGap: 2 }}>
          {readField('Name', status.name)}
          {readField('Max days to complete', status.maxDays)}
          {readField('Gems', status.boxes)}
          {readField('Retain status after gem #', status.keepGems)}
          {readField('Retain boxes after', status.keepBoxes)}
          {readField('Multiplier on level up', status.multiplier)}
        </Stack>
      </Stack>

      <ExpandedLoyaltyPanel status={status} next={nextTier} />

      <ConfirmDialog
        open={confirmWithdraw}
        title="Withdraw change request?"
        body="Withdraw this change request? It will be archived."
        confirmLabel="Withdraw"
        onConfirm={doWithdraw}
        onClose={() => setConfirmWithdraw(false)}
      />
    </Stack>
  );
}

// ── EDIT mode — unchanged editor grammar, plus optional imported-draft seeding ──────────────────
const FIELD_KEYS = ['name', 'maxDays', 'boxes', 'keepGems', 'keepBoxes', 'multiplier'] as const;
type FieldKey = (typeof FIELD_KEYS)[number];

function EditorForm({ status, imported, onCancel }: { status: LoyaltyStatus; imported?: LoyaltyStatusDraft; onCancel: () => void }) {
  const navigate = useNavigate();
  const pending = getPendingFor(String(status.id));
  const [pendingCancel, setPendingCancel] = useState(false);

  // Seed the form: an IMPORT wins (dirty from the start), else the pending draft (§6), else live.
  // The dirty BASELINE, though, is always the stored state (pending ?? live) — so an import reads
  // as dirty immediately (imported ≠ stored) and Submit is live without a spurious keystroke.
  const seedSource: LoyaltyStatusDraft = imported ?? (pending ? (pending.draft as LoyaltyStatusDraft) : status);
  const baselineSource: LoyaltyStatusDraft = pending ? (pending.draft as LoyaltyStatusDraft) : status;
  const initialModel = useMemo<EditorModel>(() => toEditorModel(seedSource), [seedSource]);
  const originalSerialized = useMemo(() => serializeModel(toEditorModel(baselineSource)), [baselineSource]);

  const [model, setModel] = useState<EditorModel>(initialModel);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const [hoverId, setHoverId] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const activeId = focusId ?? hoverId;
  const nextTier = LOYALTY_STATUSES[LOYALTY_STATUSES.findIndex((s) => s.id === status.id) + 1];
  const isDirty = serializeModel(model) !== originalSerialized;
  const submittingRef = useRef(false);

  const v = validateModel(model);
  const mark = (key: string) => setTouched((t) => ({ ...t, [key]: true }));
  const showErr = (key: string) => submitAttempted || Boolean(touched[key]);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && !submittingRef.current && currentLocation.pathname !== nextLocation.pathname,
  );

  const doSubmit = () => {
    if (!v.valid || !isDirty) return;
    submittingRef.current = true;
    submit<LoyaltyStatusDraft>({
      entityType: 'loyaltyStatus',
      entityId: String(status.id),
      entityName: status.name,
      baseVersion: status.version, // live version at submit time
      baseSnapshot: toDraft(status), // frozen before-state for the review diff
      draft: toDomainDraft(model, status),
      submittedBy: getCurrentUser().name,
    });
    navigate('/');
  };

  // Cancel exits edit → view (onCancel discards any imported draft), guarded by the SAME discard
  // prompt as navigation — a dirty mode-flip counts as the discard useBlocker protects.
  const requestCancel = () => (isDirty ? setPendingCancel(true) : onCancel());
  const keepEditing = () => { setPendingCancel(false); blocker.reset?.(); };
  const discard = () => { if (pendingCancel) { setPendingCancel(false); onCancel(); } else blocker.proceed?.(); };

  const submitReason = !isDirty
    ? 'Make a change to submit.'
    : (v.name ?? v.multiplier ?? v.boxes ?? v.maxDays ?? v.keepGems ?? v.keepBoxes ?? v.aggregate ?? 'Fix the highlighted fields.');
  const canSubmit = v.valid && isDirty;

  const field = (key: FieldKey, label: string, opts?: { width?: number; required?: boolean; hint?: string }) => (
    <TextField
      label={label}
      required={opts?.required}
      value={model[key]}
      onChange={(e) => setModel((m) => ({ ...m, [key]: e.target.value }))}
      onBlur={() => mark(key)}
      error={Boolean(v[key] && showErr(key))}
      helperText={showErr(key) && v[key] ? v[key] : opts?.hint}
      sx={{ width: opts?.width ?? 200 }}
      slotProps={key === 'name' ? { htmlInput: { maxLength: MAX_NAME } } : undefined}
    />
  );

  return (
    <Stack spacing={3}>
      <BeamPageHeader
        title={status.name}
        back={backTo(navigate, '/', 'Loyalty Status')}
        status={<GemIcon gem={status.gem} size={20} />}
        action={
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Button variant="text" onClick={requestCancel}>
              Cancel
            </Button>
            <Tooltip title={canSubmit ? '' : submitReason}>
              <span>
                <Button
                  variant="contained"
                  aria-disabled={!canSubmit || undefined}
                  sx={canSubmit ? undefined : { opacity: 0.5 }}
                  onClick={() => {
                    setSubmitAttempted(true);
                    if (canSubmit) doSubmit();
                  }}
                >
                  Submit for approval
                </Button>
              </span>
            </Tooltip>
          </Stack>
        }
      />

      {imported ? (
        <Alert severity="warning">Imported — review and submit for approval. Nothing is saved until a reviewer approves.</Alert>
      ) : pending ? (
        <Alert severity="info">
          Editing a pending change request submitted by {pending.submittedBy} on {pending.submittedAt.slice(0, 10)}.
          Submitting replaces it.
        </Alert>
      ) : null}

      <Stack spacing={2}>
        <Typography variant="subtitle2" color="text.secondary">
          Status fields
        </Typography>
        {field('name', 'Name', { width: 480, required: true })}
        <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
          {field('maxDays', 'Max days to complete', { hint: `Whole number or ${'∞'}` })}
          {field('boxes', 'Gems')}
          {field('keepGems', 'Retain status after gem #', { hint: `Whole number or ${'∞'}` })}
          {field('keepBoxes', 'Retain boxes after', { hint: `Whole number or ${'∞'}` })}
          {field('multiplier', 'Multiplier on level up')}
        </Stack>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={6} sx={{ alignItems: { md: 'flex-start' } }}>
        <LoyaltyRewardsEditor
          rows={model.rewards}
          onChange={(rewards) => setModel((m) => ({ ...m, rewards }))}
          errors={v.rewards}
          showAllErrors={submitAttempted}
          activeId={activeId}
          onRowHover={setHoverId}
          onRowFocus={setFocusId}
        />
        <NextGemPanel
          currentGem={status.gem}
          nextStatus={nextTier ? { gem: nextTier.gem, name: nextTier.name, assignedOnly: nextTier.gem === 'vip' } : undefined}
          milestoneCost={Number(model.rewards[0]?.pointsToClaim) || 2000}
          milestones={model.rewards.map((r) => ({ id: r._key }))}
          highlightId={activeId}
          onMilestoneHover={setHoverId}
        />
      </Stack>

      <Dialog open={blocker.state === 'blocked' || pendingCancel} onClose={keepEditing}>
        <DialogTitle>Discard changes?</DialogTitle>
        <DialogContent>
          <Typography>You have unsaved changes. Leaving this page will discard them.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={keepEditing}>Keep editing</Button>
          <Button color="error" onClick={discard}>
            Discard
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
