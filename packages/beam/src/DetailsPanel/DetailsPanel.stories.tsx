import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import { DetailsPanel } from './DetailsPanel';
import { BeamStat } from '../BeamStat/BeamStat';
import { BeamField } from '../BeamField/BeamField';
import { BeamSwitchField } from '../BeamSwitchField/BeamSwitchField';

/**
 * DetailsPanel — the unlabeled field panel that opens a detail page. Field twins as children:
 * BeamStat (view) morph to BeamField/BeamSwitchField (edit) in place. No title (position is the
 * convention), no buttons (they live in BeamPageHeader). A wide item spans via a gridColumn wrapper.
 */
const meta = {
  title: 'Organisms/DetailsPanel',
  component: DetailsPanel,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof DetailsPanel>;
export default meta;
type Story = StoryObj<typeof meta>;

const DESCRIPTION = 'Priority tier for high-volume players — a wide cell that spans the full panel row in both modes.';

/** View — every slot a BeamStat; the description spans the full row; the boolean is a peer. */
function ViewContent() {
  return (
    <>
      <BeamStat label="Name" value="Gold tier" />
      <BeamStat label="Status" value="Active" />
      <BeamStat label="Multiplier" value="1.5×" />
      <BeamStat label="Assigned only" value={false} />
      <Box sx={{ gridColumn: '1 / -1' }}>
        <BeamStat label="Description" value={DESCRIPTION} />
      </Box>
    </>
  );
}

/** Edit — the same slots as fields; heights pair with the view twins (44px floor, multiline grows). */
function EditContent() {
  const [assigned, setAssigned] = useState(false);
  return (
    <>
      <BeamField label="Name" defaultValue="Gold tier" />
      <BeamField select label="Status" defaultValue="Active">
        {['Active', 'Paused', 'Retired'].map((s) => (
          <MenuItem key={s} value={s}>{s}</MenuItem>
        ))}
      </BeamField>
      <BeamField label="Multiplier" defaultValue="1.5" />
      <BeamSwitchField name="assigned" label="Assigned only" checked={assigned} onChange={setAssigned} />
      <BeamField sx={{ gridColumn: '1 / -1' }} multiline minRows={3} label="Description" defaultValue={DESCRIPTION} />
    </>
  );
}

/** Mixed — editable + non-editable + disabled side by side. Non-editable values REMAIN stats while
 *  neighbours morph (no dimming this round — an open question); disabled-but-editable is a disabled
 *  field. */
function MixedContent() {
  const [assigned, setAssigned] = useState(true);
  return (
    <>
      <BeamField label="Name" defaultValue="Gold tier" />
      {/* Non-editable: stays a stat while its neighbours are fields. */}
      <BeamStat label="ID" value="30" caption="system" />
      <BeamField label="Multiplier" defaultValue="1.5" />
      {/* Disabled-but-editable: a disabled field. */}
      <BeamField label="Gem" defaultValue="topaz" disabled />
      <BeamSwitchField name="assigned2" label="Assigned only" checked={assigned} onChange={setAssigned} />
    </>
  );
}

export const View: Story = { args: { 'aria-label': 'Loyalty status', children: <ViewContent /> } };
export const Edit: Story = { args: { 'aria-label': 'Loyalty status', children: <EditContent /> } };
export const Mixed: Story = { args: { 'aria-label': 'Loyalty status', children: <MixedContent /> } };
