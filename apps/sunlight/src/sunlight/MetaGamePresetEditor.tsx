import { useMemo, useRef, useState } from 'react';
import { useBlocker, useNavigate, useParams, useLocation } from 'react-router-dom';
import EditIcon from '@mui/icons-material/EditRounded';
import {
  BeamEmptyState,
  BeamPageHeader,
  BeamStatusBadge,
  BeamStat,
  BeamField,
  DetailsPanel,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
} from '@betty/beam';
import { backTo } from './backTo';
import { GAME_CONFIGS } from './gameConfigs';
import {
  PRESET_USE_CASES,
  PRESET_VOLATILITIES,
  createMetaGamePreset,
  getMetaGamePreset,
  updateMetaGamePreset,
  type MetaGamePreset,
  type PresetUseCase,
} from './metaGamePresets';
import {
  canChangePresetSource,
  emptyPresetModel,
  gameConfigForId,
  gameTypeFromGameConfig,
  isPreviewableImageUrl,
  normalizePresetUseCases,
  presetGameConfigOptions,
  presetModelToInput,
  presetToEditorModel,
  shouldShowPresetError,
  validatePresetModel,
  type PresetEditorModel,
  type PresetSource,
} from './metaGamePresetHelpers';
import { GAME_TYPES, statusBadge, type GameType } from './payoutConfigs';
import { PresetImagePreview } from './PresetImagePreview';

type TouchedField = 'displayName' | 'gameConfigId' | 'gameType' | 'configCode' | 'expiryHours';

/**
 * MetaGame Preset detail page. VIEW-FIRST like every detail route (approval-flow §6,
 * ratified 2026-08-11): a `:id` opens read-only, **Edit** flips to the editor; `/new`
 * opens straight in create mode. The divergence is now SAVE-MODEL ONLY — a DIRECT-WRITE
 * editor ([Cancel] [Save], applies live) that onboards the CR save model later via §8;
 * the view-first posture is already shared.
 */
export function MetaGamePresetEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const existing = id ? getMetaGamePreset(id) : undefined;
  const editIntent = (location.state as { edit?: boolean } | null)?.edit;
  const [mode, setMode] = useState<'view' | 'edit'>(editIntent ? 'edit' : 'view');

  if (id && !existing) {
    return (
      <Stack spacing={3}>
        <BeamPageHeader title={`Preset ${id}`} back={backTo(navigate, '/meta-game-presets', 'MetaGame Presets')} />
        <BeamEmptyState title={`No preset with id ${id}`} description="It may have been removed." />
      </Stack>
    );
  }

  if (existing && mode === 'view') return <PresetView key={existing.id} preset={existing} onEdit={() => setMode('edit')} />;
  // Cancel exits EDIT → view of the same entity (never the list); /new has no view → the list.
  return <PresetForm key={id ?? 'new'} existing={existing} onCancel={existing ? () => setMode('view') : () => navigate('/meta-game-presets')} />;
}

/** Read-only view of a saved preset — fields as text + image preview. No editable affordance leaks.
 *  Derives display values through the same `presetToEditorModel` seam the editor uses. */
