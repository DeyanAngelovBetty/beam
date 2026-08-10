import { useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useBlocker } from 'react-router-dom';
import {
  Stack,
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
import { backTo } from './backTo';
import { LoyaltyRewardsEditor } from './LoyaltyRewardsEditor';
import { NextGemPanel } from './NextGemPanel';
import { getLoyaltyStatus, LOYALTY_STATUSES, type LoyaltyStatus, type LoyaltyStatusDraft } from './loyaltyStatuses';
import { submit, getPendingFor } from './changeRequests';
import { getCurrentUser } from './currentUser';
import {
  MAX_NAME,
  toEditorModel,
  toDomainDraft,
  serializeModel,
  validateModel,
  type EditorModel,
} from './loyaltyStatusForm';

/**
 * LoyaltyStatusEditor — the canonical page the list's identity link points to. Anatomy
 * mirrors PayoutConfigEditor (BeamPageHeader + back, Cancel/Submit in header actions,
 * empty-state on a missing id, useBlocker discard-guard). The maker-checker twist:
 * **Save is now "Submit for approval"** — it creates a pending change request; nothing
 * applies live (detail-grammar §4 save model, the button says what it does).
 *
 * If a pending CR already exists for this status, the editor seeds from that DRAFT (not
 * live) so the maker continues the in-flight proposal, and dirty is measured against the
 * draft. baseVersion is re-read from LIVE at submit time so the stale check stays honest.
 */
export function LoyaltyStatusEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const existing = id ? getLoyaltyStatus(id) : undefined;

  if (!existing) {
    return (
      <Stack spacing={3}>
        <BeamPageHeader title={`Status ${id ?? ''}`} back={backTo(navigate, '/', 'Loyalty Status')} />
        <BeamEmptyState title={`No loyalty status with id ${id}`} description="It may have been removed." />
      </Stack>
    );
  }

  return <EditorForm key={existing.id} status={existing} />;
}

const FIELD_KEYS = ['name', 'maxDays', 'boxes', 'keepGems', 'keepBoxes', 'multiplier'] as const;
type FieldKey = (typeof FIELD_KEYS)[number];

function EditorForm({ status }: { status: LoyaltyStatus }) {
  const navigate = useNavigate();
  const pending = getPendingFor(String(status.id));

  const initialModel = useMemo<EditorModel>(
    () => toEditorModel(pending ? (pending.draft as LoyaltyStatusDraft) : status),
    [pending, status],
  );
  const [model, setModel] = useState<EditorModel>(initialModel);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Milestone ↔ reward-row linking for the companion gem panel: hover + focus-within,
  // FOCUS WINS (the editor is keyboard-first — §5 parity). Same shared-state pattern the
  // view uses, extended with focus. The panel derives from the LIVE model, not the store.
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const activeId = focusId ?? hoverId;
  const nextTier = LOYALTY_STATUSES[LOYALTY_STATUSES.findIndex((s) => s.id === status.id) + 1];
  const originalSerialized = useMemo(() => serializeModel(initialModel), [initialModel]);
  const isDirty = serializeModel(model) !== originalSerialized;
  const submittingRef = useRef(false);

  const v = validateModel(model);
  const mark = (key: string) => setTouched((t) => ({ ...t, [key]: true }));
  const showErr = (key: string) => submitAttempted || Boolean(touched[key]);

  // Discard guard — same mechanism as PayoutConfigEditor / UserEdit.
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && !submittingRef.current && currentLocation.pathname !== nextLocation.pathname,
  );

  const doSubmit = () => {
    if (!v.valid || !isDirty) return;
    submittingRef.current = true; // stop the blocker before navigating
    submit<LoyaltyStatusDraft>({
      entityType: 'loyaltyStatus',
      entityId: String(status.id),
      entityName: status.name,
      baseVersion: status.version, // live version at submit time
      draft: toDomainDraft(model, status),
      submittedBy: getCurrentUser().name,
    });
    navigate('/'); // back to the list, where this row now wears the Pending badge
  };

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
        // Gem is this tier's identity, under the title (§4) — not an action.
        status={<GemIcon gem={status.gem} size={20} />}
        action={
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Button variant="text" onClick={() => navigate('/')}>
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

      {pending && (
        <Alert severity="info">
          Editing a pending change request submitted by {pending.submittedBy} on{' '}
          {pending.submittedAt.slice(0, 10)}. Submitting replaces it.
        </Alert>
      )}

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

      {/* Table-left / panel-right — the same anatomy as the view (one anatomy, both
          modes: the "same thing, now editable" bridge). The panel derives live from the
          editor model, so adding a reward row grows the milestone ladder immediately. */}
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

      <Dialog open={blocker.state === 'blocked'} onClose={() => blocker.reset?.()}>
        <DialogTitle>Discard changes?</DialogTitle>
        <DialogContent>
          <Typography>You have unsaved changes. Leaving this page will discard them.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => blocker.reset?.()}>Keep editing</Button>
          <Button color="error" onClick={() => blocker.proceed?.()}>
            Discard
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
