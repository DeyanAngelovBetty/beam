import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { LoyaltyRewardsEditor } from './LoyaltyRewardsEditor';
import { emptyReward, validateModel, type EditorReward } from './loyaltyStatusForm';

/**
 * Lab bench for LoyaltyRewardsEditor — the reward-rows grid for the loyalty-status editor,
 * the editable sibling of the expanded rewards table. Controlled; the harness holds the
 * rows and feeds per-row errors through the same validateModel the editor uses.
 */
const meta: Meta = {
  title: 'Lab/Sunlight/LoyaltyRewardsEditor',
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj;

let k = 0;
const reward = (pointsToClaim: string, rewardType: string, rewardAmount: string, expiryHours: string): EditorReward => ({
  _key: `s-${(k += 1)}`,
  pointsToClaim,
  rewardType,
  rewardAmount,
  expiryHours,
});

function Harness({ initial }: { initial: EditorReward[] }) {
  const [rows, setRows] = useState<EditorReward[]>(initial);
  // Reuse the model validator (dummy fields) so the grid shows the real per-row errors.
  const v = validateModel({
    name: 'Topaz',
    maxDays: '28',
    boxes: '6',
    keepBoxes: '∞',
    keepGems: '1',
    multiplier: '1.5',
    rewards: rows,
  });
  return <LoyaltyRewardsEditor rows={rows} onChange={setRows} errors={v.rewards} showAllErrors />;
}

/** A typical three-reward set. */
export const ThreeRewards: Story = {
  render: () => (
    <Harness
      initial={[
        reward('2000', 'Coins', '1100', '24'),
        reward('2000', 'Coins', '770', '48'),
        reward('2000', 'Coins', '860', '24'),
      ]}
    />
  ),
};

/** A single blank reward (Add-reward default). */
export const SingleBlank: Story = { render: () => <Harness initial={[emptyReward()]} /> };

/** No rewards — the aggregate rule (≥1) will block Submit upstream. */
export const Empty: Story = { render: () => <Harness initial={[]} /> };

/** Invalid values surface per-field errors. */
export const InvalidValues: Story = {
  render: () => <Harness initial={[reward('', 'Coins', 'abc', '-4'), reward('2000', '', '500', '24')]} />,
};
