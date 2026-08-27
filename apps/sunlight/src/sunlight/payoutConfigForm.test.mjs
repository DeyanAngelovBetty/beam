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
  name: 'Wheel of Wins Form Test',
  gameType: 'BettyWheelOfWins',
  payoutRows: [
    payoutRow('Small', '60', [reward('Coins', '10')]),
    payoutRow('Bundle', '30', [reward('Coins', '20'), reward('Tokens', '2')]),
    payoutRow('Jackpot', '10', [reward('Coins', '100')]),
  ],
  multiplierRows: [
    multiplierRow('60', '1'),
    multiplierRow('30', '1.5'),
    multiplierRow('10', '3'),
  ],
});

test('game-type changes create and remove multiplier state instead of hiding it', () => {
  const wheelOfWins = withGameType(emptyModel(), 'BettyWheelOfWins');
  assert.equal(wheelOfWins.gameType, 'BettyWheelOfWins');
  assert.equal(wheelOfWins.multiplierRows.length, 1);

  const wheel = withGameType(wheelOfWins, 'Wheel');
  assert.equal(wheel.gameType, 'Wheel');
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
  assert.equal(wheelInput.gameType, 'Wheel');
  assert.deepEqual(
    wheelInput.rows.map((row) => row.winMessage),
    wheelConfig.rows.map((row) => row.winMessage),
  );
});

test('payout and multiplier totals are validated independently', () => {
  const payoutUnder = validModel();
  payoutUnder.payoutRows[0].probabilityPct = '50';
  const payoutValidation = validateModel(payoutUnder);
  assert.equal(payoutValidation.valid, false);
  assert.match(payoutValidation.aggregate, /currently 90%/);
  assert.equal(payoutValidation.multiplier?.aggregate, undefined);

  const multiplierUnder = validModel();
  multiplierUnder.multiplierRows[0].probabilityPct = '50';
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

test('fractional products fail only when both rows are selectable', () => {
  const invalid = validModel();
  invalid.payoutRows = [payoutRow('Odd', '100', [reward('Coins', '5')])];
  invalid.multiplierRows = [multiplierRow('100', '1.5')];
  assert.match(validateModel(invalid).multiplier?.multiplication, /5 Coins.*1\.5.*7\.5/);

  const zeroPayout = validModel();
  zeroPayout.payoutRows = [
    payoutRow('Display only', '0', [reward('Coins', '5')]),
    payoutRow('Selectable', '100', [reward('Coins', '10')]),
  ];
  zeroPayout.multiplierRows = [multiplierRow('100', '1.5')];
  assert.equal(validateModel(zeroPayout).valid, true);

  const zeroMultiplier = validModel();
  zeroMultiplier.payoutRows = [payoutRow('Odd', '100', [reward('Coins', '5')])];
  zeroMultiplier.multiplierRows = [multiplierRow('100', '1'), multiplierRow('0', '1.5')];
  assert.equal(validateModel(zeroMultiplier).valid, true);
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

test('near-integer products are rejected beyond floating-point representation error', () => {
  const model = validModel();
  model.payoutRows = [payoutRow('Almost whole', '100', [reward('Coins', '1')])];
  model.multiplierRows = [multiplierRow('100', '1.0000005')];

  assert.match(validateModel(model).multiplier?.multiplication, /1\.0000005/);

  const representationArtifact = validModel();
  representationArtifact.payoutRows = [payoutRow('Whole in decimal arithmetic', '100', [reward('Coins', '50')])];
  representationArtifact.multiplierRows = [multiplierRow('100', '0.58')];
  assert.equal(validateModel(representationArtifact).valid, true);
});

test('finite multipliers whose reward product overflows are rejected', () => {
  const model = validModel();
  model.payoutRows = [payoutRow('Overflow', '100', [reward('Coins', '2')])];
  model.multiplierRows = [multiplierRow('100', '1e308')];

  assert.match(validateModel(model).multiplier?.multiplication, /Infinity/);
});
