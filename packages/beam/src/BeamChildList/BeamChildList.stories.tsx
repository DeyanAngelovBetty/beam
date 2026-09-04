import type { Meta, StoryObj } from '@storybook/react-vite';
import Box from '@mui/material/Box';
import { BeamChildList } from './BeamChildList';
import { BeamBool } from '../BeamStat/BeamStat';

/**
 * BeamChildList — the child-list summary organism (drill-down flows). A view-only summary of a
 * parent's child records: an identity-link column (the drill) + a few vital signs. No CRUD — the
 * identity link is the only interaction. First consumer: the Token Campaign detail's Wall Stages.
 */
const meta: Meta<typeof BeamChildList> = {
  title: 'Organisms/BeamChildList',
  component: BeamChildList,
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj<typeof BeamChildList>;

interface Stage {
  id: string;
  name: string;
  enabled: boolean;
  windows: number;
  start: string;
  finalOpen: string;
}

const STAGES: Stage[] = [
  { id: 's1', name: 'Stage 1', enabled: true, windows: 3, start: '2026-08-15', finalOpen: '2026-10-15' },
  { id: 's2', name: 'Stage 2', enabled: true, windows: 1, start: '2026-08-15', finalOpen: '2026-10-15' },
  { id: 's3', name: 'Stage 3', enabled: false, windows: 1, start: '2026-08-15', finalOpen: '2026-10-15' },
];

export const WallStages: Story = {
  render: () => (
    <Box sx={{ maxWidth: 720 }}>
      <BeamChildList<Stage>
        aria-label="Wall stages"
        title="Wall stages"
        rows={STAGES}
        getRowId={(s) => s.id}
        identityHeader="Stage"
        getIdentityLabel={(s) => s.name}
        getHref={(s) => `#/stages/${s.id}`}
        columns={[
          { key: 'enabled', header: 'Enabled', align: 'center', width: 100, render: (s) => <BeamBool value={s.enabled} /> },
          { key: 'windows', header: 'Additional Windows', align: 'right', width: 160, render: (s) => s.windows },
          { key: 'start', header: 'Start', align: 'right', width: 120, render: (s) => s.start },
          { key: 'finalOpen', header: 'Final Open', align: 'right', width: 120, render: (s) => s.finalOpen },
        ]}
      />
    </Box>
  ),
};

/** Empty — a stageless campaign renders the empty message, no table chrome. */
export const Empty: Story = {
  render: () => (
    <Box sx={{ maxWidth: 720 }}>
      <BeamChildList<Stage>
        aria-label="Wall stages"
        title="Wall stages"
        rows={[]}
        getRowId={(s) => s.id}
        identityHeader="Stage"
        getIdentityLabel={(s) => s.name}
        getHref={(s) => `#/stages/${s.id}`}
        columns={[]}
        emptyMessage="No stages yet."
      />
    </Box>
  ),
};
