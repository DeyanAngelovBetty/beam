import { useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation, useBlocker } from 'react-router-dom';
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
import EditIcon from '@mui/icons-material/EditRounded';
import { backTo } from './backTo';
import { LoyaltyRewardsEditor } from './LoyaltyRewardsEditor';
import { NextGemPanel } from './NextGemPanel';
import { ExpandedLoyaltyPanel } from './LoyaltyExpandedPanel';
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
  // A row import navigates here with the validated payload → open straight in edit mode.
  const importedDraft = (location.state as { importedDraft?: LoyaltyStatusDraft } | null)?.importedDraft;
  const [mode, setMode] = useState<'view' | 'edit'>(importedDraft ? 'edit' : 'view');

  if (!existing) {
    return (
      <Stack spacing={3}>
        <BeamPageHeader title={`Status ${id ?? ''}`} back={backTo(navigate, '/', 'Loyalty Status')} />
        <BeamEmptyState title={`No loyalty status with id ${id}`} description="It may have been removed." />
      </Stack>
    );
  }

  if (mode === 'view') return <ViewForm key={existing.id} status={existing} onEdit={() => setMode('edit')} />;
  return <EditorForm key={existing.id} status={existing} imported={importedDraft} />;
}

// ── VIEW mode — read-only, no editable affordance leaks ────────────────────────────────────────
function ViewForm({ status, onEdit }: { status: LoyaltyStatus; onEdit: () => void }) {
  const navigate = useNavigate();
  const pending = getPendingFor(String(status.id));
  const nextTier = LOYALTY_STATUSES[LOYALTY_STATUSES.findIndex((s) => s.id === status.id) + 1];

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
        action={
          <Button variant="contained" startIcon={<EditIcon />} onClick={onEdit}>
            Edit
          </Button>
        }
      />

      {/* A pending CR is a NOTICE in view mode (not a draft to edit). It becomes a seeded draft
          only on entering edit — §6. */}
      {pending && (
        <Alert severity="info">
          A change request for this status is pending review — submitted by {pending.submittedBy} on{' '}
          {pending.submittedAt.slice(0, 10)}. Approve or reject it in Pending Approvals.
        </Alert>
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
    </Stack>
  );
}

// ── EDIT mode — unchanged editor grammar, plus optional imported-draft seeding ──────────────────
const FIELD_KEYS = ['name', 'maxDays', 'boxes', 'keepGems', 'keepBoxes', 'multiplier'] as const;
type FieldKey = (typeof FIELD_KEYS)[number];

function EditorForm({ status, imported }: { status: LoyaltyStatus; imported?: LoyaltyStatusDraft }) {
  const navigate = useNavigate();
  const pending = getPendingFor(String(status.id));

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
      draft: toDomainDraft(model, status),
      submittedBy: getCurrentUser().name,
    });
    navigate('/');
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
