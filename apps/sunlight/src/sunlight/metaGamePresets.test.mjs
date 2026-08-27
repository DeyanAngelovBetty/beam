import assert from 'node:assert/strict';
import test from 'node:test';
import { GAME_CONFIGS } from './gameConfigs.ts';
import { LEGACY_YODA_GAME_TYPES, META_GAME_PRESETS } from './metaGamePresets.ts';
import { GAME_TYPES } from './payoutConfigs.ts';
import {
  canChangePresetSource,
  emptyPresetModel,
  gameTypeFromGameConfig,
  nextPresetStatusAction,
  normalizePresetUseCases,
  presetImagePreviewMode,
  presetGameConfigOptions,
  presetModelToInput,
  presetSource,
  removePresetAfterConfirmation,
  removePresetById,
  shouldShowPresetError,
  validatePresetModel,
} from './metaGamePresetHelpers.ts';

test('Preset demo contains exactly the final five Betty-owned records', () => {
  assert.deepEqual(
    META_GAME_PRESETS.map((preset) => ({
      id: preset.id,
      gameConfigId: preset.gameConfigId,
      gameType: preset.name,
      displayName: preset.displayName,
      configCode: preset.configCode,
      skinId: preset.skinId,
      useCases: preset.useCases,
      expiryHours: preset.expiryHours,
      status: preset.status,
    })),
    [
      {
        id: 'preset-mystery-box-daily-reward',
        gameConfigId: 'gc-mystery-box-default',
        gameType: 'MysteryBox',
        displayName: 'Mystery Box',
        configCode: null,
        skinId: 'mystery-box-default',
        useCases: ['All'],
        expiryHours: 24,
        status: 'Enabled',
      },
      {
        id: 'preset-mystery-box-promotion',
        gameConfigId: 'gc-mystery-box-promotion',
        gameType: 'MysteryBox',
        displayName: 'Mystery Box Promotion',
        configCode: null,
        skinId: 'mystery-box-promotion',
        useCases: ['Store'],
        expiryHours: 48,
        status: 'Disabled',
      },
      {
        id: 'preset-weekly-wheel',
        gameConfigId: 'gc-wheel-default',
        gameType: 'Wheel',
        displayName: 'Weekly Wheel',
        configCode: null,
        skinId: 'wheel-default',
        useCases: ['All'],
        expiryHours: 168,
        status: 'Enabled',
      },
      {
        id: 'preset-daily-scratcher',
        gameConfigId: 'gc-scratcher-default',
        gameType: 'Scratcher',
        displayName: 'Daily Scratcher',
        configCode: null,
        skinId: 'scratcher-default',
        useCases: ['All'],
        expiryHours: 24,
        status: 'Enabled',
      },
      {
        id: 'preset-betty-wheel-of-wins',
        gameConfigId: 'gc-betty-wheel-of-wins-default',
        gameType: 'BettyWheelOfWins',
        displayName: 'Betty Wheel of Wins',
        configCode: null,
        skinId: 'betty-wheel-of-wins-default',
        useCases: ['All'],
        expiryHours: 168,
        status: 'Enabled',
      },
    ]
  );

  assert.deepEqual(
    META_GAME_PRESETS.find((preset) => preset.id === 'preset-betty-wheel-of-wins'),
    {
      id: 'preset-betty-wheel-of-wins',
      gameConfigId: 'gc-betty-wheel-of-wins-default',
      name: 'BettyWheelOfWins',
      displayName: 'Betty Wheel of Wins',
      configCode: null,
      skinId: 'betty-wheel-of-wins-default',
      imageUrl: null,
      volatility: 'Medium',
      useCases: ['All'],
      expiryHours: 168,
      status: 'Enabled',
    }
  );
});

test('every initial Preset resolves to a same-GameType Betty GameConfig', () => {
  for (const preset of META_GAME_PRESETS) {
    assert.equal(presetSource(preset), 'Betty');
    assert.ok(preset.gameConfigId);
    assert.equal(preset.configCode, null);
    assert.ok(GAME_TYPES.includes(preset.name));

    const config = GAME_CONFIGS.find((candidate) => candidate.id === preset.gameConfigId);
    assert.ok(config, `${preset.id} references a missing GameConfig`);
    assert.equal(config.gameType, preset.name);
    if (preset.status === 'Enabled') assert.equal(config.status, 'Enabled');
  }
});

test('the Disabled promotion Preset intentionally uses the Disabled promotion GameConfig', () => {
  const preset = META_GAME_PRESETS.find((candidate) => candidate.id === 'preset-mystery-box-promotion');
  const config = GAME_CONFIGS.find((candidate) => candidate.id === preset.gameConfigId);
  assert.equal(preset.status, 'Disabled');
  assert.equal(config.code, 'MYSTERY_BOX_PROMOTION');
  assert.equal(config.status, 'Disabled');
});

