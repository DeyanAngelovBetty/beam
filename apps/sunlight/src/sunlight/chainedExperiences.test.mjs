import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { createServer } from 'vite';

const vite = await createServer({ root: process.cwd(), appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } });
after(() => vite.close());
const { CHAINED_EXPERIENCES, validateChainedExperience, targetPresetOptions, saveChainedExperience } =
  await vite.ssrLoadModule('/apps/sunlight/src/sunlight/chainedExperiences.ts');
const { GAME_CONFIGS, gameConfigEnableReason, payoutConfigDisableReason } =
  await vite.ssrLoadModule('/apps/sunlight/src/sunlight/gameConfigs.ts');
const { META_GAME_PRESETS } = await vite.ssrLoadModule('/apps/sunlight/src/sunlight/metaGamePresets.ts');
const { toEditorModel, validateModel } = await vite.ssrLoadModule('/apps/sunlight/src/sunlight/gameConfigForm.ts');

test('chain overlap uses exact source type/preset and allows adjacent periods', () => {
  const existing = CHAINED_EXPERIENCES[0];
  assert.deepEqual(validateChainedExperience(existing, existing.id), {});
  assert.match(validateChainedExperience(existing).period, /overlaps/);
  assert.deepEqual(validateChainedExperience({ ...existing, sourcePresetId: 'preset-weekly-wheel' }), {});
  assert.deepEqual(validateChainedExperience({ ...existing, startDate: existing.endDate, endDate: '2026-11-01T00:00:00.000Z' }), {});
  assert.match(validateChainedExperience({ ...existing, endDate: existing.startDate }).endDate, /after/);
});

test('target requires an MM GameConfig; disabled presets remain eligible', () => {
  const existing = CHAINED_EXPERIENCES[0];
  assert.match(validateChainedExperience({ ...existing, targetPresetId: 'preset-weekly-wheel' }, existing.id).targetPresetId, /Multiplier Madness/);
  const preset = META_GAME_PRESETS.find(preset => preset.id === 'preset-mm-standard');
  const status = preset.status;
  try {
    preset.status = 'Disabled';
    assert.ok(targetPresetOptions().includes(preset));
    assert.deepEqual(validateChainedExperience(existing, existing.id), {});
  } finally { preset.status = status; }
});

test('started experiences remain editable and the mock saves both create and update', () => {
  const input = { ...CHAINED_EXPERIENCES[0], sourcePresetId: 'preset-weekly-wheel' };
  const created = saveChainedExperience(input);
  try {
    const update = { ...input, startDate: '2020-01-01T00:00:00.000Z', endDate: '2020-02-01T00:00:00.000Z' };
    assert.deepEqual(validateChainedExperience(update, created.id), {});
    saveChainedExperience(update, created.id);
    assert.equal(created.startDate, update.startDate);
  } finally { CHAINED_EXPERIENCES.splice(CHAINED_EXPERIENCES.indexOf(created), 1); }
});

test('config status dependencies also block editing an enabled config with a disabled payout', () => {
  const active = GAME_CONFIGS.find(config => config.id === 'gc-betty-wheel-default');
  const promotion = GAME_CONFIGS.find(config => config.id === 'gc-betty-wheel-promotion');
  assert.match(payoutConfigDisableReason('pc-betty-wheel-standard'), /enabled Game Config/);
  assert.equal(payoutConfigDisableReason('pc-mm-promotion'), undefined);
  assert.match(gameConfigEnableReason(promotion), /Enable/);
  assert.equal(gameConfigEnableReason(active), undefined);
  const model = toEditorModel(active);
  model.fallback.payoutConfigId = 'pc-betty-wheel-promotion';
  assert.equal(validateModel(model, active.id, 'Enabled').valid, false);
  assert.equal(validateModel(model, active.id, 'Disabled').valid, true);
});
