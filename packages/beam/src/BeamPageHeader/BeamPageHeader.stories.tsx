import type { Meta, StoryObj } from '@storybook/react-vite';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import AddIcon from '@mui/icons-material/Add';
import { BeamPageHeader } from './BeamPageHeader';
import { DetailsPanel } from '../DetailsPanel/DetailsPanel';
import { BeamStat } from '../BeamStat/BeamStat';

/**
 * BeamPageHeader (ratified Figma pass, node 12745:68663) — three fixed rows: breadcrumb 26 (always
 * reserved), title 41 (title | actions), sub-title 24 (only when present). The title treatment
 * (gradient / halo / underline) is ratified as-is.
 */
const meta = {
  title: 'Organisms/BeamPageHeader',
  component: BeamPageHeader,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof BeamPageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TitleOnly: Story = { args: { title: 'Transactions' } };

/** The list-page shape: a primary "+ Add" CTA, right-aligned. */
export const WithPrimaryAction: Story = {
  args: {
    title: 'Users',
    subtitle: 'Operators with back-office access.',
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
    subtitle: 'Statuses, rewards, and progression rules for this jurisdiction.',
    secondaryActions: <Button variant="text">Export</Button>,
    action: <Button variant="contained">Quick actions</Button>,
  },
};

/** Detail page: back link (header anatomy, §4). Actions pin to the title line; subtitle flows beneath. */
export const WithBackLink: Story = {
  args: {
    title: 'Edna Schimmel',
    back: { label: 'Users', href: '#/users' },
    subtitle: 'Player ID 257291',
    action: <Button variant="contained">Edit</Button>,
  },
};

/** Back link, callback form — a screen-state "back" with no URL (renders a button). */
export const WithBackCallback: Story = {
  args: {
    title: 'Edna Schimmel',
    back: { label: 'Search', onClick: () => {} },
    subtitle: 'Player ID 257291',
    action: <Button variant="contained">Quick actions</Button>,
  },
};

/** Subtitle slot — none / text / chip / composed (chip + text, gap 1). */
export const SubtitleVariants: Story = {
  args: { title: 'Subtitle variants' },
  render: () => (
    <Box sx={{ display: 'grid', gap: 4 }}>
      <BeamPageHeader title="No subtitle" />
      <BeamPageHeader title="Text subtitle" subtitle="A plain description in the subtitle voice." />
      <BeamPageHeader title="Chip subtitle" subtitle={<Chip label="Pending" color="info" size="small" variant="outlined" />} />
      <BeamPageHeader
        title="Composed subtitle"
        subtitle={
          <>
            <Chip label="Active" color="success" size="small" variant="outlined" />
            <span>Updated 2026-08-27</span>
          </>
        }
      />
    </Box>
  ),
};

/**
 * List ↔ Detail — the title Y is IDENTICAL on both because the breadcrumb row is always reserved
 * (the list has no back link, the detail does; the title still sits at the same Y). Navigating
 * list→detail→list never jumps. The dashed guide marks the shared title top.
 */
export const ListDetailTitleConstancy: Story = {
  args: { title: 'Users' },
  render: () => (
    <Box sx={{ display: 'grid', gap: 5 }}>
      <Box>
        <Box sx={{ typography: 'overline', color: 'text.secondary' }}>List (no back link)</Box>
        <BeamPageHeader title="Users" subtitle="Operators with back-office access." action={<Button variant="contained" startIcon={<AddIcon />}>Add</Button>} />
      </Box>
      <Box>
        <Box sx={{ typography: 'overline', color: 'text.secondary' }}>Detail (back link)</Box>
        <BeamPageHeader title="Edna Schimmel" back={{ label: 'Users', href: '#/users' }} subtitle="Player ID 257291" action={<Button variant="contained">Edit</Button>} />
      </Box>
    </Box>
  ),
};

/** A record header + its DetailsPanel below (replaces the removed `summary` strip). */
export const RecordWithDetailsPanel: Story = {
  args: { title: 'Edna Schimmel' },
  render: () => (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <BeamPageHeader title="Edna Schimmel" back={{ label: 'Players', href: '#/players' }} subtitle="Player ID 257291" action={<Button variant="outlined">Quick actions</Button>} />
      <DetailsPanel aria-label="Player summary">
        <BeamStat label="Status" value="Approved" caption="Online" />
        <BeamStat label="Cash balance" value="$20.00" caption="CAD" />
        <BeamStat label="Betty coins" value="0" />
        <BeamStat label="Profit segment" value="Toddler" />
        <BeamStat label="RG risk" value="No risk" />
      </DetailsPanel>
    </Box>
  ),
};

/**
 * Long title stress — the underline exhibit. The rule spans width:100% up to
 * --beam-title-underline-max, so on this WRAPPING title it hugs the text then DISSOLVES (fade-to-
 * background far end = accent, not a ruler across the whole block) rather than running the full
 * multi-line width. Also confirms the gradient spans the box sanely. NOTE: a wrapping title exceeds
 * the fixed 41px title row (reported): the row grows, so a two-line title pushes its subtitle +
 * actions down. Single-line titles are the design's assumption.
 */
export const LongWrappingTitle: Story = {
  args: {
    title: 'Default MetaGame configuration for the Ontario weekend multiplier promotion',
    subtitle: 'A title long enough to wrap at most widths.',
    action: <Button variant="contained">Quick actions</Button>,
  },
};

/** Editor-page header — back link + Cancel/primary action. */
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
