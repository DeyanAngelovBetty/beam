import { useMemo } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { PendingApprovalDetailPage } from './PendingApprovalDetailPage';
import { submit, reject, approve, pendingOnRecord } from './changeRequests';
import { getLoyaltyStatus, toDraft } from './loyaltyStatuses';
import { DEMO_MAKER, DEMO_CHECKER } from './currentUser';

/**
 * Bench for the CR detail route (/pending-approvals/:id) — view-first, a change request as a
 * record. Actions follow the actor's RELATIONSHIP: PENDING by someone else → [Reject] [Approve]
 * (checker is the default actor ≠ the seed's maker); PENDING by you → [Cancel] only (OwnPending,
 * a CR authored by the default checker); an ARCHIVED CR renders read-only with no actions.
 * Needs a DATA router. NOTE: the module store is shared across stories — approving/rejecting here
 * mutates it (a live tracer); the fixtures below are each created once, on separate entities.
 */
const meta: Meta = { title: 'Lab/Sunlight/PendingApprovalDetail', parameters: { layout: 'fullscreen' } };
export default meta;
type Story = StoryObj;

// The seeded pending CR (Topaz, id 30) — authored by the maker.
const pendingId = pendingOnRecord('30')[0]?.id ?? '';

// An archived (rejected) CR for the read-only variant — created once, on Opal (id 50) so it never
// collides with the seed. Maker submits, checker rejects → a browsable decision-history record.
const archivedId = (() => {
  const opal = getLoyaltyStatus('50');
  if (!opal) return '';
  const cr = submit({ entityType: 'loyaltyStatus', entityId: '50', entityName: opal.name, baseVersion: opal.version, baseSnapshot: toDraft(opal), draft: { ...toDraft(opal), multiplier: 2 }, submittedBy: DEMO_MAKER.name, submitReason: 'Demo archive fixture.' });
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

// An OWN-pending CR — submitted BY the default actor (checker), so viewing it own=true → [Cancel].
const ownPendingId = (() => {
  const em = getLoyaltyStatus('60');
  if (!em) return '';
  const cr = submit({ entityType: 'loyaltyStatus', entityId: '60', entityName: em.name, baseVersion: em.version, baseSnapshot: toDraft(em), draft: { ...toDraft(em), multiplier: 3 }, submittedBy: DEMO_CHECKER.name, submitReason: 'Own-pending demo fixture.' });
  return cr.id;
})();

// An OUTDATED CR — the §2 auto-transition. Two makers propose on Ruby (id 70); approving one
// outdates the other. We view the LOSER (submitted by the default checker, so it's browsable as an
// own archived outcome). Created once on its own record.
const outdatedId = (() => {
  const ruby = getLoyaltyStatus('70');
  if (!ruby) return '';
  const winner = submit({ entityType: 'loyaltyStatus', entityId: '70', entityName: ruby.name, baseVersion: ruby.version, baseSnapshot: toDraft(ruby), draft: { ...toDraft(ruby), multiplier: 1.5 }, submittedBy: DEMO_MAKER.name, submitReason: 'The proposal that wins.' });
  const loser = submit({ entityType: 'loyaltyStatus', entityId: '70', entityName: ruby.name, baseVersion: ruby.version, baseSnapshot: toDraft(ruby), draft: { ...toDraft(ruby), multiplier: 1.9 }, submittedBy: DEMO_CHECKER.name, submitReason: 'The rival proposal (will be outdated).' });
  approve(winner.id, DEMO_CHECKER.name); // approving the winner outdates the loser
  return loser.id;
})();

/** Pending record, someone else's — both review actions live (checker acting on the maker's request). */
export const Pending: Story = { render: () => <At id={pendingId} /> };

/** Outdated record — a sibling CR was approved, so this one is terminal: an explicit outdated banner,
 *  the diff shown as a historical (non-actionable) record, no approve/reject. */
export const Outdated: Story = { render: () => <At id={outdatedId} /> };

/** Own pending record — the requester sees [Cancel] ONLY (no greyed-out Approve/Reject). */
export const OwnPending: Story = { render: () => <At id={ownPendingId} /> };

/** Archived (rejected) record — read-only, no actions; the decision history is browsable. */
export const ArchivedRejected: Story = { render: () => <At id={archivedId} /> };
