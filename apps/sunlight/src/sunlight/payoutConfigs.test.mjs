import assert from 'node:assert/strict';
import test from 'node:test';
import {
  GAME_TYPES,
  PAYOUT_CONFIGS,
  PRIZE_TYPE_LABEL,
  REWARD_TYPES,
  formatReward,
  formatRewards,
  gameTypeLabel,
  getPayoutRows,
} from './payoutConfigs.ts';

test('the payout catalog covers the four internal game types and RTP-only MM', () => {
  assert.deepEqual(GAME_TYPES, ['BettyWheel', 'BettyScratcher', 'BettyWheelOfWins', 'BettyMultiplierMadness']);
  for (const type of GAME_TYPES) assert.ok(PAYOUT_CONFIGS.some(config => config.gameType === type));
  const mm = PAYOUT_CONFIGS.find(config => config.gameType === 'BettyMultiplierMadness');
  assert.equal(mm.rtp, 0.97);
  assert.deepEqual(getPayoutRows(mm), []);
  assert.equal(gameTypeLabel('BettyMultiplierMadness'), 'Betty Multiplier Madness');
});

test('every payout collection totals 100 percent and every reward is a positive whole number', () => {
  for (const config of PAYOUT_CONFIGS.filter(config => config.gameType !== 'BettyMultiplierMadness')) {
    const payoutRows = getPayoutRows(config);
    const payoutTotal = payoutRows.reduce((total, row) => total + row.probability, 0);
    assert.ok(Math.abs(payoutTotal - 1) < 1e-9, `${config.id} payout rows must total exactly 100%`);

    for (const row of payoutRows) {
      assert.ok(
        row.probability >= 0 && row.probability <= 1,
        `${config.id}/${row.winMessage} must have a valid probability`,
      );
      assert.ok(row.rewards.length > 0, `${config.id}/${row.winMessage} must contain rewards`);
      for (const reward of row.rewards) {
        assert.ok(REWARD_TYPES.includes(reward.rewardType));
        assert.ok(Number.isInteger(reward.amount));
        assert.ok(reward.amount > 0);
      }
    }

    if (config.gameType === 'BettyWheelOfWins') {
      const multiplierTotal = config.multiplierRows.reduce((total, row) => total + row.probability, 0);
      assert.ok(Math.abs(multiplierTotal - 1) < 1e-9, `${config.id} multiplier rows must total exactly 100%`);
      for (const multiplierRow of config.multiplierRows) {
        assert.ok(multiplierRow.probability >= 0 && multiplierRow.probability <= 1);
        assert.ok(multiplierRow.multiplier > 0);
        if (multiplierRow.probability === 0) continue;
        for (const payoutRow of payoutRows) {
          if (payoutRow.probability === 0) continue;
          for (const reward of payoutRow.rewards) {
            const result = reward.amount * multiplierRow.multiplier;
            assert.ok(result > 0 && Number.isInteger(result));
          }
        }
      }
    }
  }
});

test('every BettyWheel jackpot demonstrates multiple rewards', () => {
  const mysteryJackpots = PAYOUT_CONFIGS
    .filter((config) => config.gameType === 'BettyWheel')
    .flatMap((config) => config.rows.filter((row) => row.winMessage.includes('Jackpot')));
  assert.equal(mysteryJackpots.length, 4);
  assert.ok(mysteryJackpots.every((row) => row.rewards.length > 1));
});

test('reward terminology and readable formatting remain backend-aligned', () => {
  assert.deepEqual(REWARD_TYPES, ['Coins', 'Tokens']);
  assert.deepEqual(PRIZE_TYPE_LABEL, { Coins: 'Coins', Tokens: 'Tokens' });
  assert.equal(formatReward({ rewardType: 'Coins', amount: 1 }), '1 Coin');
  assert.equal(formatReward({ rewardType: 'Tokens', amount: 2 }), '2 Tokens');
  assert.equal(
    formatRewards([
      { rewardType: 'Coins', amount: 500 },
      { rewardType: 'Tokens', amount: 10 },
    ]),
    '500 Coins, 10 Tokens',
  );
});
