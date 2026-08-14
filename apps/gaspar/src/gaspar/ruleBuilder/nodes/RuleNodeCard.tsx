import { Paper, Box, Stack, Typography, Tooltip, beamGradientBorder } from '@betty/beam';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import ReportProblemRoundedIcon from '@mui/icons-material/ReportProblemRounded';
import { NodeKindChip } from './NodeKindChip';
import { summarizeNode, type NodeConfig, type FactAdvisory } from '../ruleSetStore';

// The RF node carries the domain tree node + its advisories + selection in `data` (positions are
// derived by layoutTree, not stored). The card only reads `data`.
export type RuleNodeData = { node: NodeConfig; advisories: FactAdvisory[]; selected: boolean };
export type RuleFlowNode = Node<RuleNodeData, 'rule'>;

const NODE_RADIUS = 12; // must match the beamGradientBorder radius below (the rim traces this)

/**
 * A rule-tree node as a themed Beam card. Selection = the gradient-border recipe. CARRIED
 * CONSTRAINT (registry.tsx): NEVER set `overflow: hidden` — beamGradientBorder draws its rim on an
 * OUTWARD `::after` a clip would eat. Advisories (unknown facts — a fact leaf not in the catalog)
 * show as an ERROR-pigment icon badge, distinct from the warning-pigmented condition chip.
 *
 * Handles are visual anchors for the derived edges: a target on every node (the root's is unused),
 * a source on anything that has children (not an action).
 */
export function RuleNodeCard({ data }: NodeProps<RuleFlowNode>) {
  const { node, advisories, selected } = data;
  return (
    <Paper
      variant="outlined"
      sx={{
        width: 220,
        p: 1.25,
        borderRadius: `${NODE_RADIUS}px`,
        position: 'relative',
        ...(selected ? beamGradientBorder({ radius: NODE_RADIUS }) : {}),
      }}
    >
      <Handle type="target" position={Position.Top} />
      {node.type !== 'action' && <Handle type="source" position={Position.Bottom} />}

      <Stack spacing={0.5}>
        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <NodeKindChip kind={node.type} />
          {advisories.length > 0 && (
            <Tooltip title={advisories.map((a) => `Unknown fact: ${a.path}`).join(' · ')}>
              <Box aria-label={`${advisories.length} advisory`} sx={{ display: 'inline-flex', color: 'error.main' }}>
                <ReportProblemRoundedIcon fontSize="small" />
              </Box>
            </Tooltip>
          )}
        </Stack>
        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap title={node.id}>
          {node.id}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap title={summarizeNode(node)}>
          {summarizeNode(node)}
        </Typography>
      </Stack>
    </Paper>
  );
}
