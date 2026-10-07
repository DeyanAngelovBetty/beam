import type { GameConfig } from './gameConfigs';
import type { DefaultGameConfigMapping } from './defaultGameConfigs';
import type { GameType } from './payoutConfigs';

export const DISABLED_GAME_CONFIG_WARNING =
  'This GameConfig is currently disabled and cannot be used by the game engine.';

/** Only these Betty games expose default configuration management. */
export const DEFAULT_CONFIGURABLE_GAME_TYPES: GameType[] = ['BettyWheel', 'BettyScratcher', 'BettyWheelOfWins'];

export const INITIAL_DEFAULT_GAME_CONFIGS: DefaultGameConfigMapping[] = [
  { gameType: 'BettyWheel', gameConfigId: 'gc-betty-wheel-default' },
  { gameType: 'BettyScratcher', gameConfigId: 'gc-scratcher-default' },
  { gameType: 'BettyWheelOfWins', gameConfigId: 'gc-betty-wheel-of-wins-default' },
];

export function replaceDefaultGameConfig(
  mappings: DefaultGameConfigMapping[],
  next: DefaultGameConfigMapping
): DefaultGameConfigMapping[] {
  return [...mappings.filter((mapping) => mapping.gameType !== next.gameType), next];
}

export function isDefaultGameConfigChanged(savedId: string, selectedId: string): boolean {
  return selectedId !== '' && selectedId !== savedId;
}

export function disabledGameConfigWarning(config?: GameConfig): string | undefined {
  return config?.status === 'Disabled' ? DISABLED_GAME_CONFIG_WARNING : undefined;
}
