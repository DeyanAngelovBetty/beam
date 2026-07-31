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
    id: 'preset-wheel-summer',
    gameConfigId: 'gc-wheel-global',
    name: 'Wheel',
    displayName: 'Summer Rewards Wheel',
    configCode: null,
    skinId: 'summer-gold',
    imageUrl: null,
    volatility: 'Medium',
    useCases: ['All'],
    expiryHours: 24,
    status: 'Enabled',
  },
  {
    id: 'preset-instant-test',
    gameConfigId: 'gc-instant-wheel-test',
    name: 'InstantWheel',
    displayName: 'Instant Wheel Test',
    configCode: null,
    skinId: 'internal-preview',
    imageUrl: null,
    volatility: 'High',
    useCases: ['Store'],
    expiryHours: 6,
    status: 'Disabled',
  },
  {
    id: 'preset-yoda-scratcher',
    gameConfigId: null,
    name: 'Scratcher',
    displayName: 'Classic Scratcher',
    configCode: 'SCRATCHER_CLASSIC',
    skinId: 'classic-blue',
    imageUrl: null,
    volatility: 'Low',
    useCases: ['All'],
    expiryHours: null,
    status: 'Enabled',
  },
  {
    id: 'preset-yoda-daily-gift',
    gameConfigId: null,
    name: 'DailyGift',
    displayName: 'Daily Gift Preview',
    configCode: 'DAILY_GIFT_STANDARD',
    skinId: null,
    imageUrl: null,
    volatility: null,
    useCases: ['Store'],
    expiryHours: 48,
    status: 'Disabled',
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
