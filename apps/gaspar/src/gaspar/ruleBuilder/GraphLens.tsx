import '@xyflow/react/dist/style.css';
import type { CSSProperties } from 'react';
import { ReactFlow, Background, BackgroundVariant, Controls, MiniMap, type Edge, type NodeTypes } from '@xyflow/react';
import { Box } from '@betty/beam';
import { RuleNodeCard, type RuleFlowNode } from './nodes/RuleNodeCard';

// Stable node-type registry (a new object each render makes RF warn + remount nodes).
const NODE_TYPES: NodeTypes = { rule: RuleNodeCard };

// @xyflow ships functional CSS variables (--xy-*); map them onto Beam tokens so the canvas wears the
// theme with NO hardcoded colours and NO stylesheet fork (fixed-decision 1; dockview precedent).
const XY_VARS = {
  '--xy-background-color': 'var(--mui-palette-background-default)',
  '--xy-edge-stroke': 'var(--mui-palette-text-disabled)',
  '--xy-edge-stroke-width': '1.5',
  '--xy-edge-stroke-selected': 'var(--mui-palette-primary-main)',
  '--xy-handle-background-color': 'var(--mui-palette-primary-main)',
  '--xy-handle-border-color': 'var(--mui-palette-background-paper)',
  '--xy-controls-button-background-color': 'var(--mui-palette-background-paper)',
  '--xy-controls-button-background-color-hover': 'var(--mui-palette-action-hover)',
  '--xy-controls-button-color': 'var(--mui-palette-text-secondary)',
  '--xy-controls-button-color-hover': 'var(--mui-palette-text-primary)',
  '--xy-controls-button-border-color': 'var(--mui-palette-divider)',
  '--xy-minimap-background-color': 'var(--mui-palette-background-paper)',
  '--xy-minimap-mask-background-color': 'var(--mui-palette-action-hover)',
  '--xy-attribution-background-color': 'transparent',
} as CSSProperties;

/**
 * Graph lens — a PROJECTION of the rule tree (v2: tree-as-truth). The page lays the tree out
 * (io/layoutTree) and passes derived nodes/edges; this renders + themes them and reports selection.
 * There is no free connect/drag/placement — structure is edited through the tree (the inspector),
 * and the canvas regenerates. Nodes are non-draggable and the graph is not connectable, so the
 * projection can never drift from the tree.
 */
export function GraphLens({
  nodes,
  edges,
  onSelectNode,
}: {
  nodes: RuleFlowNode[];
  edges: Edge[];
  onSelectNode: (id: string | null) => void;
}) {
  return (
    <Box
      style={XY_VARS}
      sx={{ height: '70vh', minHeight: 480, borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}
    >
      <ReactFlow<RuleFlowNode>
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        fitView
        onNodeClick={(_, n) => onSelectNode(n.id)}
        onPaneClick={() => onSelectNode(null)}
        proOptions={{ hideAttribution: false }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--mui-palette-divider)" />
        <Controls showInteractive={false} />
        <MiniMap pannable zoomable nodeColor="var(--mui-palette-action-disabled)" />
      </ReactFlow>
    </Box>
  );
}
