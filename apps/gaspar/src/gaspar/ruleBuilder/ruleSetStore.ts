/**
 * Rule Builder — THE store. One data model, two projections (graph + grid). Module singleton
 * (payoutConfigs.ts precedent: a mutable module value + free functions), holding the demo seed,
 * the node-kind grammar, JSON (de)serialization + validation, and the render-time advisories.
 *
 * Maker-checker socket (named, NOT built — proposal §7): a `RuleSet` carries `version`, and the
 * store is a mutable singleton, so a future CR integration is a pure add: register
 * `'ruleSet'` on ChangeRequestEntity, define `RuleSetDraft = Omit<RuleSet,'version'>`, and call
 * `registerEntity<RuleSetDraft>('ruleSet', { getVersion, applyDraft })` as this module's import
 * side-effect — mirroring apps/sunlight/src/sunlight/loyaltyStatuses.ts. Nothing here builds it.
 *
 * Live editing truth is React state on the page (ReactFlow needs its state hooks); this module
 * owns the seed, the pure operations both lenses share, and the persisted singleton the socket
 * will hang off. `getRuleSet`/`setRuleSet` keep that singleton coherent across import/export.
 */

export type NodeKind = 'sequence' | 'condition' | 'action';

export type ConditionField = 'amount' | 'currency' | 'method' | 'providerHealth';
export type ConditionOp = 'lt' | 'lte' | 'gt' | 'gte' | 'eq' | 'neq' | 'in';
export type Provider = 'stripe' | 'adyen' | 'checkout';

// Params are SMALL but honest (proposal Q2). Discriminated by `kind` on the node.
export type SequenceParams = { strategy: 'firstMatch' }; // v1's only strategy; the field is the seam
export type ConditionParams = { field: ConditionField; op: ConditionOp; value: string };
export type ActionParams = { type: 'route' | 'reject' | 'review'; provider?: Provider };

type BaseNode = { id: string; name: string; position: { x: number; y: number } };
export type SequenceNode = BaseNode & { kind: 'sequence'; params: SequenceParams };
export type ConditionNode = BaseNode & { kind: 'condition'; params: ConditionParams };
export type ActionNode = BaseNode & { kind: 'action'; params: ActionParams };
export type RuleNode = SequenceNode | ConditionNode | ActionNode;

export type RuleEdge = { id: string; source: string; target: string };

export type RuleSet = {
  version: number; // maker-checker socket — bumped by applyDraft when CR lands (not built)
  name: string;
  nodes: RuleNode[];
  edges: RuleEdge[];
};

export const RULE_SET_SCHEMA_VERSION = 1; // JSON import/export schema version (distinct from entity `version`)

// ─── The node-kind GRAMMAR (connect-time; structure prevents — proposal Q1) ──────────────────
// sequence → condition · condition → condition | action · nothing out of action · nothing into
// a sequence (it's the root). `isValidConnection` on the canvas refuses any drop this rejects,
// so the store is structurally valid by construction and export is always well-formed.
export function canConnect(source: NodeKind, target: NodeKind): boolean {
  if (target === 'sequence') return false; // a sequence is a root — never a target
  if (source === 'sequence') return target === 'condition';
  if (source === 'condition') return target === 'condition' || target === 'action';
  return false; // action has no outgoing
}

// ─── Kind defaults + labels ──────────────────────────────────────────────────────────────────
export const NODE_KIND_LABEL: Record<NodeKind, string> = {
  sequence: 'Sequence',
  condition: 'Condition',
  action: 'Action',
};

export function defaultParams(kind: NodeKind): RuleNode['params'] {
  if (kind === 'sequence') return { strategy: 'firstMatch' };
  if (kind === 'condition') return { field: 'amount', op: 'gte', value: '0' };
  return { type: 'route', provider: 'stripe' };
}

let nodeSeq = 0;
/** A fresh node of `kind` at `position`, with a unique id + default params + a placeholder name. */
export function newNode(kind: NodeKind, position: { x: number; y: number }): RuleNode {
  const id = `${kind}-${Date.now().toString(36)}-${(nodeSeq++).toString(36)}`;
  const name = kind === 'sequence' ? 'New sequence' : kind === 'condition' ? 'New condition' : 'New action';
  return { id, kind, name, position, params: defaultParams(kind) } as RuleNode;
}

