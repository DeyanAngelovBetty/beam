import type { Meta, StoryObj } from '@storybook/react-vite';
import { MultiplierRowsGrid } from './MultiplierRowsGrid';

const meta = {
  title: 'Lab/Sunlight/MultiplierRowsGrid',
  component: MultiplierRowsGrid,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof MultiplierRowsGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The realistic Wheel of Wins multiplier collection. */
export const FullTable: Story = {
  args: {
    rows: [
      { probability: 0.6, multiplier: 1 },
      { probability: 0.3, multiplier: 1.5 },
      { probability: 0.1, multiplier: 3 },
    ],
  },
};

/** A 0%-probability sector remains visible but reads quietly. */
export const ZeroProbabilitySector: Story = {
  args: {
    rows: [
      { probability: 1, multiplier: 1 },
      { probability: 0, multiplier: 1.5 },
    ],
  },
};
