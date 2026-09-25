import { PAYOUT_CONFIGS, type GameType, type PayoutStatus } from './payoutConfigs';

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
  name: string;
  gameType: GameType;
  status: PayoutStatus;
  targetingRules: TargetingRule[];
}

/** Betty-owned GameConfigs for the internal-game visual demo. */
export const GAME_CONFIGS: GameConfig[] = [
  {
    id: 'gc-betty-wheel-default',
    name: 'BETTY_WHEEL_DEFAULT',
    gameType: 'BettyWheel',
    status: 'Enabled',
    targetingRules: [
      {
        id: 'tr-betty-wheel-vip',
        priority: 100,
        status: 'Enabled',
        payoutConfigId: 'pc-betty-wheel-premium',
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
        id: 'tr-betty-wheel-fallback',
        priority: 0,
        status: 'Enabled',
        payoutConfigId: 'pc-betty-wheel-standard',
      },
    ],
  },
  {
    id: 'gc-betty-wheel-promotion',
    name: 'BETTY_WHEEL_PROMOTION',
    gameType: 'BettyWheel',
    status: 'Disabled',
    targetingRules: [
      {
        id: 'tr-betty-wheel-promotion-fallback',
        priority: 0,
        status: 'Enabled',
        payoutConfigId: 'pc-betty-wheel-promotion',
      },
    ],
  },
  {
    id: 'gc-wheel-default',
    name: 'WHEEL_DEFAULT',
    gameType: 'BettyWheel',
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
    name: 'SCRATCHER_DEFAULT',
    gameType: 'BettyScratcher',
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
    name: 'BETTY_WHEEL_OF_WINS_DEFAULT',
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
  {
    id: 'gc-mm-default', name: 'Multiplier Madness', gameType: 'BettyMultiplierMadness', status: 'Enabled',
    targetingRules: [{ id: 'tr-mm-fallback', priority: 0, status: 'Enabled', payoutConfigId: 'pc-mm-standard' }],
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

export function gameConfigNameIsUnique(name: string, gameType: GameType, excludeId?: string): boolean {
  const normalizedCode = name.trim().toLowerCase();
  return !GAME_CONFIGS.some(
    (config) =>
      config.id !== excludeId
      && config.gameType === gameType
      && config.name.trim().toLowerCase() === normalizedCode
  );
}

export interface GameConfigInput {
  name: string;
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
    name: input.name.trim(),
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
  config.name = input.name.trim();
  config.targetingRules = stampRules(input.targetingRules);
  return config;
}

/** Same enable/disable dependencies as the MetaGame status handlers. */
export function gameConfigEnableReason(config: GameConfig): string | undefined {
  return config.targetingRules.some(rule => rule.status === 'Enabled' &&
    PAYOUT_CONFIGS.find(payout => payout.id === rule.payoutConfigId)?.status !== 'Enabled')
    ? 'Enable the Payout Configs used by enabled targeting rules first.' : undefined;
}

export function payoutConfigDisableReason(payoutConfigId: string): string | undefined {
  return GAME_CONFIGS.some(config => config.status === 'Enabled' && config.targetingRules.some(rule =>
    rule.status === 'Enabled' && rule.payoutConfigId === payoutConfigId))
    ? 'Used by an enabled Game Config. Disable that config or update its targeting rules first.' : undefined;
}
