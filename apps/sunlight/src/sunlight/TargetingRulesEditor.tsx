import {
  Stack,
  Box,
  Paper,
  Button,
  Typography,
  TextField,
  MenuItem,
  Switch,
  IconButton,
  Tooltip,
  BeamStatusBadge,
} from '@betty/beam';
import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { PAYOUT_CONFIGS, statusBadge, type GameType, type PayoutStatus } from './payoutConfigs';
import { ConditionBuilder } from './ConditionBuilder';
import type { ConditionGroup } from './conditionTree';
import {
  emptyRule,
  validateModel,
  type EditorModel,
  type EditorRule,
  type EditorFallback,
} from './gameConfigForm';

/**
 * TargetingRulesEditor — the editable rules list. Order IS priority (top =
 * highest; no numbers). Per rule: header (Rule n · Enabled/Disabled · Delete),
 * PayoutConfig select (filtered to the GameType), and the ConditionBuilder
 * (consumed via its API only). Reorder via up/down arrows (drag is a later
 * enhancement). The FALLBACK is a structurally fixed last row — always present,
 * always Enabled, conditionless, only its PayoutConfig editable.
 *
 * Scaffold plain — spacing / pigment is Deyan's bench pass.
 */
export function TargetingRulesEditor({
  value,
  onChange,
}: {
  value: EditorModel;
  onChange: (next: EditorModel) => void;
}) {
  const v = validateModel(value);
  const { rules, fallback, gameType } = value;

  const setRules = (next: EditorRule[]) => onChange({ ...value, rules: next });
  const setFallback = (next: EditorFallback) => onChange({ ...value, fallback: next });

  const updateRuleAt = (i: number, patch: Partial<EditorRule>) =>
    setRules(rules.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const removeRuleAt = (i: number) => setRules(rules.filter((_, idx) => idx !== i));
  const addRule = () => setRules([...rules, emptyRule()]);
  const moveRule = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= rules.length) return;
    const next = [...rules];
    [next[i], next[j]] = [next[j], next[i]];
    setRules(next);
  };

  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2" color="text.secondary">
        Targeting Rules
      </Typography>

      {/* AGGREGATE, non-blocking (the Enable-action concern; awareness only here).
          Ships plain. */}
      {v.disabledRefRuleNumbers.length > 0 && (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'warning.main' }} role="status">
          <WarningAmberIcon fontSize="small" />
          <Typography variant="body2">
            This config can’t be Enabled while{' '}
            {v.disabledRefRuleNumbers.map((n) => `rule ${n}`).join(', ')} uses a Disabled Payout Config.
          </Typography>
        </Stack>
      )}

      {/* Section action: a LEFT-aligned strip directly above the rules it
          operates on (altitude rule, detail-grammar §4 — the right edge is
          page-only). Matches PayoutRowsEditor's Add Row. */}
      <Button size="small" startIcon={<AddIcon />} onClick={addRule} sx={{ alignSelf: 'flex-start' }}>
        Add Rule
      </Button>

      {rules.map((rule, i) => (
        <RuleCard
          key={rule._key}
          rule={rule}
          index={i}
          isFirst={i === 0}
          isLast={i === rules.length - 1}
          gameType={gameType}
          payoutError={v.rules[i]?.payoutConfig}
          conditionError={v.rules[i]?.condition}
          onStatus={(status) => updateRuleAt(i, { status })}
          onPayout={(payoutConfigId) => updateRuleAt(i, { payoutConfigId })}
          onGroup={(group) => updateRuleAt(i, { group })}
          onDelete={() => removeRuleAt(i)}
          onMove={(dir) => moveRule(i, dir)}
        />
      ))}

      {/* Fallback — structurally fixed last row (cannot be wrong: not validated
          for structure, only its PayoutConfig is required). */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={1}>
          <Typography variant="subtitle2">Fallback</Typography>
          <Typography variant="body2" color="text.secondary">
            NO CONDITION — always matches when no rule above applies.
          </Typography>
          <PayoutConfigSelect
            gameType={gameType}
            value={fallback.payoutConfigId}
            error={v.fallback}
            onChange={(payoutConfigId) => setFallback({ ...fallback, payoutConfigId })}
            ariaLabel="Fallback Payout Config"
          />
        </Stack>
      </Paper>
    </Stack>
  );
}

