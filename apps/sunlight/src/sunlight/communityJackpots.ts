/**
 * Community Jackpots — client-side demo fixtures + a mutable in-memory store.
 *
 * Composition truth: apps/sunlight/designs/CJs.png + CJ-{view,edit,add}.png +
 * CJ-Milestone-{view,edit,add}.png. Terms are taken VERBATIM from the PNGs (task ruling: do not invent
 * or normalize labels).
 *
 * ── TBD label overloads (recorded per the task, NOT resolved here) ────────────────────────────────
 *  • "Reward Type" is overloaded: a MILESTONE-level scalar (`Milestone.rewardType`, e.g. "Coins" — the
 *    Milestones list column) AND a per-row field inside the rewards list (`RewardStrategyRow.rewardType`,
 *    e.g. "Prize" / "MilestoneFlip"). Same words, two levels — kept separate, meaning TBD.
 *  • "Reward Strategy" is overloaded: a MILESTONE-level SCALAR (`Milestone.rewardStrategy`, e.g. "Fixed" —
 *    a header field / list column) vs the "Rewards Strategy" LIST (`Milestone.rewardsStrategy` — the
 *    Rewards Strategy Configuration table). Scalar vs list; relationship TBD.
 *  • Select option sets are TBD: only "Fixed" (reward strategy) and "Prize" / "MilestoneFlip" (row reward
 *    type) appear in the PNGs. We offer exactly those (TERMS ruling — no invented options).
 *
 * ── State model (demo) ────────────────────────────────────────────────────────────────────────────
 * Module-level mutable arrays, URL-backed pages. DRAFT model for Add: `createDraftJackpot()` assigns an
 * id immediately (status 'draft', hidden from the list) so the jackpot Add page can navigate to the
 * milestone Add page against a REAL parent; Cancel calls `deleteJackpot` to discard it. Submit for
 * Approval flips status → 'submitted' (stub + toast). NOTE (follow-up, NOT this task): submit is a
 * natural integration point into the PendingApprovals change-request fixtures — deliberately not wired.
 */

// 06:50 ET on 09-Jul-2026 (EDT = UTC-4) and 08:25 ET on 31-Aug-2026 — the instants the list PNG shows.
const START_ISO = '2026-07-09T10:50:00.000Z';
const END_ISO = '2026-08-31T12:25:00.000Z';

export type JackpotStatus = 'active' | 'draft' | 'submitted';

/** One row of the "Rewards Strategy Configuration" table (the LIST — see the TBD note above). */
export interface RewardStrategyRow {
  rewardType: string; // "Prize" | "MilestoneFlip" (options TBD)
  numRewards: number;
  qualificationAmount: number;
  rewardAmount: number;
}

/** One "Milestone Winner" — OPERATIONAL data (task ruling): read-only everywhere, incl. milestone edit. */
export interface MilestoneWinner {
  playerId: string;
  screenName: string;
  playerRewardId: string;
  winAmount: number;
  winType: string;
  loyaltyStatus: string;
  rewardStatus: string;
  awardedAt: string; // ISO
}

export interface Milestone {
  id: string;
  name: string;
  rewardType: string; // milestone-level scalar (e.g. "Coins") — TBD overload
  rewardStrategy: string; // milestone-level scalar (e.g. "Fixed") — TBD overload
  threshold: number;
  jackpotAmount: number;
  rewardsStrategy: RewardStrategyRow[]; // the "Rewards Strategy" LIST
  winners: MilestoneWinner[];
}

export interface CommunityJackpot {
  id: string;
  name: string;
  startDate: string; // ISO
  endDate: string; // ISO
  status: JackpotStatus;
  milestones: Milestone[];
}

// Option sets surfaced in the edit PNGs (TERMS: exactly these; broader sets TBD).
export const REWARD_STRATEGY_OPTIONS = ['Fixed'] as const;
export const REWARD_ROW_TYPE_OPTIONS = ['Prize', 'MilestoneFlip'] as const;

