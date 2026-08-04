import { useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useBlocker } from 'react-router-dom';
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
import { backTo } from './backTo';
import { TargetingRulesEditor } from './TargetingRulesEditor';
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
 * Game Config Create / Edit page (spec: docs/specs/game-config-editor-spec.md).
 * Create + Edit only — no view mode (MetaGame default). Cancel + Create/Save in
 * the header actions slot (grammar §4); status chip below the title (identity).
 *
 * Scaffold plain — spacing / pigment is Deyan's bench pass.
 */
export function GameConfigEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const existing = id ? getGameConfig(id) : undefined;

  if (id && !existing) {
    return (
      <Stack spacing={3}>
        <BeamPageHeader title={`Config ${id}`} back={backTo(navigate, '/game-configs', 'Game Configs')} />
        <BeamEmptyState title={`No game config with id ${id}`} description="It may have been removed." />
      </Stack>
    );
  }

  return <EditorForm key={id ?? 'new'} existing={existing} />;
}

function EditorForm({ existing }: { existing?: GameConfig }) {
  const navigate = useNavigate();
  const isEdit = Boolean(existing);

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
            <Button variant="text" onClick={() => navigate('/game-configs')}>
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

      {/* Basic Information */}
      <Stack spacing={2}>
        <Typography variant="subtitle2" color="text.secondary">
          Basic Information
        </Typography>
        <TextField
          label="Name"
          required
          value={model.code}
          onChange={(e) => setModel((m) => ({ ...m, code: e.target.value }))}
          onBlur={() => setTouched((current) => ({ ...current, code: true }))}
          error={Boolean(v.code) && (touched.code || submitAttempted)}
          helperText={touched.code || submitAttempted ? v.code : undefined}
          sx={{ maxWidth: 480 }}
          slotProps={{ htmlInput: { maxLength: MAX_GC_NAME } }}
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
            error={Boolean(v.gameType) && (touched.gameType || submitAttempted)}
            helperText={
              (touched.gameType || submitAttempted) && v.gameType
                ? v.gameType
                : 'Payout Config options filter by game type.'
            }
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

      <TargetingRulesEditor value={model} onChange={setModel} showAllErrors={submitAttempted} />

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
