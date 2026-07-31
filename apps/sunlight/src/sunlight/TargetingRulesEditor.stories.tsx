import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { TargetingRulesEditor } from './TargetingRulesEditor';
import { emptyModel, emptyRule, type EditorModel, type EditorRule } from './gameConfigForm';
import type { ConditionField, ConditionGroup, GroupOperator, LeafOperator } from './conditionTree';
import type { GameType, PayoutStatus } from './payoutConfigs';

/**
 * Lab bench for TargetingRulesEditor — the Game Config editor's rules list.
 * Controlled; the harness holds the EditorModel. Order IS priority; reorder via
 * up/down arrows; the fallback is a fixed last row. NOTE: the editor renders
 * rules always-expanded, so there is no "collapsed rule → ConditionSummary"
 * story — collapse is the read-only list's concern (Georgi's TargetingRulesGrid),
 * not the editor.
 */
const meta: Meta = {
  title: 'Lab/Sunlight/TargetingRulesEditor',
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj;

// Fixture builders.
const grp = (operator: GroupOperator, children: ConditionGroup['children']): ConditionGroup => ({
  kind: 'group',
  operator,
  children,
});
const leaf = (field: ConditionField, operator: LeafOperator, values: (string | number)[]) => ({
  kind: 'leaf' as const,
  field,
  operator,
  values,
});
const rule = (payoutConfigId: string, group: ConditionGroup, status: PayoutStatus = 'Enabled'): EditorRule => ({
  ...emptyRule(),
  status,
  payoutConfigId,
  group,
});
const model = (gameType: GameType, rules: EditorRule[], fallbackPayoutId: string): EditorModel => ({
  code: 'DEMO_CONFIG',
  gameType,
  rules,
  fallback: { ...emptyModel().fallback, payoutConfigId: fallbackPayoutId },
});

function Harness({ initial }: { initial: EditorModel }) {
  const [value, setValue] = useState<EditorModel>(initial);
  return <TargetingRulesEditor value={value} onChange={setValue} />;
}

/** Fallback only — no conditional rules yet (the create minimum). */
export const FallbackOnly: Story = {
  render: () => <Harness initial={model('Wheel', [], 'pc-no-loss-abs')} />,
};

/** Multiple rules — reorder arrows disable at the first (up) and last (down). */
export const MultipleRules: Story = {
  render: () => (
    <Harness
      initial={model(
        'Wheel',
        [
          rule('pc-no-loss-abs', grp('All', [leaf('Audience', 'In', ['VIP']), leaf('LoyaltyStatus', 'In', ['Gold'])])),
          rule('pc-no-loss-abs', grp('Any', [leaf('RccSegment', 'In', ['High Value'])])),
          rule('pc-no-loss-abs', grp('All', [leaf('Audience', 'NotIn', ['Restricted'])]), 'Disabled'),
        ],
        'pc-no-loss-abs'
      )}
    />
  ),
};

/** An enabled rule referencing a Disabled Payout Config — the quiet warning
 *  fires (non-blocking; the Enable action enforces it, not Save). */
export const DisabledPayoutWarning: Story = {
  render: () => (
    <Harness
      initial={model(
        'WheelOfWins',
        [rule('pc-jamie-abs', grp('All', [leaf('Audience', 'In', ['VIP'])]))],
        'pc-jamie-abs'
      )}
    />
  ),
};

/** An incomplete condition (a leaf with no values) — inline error, Save gated. */
export const InvalidCondition: Story = {
  render: () => (
    <Harness
      initial={model('Wheel', [rule('pc-no-loss-abs', grp('All', [leaf('Audience', 'In', [])]))], 'pc-no-loss-abs')}
    />
  ),
};
