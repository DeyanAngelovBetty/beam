import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import { BeamSwitchField } from './BeamSwitchField';

/**
 * BeamSwitchField — the edit twin of a boolean BeamStat (44px outlined field, meta notch label,
 * a Switch). Shown on a paper surface (the notch mask assumes surface-1). Placeholder visuals.
 */
const meta = {
  title: 'Organisms/BeamSwitchField',
  component: BeamSwitchField,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof BeamSwitchField>;
export default meta;
type Story = StoryObj<typeof meta>;

function Bench() {
  const [active, setActive] = useState(true);
  const [locked, setLocked] = useState(false);
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap' }}>
        <BeamSwitchField name="active" label="Active" checked={active} onChange={setActive} />
        <BeamSwitchField name="locked" label="Locked" checked={locked} onChange={setLocked} />
        <BeamSwitchField name="disabled" label="Read only" checked disabled />
      </Stack>
    </Paper>
  );
}

export const Default: Story = { render: () => <Bench />, args: { label: 'Active', checked: true } };
