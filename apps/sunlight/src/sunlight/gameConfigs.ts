import type { GameType, PayoutStatus } from './payoutConfigs';

// ID prefixes for the mock store (the real API assigns these).
export type GcIdPrefix = 'gc' | 'tr';

export type MatchMode = 'All' | 'Any';
export type TargetingLeafOperator = 'IsOneOf' | 'IsNoneOf';
export type TargetingConditionField = 'Audience' | 'LoyaltyStatus' | 'RccSegment';

export type TargetingCondition =
  | { operator: MatchMode; statements: TargetingCondition[] }
  | { operator: TargetingLeafOperator; field: TargetingConditionField; values: (string | number)[] };

export interface TargetingRule {
  id: string;
  priority: number;
  status: PayoutStatus;
  payoutConfigId: string;
  condition?: TargetingCondition;
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
        payoutConfigId: 'pc-no-loss-abs',
        condition: {
          operator: 'All',
          statements: [
            { field: 'Audience', operator: 'IsOneOf', values: ['VIP'] },
            { field: 'LoyaltyStatus', operator: 'IsOneOf', values: ['Gold'] },
          ],
        },
      },
      {
        id: 'tr-wheel-special',
        priority: 200,
        status: 'Enabled',
        payoutConfigId: 'pc-no-loss-abs',
        condition: {
          operator: 'Any',
          statements: [
            { field: 'RccSegment', operator: 'IsOneOf', values: ['High Value'] },
            { field: 'Audience', operator: 'IsNoneOf', values: ['Restricted'] },
          ],
        },
      },
      {
        id: 'tr-wheel-returning',
        priority: 100,
        status: 'Disabled',
        payoutConfigId: 'pc-no-loss-abs',
        condition: {
          operator: 'All',
          statements: [{ field: 'RccSegment', operator: 'IsOneOf', values: ['Returning'] }],
        },
      },
      {
        id: 'tr-wheel-fallback',
        priority: 0,
        status: 'Enabled',
        payoutConfigId: 'pc-no-loss-abs',
      },
    ],
  },
  {
    id: 'gc-wheel-promotion',
    code: 'WHEEL_PROMOTION',
    gameType: 'Wheel',
    status: 'Disabled',
    targetingRules: [
      {
        id: 'tr-wheel-promotion-fallback',
        priority: 0,
        status: 'Enabled',
        payoutConfigId: 'pc-no-loss-abs',
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
        payoutConfigId: 'pc-legacy-scratcher',
        condition: {
          operator: 'Any',
          statements: [{ field: 'Audience', operator: 'IsOneOf', values: ['VIP', 'High Rollers'] }],
        },
      },
      {
        id: 'tr-scratcher-fallback',
        priority: 0,
        status: 'Enabled',
        payoutConfigId: 'pc-legacy-scratcher',
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
        payoutConfigId: 'pc-topaz-weekend',
        condition: {
          operator: 'All',
          statements: [
            { field: 'Audience', operator: 'IsOneOf', values: ['Internal Testers'] },
            { field: 'RccSegment', operator: 'IsNoneOf', values: ['Self Excluded'] },
          ],
        },
      },
      {
        id: 'tr-instant-fallback',
        priority: 0,
        status: 'Enabled',
        payoutConfigId: 'pc-default-instant-wheel',
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
