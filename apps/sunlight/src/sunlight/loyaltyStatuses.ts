import type { GemName } from '@betty/beam';
import { registerEntity, seedIfEmpty, submit, markSeen } from './changeRequests';
import { DEMO_MAKER, DEMO_MAKER2 } from './currentUser';

/**
 * loyaltyStatuses — the entity store, extracted from LoyaltyStatusPage (which held STATUSES
 * + REWARDS inline). Each LoyaltyStatus now owns its fields AND its reward rows AND a
 * `version` (bumped when an approved change request applies here). Mirrors the
 * payoutConfigs.ts module-store shape.
 *
 * Importing this module has a SIDE EFFECT: it registers the 'loyaltyStatus' applicator with
 * changeRequests (so approve() can write here) and seeds one demo pending CR on a fresh
 * store. Any consumer that reaches approve() for a loyalty status must have imported this
 * module first — that is the registration contract (see changeRequests.ts header).
 */

export interface StatusReward {
  id: string;
  pointsToClaim: number;
  rewardType: string;
  rewardAmount: number;
  expiryHours: number;
}

export interface LoyaltyStatus {
  id: number;
  gem: GemName;
  name: string;
  /** '∞' or a digit-string. Plain text in the editor for this tracer — an "unlimited" affordance is a later refinement. */
  maxDays: string;
  boxes: number;
  keepBoxes: string;
  keepGems: string;
  multiplier: number;
  rewards: StatusReward[];
  version: number;
}

/** The proposed payload a change request carries — the entity minus its own version. */
export type LoyaltyStatusDraft = Omit<LoyaltyStatus, 'version'>;

export const INF = '∞';

/** Claimable rewards per status — same seed the page generated before extraction. */
function seedRewards(statusId: number, i: number): StatusReward[] {
  return [1100, 770, 860, 950, 720].map((base, j) => ({
    id: `${statusId}-${j}`,
    pointsToClaim: 2000,
    rewardType: 'Coins',
    rewardAmount: base + i * 40,
    expiryHours: j % 2 === 0 ? 24 : 48,
  }));
}

const BASE_STATUSES: Omit<LoyaltyStatus, 'rewards' | 'version'>[] = [
  { id: 1, gem: 'member', name: 'Member', maxDays: INF, boxes: 1, keepBoxes: INF, keepGems: INF, multiplier: 1 },
  { id: 20, gem: 'amethyst', name: 'Amethyst', maxDays: '28', boxes: 5, keepBoxes: INF, keepGems: '1', multiplier: 1 },
  { id: 30, gem: 'topaz', name: 'Topaz', maxDays: '28', boxes: 6, keepBoxes: INF, keepGems: '1', multiplier: 1.5 },
  { id: 40, gem: 'aquamarine', name: 'Aquamarine', maxDays: '28', boxes: 8, keepBoxes: INF, keepGems: '1', multiplier: 1 },
  { id: 50, gem: 'opal', name: 'Opal', maxDays: '28', boxes: 8, keepBoxes: INF, keepGems: '2', multiplier: 1 },
  { id: 60, gem: 'emerald', name: 'Emerald', maxDays: '28', boxes: 8, keepBoxes: INF, keepGems: '1', multiplier: 1 },
  { id: 70, gem: 'ruby', name: 'Ruby', maxDays: '28', boxes: 8, keepBoxes: INF, keepGems: '2', multiplier: 1.4 },
  { id: 80, gem: 'sapphire', name: 'Sapphire', maxDays: '28', boxes: 8, keepBoxes: INF, keepGems: '2', multiplier: 1.6 },
  { id: 90, gem: 'diamond', name: 'Diamond', maxDays: '28', boxes: 8, keepBoxes: INF, keepGems: '4', multiplier: 2 },
  { id: 100, gem: 'vip', name: 'VIP', maxDays: '28', boxes: 12, keepBoxes: INF, keepGems: INF, multiplier: 2 },
];

export const LOYALTY_STATUSES: LoyaltyStatus[] = BASE_STATUSES.map((s, i) => ({
  ...s,
  rewards: seedRewards(s.id, i),
  version: 1,
}));

export function getLoyaltyStatus(id: number | string): LoyaltyStatus | undefined {
  return LOYALTY_STATUSES.find((s) => String(s.id) === String(id));
}

/** Identity (id, gem) is immutable — the draft carries the editable fields + a reward copy. */
export function toDraft(s: LoyaltyStatus): LoyaltyStatusDraft {
  return {
    id: s.id,
    gem: s.gem,
    name: s.name,
    maxDays: s.maxDays,
    boxes: s.boxes,
    keepBoxes: s.keepBoxes,
    keepGems: s.keepGems,
    multiplier: s.multiplier,
    rewards: s.rewards.map((r) => ({ ...r })),
  };
}

let rewardSeq = 0;
export function newRewardId(): string {
  rewardSeq += 1;
  return `rw-${Date.now().toString(36)}-${rewardSeq}`;
}

// ── Registration + demo seed (side effects of importing this module) ─────────────────
registerEntity<LoyaltyStatusDraft>('loyaltyStatus', {
  getVersion(entityId) {
    return getLoyaltyStatus(entityId)?.version;
  },
  applyDraft(entityId, draft) {
    const live = getLoyaltyStatus(entityId);
    if (!live) return;
    live.name = draft.name;
    live.maxDays = draft.maxDays;
    live.boxes = draft.boxes;
    live.keepBoxes = draft.keepBoxes;
    live.keepGems = draft.keepGems;
    live.multiplier = draft.multiplier;
    live.rewards = draft.rewards.map((r) => ({ ...r }));
    live.version += 1; // id + gem are identity — never applied
  },
});

// Day-zero seed: ONE record (Topaz) carrying the CONTESTED state — two competing pendings, one per
// maker, distinct values + reasons — so the checker's queue opens with a real choice (grammar §3).
// All OTHER records stay clean for the by-hand walkthrough (approval-flow.md "Walkthrough").
seedIfEmpty(() => {
  const topaz = getLoyaltyStatus(30)!;
  const base = {
    entityType: 'loyaltyStatus' as const,
    entityId: String(topaz.id),
    entityName: topaz.name,
    baseVersion: topaz.version,
    baseSnapshot: toDraft(topaz), // live Topaz (multiplier 1.5) — the frozen before-state
  };
  const a = submit<LoyaltyStatusDraft>({
    ...base,
    draft: { ...toDraft(topaz), multiplier: 1.75 }, // Maja: raise level-up multiplier 1.5 → 1.75
    submittedBy: DEMO_MAKER.name,
    submitReason: 'Trial: raise Topaz level-up multiplier to 1.75.',
  });
  const b = submit<LoyaltyStatusDraft>({
    ...base,
    draft: { ...toDraft(topaz), multiplier: 1.6 }, // Ivan: a gentler 1.6
    submittedBy: DEMO_MAKER2.name,
    submitReason: 'Counter-proposal: 1.6 is enough of a bump and keeps the payout within budget.',
  });
  // Day-zero seen (§5): each maker has already SEEN the OTHER's proposal (they're aware of the
  // contest), the checker has seen NEITHER. So the checker opens to "2 awaiting review" while both
  // makers open to nothing — and because each author's own CR stays unseen-by-them, an eventual
  // outdate/reject still surfaces to its author (outcome-relative seen).
  if (a.ok) markSeen([a.cr.id], DEMO_MAKER2.name); // Ivan has seen Maja's
  if (b.ok) markSeen([b.cr.id], DEMO_MAKER.name); // Maja has seen Ivan's
});
