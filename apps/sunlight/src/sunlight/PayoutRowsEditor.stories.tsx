import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { PayoutRowsEditor } from './PayoutRowsEditor';
import { clientKey, emptyRow, type EditorRow } from './payoutConfigForm';
import type { RewardType } from './payoutConfigs';

/**
 * Lab bench for PayoutRowsEditor — the editable sibling of PayoutRowsGrid.
 * Controlled; the harness holds the working rows. Exercises the reward blocks,
 * structural duplicate-type prevention, and the Live Check severities — now in
 * the chrome strip ABOVE the fit-content grid (stats + aggregate left, Add Row
 * right). The under/over stories keep the warning/danger states visible.
 */
// No `component` binding: these are render-only harness stories (the editor is
// controlled), so we avoid Storybook's required-args typing.
const meta: Meta = {
  title: 'Lab/Sunlight/PayoutRowsEditor',
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj;

const row = (winMessage: string, pct: string, rewards: [RewardType, string][]): EditorRow => ({
  _key: clientKey(),
  winMessage,
  probabilityPct: pct,
  rewards: rewards.map(([rewardType, amount]) => ({ _key: clientKey(), rewardType, amount })),
});

/** Controlled harness — real editing, so the bench can drive every control. */
function Harness({ initial, orderedSectors = false }: { initial: EditorRow[]; orderedSectors?: boolean }) {
  const [rows, setRows] = useState<EditorRow[]>(initial);
  return <PayoutRowsEditor rows={rows} onChange={setRows} orderedSectors={orderedSectors} />;
}

/** A single blank row — the create default (Live Check reads 0%, warning). */
export const EmptyRow: Story = { render: () => <Harness initial={[emptyRow()]} /> };

/** One reward, totals 100% — the Live Check is quiet. */
export const SingleReward: Story = {
  render: () => <Harness initial={[row('Win 5 Coins', '100', [['Coins', '5']])]} />,
};

/** Both reward types used — Add Reward is disabled (structural). */
export const MultiReward: Story = {
  render: () => (
    <Harness initial={[row('Mega bonus', '100', [['Coins', '6'], ['Tokens', '2']])]} />
  ),
};

/** Wheel of Wins payout sectors expose derived positions and arrow ordering. */
export const OrderedSectors: Story = {
  render: () => (
    <Harness
      orderedSectors
      initial={[
        row('Small win', '60', [['Coins', '10']]),
        row('Bonus bundle', '30', [['Coins', '20'], ['Tokens', '2']]),
        row('Wheel jackpot', '10', [['Coins', '100'], ['Tokens', '10']]),
      ]}
    />
  ),
};

/** Totals under 100% — Live Check shows 'warning' (incomplete). */
export const InvalidUnder: Story = {
  render: () => (
    <Harness
      initial={[row('Win 1 Coin', '50', [['Coins', '1']]), row('Win 2 Coins', '30', [['Coins', '2']])]}
    />
  ),
};

/** Totals over 100% — Live Check shows 'error' (impossible). */
export const InvalidOver: Story = {
  render: () => (
    <Harness
      initial={[row('Big', '70', [['Coins', '100']]), row('Bigger', '50', [['Coins', '200']])]}
    />
  ),
};

/** A long win message wraps; cells stay top-aligned. */
export const WrappingMessage: Story = {
  render: () => (
    <Harness
      initial={[
        row(
          'Congratulations — you unlocked the legendary weekend mega-multiplier reward across the next three sessions',
          '100',
          [['Coins', '500'], ['Tokens', '10']]
        ),
      ]}
    />
  ),
};
