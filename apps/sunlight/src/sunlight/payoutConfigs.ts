import type { BeamStatus } from '@betty/beam';

/** GameTypes exposed by the Betty MetaGame visual demo. */
export type GameType = 'MysteryBox' | 'Wheel' | 'Scratcher' | 'BettyWheelOfWins';
export type StandardPayoutGameType = Exclude<GameType, 'BettyWheelOfWins'>;

export type PayoutStatus = 'Enabled' | 'Disabled';

/** Backend-aligned reward types. */
export type RewardType = 'Coins' | 'Tokens';
export const REWARD_TYPES: RewardType[] = ['Coins', 'Tokens'];

export interface Reward {
  rewardType: RewardType;
  amount: number;
}

export interface PayoutRow {
  /** Aggregate PUT identity. New rows omit this value. */
  id?: string;
  /** Probability as a fraction from 0 to 1. */
  probability: number;
  winMessage: string;
  /** Demo-only headline value used by the derived average column. */
  prizeValue: number;
  rewards: Reward[];
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

export type PayoutConfig = StandardPayoutConfig | BettyWheelOfWinsPayoutConfig;

export function getPayoutRows(config: PayoutConfig): PayoutRow[] {
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

const coins = (amount: number): Reward => ({ rewardType: 'Coins', amount });
const tokens = (amount: number): Reward => ({ rewardType: 'Tokens', amount });

/** Coherent Betty-owned payout graph for the four-game visual demo. */
export const PAYOUT_CONFIGS: PayoutConfig[] = [
  {
    id: 'pc-mystery-box-standard',
    name: 'Mystery Box Standard Payout',
    gameType: 'MysteryBox',
    status: 'Enabled',
    createdAt: '2026-07-01',
    updatedAt: '2026-07-30',
    rows: [
      { probability: 0.55, winMessage: 'Small Prize', prizeValue: 10, rewards: [coins(10)] },
      { probability: 0.3, winMessage: 'Medium Prize', prizeValue: 25, rewards: [coins(25)] },
      { probability: 0.12, winMessage: 'Big Prize', prizeValue: 100, rewards: [coins(100)] },
      {
        probability: 0.03,
        winMessage: 'Jackpot',
        prizeValue: 500,
        rewards: [coins(500), tokens(10)],
      },
    ],
  },
  {
    id: 'pc-mystery-box-premium',
    name: 'Mystery Box Premium Payout',
    gameType: 'MysteryBox',
    status: 'Enabled',
    createdAt: '2026-07-08',
    updatedAt: '2026-07-30',
    rows: [
      { probability: 0.5, winMessage: 'Premium Prize', prizeValue: 100, rewards: [coins(100)] },
      { probability: 0.35, winMessage: 'Big Premium Prize', prizeValue: 250, rewards: [coins(250)] },
      {
        probability: 0.15,
        winMessage: 'VIP Jackpot',
        prizeValue: 1000,
        rewards: [coins(1000), tokens(25)],
      },
    ],
  },
  {
    id: 'pc-mystery-box-promotion',
    name: 'Mystery Box Promotion Payout',
    gameType: 'MysteryBox',
    status: 'Disabled',
    createdAt: '2026-07-18',
    updatedAt: '2026-07-29',
    rows: [
      { probability: 0.6, winMessage: 'Promotion Prize', prizeValue: 20, rewards: [coins(20)] },
      { probability: 0.3, winMessage: 'Big Promotion Prize', prizeValue: 50, rewards: [coins(50)] },
      {
        probability: 0.1,
        winMessage: 'Promotion Jackpot',
        prizeValue: 200,
        rewards: [coins(200), tokens(5)],
      },
    ],
  },
  {
    id: 'pc-wheel-standard',
    name: 'Wheel Standard Payout',
    gameType: 'Wheel',
    status: 'Enabled',
    createdAt: '2026-07-02',
    updatedAt: '2026-07-26',
    rows: [
      { probability: 0.7, winMessage: 'Small Wheel Win', prizeValue: 5, rewards: [coins(5)] },
      { probability: 0.25, winMessage: 'Big Wheel Win', prizeValue: 25, rewards: [coins(25)] },
      {
        probability: 0.05,
        winMessage: 'Wheel Jackpot',
        prizeValue: 100,
        rewards: [coins(100), tokens(2)],
      },
    ],
  },
  {
    id: 'pc-scratcher-standard',
    name: 'Scratcher Standard Payout',
    gameType: 'Scratcher',
    status: 'Enabled',
    createdAt: '2026-07-03',
    updatedAt: '2026-07-27',
    rows: [
      { probability: 0.65, winMessage: 'Scratch Win', prizeValue: 10, rewards: [coins(10)] },
      { probability: 0.3, winMessage: 'Big Scratch Win', prizeValue: 50, rewards: [coins(50)] },
      { probability: 0.05, winMessage: 'Scratch Jackpot', prizeValue: 250, rewards: [coins(250)] },
    ],
  },
  {
    id: 'pc-betty-wheel-of-wins-standard',
    name: 'Betty Wheel of Wins Standard Payout',
    gameType: 'BettyWheelOfWins',
    status: 'Enabled',
    createdAt: '2026-08-20',
    updatedAt: '2026-08-26',
    payoutRows: [
      { probability: 0.6, winMessage: 'Small Win', prizeValue: 10, rewards: [coins(10)] },
      {
        probability: 0.3,
        winMessage: 'Bonus Bundle',
        prizeValue: 20,
        rewards: [coins(20), tokens(2)],
      },
      {
        probability: 0.1,
        winMessage: 'Wheel Jackpot',
        prizeValue: 100,
        rewards: [coins(100), tokens(10)],
      },
    ],
    multiplierRows: [
      { probability: 0.6, multiplier: 1 },
      { probability: 0.3, multiplier: 1.5 },
      { probability: 0.1, multiplier: 3 },
    ],
  },
];

export const GAME_TYPES: GameType[] = ['MysteryBox', 'Wheel', 'Scratcher', 'BettyWheelOfWins'];
export const PAYOUT_STATUSES: PayoutStatus[] = ['Enabled', 'Disabled'];

export function gameTypeLabel(gameType: GameType): string {
  return gameType === 'BettyWheelOfWins' ? 'Betty Wheel of Wins' : gameType;
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

export type PayoutConfigInput = StandardPayoutConfigInput | BettyWheelOfWinsPayoutConfigInput;

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
  const config: PayoutConfig = input.gameType === 'BettyWheelOfWins'
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
  if (config.gameType === 'BettyWheelOfWins') {
    if (input.gameType !== 'BettyWheelOfWins') return undefined;
    config.payoutRows = stampRows(input.payoutRows);
    config.multiplierRows = input.multiplierRows.map((row) => ({ ...row }));
  } else {
    if (input.gameType === 'BettyWheelOfWins') return undefined;
    config.rows = stampRows(input.rows);
  }
  config.name = input.name.trim();
  config.updatedAt = new Date().toISOString().slice(0, 10);
  return config;
}
