import type { GameConfig } from './gameConfigs';
import type { MetaGamePreset, MetaGamePresetInput, PresetUseCase, PresetVolatility } from './metaGamePresets';
import type { GameType, PayoutStatus } from './payoutConfigs';

export type PresetSource = 'Betty' | 'Yoda';

export interface PresetEditorModel {
  source: PresetSource;
  displayName: string;
  gameConfigId: string;
  gameType: GameType | '';
  configCode: string;
  skinId: string;
  imageUrl: string;
  volatility: PresetVolatility | '';
  useCases: PresetUseCase[];
  expiryHours: string;
}

export interface PresetValidation {
  displayName?: string;
  gameConfigId?: string;
  gameType?: string;
  configCode?: string;
  expiryHours?: string;
  valid: boolean;
}

export function presetSource(preset: Pick<MetaGamePreset, 'gameConfigId'>): PresetSource {
  return preset.gameConfigId === null ? 'Yoda' : 'Betty';
}

export function emptyPresetModel(): PresetEditorModel {
  return {
    source: 'Betty',
    displayName: '',
    gameConfigId: '',
    gameType: '',
    configCode: '',
    skinId: '',
    imageUrl: '',
    volatility: '',
    useCases: [],
    expiryHours: '',
  };
}

export function presetToEditorModel(preset: MetaGamePreset): PresetEditorModel {
  return {
    source: presetSource(preset),
    displayName: preset.displayName,
    gameConfigId: preset.gameConfigId ?? '',
    gameType: preset.name,
    configCode: preset.configCode ?? '',
    skinId: preset.skinId ?? '',
    imageUrl: preset.imageUrl ?? '',
    volatility: preset.volatility ?? '',
    useCases: normalizePresetUseCases([], preset.useCases),
    expiryHours: preset.expiryHours === null ? '' : String(preset.expiryHours),
  };
}

export function gameConfigForId(configs: GameConfig[], id: string): GameConfig | undefined {
  return configs.find((config) => config.id === id);
}

export function gameTypeFromGameConfig(configs: GameConfig[], id: string): GameType | '' {
  return gameConfigForId(configs, id)?.gameType ?? '';
}

export function presetGameConfigOptions(
  configs: GameConfig[],
  model: Pick<PresetEditorModel, 'source' | 'gameType'>,
  isEdit: boolean
): GameConfig[] {
  if (model.source !== 'Betty') return [];
  if (!isEdit || !model.gameType) return configs;
  return configs.filter((config) => config.gameType === model.gameType);
}

export function canChangePresetSource(isEdit: boolean): boolean {
  return !isEdit;
}

export function validatePresetModel(model: PresetEditorModel, configs: GameConfig[]): PresetValidation {
  const displayName = model.displayName.trim() ? undefined : 'Display Name is required.';
  let gameConfigId: string | undefined;
  let gameType: string | undefined;
  let configCode: string | undefined;

  if (model.source === 'Betty') {
    gameConfigId = gameConfigForId(configs, model.gameConfigId) ? undefined : 'GameConfig is required.';
  } else {
    gameType = model.gameType ? undefined : 'Game Type is required.';
    configCode = model.configCode.trim() ? undefined : 'Config Code is required.';
  }

  const expiryValue = model.expiryHours.trim();
  const expiryNumber = Number(expiryValue);
  const expiryHours =
    !expiryValue || (Number.isInteger(expiryNumber) && expiryNumber > 0)
      ? undefined
      : 'Expiry Hours must be a positive whole number.';

  return {
    displayName,
    gameConfigId,
    gameType,
    configCode,
    expiryHours,
    valid: !displayName && !gameConfigId && !gameType && !configCode && !expiryHours,
  };
}

export function presetModelToInput(model: PresetEditorModel, configs: GameConfig[]): MetaGamePresetInput {
  const gameType =
    model.source === 'Betty' ? gameTypeFromGameConfig(configs, model.gameConfigId) : model.gameType;
  if (!gameType) throw new Error('A valid GameType is required.');
  return {
    gameConfigId: model.source === 'Betty' ? model.gameConfigId : null,
    name: gameType,
    displayName: model.displayName.trim(),
    configCode: model.source === 'Yoda' ? model.configCode.trim() : null,
    skinId: model.skinId.trim() || null,
    imageUrl: model.imageUrl.trim() || null,
    volatility: model.volatility || null,
    useCases: normalizePresetUseCases([], model.useCases),
    expiryHours: model.expiryHours.trim() ? Number(model.expiryHours) : null,
  };
}

export function nextPresetStatusAction(status: PayoutStatus): 'Enable' | 'Disable' {
  return status === 'Enabled' ? 'Disable' : 'Enable';
}

export function removePresetById(presets: MetaGamePreset[], id: string): MetaGamePreset[] {
  return presets.filter((preset) => preset.id !== id);
}

export function removePresetAfterConfirmation(
  presets: MetaGamePreset[],
  id: string,
  confirmed: boolean
): MetaGamePreset[] {
  return confirmed ? removePresetById(presets, id) : presets;
}

export function shouldShowPresetError(touched: boolean, submitAttempted: boolean): boolean {
  return touched || submitAttempted;
}

export function isPreviewableImageUrl(value: string): boolean {
  const url = value.trim();
  return /^(https?:\/\/|data:image\/|blob:|\/|file:)/i.test(url);
}

export function presetImagePreviewMode(
  imageUrl: string | null | undefined,
  loadFailed = false
): 'image' | 'placeholder' {
  return imageUrl && isPreviewableImageUrl(imageUrl) && !loadFailed ? 'image' : 'placeholder';
}

export function normalizePresetUseCases(
  current: PresetUseCase[],
  next: PresetUseCase[]
): PresetUseCase[] {
  const newlySelected = next.find((useCase) => !current.includes(useCase));
  if (newlySelected === 'All') return ['All'];
  if (newlySelected === 'Store') return ['Store'];
  if (next.includes('All')) return ['All'];
  if (next.includes('Store')) return ['Store'];
  return [];
}
