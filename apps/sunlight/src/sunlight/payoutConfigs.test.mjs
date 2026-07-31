import assert from 'node:assert/strict';
import test from 'node:test';
import {
  GAME_TYPES,
  PAYOUT_CONFIGS,
  PRIZE_TYPE_LABEL,
  REWARD_TYPES,
  formatReward,
  formatRewards,
} from './payoutConfigs.ts';

function payoutSummary(config) {
  return {
    id: config.id,
    name: config.name,
    gameType: config.gameType,
    status: config.status,
    rows: config.rows.map((row) => ({
      probability: Math.round(row.probability * 100),
      winMessage: row.winMessage,
      rewards: row.rewards.map(formatReward),
    })),
  };
}

test('PayoutConfig demo contains exactly the final five records', () => {
  assert.deepEqual(GAME_TYPES, ['MysteryBox', 'Wheel', 'Scratcher']);
  assert.deepEqual(PAYOUT_CONFIGS.map(payoutSummary), [
    {
      id: 'pc-mystery-box-standard',
      name: 'Mystery Box Standard Payout',
      gameType: 'MysteryBox',
      status: 'Enabled',
      rows: [
        { probability: 55, winMessage: 'Small Prize', rewards: ['10 Coins'] },
        { probability: 30, winMessage: 'Medium Prize', rewards: ['25 Coins'] },
        { probability: 12, winMessage: 'Big Prize', rewards: ['100 Coins'] },
        { probability: 3, winMessage: 'Jackpot', rewards: ['500 Coins', '10 Tokens'] },
      ],
    },
    {
      id: 'pc-mystery-box-premium',
      name: 'Mystery Box Premium Payout',
      gameType: 'MysteryBox',
      status: 'Enabled',
      rows: [
        { probability: 50, winMessage: 'Premium Prize', rewards: ['100 Coins'] },
        { probability: 35, winMessage: 'Big Premium Prize', rewards: ['250 Coins'] },
        { probability: 15, winMessage: 'VIP Jackpot', rewards: ['1,000 Coins', '25 Tokens'] },
      ],
    },
    {
      id: 'pc-mystery-box-promotion',
      name: 'Mystery Box Promotion Payout',
      gameType: 'MysteryBox',
      status: 'Disabled',
      rows: [
        { probability: 60, winMessage: 'Promotion Prize', rewards: ['20 Coins'] },
        { probability: 30, winMessage: 'Big Promotion Prize', rewards: ['50 Coins'] },
        { probability: 10, winMessage: 'Promotion Jackpot', rewards: ['200 Coins', '5 Tokens'] },
      ],
    },
    {
      id: 'pc-wheel-standard',
      name: 'Wheel Standard Payout',
      gameType: 'Wheel',
      status: 'Enabled',
      rows: [
        { probability: 70, winMessage: 'Small Wheel Win', rewards: ['5 Coins'] },
        { probability: 25, winMessage: 'Big Wheel Win', rewards: ['25 Coins'] },
        { probability: 5, winMessage: 'Wheel Jackpot', rewards: ['100 Coins', '2 Tokens'] },
      ],
    },
    {
      id: 'pc-scratcher-standard',
      name: 'Scratcher Standard Payout',
      gameType: 'Scratcher',
      status: 'Enabled',
      rows: [
        { probability: 65, winMessage: 'Scratch Win', rewards: ['10 Coins'] },
        { probability: 30, winMessage: 'Big Scratch Win', rewards: ['50 Coins'] },
        { probability: 5, winMessage: 'Scratch Jackpot', rewards: ['250 Coins'] },
      ],
    },
  ]);
});

test('every payout totals exactly 100 percent and every row has valid rewards', () => {
  for (const config of PAYOUT_CONFIGS) {
    const percentageTotal = config.rows.reduce(
      (total, row) => total + Math.round(row.probability * 100),
      0
    );
    assert.equal(percentageTotal, 100, `${config.id} must total exactly 100%`);

    for (const row of config.rows) {
      assert.ok(row.probability > 0, `${config.id}/${row.winMessage} must be landable`);
      assert.ok(row.rewards.length > 0, `${config.id}/${row.winMessage} must contain rewards`);
      for (const reward of row.rewards) {
        assert.ok(REWARD_TYPES.includes(reward.rewardType));
        assert.ok(Number.isInteger(reward.amount));
        assert.ok(reward.amount > 0);
      }
    }
  }
});

test('every MysteryBox jackpot demonstrates multiple rewards', () => {
  const mysteryJackpots = PAYOUT_CONFIGS
    .filter((config) => config.gameType === 'MysteryBox')
    .flatMap((config) => config.rows.filter((row) => row.winMessage.includes('Jackpot')));
  assert.equal(mysteryJackpots.length, 3);
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
    '500 Coins, 10 Tokens'
  );
});
