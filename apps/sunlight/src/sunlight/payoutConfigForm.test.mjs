import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { createServer } from 'vite';

// The app uses bundler-style extensionless TypeScript imports. Load the module
// through the already-installed Vite runtime so this focused Node test exercises
// the same resolution path as Sunlight without adding a test dependency.
const vite = await createServer({
  root: process.cwd(),
  appType: 'custom',
  logLevel: 'silent',
  server: { middlewareMode: true },
});
const {
  clientKey,
  emptyModel,
  serializeModel,
  toDomainInput,
  toEditorModel,
  validateModel,
  withGameType,
} = await vite.ssrLoadModule('/apps/sunlight/src/sunlight/payoutConfigForm.ts');
const { PAYOUT_CONFIGS } = await vite.ssrLoadModule('/apps/sunlight/src/sunlight/payoutConfigs.ts');
after(() => vite.close());

const reward = (rewardType, amount) => ({ _key: clientKey(), rewardType, amount });
const payoutRow = (winMessage, probabilityPct, rewards) => ({
  _key: clientKey(),
  winMessage,
  probabilityPct,
  rewards,
});
const multiplierRow = (probabilityPct, multiplier) => ({
  _key: clientKey(),
  probabilityPct,
  multiplier,
});

const validModel = () => ({
  ...toEditorModel(PAYOUT_CONFIGS.find(config => config.gameType === 'BettyWheelOfWins')),
  name: 'Wheel of Wins Form Test',
});

test('game-type changes create and remove multiplier state instead of hiding it', () => {
  const wheelOfWins = withGameType(emptyModel(), 'BettyWheelOfWins');
  assert.equal(wheelOfWins.gameType, 'BettyWheelOfWins');
  assert.equal(wheelOfWins.multiplierRows.length, 1);

  const wheel = withGameType(wheelOfWins, 'BettyWheel');
  assert.equal(wheel.gameType, 'BettyWheel');
  assert.ok(!('multiplierRows' in wheel));
});

test('domain/form round-trips preserve standard and Wheel of Wins collection order', () => {
  const wheelOfWinsConfig = PAYOUT_CONFIGS.find((config) => config.gameType === 'BettyWheelOfWins');
  assert.ok(wheelOfWinsConfig);
  const wheelOfWinsModel = toEditorModel(wheelOfWinsConfig);
  assert.equal(validateModel(wheelOfWinsModel, wheelOfWinsConfig.id).valid, true);

  const wheelOfWinsInput = toDomainInput(wheelOfWinsModel);
  assert.deepEqual(
    wheelOfWinsInput.payoutRows.map((row) => row.winMessage),
    wheelOfWinsConfig.payoutRows.map((row) => row.winMessage),
  );
  assert.deepEqual(
    wheelOfWinsInput.multiplierRows.map((row) => row.multiplier),
    wheelOfWinsConfig.multiplierRows.map((row) => row.multiplier),
  );
  for (const row of [...wheelOfWinsInput.payoutRows, ...wheelOfWinsInput.multiplierRows]) {
    assert.ok(!('sectorId' in row));
  }

  const payoutReordered = {
    ...wheelOfWinsModel,
    payoutRows: [wheelOfWinsModel.payoutRows[1], wheelOfWinsModel.payoutRows[0], wheelOfWinsModel.payoutRows[2]],
  };
  const multiplierReordered = {
    ...wheelOfWinsModel,
    multiplierRows: [
      wheelOfWinsModel.multiplierRows[1],
      wheelOfWinsModel.multiplierRows[0],
      wheelOfWinsModel.multiplierRows[2],
    ],
  };
  assert.notEqual(serializeModel(payoutReordered), serializeModel(wheelOfWinsModel));
  assert.notEqual(serializeModel(multiplierReordered), serializeModel(wheelOfWinsModel));

  const wheelConfig = PAYOUT_CONFIGS.find((config) => config.id === 'pc-wheel-standard');
  assert.ok(wheelConfig);
  const wheelInput = toDomainInput(toEditorModel(wheelConfig));
  assert.equal(wheelInput.gameType, 'BettyWheel');
  assert.deepEqual(
    wheelInput.rows.map((row) => row.winMessage),
    wheelConfig.rows.map((row) => row.winMessage),
  );
});

