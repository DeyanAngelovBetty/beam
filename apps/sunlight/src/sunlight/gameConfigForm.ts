import { PAYOUT_CONFIGS } from './payoutConfigs';
import type { GameType, PayoutStatus } from './payoutConfigs';
import {
  gameConfigNameIsUnique,
  type GameConfig,
  type GameConfigInput,
  type MatchMode,
  type TargetingCondition,
  type TargetingRule,
} from './gameConfigs';
import {
  emptyLeaf,
  isValidConditionTree,
  type ConditionGroup,
  type ConditionField,
  type ConditionLeaf,
  type LeafOperator,
} from './conditionTree';

/**
 * The Game Config editor's FORM model + the CONDITION ADAPTER.
 *
 * ⚠️ Integration flag: Georgi's `TargetingRule.condition` is FLAT
 * (`{ match, conditions[] }`, display-string operators, string values) while the
 * ConditionBuilder is a NESTED tree (`ConditionGroup`). This adapter bridges
 * them and consumes the builder via its exported API only. Because the persisted
 * model is flat, **nested groups can't be saved** — a rule's condition is valid
 * only when it is also flat (see validateModel). Flagged to Georgi: the model
 * grows to a tree, or Game Config conditions stay flat.
 */

const MAX_NAME = 100;

const ATTR_TO_FIELD: Record<TargetingCondition['attribute'], ConditionField> = {
  Audience: 'Audience',
  'Loyalty Status': 'LoyaltyStatus',
  'RCC Segment': 'RccSegment',
};
const FIELD_TO_ATTR: Record<ConditionField, TargetingCondition['attribute']> = {
  Audience: 'Audience',
  LoyaltyStatus: 'Loyalty Status',
  RccSegment: 'RCC Segment',
};
const OP_TO_LEAF: Record<TargetingCondition['operator'], LeafOperator> = {
  'is one of': 'In',
  'is none of': 'NotIn',
};
const LEAF_TO_OP: Record<LeafOperator, TargetingCondition['operator']> = {
  In: 'is one of',
  NotIn: 'is none of',
};

export function conditionToGroup(cond?: { match: MatchMode; conditions: TargetingCondition[] }): ConditionGroup {
  if (!cond || cond.conditions.length === 0) {
    return { kind: 'group', operator: cond?.match ?? 'All', children: [emptyLeaf()] };
  }
  return {
    kind: 'group',
    operator: cond.match,
    children: cond.conditions.map(
      (c): ConditionLeaf => ({
        kind: 'leaf',
        field: ATTR_TO_FIELD[c.attribute],
        operator: OP_TO_LEAF[c.operator],
        values: [...c.values],
      })
    ),
  };
}

/** ConditionGroup → Georgi's flat condition (root leaf children only). */
export function groupToCondition(group: ConditionGroup): { match: MatchMode; conditions: TargetingCondition[] } {
  const conditions = group.children
    .filter((c): c is ConditionLeaf => c.kind === 'leaf')
    .map((leaf) => ({
      attribute: FIELD_TO_ATTR[leaf.field],
      operator: LEAF_TO_OP[leaf.operator],
      values: leaf.values.map(String),
    }));
  return { match: group.operator, conditions };
}

/** Flat = the root group holds only leaves (the persisted model can't nest). */
export function isFlatGroup(group: ConditionGroup): boolean {
  return group.children.every((c) => c.kind === 'leaf');
}

// ---- Form model -------------------------------------------------------------

export interface EditorRule {
  _key: string;
  id?: string;
  status: PayoutStatus;
  payoutConfigId: string;
  /** Not edited here — the sketch shows names, the API defines none. Retained on
   *  save, flagged to Georgi (ConditionSummary is the rule's identity line). */
  name: string;
  group: ConditionGroup;
}

export interface EditorFallback {
  _key: string;
  id?: string;
  payoutConfigId: string;
  name: string;
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
    name: '',
    group: { kind: 'group', operator: 'All', children: [emptyLeaf()] },
  };
}

export function emptyModel(): EditorModel {
  return {
    code: '',
    gameType: '',
    rules: [],
    fallback: { _key: key(), payoutConfigId: '', name: 'Fallback' },
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
      name: r.name,
      group: conditionToGroup(r.condition),
    })),
    fallback: {
      _key: key(),
      id: fallbackRule?.id,
      payoutConfigId: fallbackRule?.payoutConfigId ?? '',
      name: fallbackRule?.name ?? 'Fallback',
    },
  };
}

const payoutName = (id: string) => PAYOUT_CONFIGS.find((p) => p.id === id)?.name ?? id;

export function toDomainInput(model: EditorModel): GameConfigInput {
  const n = model.rules.length;
  const rules: TargetingRule[] = model.rules.map((r, i) => ({
    id: r.id ?? '',
    priority: (n - i) * 100, // order → priority; top = highest
    status: r.status,
    payoutConfigId: r.payoutConfigId,
    payoutConfigName: payoutName(r.payoutConfigId),
    name: r.name,
    condition: groupToCondition(r.group),
  }));
  rules.push({
    id: model.fallback.id ?? '',
    priority: 0,
    status: 'Enabled',
    payoutConfigId: model.fallback.payoutConfigId,
    payoutConfigName: payoutName(model.fallback.payoutConfigId),
    name: model.fallback.name || 'Fallback',
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
    else if (!isFlatGroup(r.group)) errs.condition = 'Nested groups aren’t supported yet.';
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
