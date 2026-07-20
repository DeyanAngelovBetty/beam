import type { Meta, StoryObj } from '@storybook/react-vite';
import Button from '@mui/material/Button';
import { BeamPageHeader } from './BeamPageHeader';
import { BeamStat } from '../BeamStat/BeamStat';

/**
 * PLACEHOLDER organism — the props are the durable part, the arrangement
 * is not. Promoted because Sunlight and Gaspar had already duplicated the
 * same title-plus-tabs opening (BEAM.md §2).
 */
const meta = {
  title: 'Organisms (placeholder)/BeamPageHeader',
  component: BeamPageHeader,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof BeamPageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The shape Sunlight and Gaspar use today. */
export const TitleOnly: Story = {
  args: { title: 'Transactions' },
};

export const WithActions: Story = {
  args: {
    title: 'Loyalty Status',
    description: 'Statuses, rewards, and progression rules for this jurisdiction.',
    actions: <Button variant="contained">Quick actions</Button>,
  },
};

/** Entity summary: the header of a record, not of a list. */
export const WithSummary: Story = {
  args: {
    title: 'Edna Schimmel',
    description: 'Player ID 257291',
    actions: <Button variant="outlined">Quick actions</Button>,
    summary: (
      <>
        <BeamStat label="Status" value="Approved" tone="success" caption="Online" />
        <BeamStat label="Cash balance" value="$20.00" caption="CAD" />
        <BeamStat label="Betty coins" value="0" />
        <BeamStat label="Profit segment" value="Toddler" tone="info" />
        <BeamStat label="RG risk" value="No risk" tone="success" />
      </>
    ),
  },
};
