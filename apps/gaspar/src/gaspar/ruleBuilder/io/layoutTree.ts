import type { NodeConfig, NodeKind } from '../ruleTree';

/**
 * Deterministic tree layout — the canvas is a PROJECTION of the tree (v2 ruling: derive-only, no
 * stored positions, no Tidy button — layout is always tidy). Walks the containment tree, packs each
 * subtree by width, and emits laid-out nodes + LABELED edges (True / False / sequence-step). Pure:
 * returns plain shapes, so GraphLens maps them onto @xyflow nodes/edges without this file importing it.
 *
 * A re-layout on every structural edit is what keeps the graph honest — there is no free placement to
 * drift out of sync with the tree.
 */
export const COLUMN_WIDTH = 260;
export const LEVEL_HEIGHT = 168;

export type EdgeKind = 'true' | 'false' | 'step';

export interface LaidOutNode {
  id: string;
  kind: NodeKind;
  position: { x: number; y: number };
  node: NodeConfig;
}
export interface LaidOutEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  kind: EdgeKind;
}

interface ChildRef {
  node: NodeConfig;
  label: string;
  kind: EdgeKind;
}

/** A node's children in the tree, with the branch label + kind each edge carries. */
export function childrenOf(node: NodeConfig): ChildRef[] {
  if (node.type === 'action') return [];
  if (node.type === 'condition') {
    const refs: ChildRef[] = [{ node: node.trueNode, label: 'True', kind: 'true' }];
    if (node.falseNode) refs.push({ node: node.falseNode, label: 'False', kind: 'false' });
    return refs;
  }
  return node.nodes.map((child, i) => ({ node: child, label: String(i + 1), kind: 'step' as const }));
}

export function layoutTree(root: NodeConfig): { nodes: LaidOutNode[]; edges: LaidOutEdge[] } {
  const nodes: LaidOutNode[] = [];
  const edges: LaidOutEdge[] = [];

  // Returns the subtree's width in "columns"; positions are set as we go (x = column centre).
  function visit(node: NodeConfig, depth: number, xStart: number): number {
    const refs = childrenOf(node);
    let width: number;
    let center: number;

    if (refs.length === 0) {
      width = 1;
      center = xStart + 0.5;
    } else {
      let cursor = xStart;
      for (const ref of refs) {
        const childWidth = visit(ref.node, depth + 1, cursor);
        edges.push({
          id: `${node.id}__${ref.node.id}`,
          source: node.id,
          target: ref.node.id,
          label: ref.kind === 'step' ? '' : ref.label,
          kind: ref.kind,
        });
        cursor += childWidth;
      }
      width = cursor - xStart;
      center = xStart + width / 2;
    }

    nodes.push({
      id: node.id,
      kind: node.type,
      position: { x: center * COLUMN_WIDTH, y: depth * LEVEL_HEIGHT },
      node,
    });
    return width;
  }

  visit(root, 0, 0);
  return { nodes, edges };
}
