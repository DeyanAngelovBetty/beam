import { useMemo } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { MetaGamePresetEditor } from './MetaGamePresetEditor';

/**
 * Bench for MetaGamePresetEditor. VIEW-FIRST (approval-flow §6): a `:id` opens read-only (all
 * preset fields as text + image preview); Edit flips to the direct-write editor. `/new` = create.
 * Needs a DATA router (useBlocker).
 */
const meta: Meta = { title: 'Lab/Sunlight/MetaGamePresetEditor', parameters: { layout: 'fullscreen' } };
export default meta;
type Story = StoryObj;

function At({ entry }: { entry: string }) {
  const router = useMemo(
    () =>
      createMemoryRouter(
        [
          { path: '/meta-game-presets/new', element: <MetaGamePresetEditor /> },
          { path: '/meta-game-presets/:id', element: <MetaGamePresetEditor /> },
          { path: '/meta-game-presets', element: <div style={{ padding: 24 }}>MetaGame Presets list</div> },
        ],
        { initialEntries: [entry] },
      ),
    [entry],
  );
  return <RouterProvider router={router} />;
}

/** View-first: an existing preset opens READ-ONLY; Edit flips to the editor. */
export const ViewMode: Story = { render: () => <At entry="/meta-game-presets/preset-mystery-box-daily-reward" /> };

/** Create → opens straight in the editor. */
export const Create: Story = { render: () => <At entry="/meta-game-presets/new" /> };
