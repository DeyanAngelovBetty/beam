import type { Meta, StoryObj } from '@storybook/react-vite';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { BeamStatusBadge } from './BeamStatusBadge';
import type { BeamStatus } from './BeamStatusBadge.types';

/** Configuration objects: promotions, campaigns, paytables. */
const LIFECYCLE: BeamStatus[] = ['active', 'scheduled', 'draft', 'paused', 'expired', 'error'];

/** Money movement: Gaspar transactions, Midnight payments. */
const SETTLEMENT: BeamStatus[] = ['settled', 'pending', 'refunded', 'chargeback'];

const ALL_STATUSES: BeamStatus[] = [...LIFECYCLE, ...SETTLEMENT];

/**
 * Shared status grammar across Sunlight and Midnight.
 * Statuses are semantic, not colors — the theme decides rendering per mode.
 * Mirrors the Figma component: MUI kit file → 🧪 Beam Organisms — POC → BeamStatusBadge.
 */
const meta: Meta<typeof BeamStatusBadge> = {
  title: 'Organisms/BeamStatusBadge',
  component: BeamStatusBadge,
  parameters: { layout: 'padded' },
  argTypes: {
    status: { control: 'select', options: ALL_STATUSES },
    size: { control: 'radio', options: ['small', 'medium'] },
    label: { control: 'text' },
  },
};
export default meta;

type Story = StoryObj<typeof BeamStatusBadge>;

/** Interactive playground — flip status/size/label in the Controls panel. */
export const Playground: Story = {
  args: { status: 'active', size: 'small' },
};

/**
 * The full status vocabulary, in its two families. Extending it is a
 * semantic decision, not a color pick — settlement was added when Gaspar's
 * transactions needed words lifecycle could not express (BEAM.md §6.4).
 */
export const AllStatuses: Story = {
  render: () => (
    <Stack spacing={2}>
      <Stack spacing={1}>
        <Typography variant="overline" color="text.secondary">
          Lifecycle
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {LIFECYCLE.map((s) => (
            <BeamStatusBadge key={s} status={s} />
          ))}
        </Stack>
      </Stack>
      <Stack spacing={1}>
        <Typography variant="overline" color="text.secondary">
          Settlement
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {SETTLEMENT.map((s) => (
            <BeamStatusBadge key={s} status={s} />
          ))}
        </Stack>
      </Stack>
    </Stack>
  ),
};

/** Label overrides the default status name — e.g. localized copy — without changing semantics. */
export const CustomLabel: Story = {
  args: { status: 'scheduled', label: 'Goes live Jul 15' },
};
