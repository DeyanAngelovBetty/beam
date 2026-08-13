import { useMemo } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { GameConfigEditor } from './GameConfigEditor';

/**
 * Bench for GameConfigEditor. VIEW-FIRST (approval-flow §6): a `:id` opens read-only (fields as
 * text, targeting rules read-only grid); Edit flips to the direct-write editor. `/new` = create.
 * Needs a DATA router (useBlocker).
 */
const meta: Meta = { title: 'Lab/Sunlight/GameConfigEditor', parameters: { layout: 'fullscreen' } };
export default meta;
type Story = StoryObj;

function At({ entry }: { entry: string }) {
  const router = useMemo(
    () =>
      createMemoryRouter(
        [
          { path: '/game-configs/new', element: <GameConfigEditor /> },
          { path: '/game-configs/:id', element: <GameConfigEditor /> },
          { path: '/game-configs', element: <div style={{ padding: 24 }}>Game Configs list</div> },
        ],
        { initialEntries: [entry] },
      ),
    [entry],
  );
  return <RouterProvider router={router} />;
}

/** View-first: an existing config opens READ-ONLY; Edit flips to the editor. */
export const ViewMode: Story = { render: () => <At entry="/game-configs/gc-mystery-box-default" /> };

/** Create → opens straight in the editor. */
export const Create: Story = { render: () => <At entry="/game-configs/new" /> };
