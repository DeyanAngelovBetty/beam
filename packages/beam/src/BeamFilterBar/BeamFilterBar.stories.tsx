import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import { BeamFilterBar } from './BeamFilterBar';

/**
 * PLACEHOLDER organism, thinnest of the set on purpose — fields are
 * children, not a schema. See BeamFilterBar.types.ts for why.
 */
const meta = {
  title: 'Organisms (placeholder)/BeamFilterBar',
  component: BeamFilterBar,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof BeamFilterBar>;

export default meta;
type Story = StoryObj<typeof meta>;

const PRESETS = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: '7d', label: 'Last 7 days' },
  { id: 'month', label: 'This month' },
  { id: '30d', label: 'Last 30 days' },
];

/** Fields only — the Player Search shape. */
export const FieldsOnly: Story = {
  args: {
    'aria-label': 'Player filters',
    children: null,
  },
  render: (args) => (
    <BeamFilterBar {...args} onSearch={() => {}} onClear={() => {}}>
      <TextField label="Player ID" size="small" fullWidth />
      <TextField label="Email" size="small" fullWidth />
      <TextField label="First name" size="small" fullWidth />
      <TextField label="Last name" size="small" fullWidth />
    </BeamFilterBar>
  ),
};

/** With quick ranges — the transaction-log shape. */
export const WithPresets: Story = {
  args: {
    'aria-label': 'Transaction filters',
    children: null,
  },
  render: (args) => {
    const [preset, setPreset] = useState<string | null>('7d');
    return (
      <BeamFilterBar
        {...args}
        presets={PRESETS}
        activePreset={preset}
        onPresetChange={setPreset}
        onSearch={() => {}}
        onClear={() => {}}
      >
        <TextField label="Transaction ID" size="small" fullWidth />
        <TextField label="Provider" size="small" select fullWidth defaultValue="any">
          <MenuItem value="any">Any</MenuItem>
          <MenuItem value="interac">Interac</MenuItem>
        </TextField>
        <TextField label="Status" size="small" select fullWidth defaultValue="any">
          <MenuItem value="any">Any</MenuItem>
          <MenuItem value="settled">Settled</MenuItem>
        </TextField>
        <TextField label="Amount" size="small" fullWidth />
      </BeamFilterBar>
    );
  },
};
