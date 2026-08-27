import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box } from '@betty/beam';
import { PayoutRowsGrid } from './PayoutRowsGrid';
import type { PayoutRow } from './payoutConfigs';

/**
 * Lab bench for the PayoutRowsGrid — the expansion content (view half of the
 * future two-mode PayoutRow pattern). Win Message | Probability (%) | Rewards
 * (inline, comma-joined). Exercises single/multi rewards, the quiet
 * zero-probability row, and a wrapping message.
 */
const meta = {
  title: 'Lab/Sunlight/PayoutRowsGrid',
  component: PayoutRowsGrid,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof PayoutRowsGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

const single: PayoutRow = {
  probability: 0.5,
  winMessage: 'Win 1 Coin',
  prizeValue: 1,
  rewards: [{ rewardType: 'Coins', amount: 1 }],
};

const multi: PayoutRow = {
  probability: 0.05,
  winMessage: '6.25× Bonus',
  prizeValue: 6.25,
  rewards: [
    { rewardType: 'Coins', amount: 6 },
    { rewardType: 'Tokens', amount: 2 },
  ],
};

const zero: PayoutRow = {
  probability: 0,
  winMessage: 'Grand Prize (display)',
  prizeValue: 1000,
  rewards: [{ rewardType: 'Coins', amount: 1000 }],
};

const longMessage: PayoutRow = {
  probability: 0.02,
  winMessage:
    'Congratulations — you unlocked the legendary weekend mega-multiplier reward; enjoy your bonus coins and free tokens across the next three sessions',
  prizeValue: 500,
  rewards: [
    { rewardType: 'Coins', amount: 500 },
    { rewardType: 'Tokens', amount: 10 },
  ],
};

/** One reward — the simplest payout row. */
export const SingleRewardRow: Story = { args: { rows: [single] } };

/** Multiple rewards — listed inline in the Rewards column, comma-joined. */
export const MultiRewardRow: Story = { args: { rows: [multi] } };

/** Wheel of Wins payout sectors derive their public position from array order. */
export const NumberedSectors: Story = {
  args: { rows: [single, multi, zero], showSectorPositions: true },
};

/** Zero-probability ("visual only") row — same grid, dimmed quiet. */
export const ZeroProbabilityRow: Story = { args: { rows: [zero] } };

/** A long win message wraps; cells stay top-aligned. */
export const LongWrappingMessage: Story = {
  render: (args) => (
    <Box sx={{ maxWidth: 520 }}>
      <PayoutRowsGrid {...args} />
    </Box>
  ),
  args: { rows: [longMessage] },
};

/** A full table — multi-reward rows, a no-win line, and a quiet zero-probability row. */
export const FullTable: Story = {
  args: {
    rows: [
      {
        probability: 0.5,
        winMessage: 'Win 1 Coin',
        prizeValue: 1,
        rewards: [
          { rewardType: 'Coins', amount: 1 },
          { rewardType: 'Tokens', amount: 1 },
        ],
      },
      {
        probability: 0.3,
        winMessage: 'Win 3 Coins',
        prizeValue: 3,
        rewards: [
          { rewardType: 'Coins', amount: 3 },
          { rewardType: 'Tokens', amount: 1 },
        ],
      },
      multi,
      { probability: 0.13, winMessage: 'No win', prizeValue: 0, rewards: [] },
      zero,
    ],
  },
};