const OP_LABEL: Record<ConditionOp, string> = {
  lt: '<', lte: '≤', gt: '>', gte: '≥', eq: '=', neq: '≠', in: 'in',
};

/** One-line params summary — the grid cell + the node card sub-line. */
export function summarizeParams(node: RuleNode): string {
  switch (node.kind) {
    case 'sequence':
      return `strategy: ${node.params.strategy}`;
    case 'condition':
      return `${node.params.field} ${OP_LABEL[node.params.op]} ${node.params.value || '—'}`;
    case 'action':
      return node.params.type === 'route' ? `route → ${node.params.provider ?? '(none)'}` : node.params.type;
  }
}

// ─── Render-time ADVISORIES (completeness backstop — proposal Q1) ─────────────────────────────
// Non-blocking notes the connect-time grammar can't see. Distinct from validation ERRORS; the
// rule set still exports with advisories present. Kept OFF the warning pigment (sign-off a):
// the node card renders them as an ERROR-pigment icon badge, so real advisories never blend into
// the warning-pigmented condition chips.
export type AdvisoryCode = 'multipleRoots' | 'noRoot' | 'orphan' | 'deadEnd' | 'routeNoProvider';
export type Advisory = { nodeId?: string; code: AdvisoryCode; message: string };

export function computeAdvisories(nodes: RuleNode[], edges: RuleEdge[]): Advisory[] {
  const out: Advisory[] = [];
  const incoming = new Set(edges.map((e) => e.target));
  const outgoing = new Set(edges.map((e) => e.source));
  const roots = nodes.filter((n) => n.kind === 'sequence');

  if (roots.length === 0) out.push({ code: 'noRoot', message: 'No sequence node — the rule set has no entry point.' });
  if (roots.length > 1) {
    for (const r of roots) out.push({ nodeId: r.id, code: 'multipleRoots', message: 'More than one sequence root — evaluation order is ambiguous.' });
  }
  for (const n of nodes) {
    if (n.kind !== 'sequence' && !incoming.has(n.id)) out.push({ nodeId: n.id, code: 'orphan', message: `“${n.name}” has no incoming connection — it will never be reached.` });
    if ((n.kind === 'sequence' || n.kind === 'condition') && !outgoing.has(n.id)) out.push({ nodeId: n.id, code: 'deadEnd', message: `“${n.name}” goes nowhere — add a downstream node.` });
    if (n.kind === 'action' && n.params.type === 'route' && !n.params.provider) out.push({ nodeId: n.id, code: 'routeNoProvider', message: `“${n.name}” routes but names no provider.` });
  }
  return out;
}

// ─── JSON serialize + validate (import backstop — error card, never a crash) ──────────────────
export function serialize(ruleSet: RuleSet): string {
  return JSON.stringify({ version: RULE_SET_SCHEMA_VERSION, name: ruleSet.name, nodes: ruleSet.nodes, edges: ruleSet.edges }, null, 2);
}

type ValidateResult = { ok: true; ruleSet: RuleSet } | { ok: false; errors: string[] };

const KINDS: NodeKind[] = ['sequence', 'condition', 'action'];

