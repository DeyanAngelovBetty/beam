import assert from 'node:assert/strict';
import test from 'node:test';
import { GAME_CONFIGS } from './gameConfigs.ts';
import { META_GAME_PRESETS } from './metaGamePresets.ts';
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

test('Configuration Source is derived only from GameConfigId', () => {
  assert.equal(presetSource({ gameConfigId: 'gc-wheel-global' }), 'Betty');
  assert.equal(presetSource({ gameConfigId: null }), 'Yoda');
});

test('source-specific fields serialize without leaking the other source', () => {
  const betty = {
    ...emptyPresetModel(),
    displayName: 'Betty Wheel',
    gameConfigId: 'gc-wheel-global',
    gameType: 'Wheel',
    configCode: 'MUST_NOT_BE_SENT',
  };
  assert.equal(validatePresetModel(betty, GAME_CONFIGS).valid, true);
  assert.deepEqual(
    { gameConfigId: presetModelToInput(betty, GAME_CONFIGS).gameConfigId, configCode: presetModelToInput(betty, GAME_CONFIGS).configCode },
    { gameConfigId: 'gc-wheel-global', configCode: null }
  );

  const yoda = {
    ...emptyPresetModel(),
    source: 'Yoda',
    displayName: 'Yoda Scratcher',
    gameType: 'Scratcher',
    configCode: 'SCRATCHER_CLASSIC',
  };
  assert.equal(validatePresetModel(yoda, GAME_CONFIGS).valid, true);
  assert.deepEqual(
    { gameConfigId: presetModelToInput(yoda, GAME_CONFIGS).gameConfigId, configCode: presetModelToInput(yoda, GAME_CONFIGS).configCode },
    { gameConfigId: null, configCode: 'SCRATCHER_CLASSIC' }
  );
});

test('Betty GameType is derived from the selected GameConfig', () => {
  assert.equal(gameTypeFromGameConfig(GAME_CONFIGS, 'gc-wheel-global'), 'Wheel');
  assert.equal(gameTypeFromGameConfig(GAME_CONFIGS, 'gc-instant-wheel-test'), 'InstantWheel');
});

test('Betty Edit options stay within the existing GameType', () => {
  const options = presetGameConfigOptions(
    GAME_CONFIGS,
    { source: 'Betty', gameType: 'Wheel' },
    true
  );
  assert.deepEqual(options.map((config) => config.code), ['WHEEL_GLOBAL', 'WHEEL_PROMOTION']);
  assert.ok(options.every((config) => config.gameType === 'Wheel'));
});

test('Configuration Source is read-only only on Edit', () => {
  assert.equal(canChangePresetSource(false), true);
  assert.equal(canChangePresetSource(true), false);
});

test('status actions alternate between Enable and Disable', () => {
  assert.equal(nextPresetStatusAction('Enabled'), 'Disable');
  assert.equal(nextPresetStatusAction('Disabled'), 'Enable');
});

test('confirmed delete removes only the targeted preset', () => {
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

test('All and Store remain mutually exclusive', () => {
  assert.deepEqual(normalizePresetUseCases([], ['All']), ['All']);
  assert.deepEqual(normalizePresetUseCases(['All'], ['All', 'Store']), ['Store']);
  assert.deepEqual(normalizePresetUseCases(['Store'], ['Store', 'All']), ['All']);
  assert.deepEqual(normalizePresetUseCases([], ['All', 'Store']), ['All']);
});

test('mock UseCases are normalized', () => {
  assert.ok(META_GAME_PRESETS.every((preset) => !(preset.useCases.includes('All') && preset.useCases.includes('Store'))));
  assert.deepEqual(
    META_GAME_PRESETS.find((preset) => preset.id === 'preset-yoda-scratcher').useCases,
    ['All']
  );
});

test('empty ImageUrl uses the neutral placeholder', () => {
  assert.ok(META_GAME_PRESETS.every((preset) => preset.imageUrl === null));
  assert.equal(presetImagePreviewMode(null), 'placeholder');
  assert.equal(presetImagePreviewMode(''), 'placeholder');
});

test('valid ImageUrl uses an image preview and falls back after a load error', () => {
  assert.equal(presetImagePreviewMode('https://example.test/game.png'), 'image');
  assert.equal(presetImagePreviewMode('https://example.test/game.png', true), 'placeholder');
});
