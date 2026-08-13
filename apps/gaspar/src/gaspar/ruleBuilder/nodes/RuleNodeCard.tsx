import { Paper, Box, Stack, Typography, Tooltip, beamGradientBorder } from '@betty/beam';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import ReportProblemRoundedIcon from '@mui/icons-material/ReportProblemRounded';
import { NodeKindChip } from './NodeKindChip';
import { summarizeParams, type RuleNode, type Advisory } from '../ruleSetStore';

// The RF node carries the domain node + its live advisories in `data`. Positions/ids/selection
// live on the RF node itself; the card only reads `data` + `selected`.
export type RuleNodeData = { rule: RuleNode; advisories: Advisory[] };
export type RuleFlowNode = Node<RuleNodeData, 'rule'>;

const NODE_RADIUS = 12; // must match the beamGradientBorder radius below (the rim traces this)

/**
 * A rule node as a themed Beam card. Selection = the gradient-border recipe (the one that pulled
 * Dobromir to a laptop). CARRIED CONSTRAINT (registry.tsx:49-54): the card must NEVER set
 * `overflow: hidden` — beamGradientBorder draws its rim on an OUTWARD `::after`, which a clip
 * would eat. Paper `variant="outlined"` does not clip, and `radius` here === the card radius.
 *
 * Advisories (render-time completeness notes) show as an ERROR-pigment icon badge — deliberately
 * NOT the warning pigment the condition chip wears (sign-off a), so they never blend in.
 */
export function RuleNodeCard({ data, selected }: NodeProps<RuleFlowNode>) {
  const { rule, advisories } = data;
  return (
    <Paper
      variant="outlined"
      sx={{
        width: 208,
        p: 1.25,
        borderRadius: `${NODE_RADIUS}px`,
        position: 'relative',
        // NO overflow: hidden — see the class comment. Selected → the lit gradient rim.
        ...(selected ? beamGradientBorder({ radius: NODE_RADIUS }) : {}),
      }}
    >
      {/* Handles: nothing connects INTO a sequence (root); nothing connects OUT of an action. */}
      {rule.kind !== 'sequence' && <Handle type="target" position={Position.Left} />}
      {rule.kind !== 'action' && <Handle type="source" position={Position.Right} />}

      <Stack spacing={0.5}>
        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <NodeKindChip kind={rule.kind} />
          {advisories.length > 0 && (
            <Tooltip title={advisories.map((a) => a.message).join(' · ')}>
              <Box aria-label={`${advisories.length} advisory`} sx={{ display: 'inline-flex', color: 'error.main' }}>
                <ReportProblemRoundedIcon fontSize="small" />
              </Box>
            </Tooltip>
          )}
        </Stack>
        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
          {rule.name}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {summarizeParams(rule)}
        </Typography>
      </Stack>
    </Paper>
  );
}
