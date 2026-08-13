import '@xyflow/react/dist/style.css';
import type { CSSProperties } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  type Edge,
  type NodeTypes,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type IsValidConnection,
} from '@xyflow/react';
import { Box, Paper, Button, Divider, Tooltip } from '@betty/beam';
import { RuleNodeCard, type RuleFlowNode } from './nodes/RuleNodeCard';
import type { NodeKind } from './ruleSetStore';

// Stable node-type registry (a new object each render makes RF warn + remount nodes).
const NODE_TYPES: NodeTypes = { rule: RuleNodeCard };

// @xyflow/react ships functional CSS variables (--xy-*); map them onto Beam tokens so the canvas
// wears the theme with NO hardcoded colours and NO stylesheet fork (fixed-decision 1). Exactly the
// dockview precedent (BenchDashboardDock.tsx:88-101), one dep over.
const XY_VARS = {
  '--xy-background-color': 'var(--mui-palette-background-default)',
  '--xy-edge-stroke': 'var(--mui-palette-text-disabled)',
  '--xy-edge-stroke-width': '1.5',
  '--xy-edge-stroke-selected': 'var(--mui-palette-primary-main)',
  '--xy-connectionline-stroke': 'var(--mui-palette-primary-main)',
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
 * Graph lens — the ReactFlow canvas. Presentational: all state (nodes/edges/selection) lives on
 * the page (one store, two projections); this renders it, themes it, and enforces the connect-time
 * grammar. STRUCTURE PREVENTS: `isValidConnection` refuses any drop the node-kind grammar rejects
 * (proposal Q1 / sign-off b), so the store stays valid by construction. Advisories are computed on
 * the page and ride each node's `data`; the node card shows them as the error-pigment badge.
 */
export function GraphLens({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  isValidConnection,
  onAddNode,
}: {
  nodes: RuleFlowNode[];
  edges: Edge[];
  onNodesChange: OnNodesChange<RuleFlowNode>;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  isValidConnection: IsValidConnection;
  onAddNode: (kind: NodeKind) => void;
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
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        fitView
        proOptions={{ hideAttribution: false }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--mui-palette-divider)" />
        <Controls showInteractive={false} />
        <MiniMap pannable zoomable nodeColor="var(--mui-palette-action-disabled)" />
        <Panel position="top-left">
          <Paper variant="outlined" sx={{ p: 0.5, display: 'flex', gap: 0.5, alignItems: 'center' }}>
            <Button size="small" onClick={() => onAddNode('sequence')}>+ Sequence</Button>
            <Button size="small" onClick={() => onAddNode('condition')}>+ Condition</Button>
            <Button size="small" onClick={() => onAddNode('action')}>+ Action</Button>
            <Divider orientation="vertical" flexItem />
            {/* Auto-layout is NOT v1 (fixed-decision 4) — the button's HOME is decided here; the
                feature is a clean follow-up. Disabled stub, builds nothing. */}
            <Tooltip title="Auto-layout — a v2 follow-up">
              <span>
                <Button size="small" disabled>Tidy</Button>
              </span>
            </Tooltip>
          </Paper>
        </Panel>
      </ReactFlow>
    </Box>
  );
}
