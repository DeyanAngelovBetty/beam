import type {
  ActionConfig,
  ConditionOperator,
  FactCondition,
  NodeConfig,
} from '../ruleTree';

/**
 * v1 → v2 migration. RuleSet v1 was a free ReactFlow GRAPH (flat nodes[] + unlabeled edges[]); v2 is
 * the engine's containment TREE. This converts our own old seed/exports so they still open — a
 * best-effort BRIDGE, not a faithful round-trip, because v1 threw away information v2 needs:
 *
 *  - v1 condition edges are UNLABELED, so True vs False is a GUESS: first out-edge → trueNode,
 *    second → falseNode (by edge order). Flagged per condition.
 *  - v1's closed field enum maps to fact paths; `providerHealth` has no catalog twin (flagged).
 *  - v1 actions (route/reject/review) map LOSSILY onto the engine vocabulary (flagged).
 *
 * All guesses are collected as warnings for the import report. Never throws.
 */

interface V1Node {
  id: string;
  kind: 'sequence' | 'condition' | 'action';
  name?: string;
  params?: Record<string, unknown>;
}
interface V1Edge {
  id: string;
  source: string;
  target: string;
}

const OP_MAP: Record<string, ConditionOperator> = {
  lt: 'Lt', lte: 'Lte', gt: 'Gt', gte: 'Gte', eq: 'Eq', neq: 'NotEq', in: 'In',
};
// v1's closed field enum → catalog fact paths (providerHealth has no catalog twin — flagged).
const FIELD_MAP: Record<string, string> = {
  amount: 'request.amount',
  currency: 'request.currency',
  method: 'request.paymentMethod.type',
  providerHealth: 'facts.providerHealth',
};

export interface MigrateResult {
  root: NodeConfig;
  warnings: string[];
}

export function migrateV1(data: Record<string, unknown>): { ok: true; root: NodeConfig; warnings: string[] } | { ok: false; errors: string[] } {
  const rawNodes = data.nodes;
  const rawEdges = data.edges;
  if (!Array.isArray(rawNodes) || !Array.isArray(rawEdges)) {
    return { ok: false, errors: ['v1 rule set must have `nodes` and `edges` arrays.'] };
  }
  const nodes = rawNodes as V1Node[];
  const edges = rawEdges as V1Edge[];
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const outEdges = new Map<string, string[]>();
  for (const e of edges) {
    if (!outEdges.has(e.source)) outEdges.set(e.source, []);
    outEdges.get(e.source)!.push(e.target);
  }

  const roots = nodes.filter((n) => n.kind === 'sequence');
  if (roots.length === 0) return { ok: false, errors: ['v1 rule set has no sequence node to use as the tree root.'] };
  const warnings: string[] = [];
  if (roots.length > 1) warnings.push(`v1 had ${roots.length} sequence roots; using the first (“${roots[0].id}”) and dropping the rest.`);

  const emptyAction = (id: string): NodeConfig => ({ id, type: 'action', actions: [] });

  const build = (id: string, seen: Set<string>): NodeConfig => {
    const n = byId.get(id);
    if (!n) return emptyAction(`${id}__missing`);
    if (seen.has(id)) {
      warnings.push(`Cycle at “${id}” — v1 graphs allow cycles, v2 trees do not; cut here.`);
      return emptyAction(`${id}__cycle`);
    }
    const nextSeen = new Set(seen).add(id);
    const targets = outEdges.get(id) ?? [];

    if (n.kind === 'action') {
      return { id: n.id, type: 'action', actions: mapV1Action(n, warnings) };
    }
    if (n.kind === 'sequence') {
      return { id: n.id, type: 'sequence', nodes: targets.map((t) => build(t, nextSeen)) };
    }
    // condition: first out-edge → trueNode (guess), second → falseNode (guess)
    const [trueTarget, falseTarget, ...extra] = targets;
    if (extra.length) warnings.push(`Condition “${id}” had ${targets.length} outgoing edges; kept 2 (True/False), dropped ${extra.length}.`);
    if (!trueTarget) warnings.push(`Condition “${id}” had no outgoing edge; synthesised an empty True branch.`);
    else warnings.push(`Condition “${id}”: True/False branches inferred from edge order (v1 edges are unlabeled).`);
    const trueNode = trueTarget ? build(trueTarget, nextSeen) : emptyAction(`${id}__true`);
    const falseNode = falseTarget ? build(falseTarget, nextSeen) : undefined;
    return { id: n.id, type: 'condition', condition: mapV1Condition(n, warnings), trueNode, ...(falseNode ? { falseNode } : {}) };
  };

  return { ok: true, root: build(roots[0].id, new Set()), warnings };
}

function mapV1Condition(n: V1Node, warnings: string[]): FactCondition {
  const p = (n.params ?? {}) as { field?: string; op?: string; value?: string };
  const field = FIELD_MAP[p.field ?? ''] ?? `request.${p.field ?? 'unknown'}`;
  if (p.field === 'providerHealth') warnings.push(`“${n.id}”: v1 field “providerHealth” has no catalog fact; mapped to “facts.providerHealth”.`);
  const operator = OP_MAP[p.op ?? 'eq'] ?? 'Eq';
  const raw = p.value ?? '';
  const value = operator === 'In' ? raw.split(',').map((s) => s.trim()).filter(Boolean) : /^-?\d+(\.\d+)?$/.test(raw) ? Number(raw) : raw;
  return { type: 'field', field, operator, value };
}

function mapV1Action(n: V1Node, warnings: string[]): ActionConfig[] {
  const p = (n.params ?? {}) as { type?: string; provider?: string };
  switch (p.type) {
    case 'reject':
      warnings.push(`“${n.id}”: v1 action “reject” mapped to engine “block”.`);
      return [{ type: 'block', reason: '' }];
    case 'review':
      warnings.push(`“${n.id}”: v1 action “review” mapped to engine “require: ManualReview”.`);
      return [{ type: 'require', action: 'ManualReview' }];
    case 'route':
    default:
      warnings.push(`“${n.id}”: v1 action “route” mapped to engine “addPsp” (no direct route action in the engine).`);
      return [{ type: 'addPsp', pspId: p.provider ?? '', initialScore: 0 }];
  }
}
