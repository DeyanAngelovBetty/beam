import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import { PendingApprovalsPage } from './PendingApprovalsPage';
// REGISTRATION CONTRACT (doctrine, not decoration): PendingApprovalsPage only TYPE-imports
// the entity store, so in isolation nothing registers the 'loyaltyStatus' applicator and
// approve() would return { reason: 'unregistered' } — never a masqueraded 'notFound'.
// Importing the entity store HERE for its side effect (registration + the demo seed) is
// part of the consumer contract: whatever renders a reviewer surface must import every
// entity store whose requests it can approve. Every future entity type inherits this.
import './loyaltyStatuses';

/**
 * Lab bench for PendingApprovalsPage — the reviewer surface. Out of the box the store seeds
 * one pending CR authored by the maker (Maja) and the switcher defaults to the checker
 * (Ravi), so Approve/Reject are live. Switch "Acting as" to Maja to watch four-eyes disable
 * them (you can't approve your own change). NOTE: the store is shared module state, so
 * approving here consumes the seed for the other stories too — expected for a live tracer.
 */
const meta: Meta<typeof PendingApprovalsPage> = {
  title: 'Lab/Sunlight/PendingApprovalsPage',
  component: PendingApprovalsPage,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof PendingApprovalsPage>;

export const Default: Story = {};
