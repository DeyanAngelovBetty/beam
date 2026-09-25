import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { createServer } from 'vite';
const vite = await createServer({ root: process.cwd(), appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } });
after(() => vite.close());
const { GAME_CONFIGS } = await vite.ssrLoadModule('/apps/sunlight/src/sunlight/gameConfigs.ts');
const { LEGACY_YODA_GAME_TYPES, META_GAME_PRESETS } = await vite.ssrLoadModule('/apps/sunlight/src/sunlight/metaGamePresets.ts');
const { GAME_TYPES } = await vite.ssrLoadModule('/apps/sunlight/src/sunlight/payoutConfigs.ts');
const {
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
} = await vite.ssrLoadModule('/apps/sunlight/src/sunlight/metaGamePresetHelpers.ts');

test('presets cover explicit, default and legacy configurations', () => {
  assert.equal(presetSource(META_GAME_PRESETS.find(preset => preset.id === 'preset-wheel-default-config')), 'Betty');
  assert.equal(presetSource(META_GAME_PRESETS.find(preset => preset.id === 'preset-legacy-wheel')), 'Yoda');
  const model = { ...emptyPresetModel(), displayName: 'Default Wheel', gameType: 'BettyWheel' };
  assert.equal(validatePresetModel(model, GAME_CONFIGS).valid, true);
  assert.equal(presetModelToInput(model, GAME_CONFIGS).gameConfigId, null);
});

test('each preset with an explicit GameConfig uses its game type', () => {
  for (const preset of META_GAME_PRESETS.filter(preset => preset.gameConfigId !== null)) {
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
  const preset = META_GAME_PRESETS.find((candidate) => candidate.id === 'preset-betty-wheel-promotion');
  const config = GAME_CONFIGS.find((candidate) => candidate.id === preset.gameConfigId);
  assert.equal(preset.status, 'Disabled');
  assert.equal(config.name, 'BETTY_WHEEL_PROMOTION');
  assert.equal(config.status, 'Disabled');
});

test('Yoda-compatible Create behavior uses canonical legacy types', () => {
  assert.ok(LEGACY_YODA_GAME_TYPES.includes('Wheel'));
  assert.ok(LEGACY_YODA_GAME_TYPES.includes('Scratcher'));
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
  assert.equal(gameTypeFromGameConfig(GAME_CONFIGS, 'gc-betty-wheel-default'), 'BettyWheel');
  assert.equal(gameTypeFromGameConfig(GAME_CONFIGS, 'gc-wheel-default'), 'BettyWheel');
  assert.equal(
    gameTypeFromGameConfig(GAME_CONFIGS, 'gc-betty-wheel-of-wins-default'),
    'BettyWheelOfWins'
  );

  const options = presetGameConfigOptions(
    GAME_CONFIGS,
    { source: 'Betty', gameType: 'BettyWheel' }
  );
  assert.deepEqual(options.map((config) => config.name), ['BETTY_WHEEL_DEFAULT', 'BETTY_WHEEL_PROMOTION', 'WHEEL_DEFAULT']);
  assert.ok(options.every((config) => config.gameType === 'BettyWheel'));

  const createOptions = presetGameConfigOptions(
    GAME_CONFIGS,
    { source: 'Betty', gameType: '' }
  );
  assert.ok(createOptions.some((config) => config.id === 'gc-betty-wheel-of-wins-default'));

  const wheelOfWinsOptions = presetGameConfigOptions(
    GAME_CONFIGS,
    { source: 'Betty', gameType: 'BettyWheelOfWins' }
  );
  assert.deepEqual(wheelOfWinsOptions.map((config) => config.id), ['gc-betty-wheel-of-wins-default']);
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
