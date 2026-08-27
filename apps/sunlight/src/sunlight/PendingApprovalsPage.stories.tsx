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
import { submit, approve, reject, cancel, listAll } from './changeRequests';
import { getLoyaltyStatus, toDraft } from './loyaltyStatuses';
import { DEMO_MAKER, DEMO_CHECKER } from './currentUser';

// Seed a spread across ALL FIVE statuses so the multi-select filter + pending-first sort have
// something to bite on, on records no other story touches (1/20/80/90/100). Guarded so HMR / a
// second load doesn't double-seed. A live tracer — the store is shared module state.
(() => {
  if (listAll().some((cr) => cr.entityId === '80')) return; // already seeded
  const mk = (recordId: string, mult: number, by: string, reason: string) => {
    const s = getLoyaltyStatus(recordId);
    if (!s) return null;
    const r = submit({ entityType: 'loyaltyStatus', entityId: recordId, entityName: s.name, baseVersion: s.version, baseSnapshot: toDraft(s), draft: { ...toDraft(s), multiplier: mult }, submittedBy: by, submitReason: reason });
    return r.ok ? r.cr.id : null;
  };
  const approved = mk('80', 1.7, DEMO_MAKER.name, 'Approved-history fixture.');
  if (approved) approve(approved, DEMO_CHECKER.name, 'Looks right.');
  const rejected = mk('90', 3, DEMO_MAKER.name, 'Rejected-history fixture.');
  if (rejected) reject(rejected, DEMO_CHECKER.name, 'Too high.');
  const canceled = mk('100', 2.2, DEMO_MAKER.name, 'Canceled-history fixture.');
  if (canceled) cancel(canceled, DEMO_MAKER.name);
  const winner = mk('20', 1.2, DEMO_MAKER.name, 'Winning proposal.');
  mk('20', 1.4, DEMO_CHECKER.name, 'Rival proposal (will be outdated).');
  if (winner) approve(winner, DEMO_CHECKER.name); // outdates the rival on record 20
})();

/**
 * Lab bench for PendingApprovalsPage — the reviewer surface. Out of the box the store seeds the
 * CONTEST: two competing pendings on Topaz (Maja's 1.75 vs Ivan's 1.6), so the list opens with a
 * real choice; the switcher defaults to the checker (Ravi), so Approve/Reject are live. Switch
 * "Acting as" to a maker to watch four-eyes disable them on their own row. The block above adds one
 * CR in each terminal status so the status multi-select + pending-first sort are demonstrable — so
 * the Default story shows the contest (2 pending, top) plus approved/rejected/canceled/outdated
 * history. NOTE: the store is shared module state — a live tracer; acting here mutates it.
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
