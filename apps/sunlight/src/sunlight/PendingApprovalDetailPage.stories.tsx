import { useMemo } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { PendingApprovalDetailPage } from './PendingApprovalDetailPage';
import { submit, reject, getPendingFor } from './changeRequests';
import { getLoyaltyStatus, toDraft } from './loyaltyStatuses';
import { DEMO_MAKER, DEMO_CHECKER } from './currentUser';

/**
 * Bench for the CR detail route (/pending-approvals/:id) — view-first, a change request as a
 * record. PENDING shows [Reject] [Approve] (checker is the default actor ≠ the seed's maker, so
 * they're live); an ARCHIVED (rejected) CR renders the same page read-only with no actions.
 * Needs a DATA router. NOTE: the module store is shared across stories — approving/rejecting here
 * mutates it (a live tracer); the archive fixture below is created once, on a separate entity.
 */
const meta: Meta = { title: 'Lab/Sunlight/PendingApprovalDetail', parameters: { layout: 'fullscreen' } };
export default meta;
type Story = StoryObj;

// The seeded pending CR (Topaz, id 30) — authored by the maker.
const pendingId = getPendingFor('30')?.id ?? '';

// An archived (rejected) CR for the read-only variant — created once, on Opal (id 50) so it never
// collides with the seed. Maker submits, checker rejects → a browsable decision-history record.
const archivedId = (() => {
  const opal = getLoyaltyStatus('50');
  if (!opal) return '';
  const cr = submit({ entityType: 'loyaltyStatus', entityId: '50', entityName: opal.name, baseVersion: opal.version, baseSnapshot: toDraft(opal), draft: { ...toDraft(opal), multiplier: 2 }, submittedBy: DEMO_MAKER.name });
  reject(cr.id, DEMO_CHECKER.name, 'Demo archive fixture.');
  return cr.id;
})();

function At({ id }: { id: string }) {
  const router = useMemo(
    () =>
      createMemoryRouter(
        [
          { path: '/pending-approvals/:id', element: <PendingApprovalDetailPage /> },
          { path: '/pending-approvals', element: <div style={{ padding: 24 }}>Configuration Approvals list</div> },
        ],
        { initialEntries: [`/pending-approvals/${id}`] },
      ),
    [id],
  );
  return <RouterProvider router={router} />;
}

/** Pending record — both actions live (checker acting on the maker's request). */
export const Pending: Story = { render: () => <At id={pendingId} /> };

/** Archived (rejected) record — read-only, no actions; the decision history is browsable. */
export const ArchivedRejected: Story = { render: () => <At id={archivedId} /> };
