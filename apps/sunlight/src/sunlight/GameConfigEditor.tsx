import { useMemo, useRef, useState } from 'react';
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
  BeamPageHeader,
  BeamStatusBadge,
  BeamStat,
  BeamField,
  DetailsPanel,
  BeamEmptyState,
} from '@betty/beam';
import EditIcon from '@mui/icons-material/EditRounded';
import { backTo } from './backTo';
import { TargetingRulesEditor } from './TargetingRulesEditor';
import { TargetingRulesGrid } from './TargetingRulesGrid';
import { GAME_TYPES, statusBadge, type GameType } from './payoutConfigs';
import { getGameConfig, createGameConfig, updateGameConfig, type GameConfig } from './gameConfigs';
import {
  MAX_GC_NAME,
  emptyModel,
  toEditorModel,
  toDomainInput,
  serializeModel,
  validateModel,
  type EditorModel,
} from './gameConfigForm';

/**
 * Game Config detail page (spec: docs/specs/game-config-editor-spec.md). VIEW-FIRST
 * like every detail route (approval-flow §6, ratified 2026-08-11): a `:id` opens
 * read-only, **Edit** flips to the editor; `/new` opens straight in create mode.
 *
 * The divergence is now SAVE-MODEL ONLY: this is a DIRECT-WRITE editor ([Cancel] [Save],
 * applies live, no change request) — the MetaGame default — that onboards the CR save
 * model later via approval-flow §8. The view-first posture is already shared. Cancel +
 * Save stay in the header actions slot (grammar §4); status chip below the title.
 *
 * Scaffold plain — spacing / pigment is Deyan's bench pass.
 */
export function GameConfigEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const existing = id ? getGameConfig(id) : undefined;
  const editIntent = (location.state as { edit?: boolean } | null)?.edit;
  const [mode, setMode] = useState<'view' | 'edit'>(editIntent ? 'edit' : 'view');

  if (id && !existing) {
    return (
      <Stack spacing={3}>
        <BeamPageHeader title={`Config ${id}`} back={backTo(navigate, '/game-configs', 'Game Configs')} />
        <BeamEmptyState title={`No game config with id ${id}`} description="It may have been removed." />
      </Stack>
    );
  }

  if (existing && mode === 'view') return <ViewForm key={existing.id} config={existing} onEdit={() => setMode('edit')} />;
  // Cancel exits EDIT → view of the same entity (never the list); /new has no view → the list.
  return <EditorForm key={id ?? 'new'} existing={existing} onCancel={existing ? () => setMode('view') : () => navigate('/game-configs')} />;
}

/** Read-only view of a saved game config — no editable affordance leaks. */
function ViewForm({ config, onEdit }: { config: GameConfig; onEdit: () => void }) {
  const navigate = useNavigate();
  const badge = statusBadge(config.status);
  return (
    <Stack spacing={3}>
      <BeamPageHeader
        title={config.code}
        back={backTo(navigate, '/game-configs', 'Game Configs')}
        status={<BeamStatusBadge status={badge.status} label={badge.label} size="small" />}
        action={
          <Button variant="contained" startIcon={<EditIcon />} onClick={onEdit}>
            Edit
          </Button>
        }
      />
      {/* The details panel (grammar §2), view mode — first field region, unlabeled. */}
      <DetailsPanel aria-label="Basic information">
        <BeamStat label="Name" value={config.code} />
        <BeamStat label="Game Type" value={config.gameType} />
      </DetailsPanel>
      <Stack spacing={1}>
        <Typography variant="subtitle2" color="text.secondary">
          Targeting rules
        </Typography>
        <TargetingRulesGrid rules={config.targetingRules} />
      </Stack>
    </Stack>
  );
}

function EditorForm({ existing, onCancel }: { existing?: GameConfig; onCancel: () => void }) {
  const navigate = useNavigate();
  const isEdit = Boolean(existing);
  const [pendingCancel, setPendingCancel] = useState(false);

  const initialModel = useMemo<EditorModel>(
    () => (existing ? toEditorModel(existing) : emptyModel()),
    [existing]
  );
  const [model, setModel] = useState<EditorModel>(initialModel);
  const [touched, setTouched] = useState({ code: false, gameType: false });
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const originalSerialized = useMemo(() => serializeModel(initialModel), [initialModel]);
  const isDirty = serializeModel(model) !== originalSerialized;
  const savingRef = useRef(false);

  const v = validateModel(model, existing?.id);
  const saveLabel = isEdit ? 'Save' : 'Create';
  const saveReason =
    v.code ??
    v.gameType ??
    (v.rules.some((r) => r.payoutConfig || r.condition) ? 'Fix the highlighted rules.' : undefined) ??
    v.fallback ??
    'Complete the form.';

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && !savingRef.current && currentLocation.pathname !== nextLocation.pathname
  );

  const save = () => {
    if (!v.valid) return;
    savingRef.current = true;
    const input = toDomainInput(model);
    if (existing) updateGameConfig(existing.id, input);
    else createGameConfig(input);
    navigate('/game-configs');
  };

  // Cancel exits edit → view (onCancel), guarded by the SAME discard prompt as navigation.
  const requestCancel = () => (isDirty ? setPendingCancel(true) : onCancel());
  const keepEditing = () => { setPendingCancel(false); blocker.reset?.(); };
  const discard = () => { if (pendingCancel) { setPendingCancel(false); onCancel(); } else blocker.proceed?.(); };

  const badge = existing ? statusBadge(existing.status) : null;

  return (
    <Stack spacing={3}>
      <BeamPageHeader
        title={existing ? existing.code : 'Create Game Config'}
        back={backTo(navigate, '/game-configs', 'Game Configs')}
        status={badge ? <BeamStatusBadge status={badge.status} label={badge.label} size="small" /> : undefined}
        description={isEdit ? undefined : 'New configurations are created as Disabled.'}
        action={
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Button variant="text" onClick={requestCancel}>
              Cancel
            </Button>
            <Tooltip title={v.valid ? '' : submitAttempted ? saveReason : 'Complete the form to continue.'}>
              <span>
                <Button
                  variant="contained"
                  aria-disabled={!v.valid || undefined}
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
          value={model.code}
          onChange={(e) => setModel((m) => ({ ...m, code: e.target.value }))}
          onBlur={() => setTouched((current) => ({ ...current, code: true }))}
          error={Boolean(v.code) && (touched.code || submitAttempted)}
          helperText={touched.code || submitAttempted ? v.code : undefined}
          slotProps={{ htmlInput: { maxLength: MAX_GC_NAME } }}
        />
        {isEdit ? (
          <BeamField
            label="Game Type"
            value={model.gameType}
            disabled
            helperText="Game type can't be changed after creation."
          />
        ) : (
          <BeamField
            select
            label="Game Type"
            required
            value={model.gameType}
            onChange={(e) => setModel((m) => ({ ...m, gameType: e.target.value as GameType }))}
            onBlur={() => setTouched((current) => ({ ...current, gameType: true }))}
            error={Boolean(v.gameType) && (touched.gameType || submitAttempted)}
            helperText={
              (touched.gameType || submitAttempted) && v.gameType
                ? v.gameType
                : 'Payout Config options filter by game type.'
            }
          >
            {GAME_TYPES.map((g) => (
              <MenuItem key={g} value={g}>
                {g}
              </MenuItem>
            ))}
          </BeamField>
        )}
      </DetailsPanel>

      <TargetingRulesEditor value={model} onChange={setModel} showAllErrors={submitAttempted} />

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
