import { useMemo } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { LoyaltyStatusEditor } from './LoyaltyStatusEditor';
import { submit, pendingOnRecord } from './changeRequests';
import { getLoyaltyStatus, toDraft } from './loyaltyStatuses';
import { DEMO_CHECKER } from './currentUser';

/**
 * Lab bench for LoyaltyStatusEditor. It's a GOVERNED entity, so the route opens VIEW-FIRST
 * (approval-flow.md §6): read-only anatomy + an explicit **Edit** action that flips to the editor.
 * The editor uses useParams + useBlocker, so it needs a DATA router (createMemoryRouter).
 *
 * The view-mode pending alert is ACTOR-AGNOSTIC (grammar §5, 2026-08-28): ONE universal voice —
 * just the pending count on the record, the same for every actor, + [View change requests] to the
 * type-filtered approvals list. No requester/reviewer split; acting on requests is the approvals
 * surface's job.
 *  - Topaz (id 30) is the seeded CONTEST — TWO pendings → "2 change requests pending".
 *  - Emerald (id 40) below gets one CR → "1 change request pending" (singular copy).
 * (LoyaltyStatusEditor value-imports the entity store, so registration + seed happen transitively.)
 */

// A single pending CR on Emerald (id 40) → the singular-count universal voice.
(() => {
  if (pendingOnRecord('40').length) return;
  const emerald = getLoyaltyStatus('40');
  if (emerald) submit({ entityType: 'loyaltyStatus', entityId: '40', entityName: emerald.name, baseVersion: emerald.version, baseSnapshot: toDraft(emerald), draft: { ...toDraft(emerald), multiplier: 1.25 }, submittedBy: DEMO_CHECKER.name, submitReason: 'Single-pending demo fixture.' });
})();
const meta: Meta = {
  title: 'Lab/Sunlight/LoyaltyStatusEditor',
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

function At({ id }: { id: string }) {
  const router = useMemo(
    () =>
      createMemoryRouter(
        [
          { path: '/loyalty-status/:id', element: <LoyaltyStatusEditor /> },
          { path: '/', element: <div style={{ padding: 24 }}>Loyalty Status list</div> },
        ],
        { initialEntries: [`/loyalty-status/${id}`] },
      ),
    [id],
  );
  return <RouterProvider router={router} />;
}

/** View-first: a status with no pending request (Opal, id 50) opens READ-ONLY; Edit flips to the editor. */
export const ViewMode: Story = { render: () => <At id="50" /> };

/** Pending on the record — CONTESTED (Topaz, id 30, seeded with TWO competing pendings). The
 *  page-level alert is the ONE UNIVERSAL VOICE (same for every actor, 2026-08-28): "2 change requests
 *  pending on this record." + [View change requests] → the approvals list filtered by feature TYPE. */
export const PendingContested: Story = { render: () => <At id="30" /> };

/** Pending on the record — SINGLE (Emerald, id 40, one pending): the same universal voice, singular
 *  copy — "1 change request pending on this record." No requester/reviewer split, no Cancel here. */
export const PendingSingle: Story = { render: () => <At id="40" /> };

/** An unknown id → the empty state. */
export const NotFound: Story = { render: () => <At id="999" /> };

// Edit-mode variant of At — opens straight in the editor (nav state {edit:true}), so the
// change-lifecycle strip is on screen without a click.
function AtEdit({ id }: { id: string }) {
  const router = useMemo(
    () =>
      createMemoryRouter(
        [
          { path: '/loyalty-status/:id', element: <LoyaltyStatusEditor /> },
          { path: '/', element: <div style={{ padding: 24 }}>Loyalty Status list</div> },
        ],
        { initialEntries: [{ pathname: `/loyalty-status/${id}`, state: { edit: true } }] },
      ),
    [id],
  );
  return <RouterProvider router={router} />;
}

/** EDIT mode, no pending (Opal, id 50): the OPTIONAL "Change description" is the DetailsPanel's
 *  full-width FIRST ROW (gridColumn 1 / -1), PRESENT from entry, DISABLED until the form goes dirty —
 *  constant geometry, no mid-edit jump (reasons are optional; it never gates Submit). Type in a field
 *  to watch it enable. */
export const EditComposer: Story = { render: () => <AtEdit id="50" /> };

/** EDIT mode on a record that ALREADY has a pending (Emerald, id 40): no blocker anymore
 *  (2026-08-28, multi-pending) — editing is never blocked; submitting simply ADDS another CR and the
 *  record's pending count rises. The strip has no own-pending warning; only the imported cue (absent
 *  here) would show. */
export const EditWithExistingPending: Story = { render: () => <AtEdit id="40" /> };
