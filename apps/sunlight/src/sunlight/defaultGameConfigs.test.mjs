import assert from 'node:assert/strict';
import test from 'node:test';
import { GAME_CONFIGS } from './gameConfigs.ts';
import { GAME_TYPES } from './payoutConfigs.ts';
import {
  DISABLED_GAME_CONFIG_WARNING,
  INITIAL_DEFAULT_GAME_CONFIGS,
  disabledGameConfigWarning,
  filterGameConfigsByGameType,
  isDefaultGameConfigChanged,
  replaceDefaultGameConfig,
} from './defaultGameConfigHelpers.ts';

test('the demo exposes exactly four valid Enabled default mappings', () => {
  assert.deepEqual(GAME_TYPES, ['MysteryBox', 'Wheel', 'Scratcher', 'BettyWheelOfWins']);
  assert.deepEqual(INITIAL_DEFAULT_GAME_CONFIGS, [
    { gameType: 'MysteryBox', gameConfigId: 'gc-mystery-box-default' },
    { gameType: 'Wheel', gameConfigId: 'gc-wheel-default' },
    { gameType: 'Scratcher', gameConfigId: 'gc-scratcher-default' },
    { gameType: 'BettyWheelOfWins', gameConfigId: 'gc-betty-wheel-of-wins-default' },
  ]);

  for (const mapping of INITIAL_DEFAULT_GAME_CONFIGS) {
    const config = GAME_CONFIGS.find((candidate) => candidate.id === mapping.gameConfigId);
    assert.ok(config, `${mapping.gameType} references a missing GameConfig`);
    assert.equal(config.gameType, mapping.gameType);
    assert.equal(config.status, 'Enabled');
  }
});

test('selectors offer only same-GameType GameConfigs', () => {
  const mysteryBoxConfigs = filterGameConfigsByGameType(GAME_CONFIGS, 'MysteryBox');
  assert.deepEqual(
    mysteryBoxConfigs.map((config) => `${config.code} — ${config.status}`),
    ['MYSTERY_BOX_DEFAULT — Enabled', 'MYSTERY_BOX_PROMOTION — Disabled']
  );
  assert.deepEqual(
    filterGameConfigsByGameType(GAME_CONFIGS, 'Wheel').map((config) => config.code),
    ['WHEEL_DEFAULT']
  );
  assert.deepEqual(
    filterGameConfigsByGameType(GAME_CONFIGS, 'Scratcher').map((config) => config.code),
    ['SCRATCHER_DEFAULT']
  );
  assert.deepEqual(
    filterGameConfigsByGameType(GAME_CONFIGS, 'BettyWheelOfWins').map((config) => config.code),
    ['BETTY_WHEEL_OF_WINS_DEFAULT']
  );
});

test('Save becomes available only after the MysteryBox selection changes', () => {
  assert.equal(isDefaultGameConfigChanged('gc-mystery-box-default', 'gc-mystery-box-default'), false);
  assert.equal(isDefaultGameConfigChanged('gc-mystery-box-default', 'gc-mystery-box-promotion'), true);
  assert.equal(isDefaultGameConfigChanged('gc-mystery-box-promotion', 'gc-mystery-box-default'), true);
  assert.equal(isDefaultGameConfigChanged('gc-mystery-box-default', ''), false);
});

test('PUT semantics replace and restore the single MysteryBox mapping', () => {
  const replaced = replaceDefaultGameConfig(INITIAL_DEFAULT_GAME_CONFIGS, {
    gameType: 'MysteryBox',
    gameConfigId: 'gc-mystery-box-promotion',
  });
  assert.equal(replaced.filter((mapping) => mapping.gameType === 'MysteryBox').length, 1);
  assert.equal(
    replaced.find((mapping) => mapping.gameType === 'MysteryBox').gameConfigId,
    'gc-mystery-box-promotion'
  );

  const restored = replaceDefaultGameConfig(replaced, {
    gameType: 'MysteryBox',
    gameConfigId: 'gc-mystery-box-default',
  });
  assert.equal(
    restored.find((mapping) => mapping.gameType === 'MysteryBox').gameConfigId,
    'gc-mystery-box-default'
  );
});

test('only the intentional promotion alternative exposes the Disabled warning', () => {
  const disabled = GAME_CONFIGS.find((config) => config.id === 'gc-mystery-box-promotion');
  const enabled = GAME_CONFIGS.find((config) => config.id === 'gc-mystery-box-default');
  assert.equal(disabledGameConfigWarning(disabled), DISABLED_GAME_CONFIG_WARNING);
  assert.equal(disabledGameConfigWarning(enabled), undefined);
});
