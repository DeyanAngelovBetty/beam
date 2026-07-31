import type { GameConfig } from './gameConfigs';
import type { DefaultGameConfigMapping } from './defaultGameConfigs';
import type { GameType } from './payoutConfigs';

export const DISABLED_GAME_CONFIG_WARNING =
  'This GameConfig is currently disabled and cannot be used by the game engine.';

export function filterGameConfigsByGameType(configs: GameConfig[], gameType: GameType): GameConfig[] {
  return configs.filter((config) => config.gameType === gameType);
}

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