function PresetView({ preset, onEdit }: { preset: MetaGamePreset; onEdit: () => void }) {
  const navigate = useNavigate();
  const model = presetToEditorModel(preset);
  const badge = statusBadge(preset.status);
  const gameConfig = gameConfigForId(GAME_CONFIGS, model.gameConfigId);

  return (
    <Stack spacing={3}>
      <BeamPageHeader
        title={preset.displayName}
        back={backTo(navigate, '/meta-game-presets', 'MetaGame Presets')}
        status={<BeamStatusBadge status={badge.status} label={badge.label} size="small" />}
        action={
          <Button variant="contained" startIcon={<EditIcon />} onClick={onEdit}>
            Edit
          </Button>
        }
      />
      {/* Configuration Source stays a titled, distinct region — it's the mode selector that governs
          the rest (an immutable-after-creation choice), not just another field. */}
      <Stack spacing={2}>
        <Typography variant="subtitle2" color="text.secondary">Configuration Source</Typography>
        <DetailsPanel aria-label="Configuration source">
          <BeamStat label="Source" value={model.source === 'Betty' ? 'Betty GameConfig' : 'Legacy Yoda'} />
        </DetailsPanel>
      </Stack>
      {/* The details panel (grammar §2), view mode — the preset's own fields, unlabeled. */}
      <DetailsPanel aria-label="Preset details">
        <BeamStat label="Display Name" value={model.displayName || '—'} />
        {model.source === 'Betty' ? (
          <BeamStat label="GameConfig" value={gameConfig ? `${gameConfig.code} — ${gameConfig.gameType} — ${gameConfig.status}` : model.gameConfigId || '—'} />
        ) : (
          <BeamStat label="Config Code" value={model.configCode || '—'} />
        )}
        <BeamStat label="Game Type" value={model.gameType || '—'} />
        <BeamStat label="Skin ID" value={model.skinId || '—'} />
        <BeamStat label="Image URL" value={model.imageUrl || '—'} />
        <BeamStat label="Volatility" value={model.volatility || 'Not set'} />
        <BeamStat label="Use Cases" value={model.useCases.join(', ') || '—'} />
        <BeamStat label="Expiry Hours" value={model.expiryHours || '—'} />
        {isPreviewableImageUrl(model.imageUrl) && (
          <Box sx={{ gridColumn: '1 / -1' }}>
            <PresetImagePreview imageUrl={model.imageUrl} alt="Preset preview" width={180} />
          </Box>
        )}
      </DetailsPanel>
    </Stack>
  );
}

