import { useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation, useBlocker } from 'react-router-dom';
import {
  Stack,
  Button,
  TextField,
  MenuItem,
  Tooltip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  BeamPageHeader,
  BeamStatusBadge,
  BeamEmptyState,
} from '@betty/beam';
import EditIcon from '@mui/icons-material/EditRounded';
import { backTo } from './backTo';
import { PayoutRowsEditor } from './PayoutRowsEditor';
import { PayoutRowsGrid } from './PayoutRowsGrid';
import {
  GAME_TYPES,
  statusBadge,
  getPayoutConfig,
  createPayoutConfig,
  updatePayoutConfig,
  type GameType,
  type PayoutConfig,
} from './payoutConfigs';
import {
  MAX_NAME,
  emptyModel,
  toEditorModel,
  toDomainInput,
  serializeModel,
  validateModel,
  type EditorModel,
} from './payoutConfigForm';

/**
 * Payout Config detail page. VIEW-FIRST like every detail route (approval-flow §6,
 * ratified 2026-08-11): a `:id` opens read-only; **Edit** flips to the editor. `/new`
 * has nothing to view, so it opens straight in create mode.
 *
 * The divergence from governed editors is now SAVE-MODEL ONLY, no longer posture: this
 * is a DIRECT-WRITE editor — Save applies live ([Cancel] [Save]), no change request —
 * because MetaGame configs edit directly (brief §5.2 / §10). It onboards the CR save
 * model later via approval-flow §8; the view-first posture is already shared. (Cancel +
 * Save stay in the header actions slot, detail-grammar §4 — not the bottom bar Georgi
 * sketched; doctrine wins, a one-line move if overruled.)
 *
 * Scaffold plain — spacing / pigment is Deyan's bench pass.
 */
export function PayoutConfigEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const existing = id ? getPayoutConfig(id) : undefined;
  const editIntent = (location.state as { edit?: boolean } | null)?.edit;
  const [mode, setMode] = useState<'view' | 'edit'>(editIntent ? 'edit' : 'view');

  if (id && !existing) {
    return (
      <Stack spacing={3}>
        <BeamPageHeader title={`Config ${id}`} back={backTo(navigate, '/payout-configs', 'Payout Configs')} />
        <BeamEmptyState title={`No payout config with id ${id}`} description="It may have been removed." />
      </Stack>
    );
  }

  if (existing && mode === 'view') return <ViewForm key={existing.id} config={existing} onEdit={() => setMode('edit')} />;
  // Cancel exits EDIT → view of the same entity (never the list); /new has no view → the list.
  return <EditorForm key={id ?? 'new'} existing={existing} onCancel={existing ? () => setMode('view') : () => navigate('/payout-configs')} />;
}

/** Read-only view of a saved config — the row's record page. No editable affordance leaks. */
function ViewForm({ config, onEdit }: { config: PayoutConfig; onEdit: () => void }) {
  const navigate = useNavigate();
  const badge = statusBadge(config.status);
  // Probability total as a DISPLAY value — the editor shows it as a validation "Live Check"
  // (BeamStat + severity); in a saved, read-only view there is nothing to validate, so it reads
  // as a plain labelled total (severity would falsely imply live checking). Judgment call, reported.
  const total = config.rows.reduce((sum, r) => sum + r.probability, 0) * 100;
  const totalLabel = total.toLocaleString('en-US', { maximumFractionDigits: 4 });

  return (
    <Stack spacing={3}>
      <BeamPageHeader
        title={config.name}
        back={backTo(navigate, '/payout-configs', 'Payout Configs')}
        status={<BeamStatusBadge status={badge.status} label={badge.label} size="small" />}
        action={
          <Button variant="contained" startIcon={<EditIcon />} onClick={onEdit}>
            Edit
          </Button>
        }
      />
      <Stack spacing={2}>
        <Typography variant="subtitle2" color="text.secondary">
          Basic Information
        </Typography>
        <ReadField label="Name" value={config.name} />
        <ReadField label="Game Type" value={config.gameType} />
      </Stack>
      <Stack spacing={1}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'baseline' }}>
          <Typography variant="subtitle2" color="text.secondary">
            Payout rows
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total probability: {totalLabel}%
          </Typography>
        </Stack>
        <PayoutRowsGrid rows={config.rows} />
      </Stack>
    </Stack>
  );
}

