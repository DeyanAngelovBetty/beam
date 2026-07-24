import type { Meta, StoryObj } from '@storybook/react-vite';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import { BeamStat } from './BeamStat';

/**
 * BeamStat — labelled value with the spine motif. Key in the `meta` voice;
 * `tone` tints the value; `severity` switches the spine token and pairs it
 * with an icon (never colour-alone, WCAG 1.4.1).
 */
const meta = {
  title: 'Organisms/BeamStat',
  component: BeamStat,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof BeamStat>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: 'Cash balance', value: '$20.00', caption: 'CAD' },
};

export const Warning: Story = {
  args: { label: 'RG risk', value: 'Elevated', severity: 'warning' },
};

export const Danger: Story = {
  args: { label: 'Account status', value: 'Suspended', severity: 'danger' },
};

/** Long values wrap; the spine stretches to match (variable heights are legal). */
export const LongValue: Story = {
  args: {
    label: 'Effective permission',
    value: 'Approve payouts, manage users, and edit loyalty configuration across all jurisdictions',
    severity: 'warning',
  },
  render: (args) => (
    <div style={{ maxWidth: 240 }}>
      <BeamStat {...args} />
    </div>
  ),
};

/** A row of stats — the entity-summary use, mixing tone and severity. */
export const Row: Story = {
  args: { label: 'Status', value: 'Approved' },
  render: () => (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" spacing={4} flexWrap="wrap" useFlexGap>
        <BeamStat label="Status" value="Approved" tone="success" caption="Online" />
        <BeamStat label="Cash balance" value="$20.00" caption="CAD" />
        <BeamStat label="Betty coins" value="0" />
        <BeamStat label="RG risk" value="Elevated" severity="warning" />
        <BeamStat label="Account" value="Suspended" severity="danger" />
      </Stack>
    </Paper>
  ),
};
