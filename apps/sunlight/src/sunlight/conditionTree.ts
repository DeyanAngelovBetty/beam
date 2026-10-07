/**
 * ConditionTree — the domain shape for MetaGame targeting conditions, mirroring
 * the API's Condition JSON (brief §7). NEVER rendered or accepted as raw JSON:
 * the ConditionBuilder edits this tree, the ConditionSummary reads it back as
 * prose. A node is a Group (All/Any of children) or a Leaf (field
 * IsOneOf/IsNoneOf a set of values).
 */

export type ConditionField = 'Audience' | 'LoyaltyStatus' | 'RccSegment';
export type LeafOperator = 'IsOneOf' | 'IsNoneOf';
export type GroupOperator = 'All' | 'Any';

export interface AudienceConditionValue {
  audienceId: number;
  cohortIds?: number[] | null;
}

export type AudienceValue = number | AudienceConditionValue;
export type ConditionValue = string | AudienceValue;

export interface ConditionLeaf {
  kind: 'leaf';
  field: ConditionField;
  operator: LeafOperator;
  values: ConditionValue[];
}

export interface ConditionGroup {
  kind: 'group';
  operator: GroupOperator;
  children: ConditionNode[];
}

export type ConditionNode = ConditionLeaf | ConditionGroup;

// ---- Display maps (never surface the raw enum, brief §7) --------------------

export const GROUP_LABEL: Record<GroupOperator, string> = {
  All: 'Match ALL conditions',
  Any: 'Match ANY condition',
};

export const LEAF_OP_LABEL: Record<LeafOperator, string> = {
  IsOneOf: 'is one of',
  IsNoneOf: 'is none of',
};

/** Field labels per the spec (refine against brief §7 when docs/reference lands). */
export const FIELD_LABEL: Record<ConditionField, string> = {
  Audience: 'Audience',
  LoyaltyStatus: 'Loyalty Status',
  RccSegment: 'RCC Segment',
};

export const CONDITION_FIELDS: ConditionField[] = ['Audience', 'LoyaltyStatus', 'RccSegment'];
export const LEAF_OPERATORS: LeafOperator[] = ['IsOneOf', 'IsNoneOf'];
export const GROUP_OPERATORS: GroupOperator[] = ['All', 'Any'];

/** Demo memberships: cohorts belong to one audience, never to the whole leaf. */
export const AUDIENCE_OPTIONS = [
  { value: 1001, label: 'VIP High Rollers', cohorts: [
    { value: 10, label: 'Control' }, { value: 11, label: 'Variant A' }, { value: 12, label: 'Variant B' },
  ] },
  { value: 1002, label: 'Weekend Warriors', cohorts: [
    { value: 20, label: 'Control' }, { value: 21, label: 'Variant A' },
  ] },
  { value: 1003, label: 'New Depositors', cohorts: [] },
  { value: 1004, label: 'Lapsed 30d', cohorts: [
    { value: 40, label: 'Control' }, { value: 41, label: 'Variant A' },
  ] },
];

/** Mock lookup data; this demo does not call Segmentation or other services. */
export const FIELD_OPTIONS: Record<ConditionField, { value: string | number; label: string }[]> = {
  Audience: AUDIENCE_OPTIONS,
  LoyaltyStatus: [
    { value: 'Member', label: 'Member' },
    { value: 'Amethyst', label: 'Amethyst' },
    { value: 'Topaz', label: 'Topaz' },
    { value: 'Diamond', label: 'Diamond' },
    { value: 'VIP', label: 'VIP' },
  ],
  RccSegment: [
    { value: 'Toddler', label: 'Toddler' },
    { value: 'Casual', label: 'Casual' },
    { value: 'Regular', label: 'Regular' },
    { value: 'Whale', label: 'Whale' },
  ],
};

/** Label for a stored value (falls back to the raw value if unknown). */
export function labelForValue(field: ConditionField, value: ConditionValue): string {
  if (field === 'Audience') {
    const audienceId = audienceIdOf(value as AudienceValue);
    const cohortIds = typeof value === 'object' ? value.cohortIds : undefined;
    const selection = cohortIds?.length
      ? `cohorts: ${cohortIds.map((id) => labelForCohort(audienceId, id)).join(' or ')}`
      : 'whole audience';
    return `${labelForAudience(audienceId)} (${selection})`;
  }
  return FIELD_OPTIONS[field].find((o) => o.value === value)?.label ?? String(value);
}

export function audienceIdOf(value: AudienceValue): number {
  return typeof value === 'number' ? value : value.audienceId;
}

export function labelForAudience(audienceId: number): string {
  return AUDIENCE_OPTIONS.find((option) => option.value === audienceId)?.label ?? `Audience ${audienceId}`;
}

export function labelForCohort(audienceId: number, cohortId: number): string {
  const audience = AUDIENCE_OPTIONS.find((option) => option.value === audienceId);
  const cohort = audience?.cohorts.find((option) => option.value === cohortId);
  return cohort?.label ?? `Cohort ${cohortId}`;
}

export function selectAudienceCohorts(values: AudienceValue[], audienceId: number, cohortIds: number[]): AudienceValue[] {
  return values.map((value) => {
    if (audienceIdOf(value) !== audienceId) return value;
    const previousIds = typeof value === 'number' ? [] : value.cohortIds ?? [];
    if (previousIds.length === cohortIds.length && previousIds.every((id, index) => id === cohortIds[index])) return value;
    return cohortIds.length ? { audienceId, cohortIds } : audienceId;
  });
}

// ---- Construction -----------------------------------------------------------

/** New leaf: field/operator default (the API requires a field), values empty
 *  (the honest "incomplete" signal — flagged by validation, not a fake empty field). */
export function emptyLeaf(): ConditionLeaf {
  return { kind: 'leaf', field: 'Audience', operator: 'IsOneOf', values: [] };
}

/** New group starts empty — its empty state is a real, flagged validation error. */
export function emptyGroup(operator: GroupOperator = 'All'): ConditionGroup {
  return { kind: 'group', operator, children: [] };
}

// ---- Validation (mechanics; presentation is the design pass) ----------------

/** The node's OWN error, if any (children report their own). */
export function nodeError(node: ConditionNode): string | null {
  if (node.kind === 'group') {
    return node.children.length === 0 ? 'Add at least one condition.' : null;
  }
  return node.values.length === 0 ? 'Choose at least one value.' : null;
}

/** Whole-tree validity — for the parent editor's Save gate. */
export function isValidConditionTree(node: ConditionNode): boolean {
  if (nodeError(node)) return false;
  if (node.kind === 'group') return node.children.every(isValidConditionTree);
  return true;
}

// ---- Client React keys ------------------------------------------------------
// Identity-keyed via a WeakMap so keys never leak into the domain JSON. Every
// editor edit transfers the key from the old node to the new one (withKey), so a
// node keeps its key across content edits — a multi-select never remounts /
// closes mid-selection. Only add-condition / add-group mint fresh keys.

const keyMap = new WeakMap<object, string>();
let keySeq = 0;

export function keyOf(node: ConditionNode): string {
  let k = keyMap.get(node);
  if (!k) {
    keySeq += 1;
    k = `c${keySeq}`;
    keyMap.set(node, k);
  }
  return k;
}

/** Carry `from`'s key onto `next` (a content edit of the same slot). */
export function withKey<T extends ConditionNode>(next: T, from: ConditionNode): T {
  const k = keyMap.get(from);
  if (k) keyMap.set(next, k);
  return next;
}
