import type { Meta, StoryObj } from '@storybook/react-vite';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
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

/** The list-page shape: a primary "+ Add" CTA, right-aligned. */
export const WithPrimaryAction: Story = {
  args: {
    title: 'Users',
    description: 'Operators with back-office access.',
    action: (
      <Button variant="contained" startIcon={<AddIcon />}>
        Add
      </Button>
    ),
  },
};

/** Primary action with a secondary action to its left. */
export const WithSecondaryActions: Story = {
  args: {
    title: 'Loyalty Status',
    description: 'Statuses, rewards, and progression rules for this jurisdiction.',
    secondaryActions: <Button variant="text">Export</Button>,
    action: <Button variant="contained">Quick actions</Button>,
  },
};

/** Entity summary: the header of a record, not of a list. */
export const WithSummary: Story = {
  args: {
    title: 'Edna Schimmel',
    description: 'Player ID 257291',
    action: <Button variant="outlined">Quick actions</Button>,
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

/**
 * Detail page: the back link is header anatomy (detail-grammar §4), owned by the
 * organism. Href form — a real anchor for a router page (new-tab / copy work).
 */
export const WithBackLink: Story = {
  args: {
    title: 'Edna Schimmel',
    back: { label: 'Users', href: '#/users' },
    description: 'Player ID 257291',
    action: <Button variant="contained">Edit</Button>,
  },
};

/** Back link, callback form — a screen-state "back" with no URL (renders a button). */
export const WithBackCallback: Story = {
  args: {
    title: 'Edna Schimmel',
    back: { label: 'Search', onClick: () => {} },
    description: 'Player ID 257291',
    action: <Button variant="contained">Quick actions</Button>,
  },
};

/**
 * Gradient title stress — a long title that WRAPS. Verify: the text gradient spans the
 * text box sanely, and the underline tracks the box as ONE line under the whole box (not
 * one per line). Flip product/mode in the toolbar for the per-product dials; toggle
 * reduced-motion to confirm the underline lands static-and-visible.
 */
export const LongWrappingTitle: Story = {
  args: {
    title: 'Default MetaGame configuration for the Ontario weekend multiplier promotion',
    description: 'A title long enough to wrap at most widths.',
    action: <Button variant="contained">Quick actions</Button>,
  },
};

/**
 * Editor-page header — back link + Cancel/primary action. The underline reveal shouldn't
 * fight the actions layout (the title's reserved underline space is constant geometry).
 */
export const EditorHeader: Story = {
  args: {
    title: 'Topaz',
    back: { label: 'Loyalty Status', href: '#/' },
    action: (
      <>
        <Button variant="text">Cancel</Button>
        <Button variant="contained">Submit for approval</Button>
      </>
    ),
  },
};