// The rewards-strategy pair the PNGs show on every configured milestone.
const DEFAULT_REWARDS: RewardStrategyRow[] = [
  { rewardType: 'Prize', numRewards: 1, qualificationAmount: 5, rewardAmount: 0 },
  { rewardType: 'MilestoneFlip', numRewards: 1, qualificationAmount: 5, rewardAmount: 0 },
];

const DIDI_WINNER: MilestoneWinner = {
  playerId: '13987',
  screenName: 'Didi_test',
  playerRewardId: '1981294',
  winAmount: 2000,
  winType: 'Jackpot',
  loyaltyStatus: 'Amethyst',
  rewardStatus: 'Awarded',
  awardedAt: START_ISO,
};

let milestoneSeq = 1600; // seeded milestone ids run below this; new ones climb from here
const nextMilestoneId = () => String(milestoneSeq++);

function makeMilestone(
  id: string,
  overrides: Partial<Milestone> = {},
): Milestone {
  return {
    id,
    name: 'New Milestone',
    rewardType: 'Coins',
    rewardStrategy: 'Fixed',
    threshold: 1000,
    jackpotAmount: 5,
    rewardsStrategy: DEFAULT_REWARDS.map((r) => ({ ...r })),
    winners: [],
    ...overrides,
  };
}

/** A fresh, empty milestone for the Add page (defaults mirror the CJ-Milestone-add PNG's prefilled fields). */
export function makeEmptyMilestone(): Omit<Milestone, 'id'> {
  return {
    name: 'New Milestone',
    rewardType: 'Coins',
    rewardStrategy: 'Fixed',
    threshold: 100000,
    jackpotAmount: 5,
    rewardsStrategy: [], // Add starts empty (per the add PNG); Save requires ≥1 (task: min 1 row)
    winners: [],
  };
}

function makeJackpot(id: string, name: string, milestones: Milestone[]): CommunityJackpot {
  return { id, name, startDate: START_ISO, endDate: END_ISO, status: 'active', milestones };
}

// Seed ~13 jackpots from the list PNG (24-Karat Holiday, Android, Lunar New Year, Betty Max, Test
// Community, BETTY-8328-v5/v4, Betty Max georgi) plus Mini Bingo variants to fill the ~13-row page.
// Milestone COUNTS match the PNG's Milestones column. Betty Max carries the fully-specified milestone
// (threshold 100000, the Didi_test winner) the milestone PNGs detail; its other milestone has NO winners.
const bettyMaxMilestones: Milestone[] = [
  makeMilestone('1596', { threshold: 100000, winners: [DIDI_WINNER] }),
  makeMilestone('1595', { threshold: 1000, winners: [] }),
];

const COMMUNITY_JACKPOTS: CommunityJackpot[] = [
  makeJackpot('256', '24-Karat Holiday', [
    makeMilestone('1595', { threshold: 1000 }),
    makeMilestone('1596', { threshold: 100000 }),
    makeMilestone('1597', { threshold: 1000 }),
  ]),
  makeJackpot('255', 'Android', [makeMilestone('1610'), makeMilestone('1611'), makeMilestone('1612')]),
  makeJackpot('245', 'Lunar New Year', [makeMilestone('1620'), makeMilestone('1621')]),
  makeJackpot('244', 'Betty Max', bettyMaxMilestones),
  makeJackpot('235', 'Test Community', [makeMilestone('1630'), makeMilestone('1631'), makeMilestone('1632')]),
  makeJackpot('234', 'BETTY-8328-v5', [makeMilestone('1640')]),
  makeJackpot('233', 'Betty Max georgi', [makeMilestone('1650'), makeMilestone('1651')]),
  makeJackpot('232', 'BETTY-8328-v4', [makeMilestone('1660')]),
  makeJackpot('231', 'Mini Bingo Bonanza', [makeMilestone('1670'), makeMilestone('1671')]),
  makeJackpot('230', 'Mini Bingo Nightly', [makeMilestone('1680')]),
  makeJackpot('229', 'Mini Bingo Weekend', [makeMilestone('1690'), makeMilestone('1691'), makeMilestone('1692')]),
  makeJackpot('228', 'Harvest Coins', [makeMilestone('1700'), makeMilestone('1701')]),
  makeJackpot('227', 'Summer Splash', [makeMilestone('1710')]),
];

