/**
 * campaignWinners — TRANSACTIONAL runtime data for the Prize Wall flow: who won what, keyed by
 * campaignId. DELIBERATELY SEPARATE from the TokenCampaign aggregate (tokenCampaigns.ts) — winners
 * are grants that happened, not config; they live beside the aggregate, scoped to it.
 *
 * HISTORICAL SNAPSHOTS: rewardName / rewardType / rewardAmount are denormalized at grant time and
 * NEVER rewritten by later config edits (the same snapshot principle the approval pipeline uses for
 * a CR's baseSnapshot). A winner is a record of what was granted THEN.
 *
 * SHAPE FLAGS (proposed; real answers pending Radi/Tzeno — do not silently re-decide downstream):
 *  - `id` + `campaignId` — added (row id + the scoping key). Confirmed.
 *  - `rewardType` — a DEMO vocab; RewardItem has no `type` field (it carries tier + quality), so this
 *    is a NEW dimension, not derived. Real vocabulary + its relation to tier/quality joins the batch.
 *  - `rewardName` — denormalized snapshot (not a rewardItemId reference). Confirmed.
 *  - `rewardAmount` — optional (the Figma mock shows one); display format corrected on Deyan's review.
 *  - `grantedAt` timezone display convention — open item (UTC vs ET). See CampaignWinnersPage.
 */

export const WINNER_REWARD_TYPES = ['Coins', 'Free Spins', 'Physical', 'Bonus'] as const;
export type WinnerRewardType = (typeof WINNER_REWARD_TYPES)[number];

export interface CampaignWinner {
  id: string;
  campaignId: string; // scoping key
  playerId: string;
  playerName: string;
  wallStageId: string;
  rewardName: string; // denormalized snapshot
  rewardType: WinnerRewardType;
  rewardAmount?: number; // optional — the Figma mock shows an amount
  grantedAt: string; // ISO
}

// ── Fixtures ──────────────────────────────────────────────────────────────────────────────────────
// Small demo player pool.
const PLAYERS: { id: string; name: string }[] = [
  { id: 'P-10231', name: 'Ava Thompson' },
  { id: 'P-10457', name: 'Liam Chen' },
  { id: 'P-10892', name: 'Noah Williams' },
  { id: 'P-11045', name: 'Mia Rossi' },
  { id: 'P-11298', name: 'Ethan Kaur' },
  { id: 'P-11563', name: 'Sofia Marin' },
];

const REWARDS: { name: string; type: WinnerRewardType; amount?: number }[] = [
  { name: 'Coin Pack', type: 'Coins', amount: 500 },
  { name: 'Free Spins x10', type: 'Free Spins', amount: 10 },
  { name: 'Weekend Bonus', type: 'Bonus', amount: 25 },
  { name: 'Branded Hoodie', type: 'Physical' },
  { name: 'Mega Coin Pack', type: 'Coins', amount: 2500 },
];

// Build winners for a campaign, spread across the given stage ids, cycling players + rewards.
function makeWinners(campaignId: string, stageIds: string[], count: number, startTs: number): CampaignWinner[] {
  return Array.from({ length: count }, (_, i) => {
    const reward = REWARDS[i % REWARDS.length];
    const player = PLAYERS[i % PLAYERS.length];
    return {
      id: `${campaignId}-win-${i + 1}`,
      campaignId,
      playerId: player.id,
      playerName: player.name,
      wallStageId: stageIds[i % stageIds.length],
      rewardName: reward.name,
      rewardType: reward.type,
      rewardAmount: reward.amount,
      grantedAt: new Date(startTs + i * 3_600_000).toISOString(), // one per hour, deterministic
    };
  });
}

// FIXTURE SEMANTICS:
//  - running (tc-summer): winners spread across its 3 stages.
//  - ended (tc-spring): winners across its 2 stages.
//  - DISABLED (tc-holiday): 1–2 winners — its dates imply disabled AFTER running (disabled ≠
//    never-ran), so it legitimately has grants.
//  - scheduled (tc-autumn): NONE — the empty-state demo (never started).
const WINNERS: CampaignWinner[] = [
  ...makeWinners('tc-summer', ['tc-summer-s1', 'tc-summer-s2', 'tc-summer-s3'], 9, Date.parse('2026-08-16T10:00:00.000Z')),
  ...makeWinners('tc-spring', ['tc-spring-s1', 'tc-spring-s2'], 6, Date.parse('2026-05-10T12:00:00.000Z')),
  ...makeWinners('tc-holiday', ['tc-holiday-s1'], 2, Date.parse('2026-08-20T15:00:00.000Z')),
];

/** Winners for a campaign, newest grant first. */
export function getCampaignWinners(campaignId: string): CampaignWinner[] {
  return WINNERS.filter((w) => w.campaignId === campaignId).sort((a, b) => (a.grantedAt < b.grantedAt ? 1 : -1));
}
