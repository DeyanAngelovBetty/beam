import type { Meta, StoryObj } from '@storybook/react-vite';
import Stack from '@mui/material/Stack';
import { BeamStatusBadge } from './BeamStatusBadge';
import type { BeamStatus } from './BeamStatusBadge.types';

const ALL_STATUSES: BeamStatus[] = ['active', 'scheduled', 'draft', 'paused', 'expired', 'error'];

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

/** The full status vocabulary. Extending it is a semantic decision, not a color pick. */
export const AllStatuses: Story = {
  render: () => (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      {ALL_STATUSES.map((s) => (
        <BeamStatusBadge key={s} status={s} />
      ))}
    </Stack>
  ),
};

/** Label overrides the default status name — e.g. localized copy — without changing semantics. */
export const CustomLabel: Story = {
  args: { status: 'scheduled', label: 'Goes live Jul 15' },
};