function RuleCard({
  rule,
  index,
  isFirst,
  isLast,
  gameType,
  payoutError,
  conditionError,
  onStatus,
  onPayout,
  onGroup,
  onDelete,
  onMove,
}: {
  rule: EditorRule;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  gameType: GameType | '';
  payoutError?: string;
  conditionError?: string;
  onStatus: (s: PayoutStatus) => void;
  onPayout: (id: string) => void;
  onGroup: (g: ConditionGroup) => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={1.5}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Typography variant="subtitle2">Rule {index + 1}</Typography>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Switch
                size="small"
                checked={rule.status === 'Enabled'}
                onChange={(e) => onStatus(e.target.checked ? 'Enabled' : 'Disabled')}
                inputProps={{ 'aria-label': `Rule ${index + 1} enabled` }}
              />
              <Typography variant="body2" color="text.secondary">
                {rule.status}
              </Typography>
            </Stack>
          </Stack>
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Move up">
              <span>
                <IconButton size="small" aria-label={`Move rule ${index + 1} up`} disabled={isFirst} onClick={() => onMove(-1)}>
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Move down">
              <span>
                <IconButton size="small" aria-label={`Move rule ${index + 1} down`} disabled={isLast} onClick={() => onMove(1)}>
                  <ArrowDownwardIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Delete rule">
              <IconButton size="small" aria-label={`Delete rule ${index + 1}`} onClick={onDelete}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        <PayoutConfigSelect
          gameType={gameType}
          value={rule.payoutConfigId}
          error={payoutError}
          onChange={onPayout}
          ariaLabel={`Rule ${index + 1} Payout Config`}
        />

        <ConditionBuilder value={rule.group} onChange={onGroup} />
        {conditionError && (
          <Typography variant="body2" color="error" role="alert">
            {conditionError}
          </Typography>
        )}
      </Stack>
    </Paper>
  );
}

/** PayoutConfig select — filtered to the GameType, each option name + status
 *  badge (Disabled selectable). Orphan loaded ids (from seed) render flagged. */
function PayoutConfigSelect({
  gameType,
  value,
  error,
  onChange,
  ariaLabel,
}: {
  gameType: GameType | '';
  value: string;
  error?: string;
  onChange: (id: string) => void;
  ariaLabel: string;
}) {
  const options = PAYOUT_CONFIGS.filter((p) => !gameType || p.gameType === gameType).map((p) => ({
    id: p.id,
    label: p.name,
    status: p.status as PayoutStatus | undefined,
  }));
  if (value && !options.some((o) => o.id === value)) {
    options.unshift({ id: value, label: `${value} (not in this game type)`, status: undefined });
  }

  return (
    <TextField
      select
      size="small"
      label="Payout Config"
      sx={{ minWidth: 360, maxWidth: 480 }}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      error={Boolean(error)}
      helperText={error}
      inputProps={{ 'aria-label': ariaLabel }}
      SelectProps={{
        renderValue: (selected) => {
          const o = options.find((x) => x.id === selected);
          return o ? o.label : '';
        },
      }}
    >
      {options.length === 0 && (
        <MenuItem value="" disabled>
          No Payout Configs for this game type
        </MenuItem>
      )}
      {options.map((o) => {
        const badge = o.status ? statusBadge(o.status) : null;
        return (
          <MenuItem key={o.id} value={o.id}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
              <span>{o.label}</span>
              {badge && <BeamStatusBadge status={badge.status} label={badge.label} size="small" />}
            </Box>
          </MenuItem>
        );
      })}
    </TextField>
  );
}
