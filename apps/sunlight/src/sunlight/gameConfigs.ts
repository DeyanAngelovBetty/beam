import type { GameType, PayoutStatus } from './payoutConfigs';

// ID prefixes for the mock store (the real API assigns these).
export type GcIdPrefix = 'gc' | 'tr';

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

// ---- Mock persistence (the seed store as a stand-in API) --------------------
// Extends Georgi's merged domain with the editor's create/update helpers,
// mirroring payoutConfigs.ts. Aggregate PUT shape: TargetingRule.id retained,
// new rules assigned, omitted rules removed (the editor sends the full list).
// Mutates GAME_CONFIGS; the list remounts on navigate and reflects it.

let gcIdSeq = 0;
export function newGcId(prefix: GcIdPrefix): string {
  gcIdSeq += 1;
  return `${prefix}-${Date.now().toString(36)}-${gcIdSeq}`;
}

export function getGameConfig(id: string): GameConfig | undefined {
  return GAME_CONFIGS.find((c) => c.id === id);
}

/** Config code must be unique within its GameType. Excludes the config being edited. */
export function gameConfigNameIsUnique(code: string, gameType: GameType, excludeId?: string): boolean {
  const c = code.trim().toLowerCase();
  return !GAME_CONFIGS.some(
    (g) => g.id !== excludeId && g.gameType === gameType && g.code.trim().toLowerCase() === c
  );
}

/** The editor payload — code + gameType + the full (already-adapted) rule list. */
export interface GameConfigInput {
  code: string;
  gameType: GameType;
  targetingRules: TargetingRule[];
}

function stampRules(rules: TargetingRule[]): TargetingRule[] {
  return rules.map((r) => ({ ...r, id: r.id || newGcId('tr') }));
}

/** Create — always Disabled (activation is a separate action). */
export function createGameConfig(input: GameConfigInput): GameConfig {
  const config: GameConfig = {
    id: newGcId('gc'),
    code: input.code.trim(),
    gameType: input.gameType,
    status: 'Disabled',
    targetingRules: stampRules(input.targetingRules),
  };
  GAME_CONFIGS.push(config);
  return config;
}

/** Update — aggregate replace. GameType is read-only on edit, so it is untouched. */
export function updateGameConfig(id: string, input: GameConfigInput): GameConfig | undefined {
  const config = GAME_CONFIGS.find((c) => c.id === id);
  if (!config) return undefined;
  config.code = input.code.trim();
  config.targetingRules = stampRules(input.targetingRules);
  return config;
}
