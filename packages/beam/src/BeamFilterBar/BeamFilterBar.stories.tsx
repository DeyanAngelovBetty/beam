import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import { BeamFilterBar } from './BeamFilterBar';

/**
 * v1 filter bar: built-in search, promoted filters as children, Filter /
 * Clear-all, and an applied state (lit border + filled Filter CTA). Fields
 * are children — a field-schema API is a later design decision (grammar §1).
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

/** Search + a promoted Status filter; applied state tracks real input. */
export const SearchAndFilters: Story = {
  args: { 'aria-label': 'User filters', children: null },
  render: (args) => {
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('any');
    const applied = search !== '' || status !== 'any';
    return (
      <BeamFilterBar
        {...args}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search users"
        applied={applied}
        onFilter={() => {}}
        onClearAll={() => {
          setSearch('');
          setStatus('any');
        }}
      >
        <TextField
          label="Active"
          size="small"
          select
          fullWidth
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <MenuItem value="any">Any</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="inactive">Inactive</MenuItem>
        </TextField>
      </BeamFilterBar>
    );
  },
};

/** With date-range presets — the transaction-log shape. */
export const WithPresets: Story = {
  args: { 'aria-label': 'Transaction filters', children: null },
  render: (args) => {
    const [preset, setPreset] = useState<string | null>('7d');
    const [search, setSearch] = useState('');
    return (
      <BeamFilterBar
        {...args}
        searchValue={search}
        onSearchChange={setSearch}
        presets={PRESETS}
        activePreset={preset}
        onPresetChange={setPreset}
        applied={preset !== null || search !== ''}
        onFilter={() => {}}
        onClearAll={() => {
          setPreset(null);
          setSearch('');
        }}
      >
        <TextField label="Provider" size="small" select fullWidth defaultValue="any">
          <MenuItem value="any">Any</MenuItem>
          <MenuItem value="interac">Interac</MenuItem>
        </TextField>
        <TextField label="Amount" size="small" fullWidth />
      </BeamFilterBar>
    );
  },
};
