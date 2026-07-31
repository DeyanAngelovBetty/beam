import type { BeamStatus } from '@betty/beam';

/**
 * MetaGame — Payout Configs mock domain (apps/sunlight mock-data lane).
 *
 * Aligned to Georgi's MetaGame Design Brief + Simple Guide (2026-07-29): status
 * is Enabled | Disabled, GameType is the canonical eight, rewards are Coins |
 * Tokens. A PayoutConfig is a payout table: weighted rows, each a probability of
 * landing on a prize value plus the rewards paid. The derived helpers
 * (expectedAvgPayout, probabilityTotal) seed the detail page's Live Checks.
 */

/** The canonical eight game types (brief). */
export type GameType =
  | 'Wheel'
  | 'Scratcher'
  | 'DailyWheel'
  | 'DailyScratcher'
  | 'DailyGift'
  | 'MultiplierMadness'
  | 'InstantWheel'
  | 'WheelOfWins';

/**
 * Status is Enabled | Disabled only (brief). A config is *created* Disabled;
 * activation (making it live to players) is a separate concern, not a status.
 * Disabled is the normal prep state — neutral, never an error.
 */
export type PayoutStatus = 'Enabled' | 'Disabled';

/** Rewards are Coins or Tokens, positive integer amounts (brief). */
export type RewardType = 'Coins' | 'Tokens';
export const REWARD_TYPES: RewardType[] = ['Coins', 'Tokens'];

/** One reward line. A row carries at most one of each type (no repeats). */
export interface Reward {
  rewardType: RewardType;
  amount: number;
}

export interface PayoutRow {
  /**
   * Row identity for the aggregate PUT contract (brief §5.2): rows with an `id`
   * are retained across an update, rows without one are new, and omitted rows
   * are removed. The editor pairs this with a client-only `_key` (React) —
   * `id` is the domain identity, `_key` never leaves the form.
   */
  id?: string;
  /** 0..1. Rows with probability 0 are "visual only" — shown, never landed. */
  probability: number;
  winMessage: string;
  /** The row's headline payout value; feeds expectedAvgPayout. */
  prizeValue: number;
  rewards: Reward[];
}

export interface PayoutConfig {
  id: string;
  /**
   * Shown in the list's "Name" column. In Georgi's API this field is the
   * config's **API Code** (brief §5.1) — the label is "Name", the field is the
   * API code. Kept as one string here until the editor round needs both.
   */
  name: string;
  gameType: GameType;
  status: PayoutStatus;
  rows: PayoutRow[];
  createdAt: string;
  updatedAt: string;
}

/** Expected average payout: Σ probability × value across the rows. */
export function expectedAvgPayout(config: PayoutConfig): number {
  return config.rows.reduce((sum, r) => sum + r.probability * r.prizeValue, 0);
}

/** Total probability mass — should be 1.0. A future validation Live Check. */
export function probabilityTotal(config: PayoutConfig): number {
  return config.rows.reduce((sum, r) => sum + r.probability, 0);
}

// Reward shorthands for readable seed rows (amounts are positive ints).
const coins = (amount: number): Reward => ({ rewardType: 'Coins', amount });
const tokens = (amount: number): Reward => ({ rewardType: 'Tokens', amount });

/**
 * Eight configs, one per game type, recognizable from the real system. Averages
 * are engineered to hit the doc's headline numbers (the list column derives
 * them, not stores them). Deliberate demo fixtures:
 *  - "Topaz - Weekend Special" probabilities sum to 0.9 — a future validation demo.
 *  - "Default Payout Table" and "Legacy Scratcher" carry probability-0 "visual
 *    only" rows; "Legacy Scratcher" also has a no-win (value 0) row.
 */
