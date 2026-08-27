import type { GameType, PayoutStatus } from './payoutConfigs';

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

/** Betty-owned GameConfigs for the four-game visual demo. */
export const GAME_CONFIGS: GameConfig[] = [
  {
    id: 'gc-mystery-box-default',
    code: 'MYSTERY_BOX_DEFAULT',
    gameType: 'MysteryBox',
    status: 'Enabled',
    targetingRules: [
      {
        id: 'tr-mystery-box-vip',
        priority: 100,
        status: 'Enabled',
        payoutConfigId: 'pc-mystery-box-premium',
        condition: {
          operator: 'All',
          statements: [
            { field: 'Audience', operator: 'IsOneOf', values: [1001] },
            { field: 'RccSegment', operator: 'IsNoneOf', values: ['Toddler'] },
            {
              operator: 'Any',
              statements: [
                { field: 'LoyaltyStatus', operator: 'IsOneOf', values: ['Diamond', 'VIP'] },
                { field: 'RccSegment', operator: 'IsOneOf', values: ['Whale'] },
              ],
            },
          ],
        },
      },
      {
        id: 'tr-mystery-box-fallback',
        priority: 0,
        status: 'Enabled',
        payoutConfigId: 'pc-mystery-box-standard',
      },
    ],
  },
  {
    id: 'gc-mystery-box-promotion',
    code: 'MYSTERY_BOX_PROMOTION',
    gameType: 'MysteryBox',
    status: 'Disabled',
    targetingRules: [
      {
        id: 'tr-mystery-box-promotion-fallback',
        priority: 0,
        status: 'Enabled',
        payoutConfigId: 'pc-mystery-box-promotion',
      },
    ],
  },
  {
    id: 'gc-wheel-default',
    code: 'WHEEL_DEFAULT',
    gameType: 'Wheel',
    status: 'Enabled',
    targetingRules: [
      {
        id: 'tr-wheel-fallback',
        priority: 0,
        status: 'Enabled',
        payoutConfigId: 'pc-wheel-standard',
      },
    ],
  },
  {
    id: 'gc-scratcher-default',
    code: 'SCRATCHER_DEFAULT',
    gameType: 'Scratcher',
    status: 'Enabled',
    targetingRules: [
      {
        id: 'tr-scratcher-fallback',
        priority: 0,
        status: 'Enabled',
        payoutConfigId: 'pc-scratcher-standard',
      },
    ],
  },
  {
    id: 'gc-betty-wheel-of-wins-default',
    code: 'BETTY_WHEEL_OF_WINS_DEFAULT',
    gameType: 'BettyWheelOfWins',
    status: 'Enabled',
    targetingRules: [
      {
        id: 'tr-betty-wheel-of-wins-fallback',
        priority: 0,
        status: 'Enabled',
        payoutConfigId: 'pc-betty-wheel-of-wins-standard',
      },
    ],
  },
];

let gcIdSeq = 0;

export function newGcId(prefix: GcIdPrefix): string {
  gcIdSeq += 1;
  return `${prefix}-${Date.now().toString(36)}-${gcIdSeq}`;
}

export function getGameConfig(id: string): GameConfig | undefined {
  return GAME_CONFIGS.find((config) => config.id === id);
}

export function gameConfigNameIsUnique(code: string, gameType: GameType, excludeId?: string): boolean {
  const normalizedCode = code.trim().toLowerCase();
  return !GAME_CONFIGS.some(
    (config) =>
      config.id !== excludeId
      && config.gameType === gameType
      && config.code.trim().toLowerCase() === normalizedCode
  );
}

export interface GameConfigInput {
  code: string;
  gameType: GameType;
  targetingRules: TargetingRule[];
}

function stampRules(rules: TargetingRule[]): TargetingRule[] {
  return rules.map((rule) => ({ ...rule, id: rule.id || newGcId('tr') }));
}

/** New GameConfigs always start Disabled. */
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

/** Aggregate replacement. GameType stays immutable on Edit. */
export function updateGameConfig(id: string, input: GameConfigInput): GameConfig | undefined {
  const config = GAME_CONFIGS.find((candidate) => candidate.id === id);
  if (!config) return undefined;
  config.code = input.code.trim();
  config.targetingRules = stampRules(input.targetingRules);
  return config;
}
