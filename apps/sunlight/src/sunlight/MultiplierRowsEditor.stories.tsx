import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MultiplierRowsEditor } from './MultiplierRowsEditor';
import { clientKey, type EditorMultiplierRow } from './payoutConfigForm';

const meta: Meta = {
  title: 'Lab/Sunlight/MultiplierRowsEditor',
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj;

const multiplierRow = (probabilityPct: string, multiplier: string): EditorMultiplierRow => ({
  _key: clientKey(),
  probabilityPct,
  multiplier,
});

function Harness({
  initialRows,
}: {
  initialRows: EditorMultiplierRow[];
}) {
  const [rows, setRows] = useState(initialRows);
  return <MultiplierRowsEditor rows={rows} onChange={setRows} />;
}

/** ×1, ×1.5, and ×3 all produce whole rewards. */
export const Valid: Story = {
  render: () => (
    <Harness
      initialRows={[multiplierRow('60', '1'), multiplierRow('30', '1.5'), multiplierRow('10', '3')]}
    />
  ),
};

/** A selectable odd reward at ×1.5 produces the cross-collection error. */
export const FractionalResult: Story = {
  render: () => (
    <Harness
      initialRows={[multiplierRow('100', '1.5')]}
    />
  ),
};

/** Zero-probability sectors remain visible but cannot be selected by the engine. */
export const ZeroProbability: Story = {
  render: () => (
    <Harness
      initialRows={[multiplierRow('100', '1'), multiplierRow('0', '1.5')]}
    />
  ),
};
