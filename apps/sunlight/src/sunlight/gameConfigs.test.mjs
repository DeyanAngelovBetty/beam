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
}

test('targeting rules match the backend condition contract', () => {
  for (const config of GAME_CONFIGS) {
    for (const rule of config.targetingRules) {
      assert.equal('name' in rule, false);
      assert.equal('payoutConfigName' in rule, false);
      if (rule.condition) assertCondition(rule.condition);
    }
  }
});

test('targeting rules reference payout configs for the same game type', () => {
  for (const config of GAME_CONFIGS) {
    for (const rule of config.targetingRules) {
      const payoutConfig = PAYOUT_CONFIGS.find((candidate) => candidate.id === rule.payoutConfigId);
      assert.ok(payoutConfig, `${config.id}/${rule.id} references a missing PayoutConfig`);
      assert.equal(payoutConfig.gameType, config.gameType, `${config.id}/${rule.id} has the wrong GameType`);
    }
  }
});

test('rules preserve priority and fallback semantics', () => {
  for (const config of GAME_CONFIGS) {
    const ordered = [...config.targetingRules].sort((a, b) => b.priority - a.priority);
    const fallbacks = ordered.filter((rule) => rule.status === 'Enabled' && !rule.condition);

    assert.equal(fallbacks.length, 1, `${config.id} must have one enabled fallback`);
    assert.equal(ordered.at(-1), fallbacks[0], `${config.id} fallback must be evaluated last`);
    assert.ok(
      ordered.every((rule, index) => index === 0 || ordered[index - 1].priority >= rule.priority),
      `${config.id} rules must evaluate by descending priority`
    );
  }
});

test('InstantWheel demo keeps distinct disabled-rule and enabled-fallback payouts', () => {
  const config = GAME_CONFIGS.find((candidate) => candidate.id === 'gc-instant-wheel-test');
  const normalRule = config.targetingRules.find((rule) => rule.condition);
  const fallback = config.targetingRules.find((rule) => !rule.condition);

  assert.equal(normalRule.payoutConfigId, 'pc-topaz-weekend');
  assert.equal(fallback.payoutConfigId, 'pc-default-instant-wheel');
  assert.equal(PAYOUT_CONFIGS.find((candidate) => candidate.id === normalRule.payoutConfigId).status, 'Disabled');
  assert.equal(PAYOUT_CONFIGS.find((candidate) => candidate.id === fallback.payoutConfigId).status, 'Enabled');
});
