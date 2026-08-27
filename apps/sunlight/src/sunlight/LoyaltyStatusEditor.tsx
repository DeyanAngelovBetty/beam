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
  DetailsPanel,
  BeamField,
  BeamStat,
} from '@betty/beam';
import EditIcon from '@mui/icons-material/EditRounded';
import FileDownloadIcon from '@mui/icons-material/FileDownloadRounded';
import UploadFileIcon from '@mui/icons-material/UploadFileRounded';
import { backTo } from './backTo';
import { LoyaltyRewardsEditor } from './LoyaltyRewardsEditor';
import { NextGemPanel } from './NextGemPanel';
import { ExpandedLoyaltyPanel } from './LoyaltyExpandedPanel';
import { getLoyaltyStatus, LOYALTY_STATUSES, toDraft, type LoyaltyStatus, type LoyaltyStatusDraft } from './loyaltyStatuses';
import { submit, pendingOnRecord, cancel, useChangeRequests } from './changeRequests';
import { useCurrentUser } from './currentUser';
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
  useChangeRequests(); // reactive: cancel here (or approve/reject elsewhere) re-renders → alert clears
  // Count-aware (grammar §5): the record can hold concurrent pendings. Mine drives the requester
  // voice; others' drive the reviewer voice (and the "+n more" tail on the requester voice).
  const recordId = String(status.id);
  const allPending = pendingOnRecord(recordId);
  const myPending = allPending.find((cr) => cr.submittedBy === me.name);
  const othersPending = allPending.filter((cr) => cr.submittedBy !== me.name);
  const [notice, setNotice] = useState<Notice>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const doCancel = () => {
    if (!myPending) return;
    const res = cancel(myPending.id, me.name);
    setConfirmCancel(false);
    // Success: the pending alert simply disappears (pending → null on re-render); the notice confirms.
    setNotice(
      res.ok
        ? { severity: 'success', msg: `Canceled — “${status.name}” proposal archived.` }
        : { severity: 'error', msg: 'This request can no longer be canceled.' },
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

  return (
    <Stack spacing={3}>
      <BeamPageHeader
        title={status.name}
        back={backTo(navigate, '/', 'Loyalty Status')}
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

      {/* The change-lifecycle strip in VIEW mode = the count-aware page-level alert (grammar §5). A
          pending CR is a NOTICE here (never a blocker — editing is always allowed; the alert only
          informs). Voice follows the ACTOR'S RELATIONSHIP to the record, now COUNT-AWARE: the
          REQUESTER (own pending) gets a pending-approval line + [View request] · [Cancel request],
          with a "+n more pending" tail when others also have one; everyone ELSE gets the
          awaiting-review count + [View requests] → the record-filtered approvals list. Derived-only,
          so flipping Acting-as flips the voice. Outcome statuses never surface here (§5). */}
      {myPending ? (
        <Alert
          severity="info"
          action={
            // Flat only, order = emphasis (Cancel rightmost = primary); cluster never wraps.
            <Stack direction="row" spacing={PAGE_ALERT_ACTION_GAP} sx={pageAlertActionSx}>
              <Button size="small" variant="text" onClick={() => navigate(`/pending-approvals/${myPending.id}`)}>
                View request
              </Button>
              <Button size="small" variant="text" onClick={() => setConfirmCancel(true)}>
                Cancel request
              </Button>
            </Stack>
          }
        >
          You submitted a change request on {myPending.submittedAt.slice(0, 10)} — it's pending approval.
          {othersPending.length > 0 &&
            ` ${othersPending.length} more request${othersPending.length === 1 ? '' : 's'} ${
              othersPending.length === 1 ? 'is' : 'are'
            } pending on this record.`}
        </Alert>
      ) : othersPending.length > 0 ? (
        <Alert
          severity="info"
          action={
            <Stack direction="row" spacing={PAGE_ALERT_ACTION_GAP} sx={pageAlertActionSx}>
              <Button size="small" variant="text" onClick={() => navigate(`/pending-approvals?record=${recordId}`)}>
                View requests
              </Button>
            </Stack>
          }
        >
          {othersPending.length} change request{othersPending.length === 1 ? '' : 's'}{' '}
          {othersPending.length === 1 ? 'is' : 'are'} pending on this record — awaiting review.
        </Alert>
      ) : null}

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

      {/* The details panel — the first content region, unlabeled (position is the convention;
          grammar §2). View mode renders the field twins as stats; edit mode swaps them for fields. */}
      <DetailsPanel aria-label="Status fields">
        <BeamStat label="Name" value={status.name} />
        <BeamStat label="Max days to complete" value={status.maxDays} />
        <BeamStat label="Gems" value={status.boxes} />
        <BeamStat label="Retain status after gem #" value={status.keepGems} />
        <BeamStat label="Retain boxes after" value={status.keepBoxes} />
        <BeamStat label="Multiplier on level up" value={status.multiplier} />
      </DetailsPanel>

      <ExpandedLoyaltyPanel status={status} next={nextTier} />

      <ConfirmDialog
        open={confirmCancel}
        title="Cancel change request?"
        body="Cancel this change request? It will be archived."
        confirmLabel="Cancel request"
        onConfirm={doCancel}
        onClose={() => setConfirmCancel(false)}
      />
    </Stack>
  );
}

// ── EDIT mode — unchanged editor grammar, plus optional imported-draft seeding ──────────────────
const FIELD_KEYS = ['name', 'maxDays', 'boxes', 'keepGems', 'keepBoxes', 'multiplier'] as const;
type FieldKey = (typeof FIELD_KEYS)[number];

function EditorForm({ status, imported, onCancel }: { status: LoyaltyStatus; imported?: LoyaltyStatusDraft; onCancel: () => void }) {
  const navigate = useNavigate();
  const me = useCurrentUser().name; // reactive: own-pending detection tracks the Acting-as switch
  useChangeRequests(); // reactive: canceling my request here re-derives the strip (blocker → composer)
  const recordId = String(status.id);
  // MY pending on this record (if any) and OTHERS' — the §2 concurrency model. I seed from and revise
  // only my own proposal; someone else's pending is an independent proposal, never inherited.
  const myPending = pendingOnRecord(recordId).find((cr) => cr.submittedBy === me);
  const othersPending = pendingOnRecord(recordId).filter((cr) => cr.submittedBy !== me);
  const [pendingCancel, setPendingCancel] = useState(false);
  const [confirmCancelReq, setConfirmCancelReq] = useState(false); // the own-pending "Cancel request" confirm

  // Seed the form: an IMPORT wins (dirty from the start), else MY pending draft (revise my own), else
  // live. The dirty BASELINE is the stored state (my pending ?? live) — so an import reads as dirty
  // immediately and Submit needs no spurious keystroke.
  const seedSource: LoyaltyStatusDraft = imported ?? (myPending ? (myPending.draft as LoyaltyStatusDraft) : status);
  const baselineSource: LoyaltyStatusDraft = myPending ? (myPending.draft as LoyaltyStatusDraft) : status;
  const initialModel = useMemo<EditorModel>(() => toEditorModel(seedSource), [seedSource]);
  const originalSerialized = useMemo(() => serializeModel(toEditorModel(baselineSource)), [baselineSource]);

  const [model, setModel] = useState<EditorModel>(initialModel);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  // The change-lifecycle composer (§4): why this change. REQUIRED to submit — captured here in the
  // strip, not as a DetailsPanel field (it's metadata about the change, not a field of the record).
  const [reason, setReason] = useState('');

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
    if (!v.valid || !isDirty || !reason.trim() || myPending) return;
    submittingRef.current = true;
    const res = submit<LoyaltyStatusDraft>({
      entityType: 'loyaltyStatus',
      entityId: String(status.id),
      entityName: status.name,
      baseVersion: status.version, // live version at submit time
      baseSnapshot: toDraft(status), // frozen before-state for the review diff
      draft: toDomainDraft(model, status),
      submittedBy: me,
      submitReason: reason.trim(), // the composer's text (§4)
    });
    // The §3 guard is the SAFETY NET now — the strip's own-pending mode prevents reaching a refusal
    // (Submit is disabled while myPending exists). If it somehow fires, don't lie about success.
    if (!res.ok) {
      submittingRef.current = false;
      return;
    }
    navigate('/');
  };

  // Cancel MY pending request (own-pending mode) → the strip flips to the composer on re-render.
  const doCancelRequest = () => {
    if (!myPending) return;
    cancel(myPending.id, me);
    setConfirmCancelReq(false);
  };

  // Cancel exits edit → view (onCancel discards any imported draft), guarded by the SAME discard
  // prompt as navigation — a dirty mode-flip counts as the discard useBlocker protects.
  const requestCancel = () => (isDirty ? setPendingCancel(true) : onCancel());
  const keepEditing = () => { setPendingCancel(false); blocker.reset?.(); };
  const discard = () => { if (pendingCancel) { setPendingCancel(false); onCancel(); } else blocker.proceed?.(); };

  // The disabled-submit tooltip (why you can't submit yet) — distinct from the CR's submitReason.
  const submitHint = myPending
    ? 'Cancel your pending request to submit a new change.'
    : !isDirty
      ? 'Make a change to submit.'
      : !v.valid
        ? (v.name ?? v.multiplier ?? v.boxes ?? v.maxDays ?? v.keepGems ?? v.keepBoxes ?? v.aggregate ?? 'Fix the highlighted fields.')
        : !reason.trim()
          ? 'Describe this change for review to submit.'
          : '';
  const canSubmit = v.valid && isDirty && Boolean(reason.trim()) && !myPending;

  // The field twins (BeamField = small outlined; the details-panel grid sizes them — no width here).
  // This is where the queued medium→small convergence lands, as part of the details-panel pattern.
  const field = (key: FieldKey, label: string, opts?: { required?: boolean; hint?: string }) => (
    <BeamField
      label={label}
      required={opts?.required}
      value={model[key]}
      onChange={(e) => setModel((m) => ({ ...m, [key]: e.target.value }))}
      onBlur={() => mark(key)}
      error={Boolean(v[key] && showErr(key))}
      helperText={showErr(key) && v[key] ? v[key] : opts?.hint}
      slotProps={key === 'name' ? { htmlInput: { maxLength: MAX_NAME } } : undefined}
    />
  );

  return (
    <Stack spacing={3}>
      <BeamPageHeader
        title={status.name}
        back={backTo(navigate, '/', 'Loyalty Status')}
        action={
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Button variant="text" onClick={requestCancel}>
              Cancel
            </Button>
            <Tooltip title={canSubmit ? '' : submitHint}>
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

      {/* The change-lifecycle strip in EDIT mode (grammar §4). Own-pending mode (item 7) makes the
          dead end visible AT ENTRY with the exit attached — editing is never blocked, but Submit is,
          until you cancel your open request; then the strip flips to the reason composer. The
          composer is change METADATA (not a DetailsPanel field), shown once the form goes dirty. */}
      {myPending ? (
        <Alert
          severity="warning"
          action={
            <Button size="small" variant="text" onClick={() => setConfirmCancelReq(true)}>
              Cancel request
            </Button>
          }
        >
          You already have a pending request on this record (submitted {myPending.submittedAt.slice(0, 10)}) —
          cancel it to submit a new change.
        </Alert>
      ) : (
        <>
          {imported && (
            <Alert severity="info">Imported — review, describe the change, and submit for approval. Nothing is saved until a reviewer approves.</Alert>
          )}
          {othersPending.length > 0 && (
            <Alert severity="info">
              {othersPending.length} change request{othersPending.length === 1 ? '' : 's'} from others{' '}
              {othersPending.length === 1 ? 'is' : 'are'} pending on this record. Submitting adds a separate
              proposal; approving one marks the rest outdated.
            </Alert>
          )}
          {isDirty && (
            <BeamField
              label="Describe this change for review"
              placeholder="What are you changing, and why?"
              multiline
              minRows={2}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              helperText="Recorded on the request and shown to the reviewer."
            />
          )}
        </>
      )}

      {/* The details panel — same grammatical slots as the view's stats, now fields (morph in place;
          grammar §2). Unlabeled: the page title is the title. */}
      <DetailsPanel aria-label="Status fields">
        {field('name', 'Name', { required: true })}
        {field('maxDays', 'Max days to complete', { hint: `Whole number or ${'∞'}` })}
        {field('boxes', 'Gems')}
        {field('keepGems', 'Retain status after gem #', { hint: `Whole number or ${'∞'}` })}
        {field('keepBoxes', 'Retain boxes after', { hint: `Whole number or ${'∞'}` })}
        {field('multiplier', 'Multiplier on level up')}
      </DetailsPanel>

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

      <ConfirmDialog
        open={confirmCancelReq}
        title="Cancel change request?"
        body="Cancel your pending change request? It will be archived, and you can then submit a new one."
        confirmLabel="Cancel request"
        onConfirm={doCancelRequest}
        onClose={() => setConfirmCancelReq(false)}
      />
    </Stack>
  );
}
