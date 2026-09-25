import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { createServer } from 'vite';
const vite = await createServer({ root: process.cwd(), appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } });
after(() => vite.close());
const { GAME_CONFIGS } = await vite.ssrLoadModule('/apps/sunlight/src/sunlight/gameConfigs.ts');
const { GAME_TYPES } = await vite.ssrLoadModule('/apps/sunlight/src/sunlight/payoutConfigs.ts');
const {
  DISABLED_GAME_CONFIG_WARNING,
  INITIAL_DEFAULT_GAME_CONFIGS,
  disabledGameConfigWarning,
  filterGameConfigsByGameType,
  isDefaultGameConfigChanged,
  replaceDefaultGameConfig,
} = await vite.ssrLoadModule('/apps/sunlight/src/sunlight/defaultGameConfigHelpers.ts');

test('the demo exposes exactly four valid Enabled default mappings', () => {
  assert.deepEqual(GAME_TYPES, ['BettyWheel', 'BettyScratcher', 'BettyWheelOfWins', 'BettyMultiplierMadness']);
  assert.deepEqual(INITIAL_DEFAULT_GAME_CONFIGS, [
    { gameType: 'BettyWheel', gameConfigId: 'gc-betty-wheel-default' },
    { gameType: 'BettyScratcher', gameConfigId: 'gc-scratcher-default' },
    { gameType: 'BettyWheelOfWins', gameConfigId: 'gc-betty-wheel-of-wins-default' },
    { gameType: 'BettyMultiplierMadness', gameConfigId: 'gc-mm-default' },
  ]);

  for (const mapping of INITIAL_DEFAULT_GAME_CONFIGS) {
    const config = GAME_CONFIGS.find((candidate) => candidate.id === mapping.gameConfigId);
    assert.ok(config, `${mapping.gameType} references a missing GameConfig`);
    assert.equal(config.gameType, mapping.gameType);
    assert.equal(config.status, 'Enabled');
  }
});

test('selectors offer only same-GameType GameConfigs', () => {
  const mysteryBoxConfigs = filterGameConfigsByGameType(GAME_CONFIGS, 'BettyWheel');
  assert.deepEqual(
    mysteryBoxConfigs.map((config) => `${config.name} — ${config.status}`),
    ['BETTY_WHEEL_DEFAULT — Enabled', 'BETTY_WHEEL_PROMOTION — Disabled', 'WHEEL_DEFAULT — Enabled']
  );
  assert.deepEqual(
    filterGameConfigsByGameType(GAME_CONFIGS, 'BettyWheel').map((config) => config.name),
    ['BETTY_WHEEL_DEFAULT', 'BETTY_WHEEL_PROMOTION', 'WHEEL_DEFAULT']
  );
  assert.deepEqual(
    filterGameConfigsByGameType(GAME_CONFIGS, 'BettyScratcher').map((config) => config.name),
    ['SCRATCHER_DEFAULT']
  );
  assert.deepEqual(
    filterGameConfigsByGameType(GAME_CONFIGS, 'BettyWheelOfWins').map((config) => config.name),
    ['BETTY_WHEEL_OF_WINS_DEFAULT']
  );
});

test('Save becomes available only after the BettyWheel selection changes', () => {
  assert.equal(isDefaultGameConfigChanged('gc-betty-wheel-default', 'gc-betty-wheel-default'), false);
  assert.equal(isDefaultGameConfigChanged('gc-betty-wheel-default', 'gc-betty-wheel-promotion'), true);
  assert.equal(isDefaultGameConfigChanged('gc-betty-wheel-promotion', 'gc-betty-wheel-default'), true);
  assert.equal(isDefaultGameConfigChanged('gc-betty-wheel-default', ''), false);
});

test('PUT semantics replace and restore the single BettyWheel mapping', () => {
  const replaced = replaceDefaultGameConfig(INITIAL_DEFAULT_GAME_CONFIGS, {
    gameType: 'BettyWheel',
    gameConfigId: 'gc-betty-wheel-promotion',
  });
  assert.equal(replaced.filter((mapping) => mapping.gameType === 'BettyWheel').length, 1);
  assert.equal(
    replaced.find((mapping) => mapping.gameType === 'BettyWheel').gameConfigId,
    'gc-betty-wheel-promotion'
  );

  const restored = replaceDefaultGameConfig(replaced, {
    gameType: 'BettyWheel',
    gameConfigId: 'gc-betty-wheel-default',
  });
  assert.equal(
    restored.find((mapping) => mapping.gameType === 'BettyWheel').gameConfigId,
    'gc-betty-wheel-default'
  );
});

test('only the intentional promotion alternative exposes the Disabled warning', () => {
  const disabled = GAME_CONFIGS.find((config) => config.id === 'gc-betty-wheel-promotion');
  const enabled = GAME_CONFIGS.find((config) => config.id === 'gc-betty-wheel-default');
  assert.equal(disabledGameConfigWarning(disabled), DISABLED_GAME_CONFIG_WARNING);
  assert.equal(disabledGameConfigWarning(enabled), undefined);
});