test('payout and multiplier totals are validated independently', () => {
  const payoutUnder = validModel();
  payoutUnder.payoutRows[0].probabilityPct = '30';
  const payoutValidation = validateModel(payoutUnder);
  assert.equal(payoutValidation.valid, false);
  assert.match(payoutValidation.aggregate, /currently 90%/);
  assert.equal(payoutValidation.multiplier?.aggregate, undefined);

  const multiplierUnder = validModel();
  multiplierUnder.multiplierRows[0].probabilityPct = '40';
  const multiplierValidation = validateModel(multiplierUnder);
  assert.equal(multiplierValidation.valid, false);
  assert.equal(multiplierValidation.aggregate, undefined);
  assert.match(multiplierValidation.multiplier?.aggregate, /currently 90%/);

  const emptyWheelOfWins = validModel();
  emptyWheelOfWins.payoutRows = [];
  emptyWheelOfWins.multiplierRows = [];
  const emptyWheelOfWinsValidation = validateModel(emptyWheelOfWins);
  assert.equal(emptyWheelOfWinsValidation.aggregate, 'Add at least one payout sector.');
  assert.equal(emptyWheelOfWinsValidation.multiplier?.aggregate, 'Add at least one multiplier sector.');

  const wheelConfig = PAYOUT_CONFIGS.find((config) => config.id === 'pc-wheel-standard');
  assert.ok(wheelConfig);
  const emptyWheel = { ...toEditorModel(wheelConfig), payoutRows: [] };
  assert.equal(validateModel(emptyWheel, wheelConfig.id).aggregate, 'Add at least one payout row.');
});

test('fractional products are allowed, matching the backend amount conversion', () => {
  const model = validModel();
  model.payoutRows[0].rewards[0].amount = '5';
  model.multiplierRows[0].multiplier = '1.5';
  assert.equal(validateModel(model).valid, true);
});

test('reward amounts remain positive whole numbers and multipliers must be positive', () => {
  const fractionalReward = validModel();
  fractionalReward.payoutRows[0].rewards[0].amount = '1.5';
  assert.equal(validateModel(fractionalReward).rows[0].rewards[0].amount, 'Whole number ≥ 1.');

  for (const multiplier of ['0', '-1']) {
    const invalidMultiplier = validModel();
    invalidMultiplier.multiplierRows[0].multiplier = multiplier;
    assert.equal(
      validateModel(invalidMultiplier).multiplier?.rows[0].multiplier,
      'Must be greater than 0.',
    );
  }
});

test('MM uses RTP only and validates the percentage boundaries', () => {
  const mm = PAYOUT_CONFIGS.find(config => config.gameType === 'BettyMultiplierMadness');
  assert.deepEqual(toDomainInput(toEditorModel(mm)), { name: mm.name, gameType: mm.gameType, rtp: 0.97 });
  for (const rtpPct of ['', '0', '-1', '101']) assert.equal(validateModel({ ...toEditorModel(mm), name: 'New MM', rtpPct }).valid, false);
  for (const rtpPct of ['0.1', '97', '100']) assert.equal(validateModel({ ...toEditorModel(mm), name: 'New MM', rtpPct }).valid, true);
  assert.equal('rtpPct' in withGameType(toEditorModel(mm), 'BettyWheel'), false);
});

test('sector counts, top prize and reward digits match MetaGame configuration rules', () => {
  for (const config of PAYOUT_CONFIGS) assert.equal(validateModel(toEditorModel(config), config.id).valid, true, config.id);
  const wheel = { ...toEditorModel(PAYOUT_CONFIGS.find(config => config.gameType === 'BettyWheel')), name: 'New Wheel' };
  wheel.payoutRows.pop();
  assert.match(validateModel(wheel).configuration, /6–16/);
  const scratcher = { ...toEditorModel(PAYOUT_CONFIGS.find(config => config.gameType === 'BettyScratcher')), name: 'New Scratcher' };
  scratcher.payoutRows.forEach(row => row.isTopPrize = false);
  assert.match(validateModel(scratcher).configuration, /exactly one/);
  scratcher.payoutRows[0].isTopPrize = true;
  scratcher.payoutRows[0].rewards[0].amount = '1234';
  assert.match(validateModel(scratcher).rows[0].rewards[0].amount, /first 3 digits/);
  scratcher.payoutRows[0].rewards[0].amount = '1230';
  assert.equal(validateModel(scratcher).valid, true);
  assert.equal(toDomainInput(scratcher).rows[0].isTopPrize, true);
});
