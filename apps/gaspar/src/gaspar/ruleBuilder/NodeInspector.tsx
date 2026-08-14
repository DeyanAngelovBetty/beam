import { Stack, Typography, Divider, Button, IconButton, TextField, MenuItem, Box } from '@betty/beam';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineRounded';
import CloseIcon from '@mui/icons-material/Close';
import {
  CONDITION_OPERATORS,
  ACTION_TYPES,
  summarizeCondition,
  type NodeConfig,
  type ConditionConfig,
  type FactCondition,
  type ActionConfig,
  type JsonValue,
} from './ruleSetStore';
import { FACTS, findFact } from './facts/facts';
import { RISK_LEVEL_VALUES, REQUIRED_ACTION_VALUES, ENUM_TYPE_VALUES } from './facts/demoEnums';

/**
 * NodeInspector — the single edit surface. Editing mutates the TREE (the page applies each change by
 * id and re-lays-out the canvas). Delivers the data-driven fact picker (keyed on the catalog's
 * valueType/enumType), a per-type action editor, and the structural adds/deletes the tree allows.
 *
 * Scope note: nested boolean editing (and/or/not) is a listed cherry-pick — those conditions render
 * as a read-only summary here; a leaf (field/fact) gets the full picker.
 */
export function NodeInspector({
  node,
  removable,
  onUpdateCondition,
  onUpdateActions,
  onAddChild,
  onToggleFalse,
  onDelete,
}: {
  node: NodeConfig | null;
  removable: boolean;
  onUpdateCondition: (id: string, condition: ConditionConfig) => void;
  onUpdateActions: (id: string, actions: ActionConfig[]) => void;
  onAddChild: (seqId: string, kind: 'condition' | 'action' | 'sequence') => void;
  onToggleFalse: (condId: string) => void;
  onDelete: (id: string) => void;
}) {
  if (!node) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Select a node to edit it.
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={1.5} sx={{ p: 2 }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle2" sx={{ textTransform: 'capitalize' }}>
          {node.type}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap title={node.id}>
          {node.id}
        </Typography>
      </Stack>
      <Divider />

      {node.type === 'condition' && (
        <ConditionSection condition={node.condition} onChange={(c) => onUpdateCondition(node.id, c)} hasFalse={node.falseNode !== undefined} onToggleFalse={() => onToggleFalse(node.id)} />
      )}
      {node.type === 'action' && <ActionsSection actions={node.actions} onChange={(a) => onUpdateActions(node.id, a)} />}
      {node.type === 'sequence' && (
        <Stack spacing={1}>
          <Typography variant="caption" color="text.secondary">
            {node.nodes.length} step{node.nodes.length === 1 ? '' : 's'} — add one:
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button size="small" onClick={() => onAddChild(node.id, 'condition')}>+ Condition</Button>
            <Button size="small" onClick={() => onAddChild(node.id, 'action')}>+ Action</Button>
            <Button size="small" onClick={() => onAddChild(node.id, 'sequence')}>+ Sequence</Button>
          </Stack>
        </Stack>
      )}

      <Divider />
      <Button
        size="small"
        color="error"
        variant="outlined"
        startIcon={<DeleteOutlineIcon />}
        disabled={!removable}
        onClick={() => onDelete(node.id)}
        sx={{ alignSelf: 'flex-start' }}
      >
        Delete node
      </Button>
      {!removable && (
        <Typography variant="caption" color="text.secondary">
          The root and a condition’s True branch cannot be deleted.
        </Typography>
      )}
    </Stack>
  );
}

