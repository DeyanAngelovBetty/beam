import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MultiplierRowsEditor } from './MultiplierRowsEditor';
import { clientKey, type EditorMultiplierRow, type EditorRow } from './payoutConfigForm';

const meta: Meta = {
  title: 'Lab/Sunlight/MultiplierRowsEditor',
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj;

const payoutRow = (winMessage: string, probabilityPct: string, amount: string): EditorRow => ({
  _key: clientKey(),
  winMessage,
  probabilityPct,
  rewards: [{ _key: clientKey(), rewardType: 'Coins', amount }],
});

const multiplierRow = (probabilityPct: string, multiplier: string): EditorMultiplierRow => ({
  _key: clientKey(),
  probabilityPct,
  multiplier,
});

function Harness({
  initialRows,
  payoutRows,
}: {
  initialRows: EditorMultiplierRow[];
  payoutRows: EditorRow[];
}) {
  const [rows, setRows] = useState(initialRows);
  return <MultiplierRowsEditor rows={rows} payoutRows={payoutRows} onChange={setRows} />;
}

/** ×1, ×1.5, and ×3 all produce whole rewards. */
export const Valid: Story = {
  render: () => (
    <Harness
      payoutRows={[payoutRow('Small win', '60', '10'), payoutRow('Jackpot', '40', '100')]}
      initialRows={[multiplierRow('60', '1'), multiplierRow('30', '1.5'), multiplierRow('10', '3')]}
    />
  ),
};

/** A selectable odd reward at ×1.5 produces the cross-collection error. */
export const FractionalResult: Story = {
  render: () => (
    <Harness
      payoutRows={[payoutRow('Odd reward', '100', '5')]}
      initialRows={[multiplierRow('100', '1.5')]}
    />
  ),
};

/** 0%-probability payout and multiplier sectors do not enter multiplication validation. */
export const ZeroProbabilityExclusion: Story = {
  render: () => (
    <Harness
      payoutRows={[payoutRow('Display only odd reward', '0', '5'), payoutRow('Selectable reward', '100', '10')]}
      initialRows={[multiplierRow('100', '1'), multiplierRow('0', '1.5')]}
    />
  ),
};