function PresetForm({ existing, onCancel }: { existing?: MetaGamePreset; onCancel: () => void }) {
  const navigate = useNavigate();
  const isEdit = Boolean(existing);
  const [pendingCancel, setPendingCancel] = useState(false);
  const initialModel = useMemo(
    () => (existing ? presetToEditorModel(existing) : emptyPresetModel()),
    [existing]
  );
  const [model, setModel] = useState<PresetEditorModel>(initialModel);
  const [touched, setTouched] = useState<Partial<Record<TouchedField, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const savingRef = useRef(false);
  const originalSerialized = useMemo(() => JSON.stringify(initialModel), [initialModel]);
  const isDirty = JSON.stringify(model) !== originalSerialized;
  const validation = validatePresetModel(model, GAME_CONFIGS);
  const selectedGameConfig = gameConfigForId(GAME_CONFIGS, model.gameConfigId);
  const gameConfigOptions = presetGameConfigOptions(GAME_CONFIGS, model, isEdit);
  const canChangeSource = canChangePresetSource(isEdit);
  const saveLabel = isEdit ? 'Save' : 'Create';

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && !savingRef.current && currentLocation.pathname !== nextLocation.pathname
  );

  const markTouched = (field: TouchedField) =>
    setTouched((current) => ({ ...current, [field]: true }));
  const showError = (field: TouchedField) =>
    shouldShowPresetError(Boolean(touched[field]), submitAttempted);

  const selectSource = (source: PresetSource) => {
    if (!canChangeSource || source === model.source) return;
    setModel((current) => ({
      ...current,
      source,
      gameConfigId: '',
      gameType: '',
      configCode: '',
    }));
    setTouched({});
  };

  const selectGameConfig = (gameConfigId: string) => {
    markTouched('gameConfigId');
    setModel((current) => ({
      ...current,
      gameConfigId,
      gameType: gameTypeFromGameConfig(GAME_CONFIGS, gameConfigId),
    }));
  };

  const save = () => {
    if (!validation.valid) return;
    savingRef.current = true;
    const input = presetModelToInput(model, GAME_CONFIGS);
    if (existing) updateMetaGamePreset(existing.id, input);
    else createMetaGamePreset(input);
    navigate('/meta-game-presets');
  };

  // Cancel exits edit → view (onCancel), guarded by the SAME discard prompt as navigation.
  const requestCancel = () => (isDirty ? setPendingCancel(true) : onCancel());
  const keepEditing = () => { setPendingCancel(false); blocker.reset?.(); };
  const discard = () => { if (pendingCancel) { setPendingCancel(false); onCancel(); } else blocker.proceed?.(); };

  const invalidReason =
    validation.displayName ??
    validation.gameConfigId ??
    validation.gameType ??
    validation.configCode ??
    validation.expiryHours ??
    'Complete the form.';
  const badge = existing ? statusBadge(existing.status) : null;
  const disabledGameConfigWarning =
    selectedGameConfig?.status === 'Disabled'
      ? 'This GameConfig must be enabled before the Preset can be used by the game engine.'
      : undefined;

  return (
    <Stack spacing={3}>
      <BeamPageHeader
        title={existing ? existing.displayName : 'Create MetaGame Preset'}
        back={backTo(navigate, '/meta-game-presets', 'MetaGame Presets')}
        status={badge ? <BeamStatusBadge status={badge.status} label={badge.label} size="small" /> : undefined}
        description={isEdit ? undefined : 'New presets are created as Disabled.'}
        action={
          <Stack direction="row" spacing={1}>
            <Button variant="text" onClick={requestCancel}>Cancel</Button>
            <Tooltip title={validation.valid ? '' : submitAttempted ? invalidReason : 'Complete the form to continue.'}>
              <span>
                <Button
                  variant="contained"
                  aria-disabled={!validation.valid || undefined}
                  sx={validation.valid ? undefined : { opacity: 0.5 }}
                  onClick={() => {
                    setSubmitAttempted(true);
                    if (validation.valid) save();
                  }}
                >
                  {saveLabel}
                </Button>
              </span>
            </Tooltip>
          </Stack>
        }
      />

      <Stack spacing={2} sx={{ maxWidth: 720 }}>
        <Typography variant="subtitle2" color="text.secondary">Configuration Source</Typography>
        <Stack
          direction="row"
          role="group"
          aria-label="Configuration Source"
          sx={{ width: 'fit-content', '& > button:first-of-type': { borderTopRightRadius: 0, borderBottomRightRadius: 0 }, '& > button:last-of-type': { borderTopLeftRadius: 0, borderBottomLeftRadius: 0 } }}
        >
          <Button
            variant={model.source === 'Betty' ? 'contained' : 'outlined'}
            aria-pressed={model.source === 'Betty'}
            disabled={!canChangeSource}
            onClick={() => selectSource('Betty')}
          >
            Betty GameConfig
          </Button>
          <Button
            variant={model.source === 'Yoda' ? 'contained' : 'outlined'}
            aria-pressed={model.source === 'Yoda'}
            disabled={!canChangeSource}
            onClick={() => selectSource('Yoda')}
          >
            Legacy Yoda
          </Button>
        </Stack>
        {isEdit && (
          <Typography variant="body2" color="text.secondary">
            Configuration Source can't be changed after creation.
          </Typography>
        )}
      </Stack>

      {/* The details panel (grammar §2), edit mode — the preset's fields, unlabeled. Non-field
          auxiliaries (warnings, notes, image preview) span the full row. */}
      <DetailsPanel aria-label="Preset details">
        <BeamField
          label="Display Name"
          required
          value={model.displayName}
          onChange={(event) => setModel((current) => ({ ...current, displayName: event.target.value }))}
          onBlur={() => markTouched('displayName')}
          error={showError('displayName') && Boolean(validation.displayName)}
          helperText={showError('displayName') ? validation.displayName : undefined}
        />

        {model.source === 'Betty' ? (
          <>
            <BeamField
              select
              label="GameConfig"
              required
              value={model.gameConfigId}
              onChange={(event) => selectGameConfig(event.target.value)}
              onBlur={() => markTouched('gameConfigId')}
              error={showError('gameConfigId') && Boolean(validation.gameConfigId)}
              helperText={showError('gameConfigId') ? validation.gameConfigId : undefined}
            >
              {gameConfigOptions.map((config) => (
                <MenuItem key={config.id} value={config.id}>
                  {config.code} — {config.gameType} — {config.status}
                </MenuItem>
              ))}
            </BeamField>
            {disabledGameConfigWarning && (
              <Typography variant="body2" color="warning.main" role="status" sx={{ gridColumn: '1 / -1' }}>
                {disabledGameConfigWarning}
              </Typography>
            )}
            <BeamField
              label="Game Type"
              value={model.gameType}
              disabled
              helperText="Derived from the selected GameConfig."
            />
          </>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ gridColumn: '1 / -1' }}>
              Legacy Yoda remains responsible for the gameplay configuration.
            </Typography>
            <BeamField
              select
              label="Game Type"
              required
              value={model.gameType}
              onChange={(event) => setModel((current) => ({ ...current, gameType: event.target.value as GameType }))}
              onBlur={() => markTouched('gameType')}
              error={showError('gameType') && Boolean(validation.gameType)}
              helperText={showError('gameType') ? validation.gameType : undefined}
            >
              {GAME_TYPES.map((gameType) => <MenuItem key={gameType} value={gameType}>{gameType}</MenuItem>)}
            </BeamField>
            <BeamField
              label="Config Code"
              required
              value={model.configCode}
              onChange={(event) => setModel((current) => ({ ...current, configCode: event.target.value }))}
              onBlur={() => markTouched('configCode')}
              error={showError('configCode') && Boolean(validation.configCode)}
              helperText={showError('configCode') ? validation.configCode : undefined}
            />
          </>
        )}

        <BeamField label="Skin ID" value={model.skinId} onChange={(event) => setModel((current) => ({ ...current, skinId: event.target.value }))} />
        <BeamField label="Image URL" value={model.imageUrl} onChange={(event) => setModel((current) => ({ ...current, imageUrl: event.target.value }))} />
        {isPreviewableImageUrl(model.imageUrl) && (
          <Box sx={{ gridColumn: '1 / -1' }}>
            <PresetImagePreview imageUrl={model.imageUrl} alt="Preset preview" width={180} />
          </Box>
        )}
        <BeamField select label="Volatility" value={model.volatility} onChange={(event) => setModel((current) => ({ ...current, volatility: event.target.value as PresetEditorModel['volatility'] }))}>
          <MenuItem value="">Not set</MenuItem>
          {PRESET_VOLATILITIES.map((volatility) => <MenuItem key={volatility} value={volatility}>{volatility}</MenuItem>)}
        </BeamField>
        <BeamField
          select
          label="Use Cases"
          value={model.useCases}
          onChange={(event) => {
            const next = event.target.value as unknown as PresetUseCase[];
            setModel((current) => ({
              ...current,
              useCases: normalizePresetUseCases(current.useCases, next),
            }));
          }}
          slotProps={{ select: { multiple: true, renderValue: (selected) => (selected as PresetUseCase[]).join(', ') } }}
        >
          {PRESET_USE_CASES.map((useCase) => <MenuItem key={useCase} value={useCase}>{useCase}</MenuItem>)}
        </BeamField>
        <BeamField
          label="Expiry Hours"
          type="number"
          value={model.expiryHours}
          onChange={(event) => setModel((current) => ({ ...current, expiryHours: event.target.value }))}
          onBlur={() => markTouched('expiryHours')}
          error={showError('expiryHours') && Boolean(validation.expiryHours)}
          helperText={showError('expiryHours') ? validation.expiryHours : 'Optional positive whole number.'}
          slotProps={{ htmlInput: { min: 1, step: 1 } }}
        />
      </DetailsPanel>

      <Dialog open={blocker.state === 'blocked' || pendingCancel} onClose={keepEditing}>
        <DialogTitle>Discard changes?</DialogTitle>
        <DialogContent><Typography>You have unsaved changes. Leaving this page will discard them.</Typography></DialogContent>
        <DialogActions>
          <Button onClick={keepEditing}>Keep editing</Button>
          <Button color="error" onClick={discard}>Discard</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
