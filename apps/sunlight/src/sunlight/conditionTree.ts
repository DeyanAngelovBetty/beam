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

export interface ConditionLeaf {
  kind: 'leaf';
  field: ConditionField;
  operator: LeafOperator;
  values: (string | number)[];
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

/**
 * PLACEHOLDER value options per field — the lookup endpoints don't exist yet
 * (brief §14). Audience = numeric ids; LoyaltyStatus / RccSegment = strings from
 * the docs' examples. These become async-populated when the lookup API is
 * decided; the control (a constrained multi-select) stays the same.
 */
export const FIELD_OPTIONS: Record<ConditionField, { value: string | number; label: string }[]> = {
  Audience: [
    { value: 1001, label: '1001 — VIP High Rollers' },
    { value: 1002, label: '1002 — Weekend Warriors' },
    { value: 1003, label: '1003 — New Depositors' },
    { value: 1004, label: '1004 — Lapsed 30d' },
  ],
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
export function labelForValue(field: ConditionField, value: string | number): string {
  return FIELD_OPTIONS[field].find((o) => o.value === value)?.label ?? String(value);
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