// ─── Condition ───────────────────────────────────────────────────────────────────────────────────
function ConditionSection({ condition, onChange, hasFalse, onToggleFalse }: { condition: ConditionConfig; onChange: (c: ConditionConfig) => void; hasFalse: boolean; onToggleFalse: () => void }) {
  const isLeaf = condition.type === 'field' || condition.type === 'fact';
  return (
    <Stack spacing={1.5}>
      <Typography variant="caption" color="text.secondary">Condition</Typography>
      {isLeaf ? (
        <FactLeafEditor leaf={condition as FactCondition} onChange={onChange} />
      ) : (
        <Box sx={{ p: 1, borderRadius: 1, bgcolor: 'action.hover' }}>
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{summarizeCondition(condition)}</Typography>
          <Typography variant="caption" color="text.secondary">
            Nested boolean (and/or/not) — editing is a follow-up; adjust in the rule file for now.
          </Typography>
        </Box>
      )}
      <Divider />
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="caption" color="text.secondary">False branch (else)</Typography>
        <Button size="small" variant={hasFalse ? 'outlined' : 'text'} onClick={onToggleFalse}>
          {hasFalse ? 'Remove else' : 'Add else'}
        </Button>
      </Stack>
      {!hasFalse && (
        <Typography variant="caption" color="text.secondary">
          No else — a non-match falls through to the next sequence step.
        </Typography>
      )}
    </Stack>
  );
}

