import { useMemo } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { PayoutConfigEditor } from './PayoutConfigEditor';

/**
 * Bench for PayoutConfigEditor. Detail routes are VIEW-FIRST now (approval-flow §6): a `:id`
 * opens read-only (fields as text, payout rows read-only, probability total as a display value);
 * Edit flips to the direct-write editor ([Cancel] [Save]). `/new` opens straight in create mode.
 * Needs a DATA router (useBlocker).
 */
const meta: Meta = { title: 'Lab/Sunlight/PayoutConfigEditor', parameters: { layout: 'fullscreen' } };
export default meta;
type Story = StoryObj;

function At({ entry }: { entry: string }) {
  const router = useMemo(
    () =>
      createMemoryRouter(
        [
          { path: '/payout-configs/new', element: <PayoutConfigEditor /> },
          { path: '/payout-configs/:id', element: <PayoutConfigEditor /> },
          { path: '/payout-configs', element: <div style={{ padding: 24 }}>Payout Configs list</div> },
        ],
        { initialEntries: [entry] },
      ),
    [entry],
  );
  return <RouterProvider router={router} />;
}

/** View-first: an existing config opens READ-ONLY; Edit flips to the editor. */
export const ViewMode: Story = { render: () => <At entry="/payout-configs/pc-mystery-box-standard" /> };

/** Create has nothing to view → opens straight in the editor. */
export const Create: Story = { render: () => <At entry="/payout-configs/new" /> };
