import { useMemo } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { LoyaltyStatusEditor } from './LoyaltyStatusEditor';

/**
 * Lab bench for LoyaltyStatusEditor. The editor uses useParams + useBlocker, so it needs a
 * DATA router (createMemoryRouter), not just MemoryRouter. Editing Topaz (id 30) shows the
 * pending-draft path: the store's demo seed is a pending CR on Topaz, so the editor loads
 * that draft (multiplier 1.75) and shows the "editing a pending request" banner.
 * (LoyaltyStatusEditor value-imports the entity store, so registration + seed happen here
 * transitively — no explicit side-effect import needed, unlike the approvals story.)
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

/** A status with no pending request (Opal, id 50) — a clean edit from live. */
export const CleanEdit: Story = { render: () => <At id="50" /> };

/** The seeded status (Topaz, id 30) — loads the pending draft + shows the banner. */
export const WithPendingDraft: Story = { render: () => <At id="30" /> };

/** An unknown id → the empty state. */
export const NotFound: Story = { render: () => <At id="999" /> };
