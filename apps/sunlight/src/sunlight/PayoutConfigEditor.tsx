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
import { PayoutRowsEditor } from './PayoutRowsEditor';
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
 * Payout Config Create / Edit page. NO view mode — a deliberate divergence from
 * the User view↔edit doctrine: MetaGame configs are always editable (brief §5.2
 * defines only Create/Edit; Enabled configs stay editable, brief §10). Recorded
 * in metagame-pages.md.
 *
 * DIVERGENCE flagged to product: Cancel + Create/Save live in the page-header
 * actions slot (detail-grammar §4 save model), not the bottom bar Georgi
 * sketched. Doctrine wins; a one-line move if overruled.
 *
 * Scaffold plain — spacing / pigment is Deyan's bench pass.
 */
export function PayoutConfigEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const existing = id ? getPayoutConfig(id) : undefined;

  if (id && !existing) {
    return (
      <Stack spacing={3}>
        <BeamPageHeader title={`Config ${id}`} back={backTo(navigate, '/payout-configs', 'Payout Configs')} />
        <BeamEmptyState title={`No payout config with id ${id}`} description="It may have been removed." />
      </Stack>
    );
  }

  return <EditorForm key={id ?? 'new'} existing={existing} />;
}

function EditorForm({ existing }: { existing?: PayoutConfig }) {
  const navigate = useNavigate();
  const isEdit = Boolean(existing);

  const initialModel = useMemo<EditorModel>(
    () => (existing ? toEditorModel(existing) : emptyModel()),
    [existing]
  );
  const [model, setModel] = useState<EditorModel>(initialModel);
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
          <Stack direction="row" spacing={1} alignItems="center">
            <Button variant="text" onClick={() => navigate('/payout-configs')}>
              Cancel
            </Button>
            {/* Save gate: valid form AND total probability exactly 100%.
                aria-disabled (focusable + announced) + tooltip reason. */}
            <Tooltip title={v.valid ? '' : saveReason}>
              <span>
                <Button
                  variant="contained"
                  aria-disabled={!v.valid || undefined}
                  aria-describedby={undefined}
                  onClick={() => {
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
          error={Boolean(v.name)}
          helperText={v.name}
          sx={{ maxWidth: 480 }}
          inputProps={{ maxLength: MAX_NAME }}
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
            error={Boolean(v.gameType)}
            helperText={v.gameType}
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

      <PayoutRowsEditor rows={model.rows} onChange={(rows) => setModel((m) => ({ ...m, rows }))} />

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