// ── Read ────────────────────────────────────────────────────────────────────────────────────────
/** The list page's rows — drafts (unsubmitted Add sessions) are hidden until submitted. */
export function listJackpots(): CommunityJackpot[] {
  return COMMUNITY_JACKPOTS.filter((j) => j.status !== 'draft');
}
export function getJackpot(id: string): CommunityJackpot | undefined {
  return COMMUNITY_JACKPOTS.find((j) => j.id === id);
}
export function getMilestone(jackpotId: string, milestoneId: string): Milestone | undefined {
  return getJackpot(jackpotId)?.milestones.find((m) => m.id === milestoneId);
}

// ── Mutate ──────────────────────────────────────────────────────────────────────────────────────
let jackpotSeq = 300; // demo ids for newly-created jackpots (above the seeded range)
const nextJackpotId = () => String(jackpotSeq++);

/** Add draft model: a real record exists immediately so Add Milestone has a parent to attach to. */
export function createDraftJackpot(): string {
  const id = nextJackpotId();
  COMMUNITY_JACKPOTS.unshift({
    id,
    name: 'New Community Jackpot',
    startDate: '',
    endDate: '',
    status: 'draft',
    milestones: [],
  });
  return id;
}
export function updateJackpot(id: string, patch: Partial<Pick<CommunityJackpot, 'name' | 'startDate' | 'endDate'>>): void {
  const j = getJackpot(id);
  if (j) Object.assign(j, patch);
}
/** Submit for Approval — STUB (status flip + the caller's toast). Follow-up: create a PendingApprovals CR. */
export function submitJackpot(id: string): void {
  const j = getJackpot(id);
  if (j) j.status = 'submitted';
}
export function deleteJackpot(id: string): void {
  const i = COMMUNITY_JACKPOTS.findIndex((j) => j.id === id);
  if (i >= 0) COMMUNITY_JACKPOTS.splice(i, 1);
}

export function addMilestone(jackpotId: string, milestone: Omit<Milestone, 'id'>): string {
  const j = getJackpot(jackpotId);
  const id = nextMilestoneId();
  if (j) j.milestones.push({ ...milestone, id });
  return id;
}
export function updateMilestone(jackpotId: string, milestoneId: string, patch: Partial<Milestone>): void {
  const m = getMilestone(jackpotId, milestoneId);
  if (m) Object.assign(m, patch);
}
export function deleteMilestone(jackpotId: string, milestoneId: string): void {
  const j = getJackpot(jackpotId);
  if (!j) return;
  const i = j.milestones.findIndex((m) => m.id === milestoneId);
  if (i >= 0) j.milestones.splice(i, 1);
}

// ── Date helpers ──────────────────────────────────────────────────────────────────────────────────
// dd-MMM-yyyy hh:mm:ss AM/PM ET — the list PNG's format, and the estate convention (TokenCampaign twins).
// The jackpot view PNG shows dd-MM-yyyy on two lines; we use this ET form everywhere for twin + list
// consistency (flagged deviation).
export function fmtDateTimeET(iso: string): string {
  if (!iso) return '—';
  const p = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
    .formatToParts(new Date(iso))
    .reduce<Record<string, string>>((a, part) => ((a[part.type] = part.value), a), {});
  return `${p.day}-${p.month}-${p.year} ${p.hour}:${p.minute}:${p.second} ${p.dayPeriod} ET`;
}

// datetime-local twin round-trip (timezone-naive demo — a real ET picker is deferred, as in TokenCampaign).
export const toLocalInput = (iso: string) => (iso ? iso.slice(0, 16) : ''); // YYYY-MM-DDTHH:mm
export const fromLocalInput = (v: string) => (v ? `${v}:00.000Z` : '');