export const PAYOUT_CONFIGS: PayoutConfig[] = [
  {
    id: 'pc-no-loss',
    name: 'Default No Loss Payout Table',
    gameType: 'Scratcher',
    status: 'Enabled',
    createdAt: '2025-11-02',
    updatedAt: '2026-07-18',
    // avg = .5·1 + .3·3 + .2·6.25 = 2.65
    rows: [
      { probability: 0.5, winMessage: 'Win 1 Coin', prizeValue: 1, rewards: [coins(1)] },
      { probability: 0.3, winMessage: 'Win 3 Coins', prizeValue: 3, rewards: [coins(3)] },
      { probability: 0.2, winMessage: '6.25× Bonus', prizeValue: 6.25, rewards: [coins(6), tokens(2)] },
    ],
  },
  {
    id: 'pc-default',
    name: 'Default Payout Table',
    gameType: 'DailyGift',
    status: 'Enabled',
    createdAt: '2025-11-02',
    updatedAt: '2026-06-30',
    // avg = .6·1 + .3·2 + .1·11 = 2.30 (the 1000 row is visual only, p=0)
    rows: [
      { probability: 0.6, winMessage: 'Win 1 Coin', prizeValue: 1, rewards: [coins(1)] },
      { probability: 0.3, winMessage: 'Win 2 Coins', prizeValue: 2, rewards: [coins(2)] },
      { probability: 0.1, winMessage: 'Win 11 Coins', prizeValue: 11, rewards: [coins(11)] },
      { probability: 0, winMessage: 'Grand Prize (display)', prizeValue: 1000, rewards: [coins(1000)] },
    ],
  },
  {
    id: 'pc-no-loss-abs',
    name: 'Default No Loss Payout Table Absolute',
    gameType: 'Wheel',
    status: 'Enabled',
    createdAt: '2025-12-10',
    updatedAt: '2026-07-21',
    // avg = .5·1000 + .4·3000 + .1·9489.5 = 2,648.95
    rows: [
      { probability: 0.5, winMessage: '1,000 Coins', prizeValue: 1000, rewards: [coins(1000)] },
      { probability: 0.4, winMessage: '3,000 Coins', prizeValue: 3000, rewards: [coins(3000)] },
      { probability: 0.1, winMessage: 'Mega 9,489.5', prizeValue: 9489.5, rewards: [coins(9489)] },
    ],
  },
  {
    id: 'pc-sapphire-daily',
    name: 'Sapphire - Daily Game',
    gameType: 'DailyWheel',
    status: 'Enabled',
    createdAt: '2026-01-20',
    updatedAt: '2026-07-25',
    // avg = .5·20000 + .4·22000 + .1·8500 = 19,650.00
    rows: [
      { probability: 0.5, winMessage: '20,000 Coins', prizeValue: 20000, rewards: [coins(20000)] },
      { probability: 0.4, winMessage: '22,000 Coins', prizeValue: 22000, rewards: [coins(22000)] },
      { probability: 0.1, winMessage: 'Daily Bonus Tokens', prizeValue: 8500, rewards: [tokens(50)] },
    ],
  },
  {
    id: 'pc-jamie-abs',
    name: 'Jamie Payout Table Absolute',
    gameType: 'WheelOfWins',
    status: 'Disabled',
    createdAt: '2026-02-14',
    updatedAt: '2026-07-05',
    // avg = .5·50000 + .4·55000 + .1·20250 = 49,025.00
    rows: [
      { probability: 0.5, winMessage: '50,000 Coins', prizeValue: 50000, rewards: [coins(50000)] },
      { probability: 0.4, winMessage: '55,000 Coins', prizeValue: 55000, rewards: [coins(55000)] },
      { probability: 0.1, winMessage: '20,250 Coins', prizeValue: 20250, rewards: [coins(20250)] },
    ],
  },
  {
    id: 'pc-alex-abs',
    name: 'Alex Play Payout Absolute',
    gameType: 'MultiplierMadness',
    status: 'Disabled',
    createdAt: '2026-03-01',
    updatedAt: '2026-07-12',
    // avg = .5·60000 + .4·70000 + .1·11250 = 59,125.00
    rows: [
      { probability: 0.5, winMessage: '60,000 Coins', prizeValue: 60000, rewards: [coins(60000)] },
      { probability: 0.4, winMessage: '70,000 Coins', prizeValue: 70000, rewards: [coins(70000)] },
      { probability: 0.1, winMessage: '11,250 Tokens', prizeValue: 11250, rewards: [tokens(11250)] },
    ],
  },
  {
    id: 'pc-topaz-weekend',
    name: 'Topaz - Weekend Special',
    gameType: 'InstantWheel',
    status: 'Disabled',
    createdAt: '2026-05-06',
    updatedAt: '2026-07-09',
    // Probabilities sum to 0.9 — NOT 1.0. Seeds a future validation Live Check.
    rows: [
      { probability: 0.5, winMessage: '100 Coins', prizeValue: 100, rewards: [coins(100)] },
      { probability: 0.3, winMessage: '200 Coins', prizeValue: 200, rewards: [coins(200)] },
      { probability: 0.1, winMessage: '500 Coins', prizeValue: 500, rewards: [coins(500)] },
    ],
  },
  {
    id: 'pc-legacy-scratcher',
    name: 'Legacy Scratcher (Retired)',
    gameType: 'DailyScratcher',
    status: 'Disabled',
    createdAt: '2025-08-15',
    updatedAt: '2026-04-02',
    // avg = .8·0 + .15·5 + .05·25 = 2.00 (no-win row at value 0; 500 row visual only)
    rows: [
      { probability: 0.8, winMessage: 'No win', prizeValue: 0, rewards: [] },
      { probability: 0.15, winMessage: 'Win 5 Coins', prizeValue: 5, rewards: [coins(5)] },
      { probability: 0.05, winMessage: 'Win 25 Coins', prizeValue: 25, rewards: [coins(25)] },
      { probability: 0, winMessage: 'Legendary (display)', prizeValue: 500, rewards: [coins(500)] },
    ],
  },
];

