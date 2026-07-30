import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import Button from '@mui/material/Button';
import LockResetIcon from '@mui/icons-material/LockReset';
import BlockIcon from '@mui/icons-material/Block';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import { BeamRowMenu } from './BeamRowMenu';
import type { BeamRowAction } from './BeamRowMenu.types';

/**
 * The per-record overflow menu. Labeled items, destructive grouped last
 * behind an error divider, ineligible items disabled with a reason.
 */
const meta = {
  title: 'Organisms/BeamRowMenu',
  component: BeamRowMenu,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof BeamRowMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

const ITEMS: BeamRowAction[] = [
  { id: 'reset', label: 'Reset password', icon: <LockResetIcon fontSize="small" />, onSelect: () => {} },
  {
    id: 'deactivate',
    label: 'Deactivate',
    icon: <BlockIcon fontSize="small" />,
    onSelect: () => {},
    disabled: true,
    disabledReason: 'This user is already inactive.',
  },
  {
    id: 'delete',
    label: 'Delete',
    icon: <DeleteIcon fontSize="small" />,
    onSelect: () => {},
    destructive: true,
  },
];

/** Open the menu from a trigger — the real usage lives in a table rail. */
export const Default: Story = {
  args: { anchorEl: null, open: false, onClose: () => {}, items: ITEMS },
  render: () => {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    return (
      <>
        <Button variant="outlined" onClick={(e) => setAnchorEl(e.currentTarget)}>
          Open row menu
        </Button>
        <BeamRowMenu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          items={ITEMS}
        />
      </>
    );
  },
};

const DUPLICATE_DELETE: BeamRowAction[] = [
  { id: 'duplicate', label: 'Duplicate', icon: <ContentCopyIcon fontSize="small" />, onSelect: () => {} },
  {
    id: 'delete',
    label: 'Delete',
    icon: <DeleteIcon fontSize="small" />,
    onSelect: () => {},
    destructive: true,
    disabled: true,
    disabledReason: 'This role is assigned to 41 users.',
  },
];

/** A destructive item that is also ineligible — disabled, with a reason. */
export const DestructiveDisabled: Story = {
  args: { anchorEl: null, open: false, onClose: () => {}, items: DUPLICATE_DELETE },
  render: () => {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    return (
      <>
        <Button variant="outlined" onClick={(e) => setAnchorEl(e.currentTarget)}>
          Open role menu
        </Button>
        <BeamRowMenu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          items={DUPLICATE_DELETE}
        />
      </>
    );
  },
};
