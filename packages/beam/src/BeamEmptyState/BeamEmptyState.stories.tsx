import type { Meta, StoryObj } from '@storybook/react-vite';
import ConstructionIcon from '@mui/icons-material/Construction';
import InboxIcon from '@mui/icons-material/Inbox';
import Button from '@mui/material/Button';
import { BeamEmptyState } from './BeamEmptyState';

/**
 * PLACEHOLDER organism pending the Figma pass. Covers both "not built yet"
 * (nav placeholders) and "genuinely empty list".
 */
const meta = {
  title: 'Organisms (placeholder)/BeamEmptyState',
  component: BeamEmptyState,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof BeamEmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The nav-placeholder shape used across Sunlight. */
export const ComingSoon: Story = {
  args: {
    icon: <ConstructionIcon />,
    title: 'Perks',
    description: 'This screen is coming soon.',
  },
};

/** An empty list, with an action to populate it. */
export const EmptyList: Story = {
  args: {
    icon: <InboxIcon />,
    title: 'No payout tables yet',
    description: 'Create a payout table to get started.',
    action: <Button variant="contained">Add payout table</Button>,
  },
};
