import { useMemo } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { ChainedExperienceEditor } from './ChainedExperienceEditor';
import { ChainedExperiencesPage } from './ChainedExperiencesPage';

const meta: Meta = { title: 'Lab/Sunlight/ChainedExperiences', parameters: { layout: 'fullscreen' } };
export default meta;
type Story = StoryObj;

function At({ entry, edit = false }: { entry: string; edit?: boolean }) {
  const router = useMemo(() => createMemoryRouter([
    { path: '/chained-experiences', element: <ChainedExperiencesPage /> },
    { path: '/chained-experiences/new', element: <ChainedExperienceEditor /> },
    { path: '/chained-experiences/:id', element: <ChainedExperienceEditor /> },
  ], { initialEntries: [{ pathname: entry, state: { edit } }] }), [entry, edit]);
  return <RouterProvider router={router} />;
}

export const List: Story = { render: () => <At entry="/chained-experiences" /> };
export const Create: Story = { render: () => <At entry="/chained-experiences/new" /> };
export const View: Story = { render: () => <At entry="/chained-experiences/chain-wheel-default" /> };
export const Edit: Story = { render: () => <At entry="/chained-experiences/chain-wheel-default" edit /> };
