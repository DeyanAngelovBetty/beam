/**
 * Rule Builder — THE store, RuleSet v2 (tree-as-truth). The engine's containment TREE is the single
 * source of truth; the ReactFlow canvas is a derived projection (see io/layoutTree). Editing mutates
 * the tree and the canvas regenerates — there is no free node placement to drift (v2 ruling).
 *
 * Interchange = the engine's native schema (ruleTree.ts). `version` + `name` are STORE-LOCAL
 * metadata, NEVER serialized into the tree (v2 ruling) — export emits the engine schema only.
 *
 * Maker-checker socket (named, NOT built): `version` lives here store-local, so a future CR
 * integration is a pure add — register `'ruleSet'` on ChangeRequestEntity with a draft of the tree +
 * meta, mirroring apps/sunlight/src/sunlight/loyaltyStatuses.ts. Nothing here builds it.
 */
import type {
  ActionConfig,
  ConditionConfig,
  ConditionNodeConfig,
  NodeConfig,
  SequenceNodeConfig,
  ActionNodeConfig,
} from './ruleTree';
import { findFact } from './facts/facts';
import { importRuleTree } from './io/importRuleTree';
import acmeMainRaw from './fixtures/acme-main.json?raw';

export * from './ruleTree'; // re-export types + NODE_KIND_LABEL + operator/action lists

/** Store-local metadata — never serialized into the interchange tree. */
export interface RuleSetMeta {
  version: number;
  name: string;
}

// ─── id factory ────────────────────────────────────────────────────────────────────────────────
let idSeq = 0;
const nid = (k: string) => `${k}-${Date.now().toString(36)}-${(idSeq++).toString(36)}`;

// ─── fresh nodes (add affordances) ───────────────────────────────────────────────────────────────
export function newAction(): ActionNodeConfig {
  return { id: nid('act'), type: 'action', actions: [{ type: 'block', reason: '' }] };
}
export function newCondition(): ConditionNodeConfig {
  // trueNode is required — a new condition ships with an empty action as its True branch.
  return { id: nid('cond'), type: 'condition', condition: { type: 'field', field: '', operator: 'Eq', value: '' }, trueNode: newAction() };
}
export function newSequence(): SequenceNodeConfig {
  return { id: nid('seq'), type: 'sequence', nodes: [] };
}

// ─── pure tree operations (id-addressed; each returns a NEW root) ─────────────────────────────────
export function findNode(root: NodeConfig, id: string): NodeConfig | undefined {
  if (root.id === id) return root;
  if (root.type === 'condition') return findNode(root.trueNode, id) ?? (root.falseNode ? findNode(root.falseNode, id) : undefined);
  if (root.type === 'sequence') {
    for (const c of root.nodes) {
      const hit = findNode(c, id);
      if (hit) return hit;
    }
  }
  return undefined;
}

/** Replace the node with `id` by `fn(node)`, rebuilding the spine above it. */
export function updateNode(root: NodeConfig, id: string, fn: (n: NodeConfig) => NodeConfig): NodeConfig {
  if (root.id === id) return fn(root);
  if (root.type === 'condition') {
    return {
      ...root,
      trueNode: updateNode(root.trueNode, id, fn),
      ...(root.falseNode ? { falseNode: updateNode(root.falseNode, id, fn) } : {}),
    };
  }
  if (root.type === 'sequence') return { ...root, nodes: root.nodes.map((c) => updateNode(c, id, fn)) };
  return root;
}

/** Remove a node. Guards: the root and a condition's required `trueNode` cannot be removed. */
export function removeNode(root: NodeConfig, id: string): NodeConfig {
  const rec = (n: NodeConfig): NodeConfig => {
    if (n.type === 'sequence') return { ...n, nodes: n.nodes.filter((c) => c.id !== id).map(rec) };
    if (n.type === 'condition') {
      const next: ConditionNodeConfig = { ...n, trueNode: rec(n.trueNode) };
      if (n.falseNode && n.falseNode.id !== id) next.falseNode = rec(n.falseNode);
      // else: falseNode matched id → dropped (fall-through restored)
      return next;
    }
    return n;
  };
  return rec(root);
}

/** True iff `id` is removable (not the root, not a condition's trueNode). */
export function isRemovable(root: NodeConfig, id: string): boolean {
  if (root.id === id) return false;
  const rec = (n: NodeConfig): boolean => {
    if (n.type === 'condition') {
      if (n.trueNode.id === id) return false; // required branch
      return rec(n.trueNode) || (n.falseNode ? rec(n.falseNode) : false) || (n.falseNode?.id === id ? true : false);
    }
    if (n.type === 'sequence') return n.nodes.some((c) => c.id === id || rec(c));
    return false;
  };
  return rec(root);
}

