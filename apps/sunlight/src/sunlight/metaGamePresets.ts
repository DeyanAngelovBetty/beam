import type { GameType, PayoutStatus } from './payoutConfigs';

export type PresetVolatility = 'Low' | 'Medium' | 'High';
export type PresetUseCase = 'All' | 'Store';

export interface MetaGamePreset {
  id: string;
  gameConfigId: string | null;
  name: GameType;
  displayName: string;
  configCode: string | null;
  skinId: string | null;
  imageUrl: string | null;
  volatility: PresetVolatility | null;
  useCases: PresetUseCase[];
  expiryHours: number | null;
  status: PayoutStatus;
}

export type MetaGamePresetInput = Omit<MetaGamePreset, 'id' | 'status'>;

export const PRESET_VOLATILITIES: PresetVolatility[] = ['Low', 'Medium', 'High'];
export const PRESET_USE_CASES: PresetUseCase[] = ['All', 'Store'];

export const META_GAME_PRESETS: MetaGamePreset[] = [
  {
    id: 'preset-mystery-box-daily-reward',
    gameConfigId: 'gc-mystery-box-default',
    name: 'MysteryBox',
    displayName: 'Mystery Box',
    configCode: null,
    skinId: 'mystery-box-default',
    imageUrl: null,
    volatility: 'Medium',
    useCases: ['All'],
    expiryHours: 24,
    status: 'Enabled',
  },
  {
    id: 'preset-mystery-box-promotion',
    gameConfigId: 'gc-mystery-box-promotion',
    name: 'MysteryBox',
    displayName: 'Mystery Box Promotion',
    configCode: null,
    skinId: 'mystery-box-promotion',
    imageUrl: null,
    volatility: 'High',
    useCases: ['Store'],
    expiryHours: 48,
    status: 'Disabled',
  },
  {
    id: 'preset-weekly-wheel',
    gameConfigId: 'gc-wheel-default',
    name: 'Wheel',
    displayName: 'Weekly Wheel',
    configCode: null,
    skinId: 'wheel-default',
    imageUrl: null,
    volatility: 'Medium',
    useCases: ['All'],
    expiryHours: 168,
    status: 'Enabled',
  },
  {
    id: 'preset-daily-scratcher',
    gameConfigId: 'gc-scratcher-default',
    name: 'Scratcher',
    displayName: 'Daily Scratcher',
    configCode: null,
    skinId: 'scratcher-default',
    imageUrl: null,
    volatility: 'Low',
    useCases: ['All'],
    expiryHours: 24,
    status: 'Enabled',
  },
];

let presetSequence = 0;

export function getMetaGamePreset(id: string): MetaGamePreset | undefined {
  return META_GAME_PRESETS.find((preset) => preset.id === id);
}

export function createMetaGamePreset(input: MetaGamePresetInput): MetaGamePreset {
  presetSequence += 1;
  const preset: MetaGamePreset = {
    ...input,
    id: `preset-${Date.now().toString(36)}-${presetSequence}`,
    status: 'Disabled',
  };
  META_GAME_PRESETS.push(preset);
  return preset;
}

export function updateMetaGamePreset(id: string, input: MetaGamePresetInput): MetaGamePreset | undefined {
  const index = META_GAME_PRESETS.findIndex((preset) => preset.id === id);
  if (index < 0) return undefined;
  META_GAME_PRESETS[index] = { ...META_GAME_PRESETS[index], ...input, id, status: META_GAME_PRESETS[index].status };
  return META_GAME_PRESETS[index];
}

export function updateMetaGamePresetStatus(id: string, status: PayoutStatus): boolean {
  const preset = getMetaGamePreset(id);
  if (!preset) return false;
  preset.status = status;
  return true;
}

export function deleteMetaGamePreset(id: string): boolean {
  const index = META_GAME_PRESETS.findIndex((preset) => preset.id === id);
  if (index < 0) return false;
  META_GAME_PRESETS.splice(index, 1);
  return true;
}
