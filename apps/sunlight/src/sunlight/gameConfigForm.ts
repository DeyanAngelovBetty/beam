import { PAYOUT_CONFIGS } from './payoutConfigs';
import type { GameType, PayoutStatus } from './payoutConfigs';
import {
  gameConfigNameIsUnique,
  type GameConfig,
  type GameConfigInput,
  type TargetingCondition,
  type TargetingRule,
} from './gameConfigs';
import {
  emptyLeaf,
  isValidConditionTree,
  type ConditionGroup,
  type ConditionNode,
} from './conditionTree';

/**
 * The Game Config editor's FORM model + the CONDITION ADAPTER.
 *
 * The backend and editor both support recursive condition trees. This adapter
 * adds and removes the editor-only `kind` discriminator while preserving the
 * backend operator, field, value, and statement names.
 */

const MAX_NAME = 100;

export function conditionToGroup(condition?: TargetingCondition): ConditionGroup {
  if (!condition) return { kind: 'group', operator: 'All', children: [emptyLeaf()] };
  const node = conditionToNode(condition);
  return node.kind === 'group' ? node : { kind: 'group', operator: 'All', children: [node] };
}

function conditionToNode(condition: TargetingCondition): ConditionNode {
  return 'statements' in condition
    ? { kind: 'group', operator: condition.operator, children: condition.statements.map(conditionToNode) }
    : { kind: 'leaf', field: condition.field, operator: condition.operator, values: [...condition.values] };
}

/** Editor tree → exact recursive backend condition shape. */
export function groupToCondition(group: ConditionGroup): TargetingCondition {
  return nodeToCondition(group);
}

function nodeToCondition(node: ConditionNode): TargetingCondition {
  return node.kind === 'group'
    ? { operator: node.operator, statements: node.children.map(nodeToCondition) }
    : { operator: node.operator, field: node.field, values: [...node.values] };
}

// ---- Form model -------------------------------------------------------------

export interface EditorRule {
  _key: string;
  id?: string;
  status: PayoutStatus;
  payoutConfigId: string;
  group: ConditionGroup;
}

export interface EditorFallback {
  _key: string;
  id?: string;
  payoutConfigId: string;
}

export interface EditorModel {
  code: string;
  gameType: GameType | '';
  rules: EditorRule[]; // conditional rules, top = highest priority
  fallback: EditorFallback;
}

let keySeq = 0;
const key = () => `gk${(keySeq += 1)}`;

export function emptyRule(): EditorRule {
  return {
    _key: key(),
    status: 'Enabled',
    payoutConfigId: '',
    group: { kind: 'group', operator: 'All', children: [emptyLeaf()] },
  };
}

export function emptyModel(): EditorModel {
  return {
    code: '',
    gameType: '',
    rules: [],
    fallback: { _key: key(), payoutConfigId: '' },
  };
}

export function toEditorModel(config: GameConfig): EditorModel {
  // Fallback = the conditionless rule (Georgi's seed: no `condition`, priority 0).
  const fallbackRule =
    config.targetingRules.find((r) => !r.condition) ??
    config.targetingRules[config.targetingRules.length - 1];
  const conditional = config.targetingRules
    .filter((r) => r !== fallbackRule)
    .sort((a, b) => b.priority - a.priority); // order = priority, top highest

  return {
    code: config.code,
    gameType: config.gameType,
    rules: conditional.map((r) => ({
      _key: key(),
      id: r.id,
      status: r.status,
      payoutConfigId: r.payoutConfigId,
      group: conditionToGroup(r.condition),
    })),
    fallback: {
      _key: key(),
      id: fallbackRule?.id,
      payoutConfigId: fallbackRule?.payoutConfigId ?? '',
    },
  };
}

export function toDomainInput(model: EditorModel): GameConfigInput {
  const n = model.rules.length;
  const rules: TargetingRule[] = model.rules.map((r, i) => ({
    id: r.id ?? '',
    priority: (n - i) * 100, // order → priority; top = highest
    status: r.status,
    payoutConfigId: r.payoutConfigId,
    condition: groupToCondition(r.group),
  }));
  rules.push({
    id: model.fallback.id ?? '',
    priority: 0,
    status: 'Enabled',
    payoutConfigId: model.fallback.payoutConfigId,
  });
  return { code: model.code.trim(), gameType: model.gameType as GameType, targetingRules: rules };
}

/** Dirty-check projection — drops client keys/ids. */
export function serializeModel(model: EditorModel): string {
  return JSON.stringify({
    code: model.code,
    gameType: model.gameType,
    rules: model.rules.map((r) => ({ status: r.status, payoutConfigId: r.payoutConfigId, group: r.group })),
    fallback: { payoutConfigId: model.fallback.payoutConfigId },
  });
}

// ---- Validation -------------------------------------------------------------

export interface RuleErrors {
  payoutConfig?: string;
  condition?: string;
}

export interface ModelValidation {
  code?: string;
  gameType?: string;
  rules: RuleErrors[];
  fallback?: string;
  /** Rule numbers whose ENABLED rule references a Disabled PayoutConfig
   *  (AGGREGATE, non-blocking — the Enable-action concern, awareness here). */
  disabledRefRuleNumbers: number[];
  valid: boolean;
}

const statusOf = (id: string): PayoutStatus | undefined =>
  PAYOUT_CONFIGS.find((p) => p.id === id)?.status;

export function validateModel(model: EditorModel, excludeId?: string): ModelValidation {
  let code: string | undefined;
  const trimmed = model.code.trim();
  if (!trimmed) code = 'Name is required.';
  else if (trimmed.length > MAX_NAME) code = `Keep it under ${MAX_NAME} characters.`;
  else if (model.gameType && !gameConfigNameIsUnique(trimmed, model.gameType, excludeId))
    code = 'A game config with this name already exists for this game type.';

  const gameType = model.gameType ? undefined : 'Game Type is required.';

  // A selection is valid only if it's a PayoutConfig OF THE CURRENT GAME TYPE.
  // Changing GameType on create strands selections → they mark invalid here
  // (least-destructive: nothing is deleted, the operator just re-picks).
  const payoutError = (id: string): string | undefined => {
    if (!id) return 'Choose a Payout Config.';
    if (model.gameType && !PAYOUT_CONFIGS.some((p) => p.id === id && p.gameType === model.gameType))
      return 'Not available for this game type — re-select.';
    return undefined;
  };

  const rules: RuleErrors[] = model.rules.map((r) => {
    const errs: RuleErrors = {};
    const pe = payoutError(r.payoutConfigId);
    if (pe) errs.payoutConfig = pe;
    if (!isValidConditionTree(r.group)) errs.condition = 'Complete the condition — every rule needs values.';
    return errs;
  });

  const fallback = payoutError(model.fallback.payoutConfigId);

  const disabledRefRuleNumbers = model.rules
    .map((r, i) => ({ r, n: i + 1 }))
    .filter(({ r }) => r.status === 'Enabled' && statusOf(r.payoutConfigId) === 'Disabled')
    .map(({ n }) => n);

  const rulesValid = rules.every((e) => !e.payoutConfig && !e.condition);
  return {
    code,
    gameType,
    rules,
    fallback,
    disabledRefRuleNumbers,
    valid: !code && !gameType && rulesValid && !fallback,
  };
}

export const MAX_GC_NAME = MAX_NAME;
