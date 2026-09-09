import type { Meta, StoryObj } from '@storybook/react-vite';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { BeamBadge } from './BeamBadge';

/**
 * BeamBadge — the grammar-native badge (docs/state-rendering-grammar.md). Hue = meaning, volume =
 * loudness; filled-neutral and label-less badges are unrepresentable in the type. Pages own the
 * vocabulary→(hue,volume) map; the organism knows no product words.
 */
const meta: Meta<typeof BeamBadge> = {
  title: 'Organisms/BeamBadge',
  component: BeamBadge,
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj<typeof BeamBadge>;

/** The legal matrix: each semantic hue at noted (outlined) and loud (filled), plus neutral/silent. */
export const Grammar: Story = {
  render: () => (
    <Stack spacing={2}>
      <div>
        <Typography variant="overline" color="text.secondary">Noted (hue, outlined)</Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
          <BeamBadge hue="danger" volume="noted" label="Failed" />
          <BeamBadge hue="warning" volume="noted" label="Refunded" />
          <BeamBadge hue="success" volume="noted" label="Completed" />
          <BeamBadge hue="in-progress" volume="noted" label="Pending" />
        </Stack>
      </div>
      <div>
        <Typography variant="overline" color="text.secondary">Loud (hue, filled)</Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
          <BeamBadge hue="danger" volume="loud" label="Chargeback" />
          <BeamBadge hue="warning" volume="loud" label="Action needed" />
          <BeamBadge hue="success" volume="loud" label="Active" />
          <BeamBadge hue="in-progress" volume="loud" label="Awaiting review" />
        </Stack>
      </div>
      <div>
        <Typography variant="overline" color="text.secondary">Silent (neutral)</Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
          <BeamBadge hue="neutral" label="Draft" />
          <BeamBadge hue="neutral" label="Ended" />
          <BeamBadge hue="neutral" label="Disabled" />
        </Stack>
      </div>
    </Stack>
  ),
};