function FactLeafEditor({ leaf, onChange }: { leaf: FactCondition; onChange: (c: FactCondition) => void }) {
  const path = leaf.fact ?? leaf.field ?? '';
  const fact = findFact(path);
  const isArrayOp = leaf.operator === 'In' || leaf.operator === 'NotIn';

  return (
    <Stack spacing={1.5}>
      <TextField
        select
        size="small"
        label="Fact"
        value={FACTS.some((f) => f.path === path) ? path : ''}
        onChange={(e) => onChange({ type: 'field', field: e.target.value, operator: leaf.operator, value: leaf.value })}
        helperText={fact?.description ?? (path ? `“${path}” — not in the catalog` : 'Pick a fact')}
      >
        {FACTS.map((f) => (
          <MenuItem key={f.path} value={f.path}>
            {f.path}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        size="small"
        label="Operator"
        value={leaf.operator}
        onChange={(e) => onChange({ ...leaf, operator: e.target.value as FactCondition['operator'] })}
      >
        {CONDITION_OPERATORS.map((op) => (
          <MenuItem key={op} value={op}>{op}</MenuItem>
        ))}
      </TextField>

      <ValueEditor
        valueType={fact?.valueType}
        enumType={fact?.enumType}
        isArrayOp={isArrayOp}
        value={leaf.value}
        onChange={(value) => onChange({ ...leaf, value })}
      />
    </Stack>
  );
}

function ValueEditor({ valueType, enumType, isArrayOp, value, onChange }: { valueType?: string; enumType?: string; isArrayOp: boolean; value: JsonValue; onChange: (v: JsonValue) => void }) {
  if (isArrayOp) {
    const arr = Array.isArray(value) ? value : [];
    return (
      <TextField
        size="small"
        label="Values (comma-separated)"
        value={arr.join(', ')}
        onChange={(e) => onChange(e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
      />
    );
  }
  if (valueType === 'Bool') {
    return (
      <TextField select size="small" label="Value" value={String(value)} onChange={(e) => onChange(e.target.value === 'true')}>
        <MenuItem value="true">true</MenuItem>
        <MenuItem value="false">false</MenuItem>
      </TextField>
    );
  }
  if (valueType === 'Enum' && enumType && ENUM_TYPE_VALUES[enumType]) {
    return (
      <TextField select size="small" label="Value" value={String(value)} onChange={(e) => onChange(e.target.value)}>
        {ENUM_TYPE_VALUES[enumType].map((v) => (
          <MenuItem key={v} value={v}>{v}</MenuItem>
        ))}
      </TextField>
    );
  }
  if (valueType === 'Numeric') {
    return <TextField size="small" type="number" label="Value" value={String(value)} onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} />;
  }
  return <TextField size="small" label="Value" value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />;
}

// ─── Actions ─────────────────────────────────────────────────────────────────────────────────────
function defaultAction(type: ActionConfig['type']): ActionConfig {
  switch (type) {
    case 'block': return { type: 'block', reason: '' };
    case 'setRiskLevel': return { type: 'setRiskLevel', level: 'Low', reason: '' };
    case 'addPsp': return { type: 'addPsp', pspId: '', initialScore: 0 };
    case 'disablePsp': return { type: 'disablePsp', pspId: '', reason: '' };
    case 'adjustPspScore': return { type: 'adjustPspScore', pspId: '', delta: 0 };
    case 'setFact': return { type: 'setFact', key: '', value: '' };
    default: return { type: 'require', action: 'ThreeDS' };
  }
}

function ActionsSection({ actions, onChange }: { actions: ActionConfig[]; onChange: (a: ActionConfig[]) => void }) {
  const setAt = (i: number, next: ActionConfig) => onChange(actions.map((a, idx) => (idx === i ? next : a)));
  return (
    <Stack spacing={1.5}>
      <Typography variant="caption" color="text.secondary">Actions</Typography>
      {actions.map((action, i) => (
        <Stack key={i} spacing={1} sx={{ p: 1, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <TextField
              select
              size="small"
              label="Type"
              value={action.type === 'addRequiredAction' ? 'require' : action.type}
              onChange={(e) => setAt(i, defaultAction(e.target.value as ActionConfig['type']))}
              sx={{ flex: 1 }}
            >
              {ACTION_TYPES.map((t) => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </TextField>
            <IconButton size="small" aria-label="Remove action" onClick={() => onChange(actions.filter((_, idx) => idx !== i))}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
          <ActionFields action={action} onChange={(next) => setAt(i, next)} />
        </Stack>
      ))}
      <Button size="small" onClick={() => onChange([...actions, defaultAction('block')])} sx={{ alignSelf: 'flex-start' }}>
        + Action
      </Button>
    </Stack>
  );
}

function ActionFields({ action, onChange }: { action: ActionConfig; onChange: (a: ActionConfig) => void }) {
  switch (action.type) {
    case 'block':
      return <TextField size="small" label="Reason" value={action.reason} onChange={(e) => onChange({ ...action, reason: e.target.value })} />;
    case 'setRiskLevel':
      return (
        <Stack spacing={1}>
          <TextField select size="small" label="Level" value={action.level} onChange={(e) => onChange({ ...action, level: e.target.value })}>
            {RISK_LEVEL_VALUES.map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}
          </TextField>
          <TextField size="small" label="Reason" value={action.reason} onChange={(e) => onChange({ ...action, reason: e.target.value })} />
        </Stack>
      );
    case 'addPsp':
      return (
        <Stack spacing={1}>
          <TextField size="small" label="PSP id" value={action.pspId} onChange={(e) => onChange({ ...action, pspId: e.target.value })} />
          <TextField size="small" type="number" label="Initial score" value={String(action.initialScore)} onChange={(e) => onChange({ ...action, initialScore: Number(e.target.value) })} />
        </Stack>
      );
    case 'disablePsp':
      return (
        <Stack spacing={1}>
          <TextField size="small" label="PSP id" value={action.pspId} onChange={(e) => onChange({ ...action, pspId: e.target.value })} />
          <TextField size="small" label="Reason" value={action.reason} onChange={(e) => onChange({ ...action, reason: e.target.value })} />
        </Stack>
      );
    case 'adjustPspScore':
      return (
        <Stack spacing={1}>
          <TextField size="small" label="PSP id" value={action.pspId} onChange={(e) => onChange({ ...action, pspId: e.target.value })} />
          <TextField size="small" type="number" label="Delta" value={String(action.delta)} onChange={(e) => onChange({ ...action, delta: Number(e.target.value) })} />
        </Stack>
      );
    case 'require':
    case 'addRequiredAction':
      return (
        <TextField select size="small" label="Action" value={action.action} onChange={(e) => onChange({ type: 'require', action: e.target.value })}>
          {REQUIRED_ACTION_VALUES.map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}
        </TextField>
      );
    case 'setFact':
      return (
        <Stack spacing={1}>
          <TextField size="small" label="Fact key" value={action.key} onChange={(e) => onChange({ ...action, key: e.target.value })} />
          <TextField size="small" label="Value" value={String(action.value ?? '')} onChange={(e) => onChange({ ...action, value: e.target.value })} />
        </Stack>
      );
  }
}