/** A labelled read-only value — the view-mode field renderer (caption over value). */
function ReadField({ label, value }: { label: string; value: string | number }) {
  return (
    <Stack spacing={0.25} sx={{ minWidth: 160 }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2">{value}</Typography>
    </Stack>
  );
}

function EditorForm({ existing, onCancel }: { existing?: PayoutConfig; onCancel: () => void }) {
  const navigate = useNavigate();
  const isEdit = Boolean(existing);
  const [pendingCancel, setPendingCancel] = useState(false);

  const initialModel = useMemo<EditorModel>(
    () => (existing ? toEditorModel(existing) : emptyModel()),
    [existing]
  );
  const [model, setModel] = useState<EditorModel>(initialModel);
  const [touched, setTouched] = useState({ name: false, gameType: false });
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const originalSerialized = useMemo(() => serializeModel(initialModel), [initialModel]);
  const isDirty = serializeModel(model) !== originalSerialized;
  const savingRef = useRef(false);

  const v = validateModel(model, existing?.id);
  const saveLabel = isEdit ? 'Save' : 'Create';
  const saveReason =
    v.name ??
    v.gameType ??
    v.aggregate ??
    (v.rows.some((r) => r.winMessage || r.probability || r.rewards.some((x) => x.amount))
      ? 'Fix the highlighted fields.'
      : 'Complete the form.');

  // Unsaved-changes guard — same mechanism as UserEdit (data router + useBlocker).
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && !savingRef.current && currentLocation.pathname !== nextLocation.pathname
  );

  const save = () => {
    if (!v.valid) return;
    savingRef.current = true; // stop the blocker before we navigate
    const input = toDomainInput(model);
    if (existing) updatePayoutConfig(existing.id, input);
    else createPayoutConfig(input);
    navigate('/payout-configs');
  };

  // Cancel exits edit → view (onCancel), guarded by the SAME discard prompt as navigation: a dirty
  // mode-flip counts as the discard useBlocker protects. Clean cancel flips straight through.
  const requestCancel = () => (isDirty ? setPendingCancel(true) : onCancel());
  const keepEditing = () => { setPendingCancel(false); blocker.reset?.(); };
  const discard = () => { if (pendingCancel) { setPendingCancel(false); onCancel(); } else blocker.proceed?.(); };

  const badge = existing ? statusBadge(existing.status) : null;

  return (
    <Stack spacing={3}>
      <BeamPageHeader
        title={existing ? existing.name : 'Create Payout Config'}
        back={backTo(navigate, '/payout-configs', 'Payout Configs')}
        // Status is identity, under the title (§4) — not an action. Create mode
        // has no config yet; the "created as Disabled" subtitle carries it.
        status={badge ? <BeamStatusBadge status={badge.status} label={badge.label} size="small" /> : undefined}
        description={isEdit ? undefined : 'New configurations are created as Disabled.'}
        action={
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Button variant="text" onClick={requestCancel}>
              Cancel
            </Button>
            {/* Save gate: valid form AND total probability exactly 100%.
                aria-disabled (focusable + announced) + tooltip reason. */}
            <Tooltip title={v.valid ? '' : submitAttempted ? saveReason : 'Complete the form to continue.'}>
              <span>
                <Button
                  variant="contained"
                  aria-disabled={!v.valid || undefined}
                  aria-describedby={undefined}
                  onClick={() => {
                    setSubmitAttempted(true);
                    if (v.valid) save();
                  }}
                  sx={v.valid ? undefined : { opacity: 0.5 }}
                >
                  {saveLabel}
                </Button>
              </span>
            </Tooltip>
          </Stack>
        }
      />

      {/* Basic Information */}
      <Stack spacing={2}>
        <Typography variant="subtitle2" color="text.secondary">
          Basic Information
        </Typography>
        <TextField
          label="Name"
          required
          value={model.name}
          onChange={(e) => setModel((m) => ({ ...m, name: e.target.value }))}
          onBlur={() => setTouched((current) => ({ ...current, name: true }))}
          error={Boolean(v.name && (touched.name || submitAttempted))}
          helperText={touched.name || submitAttempted ? v.name : undefined}
          sx={{ maxWidth: 480 }}
          slotProps={{ htmlInput: { maxLength: MAX_NAME } }}
        />
        {isEdit ? (
          <TextField
            label="Game Type"
            value={model.gameType}
            disabled
            sx={{ maxWidth: 480 }}
            helperText="Game type can't be changed after creation."
          />
        ) : (
          <TextField
            select
            label="Game Type"
            required
            value={model.gameType}
            onChange={(e) => setModel((m) => ({ ...m, gameType: e.target.value as GameType }))}
            onBlur={() => setTouched((current) => ({ ...current, gameType: true }))}
            error={Boolean(v.gameType && (touched.gameType || submitAttempted))}
            helperText={touched.gameType || submitAttempted ? v.gameType : undefined}
            sx={{ maxWidth: 480 }}
          >
            {GAME_TYPES.map((g) => (
              <MenuItem key={g} value={g}>
                {g}
              </MenuItem>
            ))}
          </TextField>
        )}
      </Stack>

      <PayoutRowsEditor
        rows={model.rows}
        onChange={(rows) => setModel((m) => ({ ...m, rows }))}
        showAllErrors={submitAttempted}
      />

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
