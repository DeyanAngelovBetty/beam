/**
 * Rule-tree interchange types — Gaspar RuleSet v2. This mirrors the payment engine's OWN rule
 * schema (its RulesEngine, via the team's TS mirror), adopted as our interchange contract so the
 * builder opens the engine's rule files unmodified.
 *
 * A rule is a NESTED CONTAINMENT TREE, not a node+edge graph: a node's children live INSIDE it
 * (`condition.trueNode`/`falseNode`, `sequence.nodes[]`), so a DAG or a cycle is structurally
 * inexpressible — tree-ness is an invariant of the TYPE, not a runtime check. This is the deliberate
 * inversion of RuleSet v1 (a free ReactFlow graph). v2 ruling: the tree is truth, the canvas is a
 * derived projection (see layoutTree).
 *
 * The format carries NO positions, NO version, NO display name. Layout is derived (derive-only, v2
 * ruling); `version` + the maker-checker socket are STORE-LOCAL metadata, never serialized here.
 */

export type JsonScalar = string | number | boolean | null;
export type JsonValue = JsonScalar | JsonValue[];

// ── Condition expression — a recursive boolean tree, independent of the node tree ───────────────
export type ConditionOperator = 'Eq' | 'NotEq' | 'Gt' | 'Gte' | 'Lt' | 'Lte' | 'In' | 'NotIn';
export const CONDITION_OPERATORS: ConditionOperator[] = ['Eq', 'NotEq', 'Gt', 'Gte', 'Lt', 'Lte', 'In', 'NotIn'];

/** A leaf: a fact-path reference + operator + value. The engine accepts `field` or `fact` for the
 *  path key (`field` in its file samples, `fact` canonical); value is a scalar or an array (In/NotIn). */
export interface FactCondition {
  type: 'fact' | 'field';
  fact?: string;
  field?: string;
  operator: ConditionOperator;
  value: JsonValue;
}
export interface AndCondition {
  type: 'and';
  conditions: ConditionConfig[];
}
export interface OrCondition {
  type: 'or';
  conditions: ConditionConfig[];
}
export interface NotCondition {
  type: 'not';
  inner: ConditionConfig;
}
export type ConditionConfig = FactCondition | AndCondition | OrCondition | NotCondition;

// ── Action vocabulary (7) ───────────────────────────────────────────────────────────────────────
export type ArithmeticOperator = 'Add' | 'Subtract' | 'Multiply' | 'Divide';
export const ARITHMETIC_OPERATORS: ArithmeticOperator[] = ['Add', 'Subtract', 'Multiply', 'Divide'];

export interface BlockAction {
  type: 'block';
  reason: string;
}
export interface SetRiskLevelAction {
  type: 'setRiskLevel';
  level: string;
  reason: string;
}
export interface AddPspAction {
  type: 'addPsp';
  pspId: string;
  initialScore: number;
}
export interface DisablePspAction {
  type: 'disablePsp';
  pspId: string;
  reason: string;
}
export interface AdjustPspScoreAction {
  type: 'adjustPspScore';
  pspId: string;
  delta: number;
}
/** `require` is canonical; `addRequiredAction` is a legacy alias accepted on import. */
export interface RequireAction {
  type: 'require' | 'addRequiredAction';
  action: string;
}
export interface FactExpression {
  left: JsonValue;
  operator: ArithmeticOperator;
  right: JsonValue;
}
export interface SetFactAction {
  type: 'setFact';
  key: string;
  value?: JsonValue;
  field?: string;
  expression?: FactExpression;
}
export type ActionConfig =
  | BlockAction
  | SetRiskLevelAction
  | AddPspAction
  | DisablePspAction
  | AdjustPspScoreAction
  | RequireAction
  | SetFactAction;

export const ACTION_TYPES: ActionConfig['type'][] = [
  'block',
  'setRiskLevel',
  'addPsp',
  'disablePsp',
  'adjustPspScore',
  'require',
  'setFact',
];

// ── Node tree ────────────────────────────────────────────────────────────────────────────────────
export interface ConditionNodeConfig {
  id: string;
  type: 'condition';
  condition: ConditionConfig;
  trueNode: NodeConfig; // required — the branch taken when the condition holds
  falseNode?: NodeConfig; // optional — omit ⇒ fall through to the next sequence step
}
export interface SequenceNodeConfig {
  id: string;
  type: 'sequence';
  nodes: NodeConfig[]; // ordered; first-match evaluation, non-matching steps fall through
}
export interface ActionNodeConfig {
  id: string;
  type: 'action';
  actions: ActionConfig[];
}
export type NodeConfig = ConditionNodeConfig | SequenceNodeConfig | ActionNodeConfig;

/** The three node kinds (unchanged names from v1; the model beneath them is not). */
export type NodeKind = NodeConfig['type'];
export const NODE_KIND_LABEL: Record<NodeKind, string> = {
  sequence: 'Sequence',
  condition: 'Condition',
  action: 'Action',
};
