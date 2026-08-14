import type { Meta, StoryObj } from '@storybook/react-vite';
import { Stack } from '@betty/beam';
import { CRStatusChip } from './changeRequestChips';
import type { ChangeRequestStatus } from './changeRequests';

/**
 * CR-status badge mapping — the page-local CR vocabulary (deliberately NOT BeamStatus). Five words
 * now: pending (info) · approved (success) · rejected (error) · superseded (neutral) · withdrawn
 * (neutral — a requester's own retraction, NOT the reviewer's red rejected).
 */
const meta: Meta<typeof CRStatusChip> = {
  title: 'Lab/Sunlight/CRStatusChip',
  component: CRStatusChip,
};
export default meta;
type Story = StoryObj<typeof CRStatusChip>;

const ALL: ChangeRequestStatus[] = ['pending', 'approved', 'rejected', 'superseded', 'withdrawn'];

export const AllStatuses: Story = {
  render: () => (
    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
      {ALL.map((s) => (
        <CRStatusChip key={s} status={s} />
      ))}
    </Stack>
  ),
};
