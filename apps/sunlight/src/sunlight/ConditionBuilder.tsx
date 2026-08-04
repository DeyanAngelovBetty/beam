import {
  Stack,
  Box,
  Button,
  Typography,
  TextField,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
} from '@betty/beam';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import {
  CONDITION_FIELDS,
  LEAF_OPERATORS,
  GROUP_OPERATORS,
  FIELD_LABEL,
  LEAF_OP_LABEL,
  GROUP_LABEL,
  FIELD_OPTIONS,
  labelForValue,
  emptyLeaf,
  emptyGroup,
  nodeError,
  keyOf,
  withKey,
  type ConditionNode,
  type ConditionGroup,
  type ConditionLeaf,
  type ConditionField,
  type GroupOperator,
  type LeafOperator,
} from './conditionTree';

/**
 * ConditionBuilder — the editable targeting-condition tree (brief §7). App-local,
 * controlled: the root is always a Group. NEVER shows raw JSON. Structural rules
 * are enforced by construction — groups have no field/value controls, leaves have
 * no children controls.
 *
 * Values: a CONSTRAINED multi-select (no free entry) over placeholder option
 * lists — the lookup endpoints don't exist yet (brief §14). Validation is
 * server-side eventually; the client just prevents unknown ids.
 *
 * Scaffold plain. The visual language of NESTING (indentation + connector) is a
 * design pass — spine-motif territory, reserved: `// nesting visuals: pending
 * design pass`.
 */
export function ConditionBuilder({
  value,
  onChange,
}: {
  value: ConditionGroup;
  onChange: (next: ConditionGroup) => void;
}) {
  return <NodeEditor node={value} onChange={(n) => onChange(n as ConditionGroup)} isRoot />;
}

function NodeEditor({
  node,
  onChange,
  onRemove,
  isRoot = false,
}: {
  node: ConditionNode;
  onChange: (next: ConditionNode) => void;
  onRemove?: () => void;
  isRoot?: boolean;
}) {
  // Every edit transfers this node's client key to the new node (stable keys).
  const emit = (next: ConditionNode) => onChange(withKey(next, node));

  if (node.kind === 'group') {
    return <GroupEditor node={node} emit={emit} onRemove={onRemove} isRoot={isRoot} />;
  }
  return <LeafEditor node={node} emit={emit} onRemove={onRemove} />;
}

function GroupEditor({
  node,
  emit,
  onRemove,
  isRoot,
}: {
  node: ConditionGroup;
  emit: (next: ConditionNode) => void;
  onRemove?: () => void;
  isRoot?: boolean;
}) {
  const err = nodeError(node);
  const setOperator = (operator: GroupOperator) => emit({ ...node, operator });
  const updateChildAt = (i: number, child: ConditionNode) =>
    emit({ ...node, children: node.children.map((c, idx) => (idx === i ? child : c)) });
  const removeChildAt = (i: number) =>
    emit({ ...node, children: node.children.filter((_, idx) => idx !== i) });
  const addLeaf = () => emit({ ...node, children: [...node.children, emptyLeaf()] });
  const addGroup = () => emit({ ...node, children: [...node.children, emptyGroup()] });

  return (
    <Stack spacing={1} sx={isRoot ? undefined : { py: 1.5 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <TextField
          select
          size="small"
          value={node.operator}
          onChange={(e) => setOperator(e.target.value as GroupOperator)}
          sx={{ minWidth: 220 }}
          inputProps={{ 'aria-label': 'Group operator' }}
        >
          {GROUP_OPERATORS.map((op) => (
            <MenuItem key={op} value={op}>
              {GROUP_LABEL[op]}
            </MenuItem>
          ))}
        </TextField>
        {!isRoot && onRemove && (
          <Tooltip title="Remove group">
            <IconButton size="small" aria-label="Remove group" onClick={onRemove}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      {/* Nesting = indentation + a plain left rule. STRUCTURAL ONLY — the visual
          language of nesting is the design pass. // nesting visuals: pending design pass */}
      <Box sx={{ pl: 2, borderLeft: '2px solid', borderColor: 'divider' }}>
        <Stack spacing={1} sx={{ alignItems: 'flex-start' }}>
          {node.children.map((child, i) => (
            <NodeEditor
              key={keyOf(child)}
              node={child}
              onChange={(c) => updateChildAt(i, c)}
              onRemove={() => removeChildAt(i)}
            />
          ))}
          {err && (
            <Typography variant="body2" color="error" role="alert">
              {err}
            </Typography>
          )}
          <Stack direction="row" spacing={1} sx={{ mt: '8px !important' }}>
            <Button size="small" startIcon={<AddIcon />} onClick={addLeaf}>
              Add Condition
            </Button>
            <Button size="small" startIcon={<AddIcon />} onClick={addGroup}>
              Add Group
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Stack>
  );
}

function LeafEditor({
  node,
  emit,
  onRemove,
}: {
  node: ConditionLeaf;
  emit: (next: ConditionNode) => void;
  onRemove?: () => void;
}) {
  const err = nodeError(node);
  // Changing field resets values — old ids don't belong to the new field.
  const setField = (field: ConditionField) => emit({ ...node, field, values: [] });
  const setOperator = (operator: LeafOperator) => emit({ ...node, operator });
  const setValues = (values: (string | number)[]) => emit({ ...node, values });

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', ...(err && { pb: 1 }) }}>
      <TextField
        select
        size="small"
        label="Field"
        sx={{ minWidth: 150 }}
        value={node.field}
        onChange={(e) => setField(e.target.value as ConditionField)}
      >
        {CONDITION_FIELDS.map((f) => (
          <MenuItem key={f} value={f}>
            {FIELD_LABEL[f]}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        size="small"
        label="Condition"
        sx={{ minWidth: 130 }}
        value={node.operator}
        onChange={(e) => setOperator(e.target.value as LeafOperator)}
      >
        {LEAF_OPERATORS.map((op) => (
          <MenuItem key={op} value={op}>
            {LEAF_OP_LABEL[op]}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        size="small"
        label="Values"
        sx={{ minWidth: 260 }}
        value={node.values}
        onChange={(e) => setValues(e.target.value as unknown as (string | number)[])}
        error={Boolean(err)}
        helperText={err}
        SelectProps={{
          multiple: true,
          renderValue: (selected: (string | number)[]) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {(selected as (string | number)[]).map((val) => (
                <Chip key={String(val)} size="small" label={labelForValue(node.field, val)} />
              ))}
            </Box>
          ),
        }}
      >
        {FIELD_OPTIONS[node.field].map((o) => (
          <MenuItem key={String(o.value)} value={o.value}>
            {o.label}
          </MenuItem>
        ))}
      </TextField>
      {onRemove && (
        <Tooltip title="Remove condition">
          <IconButton size="small" aria-label="Remove condition" onClick={onRemove}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  );
}
