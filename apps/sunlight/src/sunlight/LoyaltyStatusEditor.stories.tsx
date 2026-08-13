import { useMemo } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { LoyaltyStatusEditor } from './LoyaltyStatusEditor';

/**
 * Lab bench for LoyaltyStatusEditor. It's a GOVERNED entity, so the route opens VIEW-FIRST
 * (approval-flow.md §6): read-only anatomy + an explicit **Edit** action that flips to the editor.
 * The editor uses useParams + useBlocker, so it needs a DATA router (createMemoryRouter).
 *
 * Topaz (id 30) is the seeded pending CR: VIEW shows it as a pending NOTICE; clicking Edit seeds
 * the form from that draft (multiplier 1.75) and shows the "editing a pending request" banner.
 * (LoyaltyStatusEditor value-imports the entity store, so registration + seed happen transitively.)
 */
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

/** An unknown id → the empty state. */
export const NotFound: Story = { render: () => <At id="999" /> };
