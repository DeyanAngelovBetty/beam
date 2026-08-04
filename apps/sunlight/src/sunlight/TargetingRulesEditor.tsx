import { useState } from 'react';
import {
  Stack,
  Paper,
  Button,
  Typography,
  TextField,
  MenuItem,
  Switch,
  IconButton,
  Tooltip,
} from '@betty/beam';
import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { PAYOUT_CONFIGS, type GameType, type PayoutStatus } from './payoutConfigs';
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
  showAllErrors = false,
}: {
  value: EditorModel;
  onChange: (next: EditorModel) => void;
  showAllErrors?: boolean;
}) {
  const [touched, setTouched] = useState<Set<string>>(() => new Set());
  const v = validateModel(value);
  const { rules, fallback, gameType } = value;

  const setRules = (next: EditorRule[]) => onChange({ ...value, rules: next });
  const setFallback = (next: EditorFallback) => onChange({ ...value, fallback: next });
  const markTouched = (key: string) => setTouched((current) => new Set(current).add(key));
  const showError = (key: string) => showAllErrors || touched.has(key);

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
    <Stack spacing={2}>
      <Typography variant="subtitle2" color="text.secondary">
        Targeting Rules
      </Typography>

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
          payoutError={showError(`payout:${rule._key}`) ? v.rules[i]?.payoutConfig : undefined}
          conditionError={showError(`condition:${rule._key}`) ? v.rules[i]?.condition : undefined}
          onStatus={(status) => updateRuleAt(i, { status })}
          onPayout={(payoutConfigId) => {
            markTouched(`payout:${rule._key}`);
            updateRuleAt(i, { payoutConfigId });
          }}
          onGroup={(group) => {
            markTouched(`condition:${rule._key}`);
            updateRuleAt(i, { group });
          }}
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
            No condition — always matches and is evaluated last.
          </Typography>
          <PayoutConfigSelect
            gameType={gameType}
            value={fallback.payoutConfigId}
            error={showError('fallback') ? v.fallback : undefined}
            onChange={(payoutConfigId) => {
              markTouched('fallback');
              setFallback({ ...fallback, payoutConfigId });
            }}
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
      <Stack spacing={2}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Typography variant="subtitle2">Rule {index + 1}</Typography>
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
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

/** PayoutConfig select — filtered to the GameType with Disabled options selectable. */
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
  const options = PAYOUT_CONFIGS.filter((p) => gameType && p.gameType === gameType).map((p) => ({
    id: p.id,
    label: p.name,
    status: p.status as PayoutStatus | undefined,
  }));
  const selectedOption = options.find((option) => option.id === value);
  return (
    <Stack spacing={0.75}>
      <TextField
        select
        size="small"
        label="Payout Config"
        sx={{ minWidth: 360, maxWidth: 480 }}
        value={value}
        disabled={!gameType}
        onChange={(e) => onChange(e.target.value)}
        error={Boolean(error)}
        helperText={error}
        inputProps={{ 'aria-label': ariaLabel }}
        SelectProps={{
          renderValue: (selected: string) => {
            const o = options.find((x) => x.id === selected);
            return o ? `${o.label} — ${o.status}` : '';
          },
        }}
      >
        {options.length === 0 && (
          <MenuItem value="" disabled>
            No Payout Configs for this game type
          </MenuItem>
        )}
        {options.map((o) => {
          return (
            <MenuItem key={o.id} value={o.id}>
              {o.label} — {o.status}
            </MenuItem>
          );
        })}
      </TextField>
      {selectedOption?.status === 'Disabled' && (
        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', color: 'warning.main' }} role="status">
          <WarningAmberIcon fontSize="small" />
          <Typography variant="body2">
            This PayoutConfig must be enabled before the GameConfig can be enabled.
          </Typography>
        </Stack>
      )}
    </Stack>
  );
}
