import type { GameType } from './payoutConfigs';
import { replaceDefaultGameConfig } from './defaultGameConfigHelpers';

export interface DefaultGameConfigMapping {
  gameType: GameType;
  gameConfigId: string;
}

/** Visual mock for GET /defaultGameConfigs. One mapping at most per GameType. */
export let DEFAULT_GAME_CONFIGS: DefaultGameConfigMapping[] = [
  { gameType: 'InstantWheel', gameConfigId: 'gc-instant-wheel-test' },
  { gameType: 'Wheel', gameConfigId: 'gc-wheel-global' },
];

export function getDefaultGameConfigs(): DefaultGameConfigMapping[] {
  return DEFAULT_GAME_CONFIGS.map((mapping) => ({ ...mapping }));
}

/** Visual mock for GET /defaultGameConfigs/{gameType}. */
export function getDefaultGameConfig(gameType: GameType): DefaultGameConfigMapping | undefined {
  const mapping = DEFAULT_GAME_CONFIGS.find((candidate) => candidate.gameType === gameType);
  return mapping ? { ...mapping } : undefined;
}

/** Visual mock for PUT /defaultGameConfigs/{gameType}, body { gameConfigId }. */
export function putDefaultGameConfig(gameType: GameType, gameConfigId: string): DefaultGameConfigMapping {
  const next = { gameType, gameConfigId };
  DEFAULT_GAME_CONFIGS = replaceDefaultGameConfig(DEFAULT_GAME_CONFIGS, next);
  return { ...next };
}
