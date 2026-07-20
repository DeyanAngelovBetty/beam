import type { Meta, StoryObj } from '@storybook/react-vite';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import { BeamStat } from './BeamStat';

/**
 * PLACEHOLDER organism — shape only, pending the Figma design pass.
 * Tones are semantic; the theme decides how each renders per mode.
 */
const meta = {
  title: 'Organisms (placeholder)/BeamStat',
  component: BeamStat,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof BeamStat>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { label: 'Cash balance', value: '$20.00', tone: 'default' },
};

/** A row of stats is the common case — entity summary in a header. */
export const Row: Story = {
  args: { label: 'Cash balance', value: '$20.00' },
  render: () => (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" spacing={4} flexWrap="wrap" useFlexGap>
        <BeamStat label="Status" value="Approved" tone="success" caption="Online" />
        <BeamStat label="Cash balance" value="$20.00" caption="CAD" />
        <BeamStat label="Betty coins" value="0" />
        <BeamStat label="Profit segment" value="Toddler" tone="info" />
        <BeamStat label="RG risk" value="No risk" tone="success" />
        <BeamStat label="Risk of churn" value="N/A" />
      </Stack>
    </Paper>
  ),
};
