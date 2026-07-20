import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { BeamTabs } from './BeamTabs';
import type { BeamTabItem } from './BeamTabs.types';

/**
 * PLACEHOLDER organism pending the Figma pass.
 *
 * Nesting is a capability, not a default — see BeamTabs.types.ts.
 */
const meta = {
  title: 'Organisms (placeholder)/BeamTabs',
  component: BeamTabs,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof BeamTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

const FLAT: BeamTabItem[] = [
  { id: 'status', label: 'Status' },
  { id: 'a-levels', label: 'A Levels' },
  { id: 'b-levels', label: 'B Levels' },
  { id: 'rtp', label: 'RTP Multipliers' },
  { id: 'gifts', label: 'Daily Gifts' },
];

const NESTED: BeamTabItem[] = [
  { id: 'overview', label: 'Overview' },
  {
    id: 'payments',
    label: 'Payments',
    children: [
      { id: 'transactions', label: 'Payment Transactions' },
      { id: 'methods', label: 'Payment Methods' },
      { id: 'interac', label: 'Interac Emails' },
      { id: 'prepaid', label: 'Prepaid Limits' },
    ],
  },
  { id: 'loyalty', label: 'Loyalty' },
];

/** One level — what Sunlight and Gaspar use. */
export const Flat: Story = {
  args: { items: FLAT, value: 'status', onChange: () => {}, 'aria-label': 'Sections' },
  render: (args) => {
    const [value, setValue] = useState('status');
    return <BeamTabs {...args} value={value} onChange={setValue} />;
  },
};

/** Two levels — only where the domain genuinely has them. */
export const Nested: Story = {
  args: { items: NESTED, value: 'payments', onChange: () => {}, 'aria-label': 'Player sections' },
  render: (args) => {
    const [value, setValue] = useState('payments');
    const [subValue, setSubValue] = useState('transactions');
    return (
      <BeamTabs
        {...args}
        value={value}
        onChange={setValue}
        subValue={subValue}
        onSubChange={setSubValue}
      />
    );
  },
};
