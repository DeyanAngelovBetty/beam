import { useRef, useState, type ChangeEvent } from 'react';
import { useBlocker, useLocation, useNavigate, useParams } from 'react-router-dom';
import EditIcon from '@mui/icons-material/EditRounded';
import { BeamEmptyState, BeamField, BeamPage, BeamStat, Button, DetailsPanel, Dialog, DialogActions,
  DialogContent, DialogTitle, MenuItem, Stack, Typography } from '@betty/beam';
import { backTo } from './backTo';
import { gameTypeLabel } from './payoutConfigs';
import { CHAINED_EXPERIENCES, CHAIN_SOURCE_TYPES, formatChainDate, presetLabel, saveChainedExperience,
  sourcePresetOptions, targetPresetOptions, validateChainedExperience,
  type ChainedExperience, type ChainedExperienceInput, type SourceGameType } from './chainedExperiences';

export function ChainedExperienceEditor() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const existing = CHAINED_EXPERIENCES.find(experience => experience.id === id);
  const editIntent = Boolean((location.state as { edit?: boolean } | null)?.edit);
  const key = `${id ?? 'new'}:${editIntent}`;
  if (id && !existing) {
    return <Stack spacing={3}><BeamPage title="Chained Experience" back={backTo(navigate, '/chained-experiences', 'Chained Experiences')} />
      <BeamEmptyState title="Experience not found" description="Return to the list to select an existing experience." /></Stack>;
  }
  return <ExperienceForm key={key} existing={existing} initialEdit={editIntent || !existing} />;
}

