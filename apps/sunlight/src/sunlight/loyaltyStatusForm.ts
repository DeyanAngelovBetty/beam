import { INF, newRewardId, type LoyaltyStatus, type LoyaltyStatusDraft } from './loyaltyStatuses';

// toEditorModel accepts a draft OR a live status (a live status is assignable to the draft
// type) — the editor seeds from the pending draft when one exists, else from live.

/**
 * loyaltyStatusForm — the editor's model + validation, split out of the page exactly as
 * payoutConfigForm.ts is for PayoutConfigEditor. Numeric fields ride as strings while
 * editing (so a half-typed value is legal); toDomainDraft parses them back. There is no
 * emptyModel(): the loyalty ladder is fixed, so the editor only ever edits an existing
 * status (no create).
 */

export const MAX_NAME = 100;

/** A reward row while editing. `_key` is the stable React key AND the domain id (existing rewards keep theirs; new ones get a fresh id at creation). */
export interface EditorReward {
  _key: string;
  pointsToClaim: string;
  rewardType: string;
  rewardAmount: string;
  expiryHours: string;
}

export interface EditorModel {
  name: string;
  maxDays: string;
  boxes: string;
  keepBoxes: string;
  keepGems: string;
  multiplier: string;
  rewards: EditorReward[];
}

export function emptyReward(): EditorReward {
  return { _key: newRewardId(), pointsToClaim: '2000', rewardType: 'Coins', rewardAmount: '', expiryHours: '24' };
}

export function toEditorModel(status: LoyaltyStatusDraft): EditorModel {
  return {
    name: status.name,
    maxDays: status.maxDays,
    boxes: String(status.boxes),
    keepBoxes: status.keepBoxes,
    keepGems: status.keepGems,
    multiplier: String(status.multiplier),
    rewards: status.rewards.map((r) => ({
      _key: r.id,
      pointsToClaim: String(r.pointsToClaim),
      rewardType: r.rewardType,
      rewardAmount: String(r.rewardAmount),
      expiryHours: String(r.expiryHours),
    })),
  };
}

/** Merge the editable fields onto the base status's identity (id, gem) → the CR draft. */
export function toDomainDraft(model: EditorModel, base: LoyaltyStatus): LoyaltyStatusDraft {
  return {
    id: base.id,
    gem: base.gem,
    name: model.name.trim(),
    maxDays: model.maxDays.trim() || INF,
    boxes: Number(model.boxes),
    keepBoxes: model.keepBoxes.trim() || INF,
    keepGems: model.keepGems.trim() || INF,
    multiplier: Number(model.multiplier),
    rewards: model.rewards.map((r) => ({
      id: r._key,
      pointsToClaim: Number(r.pointsToClaim),
      rewardType: r.rewardType.trim(),
      rewardAmount: Number(r.rewardAmount),
      expiryHours: Number(r.expiryHours),
    })),
  };
}

/** Stable string for dirty comparison (baseline is the pending draft if one exists, else live). */
export function serializeModel(model: EditorModel): string {
  return JSON.stringify(model);
}

export interface RewardErrors {
  pointsToClaim?: string;
  rewardAmount?: string;
  expiryHours?: string;
  rewardType?: string;
}

export interface ModelValidation {
  valid: boolean;
  name?: string;
  maxDays?: string;
  boxes?: string;
  keepBoxes?: string;
  keepGems?: string;
  multiplier?: string;
  aggregate?: string;
  rewards: RewardErrors[];
}

/** '∞' or a non-negative integer string. */
function invalidInf(s: string): string | undefined {
  const t = s.trim();
  if (t === INF || t === '') return undefined; // empty normalizes to ∞ on save
  return /^\d+$/.test(t) ? undefined : `Enter a whole number or ${INF}.`;
}

function invalidNumber(s: string, label: string, { min = 0 }: { min?: number } = {}): string | undefined {
  const t = s.trim();
  if (t === '') return `${label} is required.`;
  const n = Number(t);
  if (!Number.isFinite(n)) return `${label} must be a number.`;
  if (n < min) return `${label} can't be below ${min}.`;
  return undefined;
}

export function validateModel(model: EditorModel): ModelValidation {
  const rewards: RewardErrors[] = model.rewards.map((r) => ({
    pointsToClaim: invalidNumber(r.pointsToClaim, 'Points to claim'),
    rewardAmount: invalidNumber(r.rewardAmount, 'Reward amount'),
    expiryHours: invalidNumber(r.expiryHours, 'Expiry hours'),
    rewardType: r.rewardType.trim() ? undefined : 'Reward type is required.',
  }));

  const name = !model.name.trim()
    ? 'Name is required.'
    : model.name.trim().length > MAX_NAME
      ? `Keep the name under ${MAX_NAME} characters.`
      : undefined;

  const v: ModelValidation = {
    valid: false,
    name,
    maxDays: invalidInf(model.maxDays),
    boxes: invalidNumber(model.boxes, 'Gems'),
    keepBoxes: invalidInf(model.keepBoxes),
    keepGems: invalidInf(model.keepGems),
    multiplier: invalidNumber(model.multiplier, 'Multiplier', { min: 0 }),
    aggregate: model.rewards.length === 0 ? 'Add at least one reward.' : undefined,
    rewards,
  };

  v.valid =
    !v.name &&
    !v.maxDays &&
    !v.boxes &&
    !v.keepBoxes &&
    !v.keepGems &&
    !v.multiplier &&
    !v.aggregate &&
    rewards.every((r) => !r.pointsToClaim && !r.rewardAmount && !r.expiryHours && !r.rewardType);

  return v;
}