export const GAME_TYPES: GameType[] = [
  'Wheel',
  'Scratcher',
  'DailyWheel',
  'DailyScratcher',
  'DailyGift',
  'MultiplierMadness',
  'InstantWheel',
  'WheelOfWins',
];
export const PAYOUT_STATUSES: PayoutStatus[] = ['Enabled', 'Disabled'];

/**
 * Status → Beam's semantic status vocabulary (BeamStatus). Resolves the §6.4
 * creak (metagame-pages.md, 2026-07-29): Enabled → `active` (positive, green);
 * Disabled → `draft` (neutral/dormant, grey outline — NOT `paused`, which
 * renders as a warning, and Disabled is the normal prep state, not a warning).
 * Labels are overridden to the domain words.
 */
export function statusBadge(status: PayoutStatus): { status: BeamStatus; label: string } {
  return status === 'Enabled'
    ? { status: 'active', label: 'Enabled' }
    : { status: 'draft', label: 'Disabled' };
}

/** Format a reward amount as a grouped whole number (2,648). */
export function formatPayout(value: number): string {
  return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

/**
 * Reward type display labels mirror the backend-aligned domain vocabulary.
 */
export const PRIZE_TYPE_LABEL: Record<RewardType, string> = { Coins: 'Coins', Tokens: 'Tokens' };

/** Readable reward copy with grouped whole amounts and singular grammar. */
export function formatReward(reward: Reward): string {
  const label = reward.amount === 1
    ? reward.rewardType.slice(0, -1)
    : PRIZE_TYPE_LABEL[reward.rewardType];
  return `${formatPayout(reward.amount)} ${label}`;
}

/** Inline reward-list copy used by payout-row previews. */
export function formatRewards(rewards: Reward[]): string {
  return rewards.map(formatReward).join(', ');
}

// ---- Mock persistence (the seed store as a stand-in API) --------------------
// Mutates the module array; the list page remounts on navigate and reflects it
// (same pattern as saveUserEdit). Shapes mirror the brief's create/PUT contract
// so the real API swap is mechanical.

let idSeq = 0;
/** Unique id for a config or row (mock; the real API assigns these). */
export function newId(prefix: 'pc' | 'row'): string {
  idSeq += 1;
  return `${prefix}-${Date.now().toString(36)}-${idSeq}`;
}

export function getPayoutConfig(id: string): PayoutConfig | undefined {
  return PAYOUT_CONFIGS.find((c) => c.id === id);
}

/** Name must be unique within its GameType (brief §5.2). Excludes the config being edited. */
export function nameIsUnique(name: string, gameType: GameType, excludeId?: string): boolean {
  const n = name.trim().toLowerCase();
  return !PAYOUT_CONFIGS.some(
    (c) => c.id !== excludeId && c.gameType === gameType && c.name.trim().toLowerCase() === n
  );
}

/** The editor's payload — everything the form owns (status is set by the system). */
export interface PayoutConfigInput {
  name: string;
  gameType: GameType;
  rows: PayoutRow[];
}

function stampRows(rows: PayoutRow[]): PayoutRow[] {
  // Aggregate PUT: retain identity where it exists, assign ids to new rows.
  return rows.map((r) => ({ ...r, id: r.id ?? newId('row') }));
}

/** Create — always Disabled (brief §5.2: created as Disabled; activation is separate). */
export function createPayoutConfig(input: PayoutConfigInput): PayoutConfig {
  const today = new Date().toISOString().slice(0, 10);
  const config: PayoutConfig = {
    id: newId('pc'),
    name: input.name.trim(),
    gameType: input.gameType,
    status: 'Disabled',
    rows: stampRows(input.rows),
    createdAt: today,
    updatedAt: today,
  };
  PAYOUT_CONFIGS.push(config);
  return config;
}

/**
 * Update — aggregate replace (brief PUT contract): the sent rows array IS the
 * new state (existing ids retained, new rows assigned, omitted rows removed).
 * GameType is read-only on edit (brief §5.2.7), so it is not changed here.
 */
export function updatePayoutConfig(id: string, input: PayoutConfigInput): PayoutConfig | undefined {
  const config = PAYOUT_CONFIGS.find((c) => c.id === id);
  if (!config) return undefined;
  config.name = input.name.trim();
  config.rows = stampRows(input.rows);
  config.updatedAt = new Date().toISOString().slice(0, 10);
  return config;
}
