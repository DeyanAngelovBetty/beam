import assert from 'node:assert/strict';
import test from 'node:test';
import { GAME_CONFIGS } from './gameConfigs.ts';
import { PAYOUT_CONFIGS } from './payoutConfigs.ts';

const GROUP_OPERATORS = new Set(['All', 'Any']);
const LEAF_OPERATORS = new Set(['IsOneOf', 'IsNoneOf']);
const CONDITION_FIELDS = new Set(['Audience', 'LoyaltyStatus', 'RccSegment']);

function assertCondition(condition) {
  if (GROUP_OPERATORS.has(condition.operator)) {
    assert.ok(Array.isArray(condition.statements));
    assert.ok(condition.statements.length > 0);
    condition.statements.forEach(assertCondition);
    return;
  }

  assert.ok(LEAF_OPERATORS.has(condition.operator), `Unexpected operator: ${condition.operator}`);
  assert.ok(CONDITION_FIELDS.has(condition.field), `Unexpected field: ${condition.field}`);
  assert.ok(Array.isArray(condition.values));
  assert.ok(condition.values.length > 0);
  if (condition.field === 'Audience') {
    assert.ok(condition.values.every(Number.isInteger), 'Audience values must be numeric IDs');
  }
}

test('GameConfig demo contains exactly the final four records', () => {
  assert.deepEqual(
    GAME_CONFIGS.map(({ id, code, gameType, status }) => ({ id, code, gameType, status })),
    [
      {
        id: 'gc-mystery-box-default',
        code: 'MYSTERY_BOX_DEFAULT',
        gameType: 'MysteryBox',
        status: 'Enabled',
      },
      {
        id: 'gc-mystery-box-promotion',
        code: 'MYSTERY_BOX_PROMOTION',
        gameType: 'MysteryBox',
        status: 'Disabled',
      },
      { id: 'gc-wheel-default', code: 'WHEEL_DEFAULT', gameType: 'Wheel', status: 'Enabled' },
      {
        id: 'gc-scratcher-default',
        code: 'SCRATCHER_DEFAULT',
        gameType: 'Scratcher',
        status: 'Enabled',
      },
    ]
  );
});

test('MysteryBox targeting rule matches the exact recursive condition', () => {
  const config = GAME_CONFIGS.find((candidate) => candidate.id === 'gc-mystery-box-default');
  const targetedRule = config.targetingRules[0];

  assert.deepEqual(
    {
      priority: targetedRule.priority,
      status: targetedRule.status,
      payoutConfigId: targetedRule.payoutConfigId,
      condition: targetedRule.condition,
    },
    {
      priority: 100,
      status: 'Enabled',
      payoutConfigId: 'pc-mystery-box-premium',
      condition: {
        operator: 'All',
        statements: [
          { field: 'Audience', operator: 'IsOneOf', values: [1001] },
          { field: 'RccSegment', operator: 'IsNoneOf', values: ['Toddler'] },
          {
            operator: 'Any',
            statements: [
              { field: 'LoyaltyStatus', operator: 'IsOneOf', values: ['Diamond', 'VIP'] },
              { field: 'RccSegment', operator: 'IsOneOf', values: ['Whale'] },
            ],
          },
        ],
      },
    }
  );
  assertCondition(targetedRule.condition);

  const fallback = config.targetingRules[1];
  assert.equal(fallback.payoutConfigId, 'pc-mystery-box-standard');
  assert.equal(fallback.priority, 0);
  assert.equal(fallback.condition, undefined);
});

test('all rules reference existing same-GameType PayoutConfigs', () => {
  for (const config of GAME_CONFIGS) {
    for (const rule of config.targetingRules) {
      const payoutConfig = PAYOUT_CONFIGS.find((candidate) => candidate.id === rule.payoutConfigId);
      assert.ok(payoutConfig, `${config.id}/${rule.id} references a missing PayoutConfig`);
      assert.equal(payoutConfig.gameType, config.gameType, `${config.id}/${rule.id} has the wrong GameType`);
      if (config.status === 'Enabled' && rule.status === 'Enabled') {
        assert.equal(payoutConfig.status, 'Enabled', `${config.id}/${rule.id} must use an Enabled PayoutConfig`);
      }
    }
  }
});

test('enabled priorities are unique and every fallback is enabled, last, and priority zero', () => {
  for (const config of GAME_CONFIGS) {
    const enabled = config.targetingRules.filter((rule) => rule.status === 'Enabled');
    const priorities = enabled.map((rule) => rule.priority);
    const fallbacks = enabled.filter((rule) => !rule.condition);

    assert.equal(new Set(priorities).size, priorities.length, `${config.id} priorities must be unique`);
    assert.ok(
      config.targetingRules.every(
        (rule, index) => index === 0 || config.targetingRules[index - 1].priority >= rule.priority
      ),
      `${config.id} rules must be descending`
    );
    assert.equal(fallbacks.length, 1, `${config.id} must have one enabled fallback`);
    assert.equal(fallbacks[0].priority, 0);
    assert.equal(config.targetingRules.at(-1), fallbacks[0]);
  }
});

test('Disabled MysteryBox promotion is isolated from Enabled configurations', () => {
  const config = GAME_CONFIGS.find((candidate) => candidate.id === 'gc-mystery-box-promotion');
  assert.equal(config.targetingRules.length, 1);
  assert.equal(config.targetingRules[0].status, 'Enabled');
  assert.equal(config.targetingRules[0].priority, 0);
  assert.equal(config.targetingRules[0].condition, undefined);
  assert.equal(config.targetingRules[0].payoutConfigId, 'pc-mystery-box-promotion');
});
