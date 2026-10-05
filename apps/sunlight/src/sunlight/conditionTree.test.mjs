import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { createServer } from 'vite';

const vite = await createServer({ root: process.cwd(), appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } });
after(() => vite.close());
const { labelForValue, selectAudienceCohorts } =
  await vite.ssrLoadModule('/apps/sunlight/src/sunlight/conditionTree.ts');
const { conditionToGroup, groupToCondition, toEditorModel, toDomainInput } =
  await vite.ssrLoadModule('/apps/sunlight/src/sunlight/gameConfigForm.ts');
const { createGameConfig, updateGameConfig, getGameConfig } =
  await vite.ssrLoadModule('/apps/sunlight/src/sunlight/gameConfigs.ts');

test('nested conditions preserve operators and every supported audience JSON form', () => {
  const values = [1001, { audienceId: 1002, cohortIds: [20, 21] },
    { audienceId: 1003 }, { audienceId: 1004, cohortIds: [] }, { audienceId: 9999, cohortIds: null }];
  const condition = { operator: 'All', statements: [
    { field: 'Audience', operator: 'IsOneOf', values },
    { operator: 'Any', statements: [
      { field: 'Audience', operator: 'IsNoneOf', values: [{ audienceId: 1001, cohortIds: [12] }] },
      { field: 'LoyaltyStatus', operator: 'IsOneOf', values: ['VIP'] },
    ] },
  ] };
  assert.deepEqual(JSON.parse(JSON.stringify(groupToCondition(conditionToGroup(condition)))), condition);
});

test('changing one audience cohorts preserves other audiences and the saved values', () => {
  const saved = [1001, { audienceId: 1002, cohortIds: [20] }];
  const selected = selectAudienceCohorts(saved, 1001, [10, 11]);
  assert.deepEqual(selected, [{ audienceId: 1001, cohortIds: [10, 11] }, { audienceId: 1002, cohortIds: [20] }]);
  assert.deepEqual(saved, [1001, { audienceId: 1002, cohortIds: [20] }]);
  assert.deepEqual(selectAudienceCohorts(selected, 1001, []), saved);
});

test('summaries show scoped cohorts, whole audiences and unknown IDs without losing values', () => {
  for (const value of [1001, { audienceId: 1001 }, { audienceId: 1001, cohortIds: [] }, { audienceId: 1001, cohortIds: null }]) {
    assert.equal(labelForValue('Audience', value), 'VIP High Rollers (whole audience)');
    assert.deepEqual(selectAudienceCohorts([value], 1001, []), [value]);
  }
  assert.equal(labelForValue('Audience', { audienceId: 1001, cohortIds: [10, 11] }),
    'VIP High Rollers (cohorts: Control or Variant A)');
  const unknown = { audienceId: 9999, cohortIds: [9876] };
  assert.equal(labelForValue('Audience', unknown), 'Audience 9999 (cohorts: Cohort 9876)');
  assert.deepEqual(selectAudienceCohorts([unknown, 1001], 1001, [10]), [unknown, { audienceId: 1001, cohortIds: [10] }]);
});

test('mock create, edit and read retain cohort JSON, rule order and fallback', () => {
  const condition = { operator: 'All', statements: [
    { field: 'Audience', operator: 'IsOneOf', values: [1002, { audienceId: 1001, cohortIds: [10, 11] }] },
  ] };
  const created = createGameConfig({ name: 'Cohort round trip', gameType: 'BettyWheel', targetingRules: [
    { id: '', priority: 100, status: 'Enabled', payoutConfigId: 'pc-betty-wheel-premium', condition },
    { id: '', priority: 0, status: 'Enabled', payoutConfigId: 'pc-betty-wheel-standard' },
  ] });
  const model = toEditorModel(created);
  const leaf = model.rules[0].group.children[0];
  model.rules[0].group.children[0] = { ...leaf, values: selectAudienceCohorts(leaf.values, 1001, [12]) };
  assert.deepEqual(getGameConfig(created.id).targetingRules[0].condition, condition);
  updateGameConfig(created.id, toDomainInput(model));
  const read = JSON.parse(JSON.stringify(getGameConfig(created.id)));
  assert.deepEqual(read.targetingRules[0].condition.statements[0].values, [1002, { audienceId: 1001, cohortIds: [12] }]);
  assert.deepEqual(read.targetingRules.map(rule => rule.priority), [100, 0]);
  assert.equal(read.targetingRules[1].condition, undefined);
  assert.equal(read.targetingRules[1].status, 'Enabled');
});