test('Yoda-compatible Create behavior remains available without initial Yoda records', () => {
  assert.deepEqual(LEGACY_YODA_GAME_TYPES, ['MysteryBox', 'Wheel', 'Scratcher']);
  assert.equal(LEGACY_YODA_GAME_TYPES.includes('BettyWheelOfWins'), false);

  const yoda = {
    ...emptyPresetModel(),
    source: 'Yoda',
    displayName: 'Yoda Scratcher',
    gameType: 'Scratcher',
    configCode: 'SCRATCHER_CLASSIC',
  };
  assert.equal(validatePresetModel(yoda, GAME_CONFIGS).valid, true);
  assert.deepEqual(
    {
      gameConfigId: presetModelToInput(yoda, GAME_CONFIGS).gameConfigId,
      configCode: presetModelToInput(yoda, GAME_CONFIGS).configCode,
    },
    { gameConfigId: null, configCode: 'SCRATCHER_CLASSIC' }
  );
});

test('Betty GameType and Edit options derive from the selected GameConfig', () => {
  assert.equal(gameTypeFromGameConfig(GAME_CONFIGS, 'gc-mystery-box-default'), 'MysteryBox');
  assert.equal(gameTypeFromGameConfig(GAME_CONFIGS, 'gc-wheel-default'), 'Wheel');
  assert.equal(
    gameTypeFromGameConfig(GAME_CONFIGS, 'gc-betty-wheel-of-wins-default'),
    'BettyWheelOfWins'
  );

  const options = presetGameConfigOptions(
    GAME_CONFIGS,
    { source: 'Betty', gameType: 'MysteryBox' },
    true
  );
  assert.deepEqual(options.map((config) => config.code), ['MYSTERY_BOX_DEFAULT', 'MYSTERY_BOX_PROMOTION']);
  assert.ok(options.every((config) => config.gameType === 'MysteryBox'));

  const createOptions = presetGameConfigOptions(
    GAME_CONFIGS,
    { source: 'Betty', gameType: '' },
    false
  );
  assert.ok(createOptions.some((config) => config.id === 'gc-betty-wheel-of-wins-default'));

  const wheelOfWinsOptions = presetGameConfigOptions(
    GAME_CONFIGS,
    { source: 'Betty', gameType: 'BettyWheelOfWins' },
    true
  );
  assert.deepEqual(wheelOfWinsOptions.map((config) => config.id), ['gc-betty-wheel-of-wins-default']);
});

test('Configuration Source remains editable only on Create', () => {
  assert.equal(canChangePresetSource(false), true);
  assert.equal(canChangePresetSource(true), false);
});

test('status and delete interactions remain available', () => {
  assert.equal(nextPresetStatusAction('Enabled'), 'Disable');
  assert.equal(nextPresetStatusAction('Disabled'), 'Enable');

  const presets = [{ id: 'keep' }, { id: 'delete' }, { id: 'also-keep' }];
  assert.equal(removePresetAfterConfirmation(presets, 'delete', false), presets);
  assert.deepEqual(
    removePresetAfterConfirmation(presets, 'delete', true).map((preset) => preset.id),
    ['keep', 'also-keep']
  );
  assert.deepEqual(removePresetById(presets, 'delete').map((preset) => preset.id), ['keep', 'also-keep']);
});

test('initial validation errors stay hidden until touch or submit', () => {
  const validation = validatePresetModel(emptyPresetModel(), GAME_CONFIGS);
  assert.equal(validation.valid, false);
  assert.equal(shouldShowPresetError(false, false), false);
  assert.equal(shouldShowPresetError(true, false), true);
  assert.equal(shouldShowPresetError(false, true), true);
});

test('UseCases remain normalized for both controls and initial records', () => {
  assert.deepEqual(normalizePresetUseCases([], ['All']), ['All']);
  assert.deepEqual(normalizePresetUseCases(['All'], ['All', 'Store']), ['Store']);
  assert.deepEqual(normalizePresetUseCases(['Store'], ['Store', 'All']), ['All']);
  assert.ok(
    META_GAME_PRESETS.every(
      (preset) => !(preset.useCases.includes('All') && preset.useCases.includes('Store'))
    )
  );
});

test('image placeholder and valid preview behavior remain available', () => {
  assert.ok(META_GAME_PRESETS.every((preset) => preset.imageUrl === null));
  assert.equal(presetImagePreviewMode(null), 'placeholder');
  assert.equal(presetImagePreviewMode('https://example.test/game.png'), 'image');
  assert.equal(presetImagePreviewMode('https://example.test/game.png', true), 'placeholder');
});
