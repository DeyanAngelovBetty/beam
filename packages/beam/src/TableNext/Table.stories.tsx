import type { Meta, StoryObj } from '@storybook/react-vite';
import Box from '@mui/material/Box';
import { TableNext } from './Table';
import { beamCells } from './beamCells';
import { useClientPagination } from './useClientPagination';
import type { ColumnDef } from '@tanstack/react-table';

/**
 * The Wave-2 official-API Table port (coexists with the current organism `Table` until the migration
 * batches). Columns are raw TanStack `ColumnDef`s, authored terse via `beamCells`; pagination is the
 * official 1-based controlled contract, fed here by the `useClientPagination` demo adapter.
 */
type Person = { name: string; province: string; age: number; tier: string; coins: number };

const data: Person[] = [
  { name: 'Mara', province: 'Ontario', age: 31, tier: 'Gold', coins: 12400 },
  { name: 'Toshko', province: 'Alberta', age: 27, tier: 'Silver', coins: 8800 },
  { name: 'Goshko', province: 'Alberta', age: 19, tier: 'Bronze', coins: 3200 },
  { name: 'Bobko', province: 'Ontario', age: 57, tier: 'Platinum', coins: 21900 },
  { name: 'Zarko', province: 'Alberta', age: 32, tier: 'Bronze', coins: 700 },
];

const columns: ColumnDef<Person, unknown>[] = [
  beamCells.text({ id: 'name', header: 'Name', accessor: (p) => p.name }),
  beamCells.text({ id: 'province', header: 'Province', accessor: (p) => p.province }),
  beamCells.number({ id: 'age', header: 'Age', accessor: (p) => p.age }),
  beamCells.text({ id: 'tier', header: 'Tier', accessor: (p) => p.tier }),
  beamCells.number({ id: 'coins', header: 'Coins', accessor: (p) => p.coins }),
];

const meta: Meta = {
  title: 'Components/Table (Wave 2 port)',
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj;

export const Basic: Story = {
  render: () => (
    <Box sx={{ maxWidth: 720 }}>
      <TableNext data={data} columns={columns} getRowId={(p) => p.name} aria-label="People" />
    </Box>
  ),
};

export const Empty: Story = {
  render: () => (
    <Box sx={{ maxWidth: 720 }}>
      <TableNext data={[]} columns={columns} getRowId={(p) => p.name} emptyMessage="Nothing to display." aria-label="People" />
    </Box>
  ),
};

/** Sorting is an explicit lane opt-in (`sortable`) — off by default, so official-subset renders no sort. */
export const Sortable: Story = {
  render: () => (
    <Box sx={{ maxWidth: 720 }}>
      <TableNext data={data} columns={columns} getRowId={(p) => p.name} sortable aria-label="People" />
    </Box>
  ),
};

export const Actions: Story = {
  render: () => (
    <Box sx={{ maxWidth: 720 }}>
      <TableNext
        data={data}
        columns={columns}
        getRowId={(p) => p.name}
        aria-label="People"
        actionRail={{
          expand: (p) => <>Name: {p.name} · Province: {p.province} · Age: {p.age}</>,
          select: { onSelect: () => undefined, onSelectAll: () => undefined },
          menu: (p) => [
            { id: 'view', label: 'View', onSelect: () => alert(`view ${p.name}`) },
            { id: 'delete', label: 'Delete', destructive: true, onSelect: () => alert(`delete ${p.name}`) },
          ],
        }}
      />
    </Box>
  ),
};

const pageData: Person[] = Array.from({ length: 32 }, (_, i) => ({ ...data[i % data.length], name: `${data[i % data.length].name} ${i + 1}` }));

export const Paginated: Story = {
  render: function PaginatedStory() {
    const { pageRows, pagination, totalCount } = useClientPagination(pageData, { defaultPageSize: 10 });
    return (
      <Box sx={{ maxWidth: 720 }}>
        <TableNext data={pageRows} columns={columns} getRowId={(p) => p.name} pagination={pagination} totalCount={totalCount} aria-label="People" />
      </Box>
    );
  },
};
