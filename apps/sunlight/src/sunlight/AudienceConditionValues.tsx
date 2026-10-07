import { useState, type ChangeEvent, type SyntheticEvent } from 'react';
import {
  Autocomplete, Box, Button, Checkbox, Chip, Dialog, DialogActions,
  DialogContent, DialogTitle, IconButton, MenuItem, Paper, Stack, TextField,
  Tooltip, Typography, type AutocompleteRenderInputParams,
} from '@betty/beam';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import {
  AUDIENCE_OPTIONS, audienceIdOf, labelForAudience, labelForCohort,
  selectAudienceCohorts, type AudienceValue,
} from './conditionTree';

/** Midnight's selected-audience cards, composed from Beam atoms. */
export function AudienceConditionValues({ values, onChange, error }: {
  values: AudienceValue[];
  onChange: (values: AudienceValue[]) => void;
  error: string | null;
}) {
  const [editor, setEditor] = useState<{ value?: AudienceValue } | null>(null);
  const canAdd = AUDIENCE_OPTIONS.some((option) => !values.some((value) => audienceIdOf(value) === option.value));
  const addAudience = () => setEditor({});
  const editAudience = (value: AudienceValue) => setEditor({ value });
  const closeEditor = () => setEditor(null);
  const removeAudience = (audienceId: number) => onChange(values.filter((value) => audienceIdOf(value) !== audienceId));
  const confirmSelection = (audienceId: number, cohortIds: number[]) => {
    const next = editor?.value === undefined ? [...values, audienceId] : values;
    onChange(selectAudienceCohorts(next, audienceId, cohortIds));
    closeEditor();
  };

  return (
    <Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
      {values.map((value) => (
        <SelectedAudience key={audienceIdOf(value)} value={value} onEdit={editAudience} onRemove={removeAudience} />
      ))}
      {error && <Typography variant="caption" color="error" role="alert">{error}</Typography>}
      {canAdd && (
        <Button size="small" startIcon={<AddIcon />} onClick={addAudience} sx={{ alignSelf: 'flex-start' }}>
          {values.length ? 'Add another audience' : 'Add audience'}
        </Button>
      )}
      {editor && (
        <AudienceSelectionDialog
          initialValue={editor.value} selectedValues={values}
          onConfirm={confirmSelection} onClose={closeEditor}
        />
      )}
    </Stack>
  );
}

function SelectedAudience({ value, onEdit, onRemove }: {
  value: AudienceValue;
  onEdit: (value: AudienceValue) => void;
  onRemove: (audienceId: number) => void;
}) {
  const audienceId = audienceIdOf(value);
  const audienceLabel = labelForAudience(audienceId);
  const cohortIds = typeof value === 'number' ? [] : value.cohortIds ?? [];
  const edit = () => onEdit(value);
  const remove = () => onRemove(audienceId);

  return (
    <Paper variant="outlined" sx={{ p: 1.5 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
        <Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{audienceLabel}</Typography>
            <Typography variant="caption" color="text.secondary">#{audienceId}</Typography>
          </Stack>
          <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="caption" color="text.secondary">Cohorts</Typography>
            {cohortIds.length
              ? cohortIds.map((id) => <Chip key={id} size="small" variant="outlined" label={labelForCohort(audienceId, id)} />)
              : <Chip size="small" variant="outlined" label="Whole audience" />}
          </Stack>
        </Stack>
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Edit cohorts">
            <IconButton size="small" aria-label={`Edit ${audienceLabel} cohorts`} onClick={edit}><EditIcon fontSize="small" /></IconButton>
          </Tooltip>
          <Tooltip title="Remove audience">
            <IconButton size="small" aria-label={`Remove ${audienceLabel}`} onClick={remove}><DeleteIcon fontSize="small" /></IconButton>
          </Tooltip>
        </Stack>
      </Stack>
    </Paper>
  );
}

/** Local edits apply on confirmation; page Save/Cancel still owns persistence. */
function AudienceSelectionDialog({ initialValue, selectedValues, onConfirm, onClose }: {
  initialValue?: AudienceValue;
  selectedValues: AudienceValue[];
  onConfirm: (audienceId: number, cohortIds: number[]) => void;
  onClose: () => void;
}) {
  const [audienceId, setAudienceId] = useState<number | null>(initialValue === undefined ? null : audienceIdOf(initialValue));
  const [cohortIds, setCohortIds] = useState<number[]>(typeof initialValue === 'object' ? initialValue.cohortIds ?? [] : []);
  const audience = AUDIENCE_OPTIONS.find((option) => option.value === audienceId);
  const audienceOptions = AUDIENCE_OPTIONS.filter((option) => !selectedValues.some((value) => audienceIdOf(value) === option.value));
  const cohortOptions = [
    ...(audience?.cohorts ?? []),
    ...cohortIds.filter((id) => !audience?.cohorts.some((option) => option.value === id))
      .map((id) => ({ value: id, label: `Cohort ${id}` })),
  ];
  const changeAudience = (_event: SyntheticEvent, option: typeof audience | null) => {
    setAudienceId(option?.value ?? null);
    setCohortIds([]);
  };
  const changeCohorts = (event: ChangeEvent<HTMLInputElement>) => setCohortIds(event.target.value as unknown as number[]);
  const clearCohorts = () => setCohortIds([]);
  const confirm = () => { if (audienceId !== null) onConfirm(audienceId, cohortIds); };
  const optionLabel = (option: (typeof AUDIENCE_OPTIONS)[number]) => `${option.label} · #${option.value}`;
  const renderAudienceInput = (params: AutocompleteRenderInputParams) =>
    <TextField {...params} label="Audience" placeholder="Search audiences" />;
  const renderCohorts = (selected: unknown) => (selected as number[]).length
    ? (selected as number[]).map((id) => labelForCohort(audienceId!, id)).join(', ')
    : 'Whole audience';

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="audience-selection-title">
      <DialogTitle id="audience-selection-title">{initialValue === undefined ? 'Add audience' : 'Edit cohorts'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {initialValue === undefined ? (
            <Autocomplete
              size="small" options={audienceOptions} value={audience ?? null} onChange={changeAudience}
              getOptionLabel={optionLabel} renderInput={renderAudienceInput}
            />
          ) : (
            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.secondary">Audience</Typography>
              <Typography variant="body2">{labelForAudience(audienceId!)} · #{audienceId}</Typography>
            </Stack>
          )}
          {audienceId !== null && (
            <Box>
              <TextField
                select fullWidth size="small" label="Cohorts (optional)" value={cohortIds}
                onChange={changeCohorts} disabled={cohortOptions.length === 0}
                helperText={cohortOptions.length === 0 ? 'This audience has no available cohorts.' : 'Leave empty to include the whole audience.'}
                slotProps={{ inputLabel: { shrink: true }, select: { multiple: true, displayEmpty: true, renderValue: renderCohorts } }}
              >
                {cohortOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Checkbox size="small" checked={cohortIds.includes(option.value)} />{option.label}
                  </MenuItem>
                ))}
              </TextField>
              {cohortIds.length > 0 && <Button size="small" onClick={clearCohorts}>Use whole audience</Button>}
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={confirm} disabled={audienceId === null}>
          {initialValue === undefined ? 'Add audience' : 'Apply selection'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
