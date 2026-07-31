import assert from 'node:assert/strict';
import test from 'node:test';
import { GAME_CONFIGS } from './gameConfigs.ts';
import {
  DISABLED_GAME_CONFIG_WARNING,
  disabledGameConfigWarning,
  filterGameConfigsByGameType,
  isDefaultGameConfigChanged,
  replaceDefaultGameConfig,
} from './defaultGameConfigHelpers.ts';

test('GameConfig options are limited to the same GameType', () => {
  const wheelConfigs = filterGameConfigsByGameType(GAME_CONFIGS, 'Wheel');
  assert.ok(wheelConfigs.every((config) => config.gameType === 'Wheel'));
  assert.deepEqual(wheelConfigs.map((config) => config.id), ['gc-wheel-global', 'gc-wheel-promotion']);
});

test('Save becomes available only after a configured selection changes', () => {
  assert.equal(isDefaultGameConfigChanged('gc-wheel-global', 'gc-wheel-global'), false);
  assert.equal(isDefaultGameConfigChanged('gc-wheel-global', 'gc-wheel-promotion'), true);
  assert.equal(isDefaultGameConfigChanged('gc-wheel-promotion', 'gc-wheel-global'), true);
  assert.equal(isDefaultGameConfigChanged('gc-wheel-global', ''), false);
  assert.equal(isDefaultGameConfigChanged('', 'gc-instant-wheel-test'), true);
});

test('PUT semantics replace the single mapping for a GameType', () => {
  const mappings = [
    { gameType: 'Wheel', gameConfigId: 'gc-wheel-global' },
    { gameType: 'InstantWheel', gameConfigId: 'gc-instant-wheel-test' },
  ];
  const replaced = replaceDefaultGameConfig(mappings, {
    gameType: 'Wheel',
    gameConfigId: 'gc-wheel-promotion',
  });

  assert.equal(replaced.filter((mapping) => mapping.gameType === 'Wheel').length, 1);
  assert.equal(replaced.find((mapping) => mapping.gameType === 'Wheel').gameConfigId, 'gc-wheel-promotion');

  const restored = replaceDefaultGameConfig(replaced, {
    gameType: 'Wheel',
    gameConfigId: 'gc-wheel-global',
  });
  assert.equal(restored.filter((mapping) => mapping.gameType === 'Wheel').length, 1);
  assert.equal(restored.find((mapping) => mapping.gameType === 'Wheel').gameConfigId, 'gc-wheel-global');
});

test('Disabled selections expose the game-engine warning', () => {
  const disabled = GAME_CONFIGS.find((config) => config.id === 'gc-wheel-promotion');
  const enabled = GAME_CONFIGS.find((config) => config.id === 'gc-wheel-global');
  assert.equal(disabledGameConfigWarning(disabled), DISABLED_GAME_CONFIG_WARNING);
  assert.equal(disabledGameConfigWarning(enabled), undefined);
});
