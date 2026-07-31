import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PAYOUT_CONFIGS,
  PRIZE_TYPE_LABEL,
  REWARD_TYPES,
  formatReward,
  formatRewards,
} from './payoutConfigs.ts';

test('reward types stay backend-aligned', () => {
  assert.deepEqual(REWARD_TYPES, ['Coins', 'Tokens']);
  assert.deepEqual(PRIZE_TYPE_LABEL, { Coins: 'Coins', Tokens: 'Tokens' });
  assert.deepEqual(
    [...new Set(PAYOUT_CONFIGS.flatMap((config) =>
      config.rows.flatMap((row) => row.rewards.map((reward) => reward.rewardType))
    ))].sort(),
    ['Coins', 'Tokens']
  );
});

test('reward amounts use readable whole-number formatting', () => {
  assert.equal(formatReward({ rewardType: 'Coins', amount: 1 }), '1 Coin');
  assert.equal(formatReward({ rewardType: 'Coins', amount: 3 }), '3 Coins');
  assert.equal(formatReward({ rewardType: 'Tokens', amount: 1 }), '1 Token');
  assert.equal(formatReward({ rewardType: 'Tokens', amount: 2 }), '2 Tokens');
  assert.equal(
    formatRewards([
      { rewardType: 'Coins', amount: 500 },
      { rewardType: 'Tokens', amount: 10 },
    ]),
    '500 Coins, 10 Tokens'
  );
  assert.equal(formatReward({ rewardType: 'Coins', amount: 1000 }), '1,000 Coins');
});

test('mock reward amounts are positive whole numbers', () => {
  for (const config of PAYOUT_CONFIGS) {
    for (const row of config.rows) {
      for (const reward of row.rewards) {
        assert.ok(Number.isInteger(reward.amount), `${config.id}/${row.id ?? row.winMessage}`);
        assert.ok(reward.amount > 0, `${config.id}/${row.id ?? row.winMessage}`);
      }
    }
  }
});
