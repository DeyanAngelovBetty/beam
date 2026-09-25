import type { BeamStatus } from '@betty/beam';

/** GameTypes exposed by the Betty MetaGame visual demo. */
export type GameType = 'BettyWheel' | 'BettyScratcher' | 'BettyWheelOfWins' | 'BettyMultiplierMadness';
export type StandardPayoutGameType = Exclude<GameType, 'BettyWheelOfWins' | 'BettyMultiplierMadness'>;

export type PayoutStatus = 'Enabled' | 'Disabled';

/** Backend-aligned reward types. */
export type RewardType = 'Coins' | 'Tokens';
export const REWARD_TYPES: RewardType[] = ['Coins', 'Tokens'];

export interface Reward {
  rewardType: RewardType;
  amount: number;
}

export interface PayoutRow {
  /** Mock row identity, used only for rendering. */
  id?: string;
  /** Probability as a fraction from 0 to 1. */
  probability: number;
  winMessage: string;
  /** Demo-only headline value used by the derived average column. */
  prizeValue: number;
  rewards: Reward[];
  isTopPrize?: boolean;
}

export interface MultiplierRow {
  /** Probability as a fraction from 0 to 1. */
  probability: number;
  multiplier: number;
}

interface PayoutConfigBase {
  id: string;
  name: string;
  status: PayoutStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StandardPayoutConfig extends PayoutConfigBase {
  gameType: StandardPayoutGameType;
  rows: PayoutRow[];
}

export interface BettyWheelOfWinsPayoutConfig extends PayoutConfigBase {
  gameType: 'BettyWheelOfWins';
  payoutRows: PayoutRow[];
  multiplierRows: MultiplierRow[];
}

export interface MultiplierMadnessPayoutConfig extends PayoutConfigBase {
  gameType: 'BettyMultiplierMadness';
  rtp: number;
}

export type PayoutConfig = StandardPayoutConfig | BettyWheelOfWinsPayoutConfig | MultiplierMadnessPayoutConfig;

export function getPayoutRows(config: PayoutConfig): PayoutRow[] {
  if (config.gameType === 'BettyMultiplierMadness') return [];
  return config.gameType === 'BettyWheelOfWins' ? config.payoutRows : config.rows;
}

export function expectedAvgPayout(config: PayoutConfig): number {
  const basePayout = getPayoutRows(config).reduce(
    (sum, row) => sum + row.probability * row.prizeValue,
    0,
  );
  if (config.gameType !== 'BettyWheelOfWins') return basePayout;
  const expectedMultiplier = config.multiplierRows.reduce(
    (sum, row) => sum + row.probability * row.multiplier,
    0,
  );
  return basePayout * expectedMultiplier;
}

export function probabilityTotal(config: PayoutConfig): number {
  return getPayoutRows(config).reduce((sum, row) => sum + row.probability, 0);
}

/** In-memory examples matching the MetaGame configuration rules. */
export const PAYOUT_CONFIGS: PayoutConfig[] = [
  {
    id: 'pc-betty-wheel-standard',
    name: 'Betty Wheel Standard Payout',
    gameType: 'BettyWheel',
    status: 'Enabled',
    createdAt: '2026-09-01',
    updatedAt: '2026-09-25',
    rows: [
      {probability: 0.4, winMessage: '10 Coins', prizeValue: 10, rewards: [{rewardType: 'Coins', amount: 10}]},
      {probability: 0.25, winMessage: '20 Coins', prizeValue: 20, rewards: [{rewardType: 'Coins', amount: 20}]},
      {probability: 0.15, winMessage: '50 Coins', prizeValue: 50, rewards: [{rewardType: 'Coins', amount: 50}]},
      {probability: 0.1, winMessage: '100 Coins', prizeValue: 100, rewards: [{rewardType: 'Coins', amount: 100}]},
      {probability: 0.09, winMessage: '200 Coins', prizeValue: 200, rewards: [{rewardType: 'Coins', amount: 200}]},
      {probability: 0.01, winMessage: 'Jackpot', prizeValue: 1000, rewards: [{rewardType: 'Coins', amount: 1000}, {rewardType: 'Tokens', amount: 10}]},
    ],
  },
  {
    id: 'pc-betty-wheel-premium',
    name: 'Betty Wheel Premium Payout',
    gameType: 'BettyWheel',
    status: 'Enabled',
    createdAt: '2026-09-01',
    updatedAt: '2026-09-25',
    rows: [
      {probability: 0.4, winMessage: '100 Coins', prizeValue: 100, rewards: [{rewardType: 'Coins', amount: 100}]},
      {probability: 0.25, winMessage: '200 Coins', prizeValue: 200, rewards: [{rewardType: 'Coins', amount: 200}]},
      {probability: 0.15, winMessage: '500 Coins', prizeValue: 500, rewards: [{rewardType: 'Coins', amount: 500}]},
      {probability: 0.1, winMessage: '1000 Coins', prizeValue: 1000, rewards: [{rewardType: 'Coins', amount: 1000}]},
      {probability: 0.09, winMessage: '2000 Coins', prizeValue: 2000, rewards: [{rewardType: 'Coins', amount: 2000}]},
      {probability: 0.01, winMessage: 'Jackpot', prizeValue: 10000, rewards: [{rewardType: 'Coins', amount: 10000}, {rewardType: 'Tokens', amount: 10}]},
    ],
  },
  {
    id: 'pc-betty-wheel-promotion',
    name: 'Betty Wheel Promotion Payout',
    gameType: 'BettyWheel',
    status: 'Disabled',
    createdAt: '2026-09-01',
    updatedAt: '2026-09-25',
    rows: [
      {probability: 0.4, winMessage: '10 Coins', prizeValue: 10, rewards: [{rewardType: 'Coins', amount: 10}]},
      {probability: 0.25, winMessage: '20 Coins', prizeValue: 20, rewards: [{rewardType: 'Coins', amount: 20}]},
      {probability: 0.15, winMessage: '50 Coins', prizeValue: 50, rewards: [{rewardType: 'Coins', amount: 50}]},
      {probability: 0.1, winMessage: '100 Coins', prizeValue: 100, rewards: [{rewardType: 'Coins', amount: 100}]},
      {probability: 0.09, winMessage: '200 Coins', prizeValue: 200, rewards: [{rewardType: 'Coins', amount: 200}]},
      {probability: 0.01, winMessage: 'Jackpot', prizeValue: 1000, rewards: [{rewardType: 'Coins', amount: 1000}, {rewardType: 'Tokens', amount: 10}]},
    ],
  },
  {
    id: 'pc-wheel-standard',
    name: 'Weekly Wheel Payout',
    gameType: 'BettyWheel',
    status: 'Enabled',
    createdAt: '2026-09-01',
    updatedAt: '2026-09-25',
    rows: [
      {probability: 0.4, winMessage: '10 Coins', prizeValue: 10, rewards: [{rewardType: 'Coins', amount: 10}]},
      {probability: 0.25, winMessage: '20 Coins', prizeValue: 20, rewards: [{rewardType: 'Coins', amount: 20}]},
      {probability: 0.15, winMessage: '50 Coins', prizeValue: 50, rewards: [{rewardType: 'Coins', amount: 50}]},
      {probability: 0.1, winMessage: '100 Coins', prizeValue: 100, rewards: [{rewardType: 'Coins', amount: 100}]},
      {probability: 0.09, winMessage: '200 Coins', prizeValue: 200, rewards: [{rewardType: 'Coins', amount: 200}]},
      {probability: 0.01, winMessage: 'Jackpot', prizeValue: 1000, rewards: [{rewardType: 'Coins', amount: 1000}, {rewardType: 'Tokens', amount: 10}]},
    ],
  },
  {
    id: 'pc-scratcher-standard',
    name: 'Betty Scratcher Payout',
    gameType: 'BettyScratcher',
    status: 'Enabled',
    createdAt: '2026-09-01',
    updatedAt: '2026-09-25',
    rows: [
      {probability: 0.3, winMessage: '10 Coins', prizeValue: 10, rewards: [{rewardType: 'Coins', amount: 10}], isTopPrize: false},
      {probability: 0.2, winMessage: '20 Coins', prizeValue: 20, rewards: [{rewardType: 'Coins', amount: 20}], isTopPrize: false},
      {probability: 0.15, winMessage: '30 Coins', prizeValue: 30, rewards: [{rewardType: 'Coins', amount: 30}], isTopPrize: false},
      {probability: 0.1, winMessage: '50 Coins', prizeValue: 50, rewards: [{rewardType: 'Coins', amount: 50}], isTopPrize: false},
      {probability: 0.1, winMessage: '100 Coins', prizeValue: 100, rewards: [{rewardType: 'Coins', amount: 100}], isTopPrize: false},
      {probability: 0.08, winMessage: '200 Coins', prizeValue: 200, rewards: [{rewardType: 'Coins', amount: 200}], isTopPrize: false},
      {probability: 0.04, winMessage: '500 Coins', prizeValue: 500, rewards: [{rewardType: 'Coins', amount: 500}], isTopPrize: false},
      {probability: 0.02, winMessage: '1000 Coins', prizeValue: 1000, rewards: [{rewardType: 'Coins', amount: 1000}], isTopPrize: false},
      {probability: 0.01, winMessage: '10000 Coins', prizeValue: 10000, rewards: [{rewardType: 'Coins', amount: 10000}], isTopPrize: true},
    ],
  },
  {
    id: 'pc-betty-wheel-of-wins-standard',
    name: 'Betty Wheel of Wins Payout',
    gameType: 'BettyWheelOfWins',
    status: 'Enabled',
    createdAt: '2026-09-01',
    updatedAt: '2026-09-25',
    payoutRows: [
      {probability: 0.4, winMessage: '10 Coins', prizeValue: 10, rewards: [{rewardType: 'Coins', amount: 10}]},
      {probability: 0.2, winMessage: '20 Coins', prizeValue: 20, rewards: [{rewardType: 'Coins', amount: 20}]},
      {probability: 0.15, winMessage: '30 Coins', prizeValue: 30, rewards: [{rewardType: 'Coins', amount: 30}]},
      {probability: 0.1, winMessage: '50 Coins', prizeValue: 50, rewards: [{rewardType: 'Coins', amount: 50}]},
      {probability: 0.07, winMessage: '100 Coins', prizeValue: 100, rewards: [{rewardType: 'Coins', amount: 100}]},
      {probability: 0.04, winMessage: '200 Coins', prizeValue: 200, rewards: [{rewardType: 'Coins', amount: 200}]},
      {probability: 0.03, winMessage: '500 Coins', prizeValue: 500, rewards: [{rewardType: 'Coins', amount: 500}]},
      {probability: 0.01, winMessage: '1000 Coins', prizeValue: 1000, rewards: [{rewardType: 'Coins', amount: 1000}]},
    ],
    multiplierRows: [
      {probability: 0.5, multiplier: 1},
      {probability: 0.2, multiplier: 2},
      {probability: 0.15, multiplier: 3},
      {probability: 0.1, multiplier: 5},
      {probability: 0.04, multiplier: 10},
      {probability: 0.01, multiplier: 20},
    ],
  },
  {
    id: 'pc-mm-standard',
    name: 'Multiplier Madness 97%',
    gameType: 'BettyMultiplierMadness',
    status: 'Enabled',
    createdAt: '2026-09-01',
    updatedAt: '2026-09-25',
    rtp: 0.97,
  },
  {
    id: 'pc-mm-promotion',
    name: 'Multiplier Madness 98%',
    gameType: 'BettyMultiplierMadness',
    status: 'Disabled',
    createdAt: '2026-09-01',
    updatedAt: '2026-09-25',
    rtp: 0.98,
  },
];

export const GAME_TYPES: GameType[] = ['BettyWheel', 'BettyScratcher', 'BettyWheelOfWins', 'BettyMultiplierMadness'];
export const PAYOUT_STATUSES: PayoutStatus[] = ['Enabled', 'Disabled'];

/**
 * Is the payout table's ROW ORDER data-meaningful? DECLARED, not inferred (BEAM.md §6.7): the wheel games
 * (Betty Wheel, Wheel of Wins) render positional sectors whose order IS the sector layout, so they are
 * orderable — the drag handle + kebab Move up/down show. Scratcher rows and the RTP-only Multiplier Madness
 * carry no positional order → not orderable (shell + Delete-only kebab). (Multiplier SECTORS, a separate
 * table, are always positional → orderable — declared at that table directly.)
 */
export const isOrderablePayout = (gameType: GameType | ''): boolean =>
  gameType === 'BettyWheel' || gameType === 'BettyWheelOfWins';

export const LEGACY_GAME_TYPES = ['Wheel', 'Scratcher', 'DailyWheel', 'DailyScratcher', 'DailyGift', 'MultiplierMadness', 'InstantWheel', 'WheelOfWins'] as const;

export function gameTypeLabel(gameType: string): string {
  return gameType.replace(/([a-z])([A-Z])/g, '$1 $2');
}

export function statusBadge(status: PayoutStatus): { status: BeamStatus; label: string } {
  return status === 'Enabled'
    ? { status: 'active', label: 'Enabled' }
    : { status: 'draft', label: 'Disabled' };
}

export function formatPayout(value: number): string {
  return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export const PRIZE_TYPE_LABEL: Record<RewardType, string> = { Coins: 'Coins', Tokens: 'Tokens' };

export function formatReward(reward: Reward): string {
  const label = reward.amount === 1
    ? reward.rewardType.slice(0, -1)
    : PRIZE_TYPE_LABEL[reward.rewardType];
  return `${formatPayout(reward.amount)} ${label}`;
}

export function formatRewards(rewards: Reward[]): string {
  return rewards.map(formatReward).join(', ');
}

let idSeq = 0;

export function newId(prefix: 'pc' | 'row'): string {
  idSeq += 1;
  return `${prefix}-${Date.now().toString(36)}-${idSeq}`;
}

export function getPayoutConfig(id: string): PayoutConfig | undefined {
  return PAYOUT_CONFIGS.find((config) => config.id === id);
}

export function nameIsUnique(name: string, gameType: GameType, excludeId?: string): boolean {
  const normalizedName = name.trim().toLowerCase();
  return !PAYOUT_CONFIGS.some(
    (config) =>
      config.id !== excludeId
      && config.gameType === gameType
      && config.name.trim().toLowerCase() === normalizedName
  );
}

interface PayoutConfigInputBase {
  name: string;
}

export interface StandardPayoutConfigInput extends PayoutConfigInputBase {
  gameType: StandardPayoutGameType;
  rows: PayoutRow[];
}

export interface BettyWheelOfWinsPayoutConfigInput extends PayoutConfigInputBase {
  gameType: 'BettyWheelOfWins';
  payoutRows: PayoutRow[];
  multiplierRows: MultiplierRow[];
}

export type PayoutConfigInput = StandardPayoutConfigInput | BettyWheelOfWinsPayoutConfigInput | { name: string; gameType: 'BettyMultiplierMadness'; rtp: number };

function stampRows(rows: PayoutRow[]): PayoutRow[] {
  return rows.map((row) => ({ ...row, id: row.id ?? newId('row') }));
}

/** New PayoutConfigs always start Disabled. */
export function createPayoutConfig(input: PayoutConfigInput): PayoutConfig {
  const today = new Date().toISOString().slice(0, 10);
  const common = {
    id: newId('pc'),
    name: input.name.trim(),
    status: 'Disabled' as const,
    createdAt: today,
    updatedAt: today,
  };
  const config: PayoutConfig = input.gameType === 'BettyMultiplierMadness'
    ? { ...common, gameType: input.gameType, rtp: input.rtp }
    : input.gameType === 'BettyWheelOfWins'
    ? {
        ...common,
        gameType: input.gameType,
        payoutRows: stampRows(input.payoutRows),
        multiplierRows: input.multiplierRows.map((row) => ({ ...row })),
      }
    : { ...common, gameType: input.gameType, rows: stampRows(input.rows) };
  PAYOUT_CONFIGS.push(config);
  return config;
}

/** Aggregate replacement. GameType stays immutable on Edit. */
export function updatePayoutConfig(id: string, input: PayoutConfigInput): PayoutConfig | undefined {
  const config = PAYOUT_CONFIGS.find((candidate) => candidate.id === id);
  if (!config) return undefined;
  if (config.gameType === 'BettyMultiplierMadness') {
    if (input.gameType !== 'BettyMultiplierMadness') return undefined;
    config.rtp = input.rtp;
  } else if (config.gameType === 'BettyWheelOfWins') {
    if (input.gameType !== 'BettyWheelOfWins') return undefined;
    config.payoutRows = stampRows(input.payoutRows);
    config.multiplierRows = input.multiplierRows.map((row) => ({ ...row }));
  } else {
    if (input.gameType === 'BettyWheelOfWins' || input.gameType === 'BettyMultiplierMadness') return undefined;
    config.rows = stampRows(input.rows);
  }
  config.name = input.name.trim();
  config.updatedAt = new Date().toISOString().slice(0, 10);
  return config;
}
