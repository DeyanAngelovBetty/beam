import { Box, Stack, Typography, TextField, MenuItem, Button, Divider } from '@betty/beam';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineRounded';
import { NodeKindChip } from './nodes/NodeKindChip';
import type {
  RuleNode,
  ConditionField,
  ConditionOp,
  Provider,
  ActionParams,
} from './ruleSetStore';

const CONDITION_FIELDS: ConditionField[] = ['amount', 'currency', 'method', 'providerHealth'];
const CONDITION_OPS: ConditionOp[] = ['lt', 'lte', 'gt', 'gte', 'eq', 'neq', 'in'];
const PROVIDERS: Provider[] = ['stripe', 'adyen', 'checkout'];
const ACTION_TYPES: ActionParams['type'][] = ['route', 'reject', 'review'];

/**
 * The single edit surface for the selected node — rename, kind-specific params, delete. Shared by
 * both lenses: the graph selects a node into it; the grid's "Edit in graph" lands here too. Params
 * are the small, honest v1 set (proposal Q2); the controls are `TextField select` (no FormControl
 * dependency). Every change calls back up so the page's one store stays the source of truth.
 */
export function NodeInspector({
  node,
  onRename,
  onParams,
  onDelete,
}: {
  node: RuleNode | null;
  onRename: (id: string, name: string) => void;
  onParams: (id: string, params: RuleNode['params']) => void;
  onDelete: (id: string) => void;
}) {
  if (!node) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Select a node to edit its name and parameters.
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={2} sx={{ p: 2 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <NodeKindChip kind={node.kind} />
        <Typography variant="overline" color="text.secondary">
          Inspector
        </Typography>
      </Stack>

      <TextField
        size="small"
        label="Name"
        value={node.name}
        onChange={(e) => onRename(node.id, e.target.value)}
        fullWidth
      />

      <Divider />

      {node.kind === 'sequence' && (
        <TextField
          size="small"
          select
          label="Strategy"
          value={node.params.strategy}
          onChange={(e) => onParams(node.id, { strategy: e.target.value as 'firstMatch' })}
          helperText="First matching branch wins (v1)."
          fullWidth
        >
          <MenuItem value="firstMatch">firstMatch</MenuItem>
        </TextField>
      )}

      {node.kind === 'condition' && (
        <>
          <TextField
            size="small"
            select
            label="Field"
            value={node.params.field}
            onChange={(e) => onParams(node.id, { ...node.params, field: e.target.value as ConditionField })}
            fullWidth
          >
            {CONDITION_FIELDS.map((f) => (
              <MenuItem key={f} value={f}>{f}</MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            select
            label="Operator"
            value={node.params.op}
            onChange={(e) => onParams(node.id, { ...node.params, op: e.target.value as ConditionOp })}
            fullWidth
          >
            {CONDITION_OPS.map((o) => (
              <MenuItem key={o} value={o}>{o}</MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            label="Value"
            value={node.params.value}
            onChange={(e) => onParams(node.id, { ...node.params, value: e.target.value })}
            helperText={node.params.op === 'in' ? 'Comma-separated (e.g. EUR,GBP).' : undefined}
            fullWidth
          />
        </>
      )}

      {node.kind === 'action' && (
        <>
          <TextField
            size="small"
            select
            label="Type"
            value={node.params.type}
            onChange={(e) => {
              const type = e.target.value as ActionParams['type'];
              // route needs a provider; reject/review drop it (keeps the shape honest).
              onParams(node.id, type === 'route' ? { type, provider: node.params.provider ?? 'stripe' } : { type });
            }}
            fullWidth
          >
            {ACTION_TYPES.map((t) => (
              <MenuItem key={t} value={t}>{t}</MenuItem>
            ))}
          </TextField>
          {node.params.type === 'route' && (
            <TextField
              size="small"
              select
              label="Provider"
              value={node.params.provider ?? 'stripe'}
              onChange={(e) => onParams(node.id, { type: 'route', provider: e.target.value as Provider })}
              fullWidth
            >
              {PROVIDERS.map((p) => (
                <MenuItem key={p} value={p}>{p}</MenuItem>
              ))}
            </TextField>
          )}
        </>
      )}

      <Divider />

      <Button
        size="small"
        color="error"
        variant="outlined"
        startIcon={<DeleteOutlineIcon />}
        onClick={() => onDelete(node.id)}
        sx={{ alignSelf: 'flex-start' }}
      >
        Delete node
      </Button>
    </Stack>
  );
}