function ExperienceForm({ existing, initialEdit }: { existing?: ChainedExperience; initialEdit: boolean }) {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(initialEdit);
  const [model, setModel] = useState<ChainedExperienceInput>(() => existing ? { ...existing } : {
    sourceGameType: 'BettyWheel', sourcePresetId: null, targetGameType: 'BettyMultiplierMadness',
    targetPresetId: '', startDate: '', endDate: '',
  });
  const initial = useRef(JSON.stringify(model));
  const saving = useRef(false);
  const [submitted, setSubmitted] = useState(false);
  const [pendingCancel, setPendingCancel] = useState(false);
  const dirty = editing && JSON.stringify(model) !== initial.current;
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && !saving.current && currentLocation.pathname !== nextLocation.pathname);
  const errors = validateChainedExperience(model, existing?.id);
  const sources = sourcePresetOptions(model.sourceGameType);
  const targets = targetPresetOptions();
  const sourceChange = (event: ChangeEvent<HTMLInputElement>) => {
    const sourceGameType = event.target.value as SourceGameType;
    setModel(current => ({ ...current, sourceGameType, sourcePresetId: null }));
  };
  const sourcePresetChange = (event: ChangeEvent<HTMLInputElement>) => {
    const sourcePresetId = event.target.value || null;
    setModel(current => ({ ...current, sourcePresetId }));
  };
  const targetChange = (event: ChangeEvent<HTMLInputElement>) => {
    const targetPresetId = event.target.value;
    setModel(current => ({ ...current, targetPresetId }));
  };
  const startChange = (event: ChangeEvent<HTMLInputElement>) => {
    const startDate = event.target.value ? `${event.target.value}Z` : '';
    setModel(current => ({ ...current, startDate }));
  };
  const endChange = (event: ChangeEvent<HTMLInputElement>) => {
    const endDate = event.target.value ? `${event.target.value}Z` : '';
    setModel(current => ({ ...current, endDate }));
  };
  const edit = () => setEditing(true);
  const cancel = () => {
    if (existing) { setModel({ ...existing }); setEditing(false); setSubmitted(false); }
    else navigate('/chained-experiences');
  };
  const requestCancel = () => dirty ? setPendingCancel(true) : cancel();
  const keepEditing = () => { setPendingCancel(false); blocker.reset?.(); };
  const discard = () => {
    if (pendingCancel) { setPendingCancel(false); cancel(); }
    else blocker.proceed?.();
  };
  const save = () => {
    setSubmitted(true);
    if (Object.keys(errors).length) return;
    saveChainedExperience({
      ...model, startDate: new Date(model.startDate).toISOString(), endDate: new Date(model.endDate).toISOString(),
    }, existing?.id);
    saving.current = true;
    navigate('/chained-experiences');
  };
  const title = existing ? `${gameTypeLabel(existing.sourceGameType)} → Multiplier Madness` : 'Create Chained Experience';
  return (
    <Stack spacing={3}>
      <BeamPage title={title} back={backTo(navigate, '/chained-experiences', 'Chained Experiences')}
        action={editing ? <Stack direction="row" spacing={1}><Button onClick={requestCancel}>Cancel</Button>
          <Button variant="contained" onClick={save}>{existing ? 'Save' : 'Create'}</Button></Stack>
          : <Button variant="contained" startIcon={<EditIcon />} onClick={edit}>Edit</Button>} />
      {editing ? (
        <DetailsPanel aria-label="Chained experience configuration" minColumnWidth={320}>
          <BeamField select required label="Source Game" value={model.sourceGameType} onChange={sourceChange}>
            {CHAIN_SOURCE_TYPES.map(type => <MenuItem key={type} value={type}>{gameTypeLabel(type)}</MenuItem>)}
          </BeamField>
          <BeamField select label="Source Preset" value={model.sourcePresetId ?? ''} onChange={sourcePresetChange}
            slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
            error={submitted && Boolean(errors.sourcePresetId)}
            helperText={submitted && errors.sourcePresetId ? errors.sourcePresetId : 'Without preset matches only games created without a preset; it does not match all presets.'}>
            <MenuItem value="">Without preset (default configuration)</MenuItem>
            {sources.map(preset => <MenuItem key={preset.id} value={preset.id}>{preset.displayName} — {preset.status}</MenuItem>)}
          </BeamField>
          <BeamField label="Target Game" value="Betty Multiplier Madness" disabled />
          <BeamField select required label="Target Preset" value={model.targetPresetId} onChange={targetChange}
            error={submitted && Boolean(errors.targetPresetId)} helperText={submitted ? errors.targetPresetId : undefined}>
            {targets.map(preset => <MenuItem key={preset.id} value={preset.id}>{preset.displayName} — {preset.status}</MenuItem>)}
          </BeamField>
          <BeamField type="datetime-local" required label="Start (UTC)" value={model.startDate.replace(/Z$/, '')}
            onChange={startChange} error={submitted && Boolean(errors.startDate)} helperText={submitted ? errors.startDate : undefined}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { step: 0.001 } }} />
          <BeamField type="datetime-local" required label="End (UTC, exclusive)" value={model.endDate.replace(/Z$/, '')}
            onChange={endChange} error={submitted && Boolean(errors.endDate)} helperText={submitted ? errors.endDate : undefined}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { step: 0.001 } }} />
        </DetailsPanel>
      ) : (
        <DetailsPanel aria-label="Chained experience details" minColumnWidth={320}>
          <BeamStat label="Source Game" value={gameTypeLabel(model.sourceGameType)} />
          <BeamStat label="Source Preset" value={presetLabel(model.sourcePresetId)} />
          <BeamStat label="Target Game" value="Betty Multiplier Madness" />
          <BeamStat label="Target Preset" value={presetLabel(model.targetPresetId)} />
          <BeamStat label="Start (UTC)" value={formatChainDate(model.startDate)} />
          <BeamStat label="End (UTC, exclusive)" value={formatChainDate(model.endDate)} />
        </DetailsPanel>
      )}
      {editing && submitted && errors.period && <Typography color="error" role="alert">{errors.period}</Typography>}
      <Typography variant="body2" color="text.secondary">
        The source game's completion time selects the period: start included, end excluded.
        Periods for the same source game and preset cannot overlap. Started periods can be edited.
        A successful Coins reward is required. Changes do not replace an already created next game.
      </Typography>
      <Dialog open={pendingCancel || blocker.state === 'blocked'} onClose={keepEditing}>
        <DialogTitle>Discard changes?</DialogTitle><DialogContent>You have unsaved changes.</DialogContent>
        <DialogActions><Button onClick={keepEditing}>Keep editing</Button><Button color="error" onClick={discard}>Discard</Button></DialogActions>
      </Dialog>
    </Stack>
  );
}