/** Append a child to a sequence node. */
export function addSequenceChild(root: NodeConfig, seqId: string, child: NodeConfig): NodeConfig {
  return updateNode(root, seqId, (n) => (n.type === 'sequence' ? { ...n, nodes: [...n.nodes, child] } : n));
}
/** Attach (or clear) a condition's False branch. */
export function setFalseBranch(root: NodeConfig, condId: string, falseNode: NodeConfig | undefined): NodeConfig {
  return updateNode(root, condId, (n) => {
    if (n.type !== 'condition') return n;
    const next: ConditionNodeConfig = { ...n };
    if (falseNode) next.falseNode = falseNode;
    else delete next.falseNode;
    return next;
  });
}

// ─── summaries ───────────────────────────────────────────────────────────────────────────────────
export function summarizeCondition(c: ConditionConfig): string {
  switch (c.type) {
    case 'fact':
    case 'field': {
      const path = c.fact ?? c.field ?? '(no fact)';
      const value = Array.isArray(c.value) ? `[${c.value.join(', ')}]` : String(c.value);
      return `${path} ${c.operator} ${value}`;
    }
    case 'and':
      return `AND (${c.conditions.length})`;
    case 'or':
      return `OR (${c.conditions.length})`;
    case 'not':
      return `NOT (${summarizeCondition(c.inner)})`;
  }
}
export function summarizeAction(a: ActionConfig): string {
  switch (a.type) {
    case 'block':
      return `Block: ${a.reason || '(no reason)'}`;
    case 'setRiskLevel':
      return `Set risk: ${a.level}`;
    case 'addPsp':
      return `Add PSP ${a.pspId} (${a.initialScore})`;
    case 'disablePsp':
      return `Disable PSP ${a.pspId}`;
    case 'adjustPspScore':
      return `Adjust PSP ${a.pspId} by ${a.delta}`;
    case 'require':
    case 'addRequiredAction':
      return `Require: ${a.action}`;
    case 'setFact':
      return `Set fact ${a.key}`;
  }
}
export function summarizeNode(n: NodeConfig): string {
  if (n.type === 'condition') return summarizeCondition(n.condition);
  if (n.type === 'action') return n.actions.map(summarizeAction).join(' · ') || '(no actions)';
  return `${n.nodes.length} step${n.nodes.length === 1 ? '' : 's'}`;
}

// ─── advisories: fact leaves not in the catalog (the real engine file had 6 such) ───────────────
export interface FactAdvisory {
  nodeId: string;
  path: string;
}
export function unknownFactAdvisories(root: NodeConfig): FactAdvisory[] {
  const out: FactAdvisory[] = [];
  const walkCond = (nodeId: string, c: ConditionConfig) => {
    if (c.type === 'field' || c.type === 'fact') {
      const path = c.fact ?? c.field ?? '';
      if (path && !findFact(path)) out.push({ nodeId, path });
    } else if (c.type === 'and' || c.type === 'or') c.conditions.forEach((sub) => walkCond(nodeId, sub));
    else if (c.type === 'not') walkCond(nodeId, c.inner);
  };
  const walk = (n: NodeConfig) => {
    if (n.type === 'condition') {
      walkCond(n.id, n.condition);
      walk(n.trueNode);
      if (n.falseNode) walk(n.falseNode);
    } else if (n.type === 'sequence') n.nodes.forEach(walk);
  };
  walk(root);
  return out;
}

// ─── native export (engine schema only — no positions, version, or name) ─────────────────────────
export function serialize(root: NodeConfig): string {
  return JSON.stringify(root, null, 2);
}

// ─── the seed (built on the demo catalog) + the store singleton ──────────────────────────────────
function seed(): NodeConfig {
  const res = importRuleTree(acmeMainRaw);
  return res.ok ? res.root : newSequence();
}
export const SEED_ROOT: NodeConfig = seed();

const clone = (n: NodeConfig): NodeConfig => JSON.parse(JSON.stringify(n));
let currentRoot: NodeConfig = clone(SEED_ROOT);
let currentMeta: RuleSetMeta = { version: 1, name: 'Acme routing policy' };

export const getRuleTree = (): NodeConfig => currentRoot;
export const getRuleMeta = (): RuleSetMeta => currentMeta;
export function setRuleTree(root: NodeConfig, name?: string): void {
  currentRoot = root;
  if (name !== undefined) currentMeta = { ...currentMeta, name };
}
export function resetToSeed(): void {
  currentRoot = clone(SEED_ROOT);
  currentMeta = { version: 1, name: 'Acme routing policy' };
}
