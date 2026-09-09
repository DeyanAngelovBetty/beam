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

/**
 * ADVANCED representation (add / remove / persist fields). Same bar, same position — plus a [+]
 * add-field menu and [x]-removable added fields. The bar owns the STRUCTURE (which fields are added)
 * and persists it (localStorage `beam:filters:sb.demo:fields:v1`); the page owns the VALUES. The menu
 * offers only not-yet-added fields and shows disabled "awaiting data" entries. Keyboard: [+] opens the
 * menu, arrows/Enter add, each [x] is focusable. (Values are per-page draft here; reload restores the
 * added fields empty-valued.)
 */
export const Advanced: Story = {
  args: { 'aria-label': 'Transaction filters', children: null },
  render: (args) => {
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [currency, setCurrency] = useState('');
    const [threeDs, setThreeDs] = useState('');
    const applied = search !== '' || status !== '' || currency !== '' || threeDs !== '';
    return (
      <BeamFilterBar
        {...args}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search ID, customer"
        applied={applied}
        onFilter={() => {}}
        onClearAll={() => {
          setSearch('');
          setStatus('');
          setCurrency('');
          setThreeDs('');
        }}
        advanced={{
          storageKey: 'sb.demo',
          onFieldRemoved: (id) => {
            if (id === 'currency') setCurrency('');
            if (id === 'threeDs') setThreeDs('');
          },
          addableFields: [
            {
              id: 'currency',
              label: 'Currency',
              control: (
                <TextField label="Currency" size="small" select fullWidth value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  <MenuItem value="">Any</MenuItem>
                  <MenuItem value="USD">USD</MenuItem>
                  <MenuItem value="EUR">EUR</MenuItem>
                  <MenuItem value="CAD">CAD</MenuItem>
                </TextField>
              ),
            },
            {
              id: 'threeDs',
              label: '3DS status',
              control: (
                <TextField label="3DS status" size="small" select fullWidth value={threeDs} onChange={(e) => setThreeDs(e.target.value)}>
                  <MenuItem value="">Any</MenuItem>
                  <MenuItem value="NotRequired">NotRequired</MenuItem>
                  <MenuItem value="Authenticated">Authenticated</MenuItem>
                </TextField>
              ),
            },
            { id: 'nameOnCard', label: 'Name on Card', control: null, disabled: true, disabledReason: 'awaiting data' },
            { id: 'fraudRulesMatched', label: 'Fraud Rules Matched', control: null, disabled: true, disabledReason: 'awaiting data' },
          ],
        }}
      >
        <TextField label="Status" size="small" select fullWidth value={status} onChange={(e) => setStatus(e.target.value)}>
          <MenuItem value="">Any</MenuItem>
          <MenuItem value="Succeeded">Succeeded</MenuItem>
          <MenuItem value="Pending">Pending</MenuItem>
          <MenuItem value="Failed">Failed</MenuItem>
        </TextField>
      </BeamFilterBar>
    );
  },
};
