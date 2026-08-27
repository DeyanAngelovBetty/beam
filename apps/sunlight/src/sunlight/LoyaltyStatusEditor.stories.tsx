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
 * The view-mode pending alert is ACTOR-RELATIVE (approval-flow "Actor → action-set"):
 *  - Topaz (id 30) is the seed CR, submitted by the MAKER; the default actor is the checker → the
 *    REVIEWER voice ("… awaiting review", [Review] → CR page).
 *  - Emerald (id 40) below gets a CR submitted by the DEFAULT actor (checker), so viewing it reads
 *    as the REQUESTER voice ("You submitted …", [View request] · [Cancel]) without switching actor.
 * (LoyaltyStatusEditor value-imports the entity store, so registration + seed happen transitively.)
 */

// A pending CR authored by the default actor (checker) → the requester voice on Emerald (id 40).
(() => {
  if (pendingOnRecord('40').length) return;
  const emerald = getLoyaltyStatus('40');
  if (emerald) submit({ entityType: 'loyaltyStatus', entityId: '40', entityName: emerald.name, baseVersion: emerald.version, baseSnapshot: toDraft(emerald), draft: { ...toDraft(emerald), multiplier: 1.25 }, submittedBy: DEMO_CHECKER.name, submitReason: 'Requester-voice demo fixture.' });
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

/** The seeded status (Topaz, id 30) — view shows the pending NOTICE; Edit loads the draft + banner. */
export const WithPendingDraft: Story = { render: () => <At id="30" /> };

/** Pending as REVIEWER (Topaz, id 30, submitted by the maker; default actor = checker): the alert
 *  reads "… awaiting review" with [Review] → the CR page. */
export const PendingAsReviewer: Story = { render: () => <At id="30" /> };

/** Pending as REQUESTER (Emerald, id 40, submitted by the default checker): the alert reads
 *  "You submitted …" with [View request] · [Cancel] (the confirm travels with Cancel). */
export const PendingAsRequester: Story = { render: () => <At id="40" /> };

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

/** EDIT mode, no pending (Opal, id 50): the change-lifecycle strip is clean; the reason composer
 *  ("Describe this change for review") appears once the form goes DIRTY, and Submit stays disabled
 *  until it's filled (item 1). Type in a field to see the composer. */
export const EditComposer: Story = { render: () => <AtEdit id="50" /> };

/** EDIT mode with YOUR OWN pending (Emerald, id 40, submitted by the default checker): the strip
 *  shows the own-pending blocker — "You already have a pending request on this record — cancel it to
 *  submit a new change" — with an inline [Cancel request]. Submit is disabled until you cancel; then
 *  the strip flips to the composer (item 7). */
export const EditOwnPendingBlocked: Story = { render: () => <AtEdit id="40" /> };
