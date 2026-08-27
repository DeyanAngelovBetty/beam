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

function payoutSummary(config) {
  return {
    id: config.id,
    name: config.name,
    gameType: config.gameType,
    status: config.status,
    rows: getPayoutRows(config).map((row) => ({
      probability: Math.round(row.probability * 100),
      winMessage: row.winMessage,
      rewards: row.rewards.map(formatReward),
    })),
  };
}

test('shared game types and the five legacy PayoutConfigs remain unchanged', () => {
  assert.deepEqual(GAME_TYPES, ['MysteryBox', 'Wheel', 'Scratcher', 'BettyWheelOfWins']);
  assert.equal(gameTypeLabel('BettyWheelOfWins'), 'Betty Wheel of Wins');
  assert.equal(gameTypeLabel('Wheel'), 'Wheel');
  assert.deepEqual(
    PAYOUT_CONFIGS.filter((config) => config.gameType !== 'BettyWheelOfWins').map(payoutSummary),
    [
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
    ],
  );
});

test('Betty Wheel of Wins mock has two ordered collections and no public sector ids', () => {
  const config = PAYOUT_CONFIGS.find((candidate) => candidate.gameType === 'BettyWheelOfWins');
  assert.ok(config);
  assert.deepEqual(
    {
      id: config.id,
      name: config.name,
      gameType: config.gameType,
      status: config.status,
      payoutRows: config.payoutRows.map((row) => ({
        probability: row.probability,
        winMessage: row.winMessage,
        rewards: row.rewards.map(formatReward),
      })),
      multiplierRows: config.multiplierRows,
    },
    {
      id: 'pc-betty-wheel-of-wins-standard',
      name: 'Betty Wheel of Wins Standard Payout',
      gameType: 'BettyWheelOfWins',
      status: 'Enabled',
      payoutRows: [
        { probability: 0.6, winMessage: 'Small Win', rewards: ['10 Coins'] },
        { probability: 0.3, winMessage: 'Bonus Bundle', rewards: ['20 Coins', '2 Tokens'] },
        { probability: 0.1, winMessage: 'Wheel Jackpot', rewards: ['100 Coins', '10 Tokens'] },
      ],
      multiplierRows: [
        { probability: 0.6, multiplier: 1 },
        { probability: 0.3, multiplier: 1.5 },
        { probability: 0.1, multiplier: 3 },
      ],
    },
  );
  assert.ok(!('rows' in config));
  for (const row of [...config.payoutRows, ...config.multiplierRows]) {
    assert.ok(!('sectorId' in row));
  }
});

test('every payout collection totals 100 percent and every reward is a positive whole number', () => {
  for (const config of PAYOUT_CONFIGS) {
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
    '500 Coins, 10 Tokens',
  );
});
