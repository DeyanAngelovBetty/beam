import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useParams, useNavigate, useLocation, useBlocker } from 'react-router-dom';
import {
  Stack,
  Button,
  MenuItem,
  Tooltip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  BeamPage,
  BeamStatusBadge,
  BeamStat,
  BeamField,
  DetailsPanel,
  BeamEmptyState,
} from '@betty/beam';
import EditIcon from '@mui/icons-material/EditRounded';
import { backTo } from './backTo';
import { PayoutRowsEditor } from './PayoutRowsEditor';
import { PayoutRowsGrid } from './PayoutRowsGrid';
import { MultiplierRowsEditor } from './MultiplierRowsEditor';
import { MultiplierRowsGrid } from './MultiplierRowsGrid';
import {
  GAME_TYPES,
  gameTypeLabel,
  isOrderablePayout,
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
  withGameType,
  type EditorModel,
  type EditorRow,
  type EditorMultiplierRow,
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
        <BeamPage title={`Config ${id}`} back={backTo(navigate, '/payout-configs', 'Payout Configs')} />
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

  return (
    <Stack spacing={3}>
      <BeamPage
        title={config.name}
        back={backTo(navigate, '/payout-configs', 'Payout Configs')}
        subtitle={<BeamStatusBadge status={badge.status} label={badge.label} size="small" />}
        action={
          <Button variant="contained" startIcon={<EditIcon />} onClick={onEdit}>
            Edit
          </Button>
        }
      />
      {/* The details panel (grammar §2), view mode — first field region, unlabeled. */}
      <DetailsPanel aria-label="Basic information">
        <BeamStat label="Name" value={config.name} />
        <BeamStat label="Game Type" value={gameTypeLabel(config.gameType)} />
      </DetailsPanel>
      {/* Each grid now owns its own bleed Section (title + TOTAL-only toolbar stat) — the page just
          places them; the read-only "total as plain labelled value, no severity" judgment lives in the
          grid (a saved record has nothing to live-validate). */}
      {config.gameType === 'BettyMultiplierMadness' ? (
        <DetailsPanel aria-label="Payout configuration"><BeamStat label="RTP" value={`${config.rtp * 100}%`} /></DetailsPanel>
      ) : config.gameType === 'BettyWheelOfWins' ? (
        <>
          <PayoutRowsGrid rows={config.payoutRows} orderable />
          <MultiplierRowsGrid rows={config.multiplierRows} />
        </>
      ) : (
        <PayoutRowsGrid
          rows={config.rows}
          orderable={isOrderablePayout(config.gameType)}
          showTopPrize={config.gameType === 'BettyScratcher'}
        />
      )}
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
  const hasPayoutFieldError = v.rows.some(
    (row) => row.winMessage || row.probability || row.rewards.some((reward) => reward.amount),
  );
  const hasMultiplierFieldError = v.multiplier?.rows.some(
    (row) => row.probability || row.multiplier,
  );
  const saveReason =
    v.name ??
    v.gameType ??
    v.rtp ??
    v.configuration ??
    v.aggregate ??
    v.multiplier?.aggregate ??
    (hasPayoutFieldError || hasMultiplierFieldError
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

  const changeRtp = (event: ChangeEvent<HTMLInputElement>) => {
    const rtpPct = event.target.value;
    setModel(current => current.gameType === 'BettyMultiplierMadness' ? { ...current, rtpPct } : current);
  };
  const changePayoutRows = (payoutRows: EditorRow[]) => setModel(current => ({ ...current, payoutRows }));
  const changeMultiplierRows = (multiplierRows: EditorMultiplierRow[]) =>
    setModel(current => current.gameType === 'BettyWheelOfWins' ? { ...current, multiplierRows } : current);

  const badge = existing ? statusBadge(existing.status) : null;

  return (
    <Stack spacing={3}>
      <BeamPage
        title={existing ? existing.name : 'Create Payout Config'}
        back={backTo(navigate, '/payout-configs', 'Payout Configs')}
        // Subtitle: the status badge in edit (identity), or the "created as Disabled" note in create.
        subtitle={badge ? <BeamStatusBadge status={badge.status} label={badge.label} size="small" /> : isEdit ? undefined : 'New configurations are created as Disabled.'}
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

      {/* The details panel (grammar §2), edit mode — first field region, unlabeled. */}
      <DetailsPanel aria-label="Basic information">
        <BeamField
          label="Name"
          required
          value={model.name}
          onChange={(e) => setModel((m) => ({ ...m, name: e.target.value }))}
          onBlur={() => setTouched((current) => ({ ...current, name: true }))}
          error={Boolean(v.name && (touched.name || submitAttempted))}
          helperText={touched.name || submitAttempted ? v.name : undefined}
          slotProps={{ htmlInput: { maxLength: MAX_NAME } }}
        />
        {isEdit ? (
          // Add-time-fixed (BEAM.md §6, the CJ ruling): game type is chosen at creation and never
          // changes, so edit shows it as STATIC TEXT — a BeamStat (the field twin's view half) + the
          // helper as its caption — NOT a disabled input (disabled reads as "editable, just not now").
          <BeamStat
            label="Game Type"
            value={model.gameType ? gameTypeLabel(model.gameType) : ''}
            caption="Game type can't be changed after creation."
            showCaption
          />
        ) : (
          <BeamField
            select
            label="Game Type"
            required
            value={model.gameType}
            onChange={(e) => setModel((current) => withGameType(current, e.target.value as GameType))}
            onBlur={() => setTouched((current) => ({ ...current, gameType: true }))}
            error={Boolean(v.gameType && (touched.gameType || submitAttempted))}
            helperText={touched.gameType || submitAttempted ? v.gameType : undefined}
          >
            {GAME_TYPES.map((g) => (
              <MenuItem key={g} value={g}>
                {gameTypeLabel(g)}
              </MenuItem>
            ))}
          </BeamField>
        )}
      </DetailsPanel>

      {model.gameType === 'BettyMultiplierMadness' ? (
        <DetailsPanel aria-label="Payout configuration">
          <BeamField label="RTP (%)" required value={model.rtpPct}
            onChange={changeRtp} error={submitAttempted && Boolean(v.rtp)}
            helperText={submitAttempted && v.rtp ? v.rtp : 'Greater than 0%, up to 100%. Example: 97.'}
            slotProps={{ htmlInput: { inputMode: 'decimal' } }} />
        </DetailsPanel>
      ) : (
        <PayoutRowsEditor rows={model.payoutRows} onChange={changePayoutRows}
          showAllErrors={submitAttempted} orderable={isOrderablePayout(model.gameType)}
          showTopPrize={model.gameType === 'BettyScratcher'} />
      )}
      {v.configuration && <Typography variant="body2" color={submitAttempted ? 'error' : 'text.secondary'} role="status">{v.configuration}</Typography>}
      {model.gameType === 'BettyWheelOfWins' && (
        <MultiplierRowsEditor rows={model.multiplierRows} onChange={changeMultiplierRows} showAllErrors={submitAttempted} />
      )}

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
