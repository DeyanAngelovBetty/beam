import type { Meta, StoryObj } from '@storybook/react-vite';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import { BeamStat } from './BeamStat';

/**
 * BeamStat v2 — labelled value with the spine motif; the VIEW half of the 44px field twin. Key in
 * the `meta` voice; `severity` (warning | error) is the only alarm channel — spine token + a paired
 * icon (never colour-alone). ONE fill principle: fill marks a family's notable state — severity
 * (WarningAmber outlined → Error filled), boolean (CheckCircle filled / Cancel outlined). No tone.
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

/** Severity axis — outlined WarningAmber (lower) escalates to the FILLED Error (highest). */
export const Warning: Story = {
  args: { label: 'RG risk', value: 'Elevated', severity: 'warning' },
};
export const Error: Story = {
  args: { label: 'Account status', value: 'Suspended', severity: 'error' },
};

/** Boolean values — the yes/no icon pair (fill = true). Pass a boolean straight into `value`. */
export const BooleanTrue: Story = { args: { label: 'Active', value: true } };
export const BooleanFalse: Story = { args: { label: 'Active', value: false } };

/** Multiline value — grows by one line-height (18px) per line; the spine stretches to match. */
export const Multiline: Story = {
  args: {
    label: 'Effective permission',
    value: 'Approve payouts, manage users, and edit loyalty configuration across all jurisdictions',
  },
  render: (args) => (
    <div style={{ maxWidth: 240 }}>
      <BeamStat {...args} />
    </div>
  ),
};

/** A row of stats — the entity-summary use (plain values + the severity axis + a boolean). */
export const Row: Story = {
  args: { label: 'Status', value: 'Approved' },
  render: () => (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" spacing={4} useFlexGap sx={{ flexWrap: 'wrap' }}>
        <BeamStat label="Status" value="Approved" caption="Online" />
        <BeamStat label="Cash balance" value="$20.00" caption="CAD" />
        <BeamStat label="Active" value={true} />
        <BeamStat label="RG risk" value="Elevated" severity="warning" />
        <BeamStat label="Account" value="Suspended" severity="error" />
      </Stack>
    </Paper>
  ),
};
