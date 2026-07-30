import type { GameType, PayoutStatus } from './payoutConfigs';

export type MatchMode = 'All' | 'Any';

export interface TargetingCondition {
  attribute: 'Audience' | 'Loyalty Status' | 'RCC Segment';
  operator: 'is one of' | 'is none of';
  values: string[];
}

export interface TargetingRule {
  id: string;
  priority: number;
  status: PayoutStatus;
  payoutConfigId: string;
  payoutConfigName: string;
  name: string;
  condition?: {
    match: MatchMode;
    conditions: TargetingCondition[];
  };
}

export interface GameConfig {
  id: string;
  code: string;
  gameType: GameType;
  status: PayoutStatus;
  targetingRules: TargetingRule[];
}

export const GAME_CONFIGS: GameConfig[] = [
  {
    id: 'gc-wheel-global',
    code: 'WHEEL_GLOBAL',
    gameType: 'Wheel',
    status: 'Enabled',
    targetingRules: [
      {
        id: 'tr-wheel-vip-gold',
        priority: 300,
        status: 'Enabled',
        payoutConfigId: 'pc-wheel-vip',
        payoutConfigName: 'VIP Wheel Payout',
        name: 'VIP Gold Players',
        condition: {
          match: 'All',
          conditions: [
            { attribute: 'Audience', operator: 'is one of', values: ['VIP'] },
            { attribute: 'Loyalty Status', operator: 'is one of', values: ['Gold'] },
          ],
        },
      },
      {
        id: 'tr-wheel-special',
        priority: 200,
        status: 'Enabled',
        payoutConfigId: 'pc-wheel-special',
        payoutConfigName: 'Special Wheel Payout',
        name: 'Special Segment Players',
        condition: {
          match: 'Any',
          conditions: [
            { attribute: 'RCC Segment', operator: 'is one of', values: ['High Value'] },
            { attribute: 'Audience', operator: 'is none of', values: ['Restricted'] },
          ],
        },
      },
      {
        id: 'tr-wheel-returning',
        priority: 100,
        status: 'Disabled',
        payoutConfigId: 'pc-wheel-returning',
        payoutConfigName: 'Returning Player Wheel Payout',
        name: 'Returning Players',
        condition: {
          match: 'All',
          conditions: [{ attribute: 'RCC Segment', operator: 'is one of', values: ['Returning'] }],
        },
      },
      {
        id: 'tr-wheel-fallback',
        priority: 0,
        status: 'Enabled',
        payoutConfigId: 'pc-wheel-default',
        payoutConfigName: 'Default Wheel Payout',
        name: 'Fallback',
      },
    ],
  },
  {
    id: 'gc-daily-scratcher',
    code: 'DAILY_SCRATCHER_CA',
    gameType: 'DailyScratcher',
    status: 'Enabled',
    targetingRules: [
      {
        id: 'tr-scratcher-vip',
        priority: 100,
        status: 'Enabled',
        payoutConfigId: 'pc-scratcher-vip',
        payoutConfigName: 'VIP Daily Scratcher Payout',
        name: 'VIP Players',
        condition: {
          match: 'Any',
          conditions: [{ attribute: 'Audience', operator: 'is one of', values: ['VIP', 'High Rollers'] }],
        },
      },
      {
        id: 'tr-scratcher-fallback',
        priority: 0,
        status: 'Enabled',
        payoutConfigId: 'pc-scratcher-default',
        payoutConfigName: 'Default Daily Scratcher Payout',
        name: 'Fallback',
      },
    ],
  },
  {
    id: 'gc-instant-wheel-test',
    code: 'INSTANT_WHEEL_TEST',
    gameType: 'InstantWheel',
    status: 'Disabled',
    targetingRules: [
      {
        id: 'tr-instant-test',
        priority: 100,
        status: 'Disabled',
        payoutConfigId: 'pc-instant-test',
        payoutConfigName: 'Instant Wheel Test Payout',
        name: 'Test Audience',
        condition: {
          match: 'All',
          conditions: [
            { attribute: 'Audience', operator: 'is one of', values: ['Internal Testers'] },
            { attribute: 'RCC Segment', operator: 'is none of', values: ['Self Excluded'] },
          ],
        },
      },
      {
        id: 'tr-instant-fallback',
        priority: 0,
        status: 'Enabled',
        payoutConfigId: 'pc-instant-default',
        payoutConfigName: 'Default Instant Wheel Payout',
        name: 'Fallback',
      },
    ],
  },
];