/** Parse + structurally validate untrusted JSON. Returns typed errors; NEVER throws. */
export function validateRuleSet(input: string): ValidateResult {
  let data: unknown;
  try {
    data = JSON.parse(input);
  } catch {
    return { ok: false, errors: ['Not valid JSON.'] };
  }
  const errors: string[] = [];
  const obj = data as Record<string, unknown>;
  if (typeof data !== 'object' || data === null) return { ok: false, errors: ['Top level must be an object.'] };
  if (obj.version !== RULE_SET_SCHEMA_VERSION) errors.push(`Unsupported schema version (expected ${RULE_SET_SCHEMA_VERSION}, got ${String(obj.version)}).`);
  if (!Array.isArray(obj.nodes)) errors.push('`nodes` must be an array.');
  if (!Array.isArray(obj.edges)) errors.push('`edges` must be an array.');
  if (errors.length) return { ok: false, errors };

  const nodes = obj.nodes as unknown[];
  const edges = obj.edges as unknown[];
  const ids = new Set<string>();
  nodes.forEach((raw, i) => {
    const n = raw as Record<string, unknown>;
    if (typeof n.id !== 'string') return errors.push(`node[${i}]: missing string id.`);
    if (ids.has(n.id)) errors.push(`node[${i}]: duplicate id “${n.id}”.`);
    ids.add(n.id);
    if (!KINDS.includes(n.kind as NodeKind)) errors.push(`node[${i}] (${n.id}): unknown kind “${String(n.kind)}”.`);
    if (typeof n.name !== 'string') errors.push(`node[${i}] (${n.id}): missing name.`);
    const p = n.position as Record<string, unknown> | undefined;
    if (!p || typeof p.x !== 'number' || typeof p.y !== 'number') errors.push(`node[${i}] (${n.id}): position must be {x,y} numbers.`);
    if (typeof n.params !== 'object' || n.params === null) errors.push(`node[${i}] (${n.id}): missing params.`);
  });
  edges.forEach((raw, i) => {
    const e = raw as Record<string, unknown>;
    if (typeof e.id !== 'string') errors.push(`edge[${i}]: missing string id.`);
    if (typeof e.source !== 'string' || !ids.has(e.source as string)) errors.push(`edge[${i}]: source “${String(e.source)}” is not a known node.`);
    if (typeof e.target !== 'string' || !ids.has(e.target as string)) errors.push(`edge[${i}]: target “${String(e.target)}” is not a known node.`);
  });
  if (errors.length) return { ok: false, errors };

  return { ok: true, ruleSet: { version: 1, name: typeof obj.name === 'string' ? obj.name : 'Imported rule set', nodes: nodes as RuleNode[], edges: edges as RuleEdge[] } };
}

// ─── The demo SEED — a domain-plausible routing rule set (demos itself to a payments audience) ─
export const SEED_RULE_SET: RuleSet = {
  version: 1,
  name: 'Card routing — EU + health',
  nodes: [
    { id: 'seq-entry', kind: 'sequence', name: 'Incoming payment', position: { x: 40, y: 240 }, params: { strategy: 'firstMatch' } },
    { id: 'cond-highvalue', kind: 'condition', name: 'High value?', position: { x: 340, y: 80 }, params: { field: 'amount', op: 'gte', value: '1000' } },
    { id: 'cond-health', kind: 'condition', name: 'Primary healthy?', position: { x: 340, y: 400 }, params: { field: 'providerHealth', op: 'eq', value: 'up' } },
    { id: 'cond-eu', kind: 'condition', name: 'EU currency?', position: { x: 660, y: 40 }, params: { field: 'currency', op: 'in', value: 'EUR,GBP' } },
    { id: 'act-adyen', kind: 'action', name: 'Route to Adyen', position: { x: 980, y: 40 }, params: { type: 'route', provider: 'adyen' } },
    { id: 'act-stripe', kind: 'action', name: 'Route to Stripe', position: { x: 660, y: 200 }, params: { type: 'route', provider: 'stripe' } },
    { id: 'act-checkout', kind: 'action', name: 'Route to Checkout', position: { x: 660, y: 360 }, params: { type: 'route', provider: 'checkout' } },
    { id: 'act-review', kind: 'action', name: 'Hold for review', position: { x: 660, y: 500 }, params: { type: 'review' } },
  ],
  edges: [
    { id: 'e1', source: 'seq-entry', target: 'cond-highvalue' },
    { id: 'e2', source: 'seq-entry', target: 'cond-health' },
    { id: 'e3', source: 'cond-highvalue', target: 'cond-eu' },
    { id: 'e4', source: 'cond-eu', target: 'act-adyen' },
    { id: 'e5', source: 'cond-highvalue', target: 'act-stripe' },
    { id: 'e6', source: 'cond-health', target: 'act-checkout' },
    { id: 'e7', source: 'cond-health', target: 'act-review' },
  ],
};

// ─── The module singleton (persisted instance — the CR socket hangs off this) ─────────────────
const clone = (r: RuleSet): RuleSet => JSON.parse(JSON.stringify(r));
let current: RuleSet = clone(SEED_RULE_SET);
export const getRuleSet = (): RuleSet => current;
export const setRuleSet = (next: RuleSet): void => { current = next; };
