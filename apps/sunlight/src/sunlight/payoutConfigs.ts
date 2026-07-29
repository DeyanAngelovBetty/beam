import type { BeamStatus } from '@betty/beam';

/**
 * MetaGame — Payout Configs mock domain (apps/sunlight mock-data lane).
 *
 * Shaped from Georgi's MetaGame Configuration doc and the legacy Yoda back
 * office we're replacing. A PayoutConfig is a payout table: a set of weighted
 * rows, each a probability of landing on a prize value plus the rewards paid.
 * The two derived helpers (expectedAvgPayout, probabilityTotal) are the seed of
 * the detail page's Live Checks — kept here so the list and the (later) detail
 * compute the same numbers from one source.
 */

export type GameType = 'Scratcher' | 'RewardsWheel' | 'WheelOfWins' | 'MultiMadness';
export type PayoutStatus = 'Live' | 'Draft' | 'Disabled';

/**
 * A reward is typed per kind — the payload shape depends on rewardType. A
 * discriminated union so the detail editor (later) can render the right fields
 * and the type checker enforces the payload. Extend the union as the domain
 * grows (the doc lists more kinds than the two seeded here).
 */
export type Reward =
  | { rewardType: 'Coins'; amount: number }
  | { rewardType: 'FreeSpins'; gameId: string; spinCount: number };

export interface PayoutRow {
  /** 0..1. Rows with probability 0 are "visual only" — shown, never landed. */
  probability: number;
  winMessage: string;
  /** The row's headline payout value; feeds expectedAvgPayout. */
  prizeValue: number;
  rewards: Reward[];
}

export interface PayoutConfig {
  id: string;
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

// Reward shorthands for readable seed rows.
const coins = (amount: number): Reward => ({ rewardType: 'Coins', amount });
const spins = (gameId: string, spinCount: number): Reward => ({
  rewardType: 'FreeSpins',
  gameId,
  spinCount,
});

/**
 * Eight configs, recognizable from the real system. Averages are engineered to
 * hit the doc's headline numbers (the list column derives them, not stores
 * them). Deliberate demo fixtures:
 *  - "Topaz - Weekend Special" probabilities sum to 0.9 — a future validation demo.
 *  - "Default Payout Table" and "Legacy Scratcher" carry probability-0 "visual
 *    only" rows; "Legacy Scratcher" also has a no-win (value 0) row.
 */
export const PAYOUT_CONFIGS: PayoutConfig[] = [
  {
    id: 'pc-no-loss',
    name: 'Default No Loss Payout Table',
    gameType: 'Scratcher',
    status: 'Live',
    createdAt: '2025-11-02',
    updatedAt: '2026-07-18',
    // avg = .5·1 + .3·3 + .2·6.25 = 2.65
    rows: [
      { probability: 0.5, winMessage: 'Win 1 Coin', prizeValue: 1, rewards: [coins(1)] },
      { probability: 0.3, winMessage: 'Win 3 Coins', prizeValue: 3, rewards: [coins(3)] },
      { probability: 0.2, winMessage: '6.25× Bonus', prizeValue: 6.25, rewards: [coins(6), spins('scratch-gold', 5)] },
    ],
  },
  {
    id: 'pc-default',
    name: 'Default Payout Table',
    gameType: 'Scratcher',
    status: 'Live',
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
    gameType: 'RewardsWheel',
    status: 'Live',
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
    id: 'pc-jamie-abs',
    name: 'Jamie Payout Table Absolute',
    gameType: 'WheelOfWins',
    status: 'Draft',
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
    gameType: 'MultiMadness',
    status: 'Draft',
    createdAt: '2026-03-01',
    updatedAt: '2026-07-12',
    // avg = .5·60000 + .4·70000 + .1·11250 = 59,125.00
    rows: [
      { probability: 0.5, winMessage: '60,000 Coins', prizeValue: 60000, rewards: [coins(60000)] },
      { probability: 0.4, winMessage: '70,000 Coins', prizeValue: 70000, rewards: [coins(70000)] },
      { probability: 0.1, winMessage: '11,250 Coins', prizeValue: 11250, rewards: [coins(11250)] },
    ],
  },
  {
    id: 'pc-sapphire-daily',
    name: 'Sapphire - Daily Game',
    gameType: 'RewardsWheel',
    status: 'Live',
    createdAt: '2026-01-20',
    updatedAt: '2026-07-25',
    // avg = .5·20000 + .4·22000 + .1·8500 = 19,650.00
    rows: [
      { probability: 0.5, winMessage: '20,000 Coins', prizeValue: 20000, rewards: [coins(20000)] },
      { probability: 0.4, winMessage: '22,000 Coins', prizeValue: 22000, rewards: [coins(22000)] },
      { probability: 0.1, winMessage: 'Daily Bonus Spins', prizeValue: 8500, rewards: [spins('sapphire-daily', 10)] },
    ],
  },
  {
    id: 'pc-topaz-weekend',
    name: 'Topaz - Weekend Special',
    gameType: 'WheelOfWins',
    status: 'Draft',
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
    gameType: 'Scratcher',
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

export const GAME_TYPES: GameType[] = ['Scratcher', 'RewardsWheel', 'WheelOfWins', 'MultiMadness'];
export const PAYOUT_STATUSES: PayoutStatus[] = ['Live', 'Draft', 'Disabled'];

/**
 * Status → Beam's semantic status vocabulary (BeamStatus). 'Live'/'Draft' map
 * cleanly; 'Disabled' has NO exact lifecycle word — it rides 'paused' with a
 * label override (semantic status, overridden copy). Flagged as a candidate
 * BeamStatus vocabulary decision (BEAM.md §6.4), not made unilaterally here.
 */
export function statusBadge(status: PayoutStatus): { status: BeamStatus; label: string } {
  switch (status) {
    case 'Live':
      return { status: 'active', label: 'Live' };
    case 'Draft':
      return { status: 'draft', label: 'Draft' };
    case 'Disabled':
      return { status: 'paused', label: 'Disabled' };
  }
}

/** Format a payout value: grouped thousands, two decimals (2,648.95). */
export function formatPayout(value: number): string {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
