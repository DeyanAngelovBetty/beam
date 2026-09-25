import { GAME_CONFIGS } from './gameConfigs';
import { META_GAME_PRESETS, type MetaGamePreset } from './metaGamePresets';
import { GAME_TYPES, type GameType } from './payoutConfigs';

export type SourceGameType = Exclude<GameType, 'BettyMultiplierMadness'>;
export const CHAIN_SOURCE_TYPES = GAME_TYPES.filter((type): type is SourceGameType => type !== 'BettyMultiplierMadness');

export interface ChainedExperience {
  id: string;
  sourceGameType: SourceGameType;
  sourcePresetId: string | null;
  targetGameType: 'BettyMultiplierMadness';
  targetPresetId: string;
  startDate: string;
  endDate: string;
}
export type ChainedExperienceInput = Omit<ChainedExperience, 'id'>;

/** Local demo records only. Dates are UTC, with an inclusive start and exclusive end. */
export const CHAINED_EXPERIENCES: ChainedExperience[] = [
  {
    id: 'chain-wheel-default', sourceGameType: 'BettyWheel', sourcePresetId: null,
    targetGameType: 'BettyMultiplierMadness', targetPresetId: 'preset-mm-standard',
    startDate: '2026-09-01T00:00:00.000Z', endDate: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 'chain-scratcher', sourceGameType: 'BettyScratcher', sourcePresetId: 'preset-daily-scratcher',
    targetGameType: 'BettyMultiplierMadness', targetPresetId: 'preset-mm-standard',
    startDate: '2026-09-15T00:00:00.000Z', endDate: '2026-10-15T00:00:00.000Z',
  },
];

export function sourcePresetOptions(gameType: SourceGameType): MetaGamePreset[] {
  return META_GAME_PRESETS.filter(preset => preset.gameConfigId === null ||
    GAME_CONFIGS.some(config => config.id === preset.gameConfigId && config.gameType === gameType));
}

export function targetPresetOptions(): MetaGamePreset[] {
  return META_GAME_PRESETS.filter(preset =>
    GAME_CONFIGS.some(config => config.id === preset.gameConfigId && config.gameType === 'BettyMultiplierMadness'));
}

export function presetLabel(id: string | null): string {
  if (id === null) return 'Without preset (default configuration)';
  return META_GAME_PRESETS.find(preset => preset.id === id)?.displayName ?? `Preset ${id} (deleted)`;
}

export function validateChainedExperience(input: ChainedExperienceInput, excludeId?: string) {
  const errors: Partial<Record<keyof ChainedExperienceInput | 'period', string>> = {};
  if (!CHAIN_SOURCE_TYPES.includes(input.sourceGameType)) errors.sourceGameType = 'Choose a source game type.';
  if (input.sourcePresetId !== null && !sourcePresetOptions(input.sourceGameType).some(preset => preset.id === input.sourcePresetId)) {
    errors.sourcePresetId = 'Choose an existing preset with no GameConfig or a matching source GameConfig.';
  }
  if (input.targetGameType !== 'BettyMultiplierMadness' || !targetPresetOptions().some(preset => preset.id === input.targetPresetId)) {
    errors.targetPresetId = 'Choose a preset with a Multiplier Madness GameConfig.';
  }
  const start = Date.parse(input.startDate);
  const end = Date.parse(input.endDate);
  if (!Number.isFinite(start)) errors.startDate = 'Enter a start date and time.';
  if (!Number.isFinite(end)) errors.endDate = 'Enter an end date and time.';
  else if (end <= start) errors.endDate = 'End must be after start.';
  if (!errors.startDate && !errors.endDate && CHAINED_EXPERIENCES.some(existing =>
    existing.id !== excludeId && existing.sourceGameType === input.sourceGameType &&
    existing.sourcePresetId === input.sourcePresetId &&
    Date.parse(existing.startDate) < end && start < Date.parse(existing.endDate))) {
    errors.period = 'This period overlaps another experience for the same source game and preset.';
  }
  return errors;
}

export function saveChainedExperience(input: ChainedExperienceInput, id?: string): ChainedExperience {
  if (id) {
    const existing = CHAINED_EXPERIENCES.find(experience => experience.id === id)!;
    Object.assign(existing, input);
    return existing;
  }
  const experience = { ...input, id: `chain-${crypto.randomUUID()}` };
  CHAINED_EXPERIENCES.push(experience);
  return experience;
}

export function formatChainDate(value: string): string {
  return new Date(value).toLocaleString('en-GB', { timeZone: 'UTC', hour12: false });
}
