import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import { TableFilters } from './TableFilters';
import { defineTableFilters } from './TableFilters.helpers';
import { useTableFilters } from './hooks';

/**
 * TableFilters — the typed-definition filter bar (official Beam model). `definitions` describe the controls;
 * `useTableFilters` owns the draft/applied state + the Filter/Clear controller. Ported from beam-alex; our
 * hook syncs to the URL via react-router, so the story is wrapped in a MemoryRouter.
 */
interface DemoFilters {
  q: string;
  status: string;
  createdFrom: string | null;
}

const meta: Meta<typeof TableFilters<DemoFilters>> = {
  title: 'Components/TableFilters',
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div style={{ maxWidth: 900 }}>
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof meta>;

const definitions = defineTableFilters<DemoFilters>([
  { key: 'q', control: 'text', label: 'Search', placeholder: 'Search name or id' },
  {
    key: 'status',
    control: 'select',
    label: 'Status',
    options: [
      { label: 'Any', value: '' },
      { label: 'Active', value: 'active' },
      { label: 'Paused', value: 'paused' },
    ],
  },
  { key: 'createdFrom', control: 'dateTime', label: 'Created from' },
]);

function Demo() {
  const controller = useTableFilters<DemoFilters>({
    initialValues: { q: '', status: '', createdFrom: null },
  });
  return <TableFilters definitions={definitions} controller={controller} />;
}

export const Default: Story = { render: () => <Demo /> };
