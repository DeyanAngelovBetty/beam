import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import type { ColumnDef } from '@tanstack/react-table';
import { TableNext } from './Table';
import { beamCells } from './beamCells';
import { Table } from '../Table/Table';
import type { BeamColumn } from '../Table/Table.types';

/**
 * ROW-STATES REGRESSION HARNESS — the state matrix we were owing (surfaced by the 2026-09-23 dark-mode
 * split: a hovered/selected row lit its rail cell but not its data cells). Renders BOTH Table trees — the
 * Wave-2 port (`TableNext`) and the organism `Table` — with rows forced into each state in ONE frame, so a
 * row-state regression is visible at a glance instead of waiting for an eyeball on a real screen.
 *
 * THE INVARIANT to verify: in every row state, the leading action-rail cell and the data cells read as ONE
 * surface — same resolved colour, no seam — in ALL FOUR states (rest / hover / selected / selected+hover)
 * and in BOTH modes (flip the Storybook `mode` global). The rail is opaque (it can't show data columns
 * through as it sticks under horizontal scroll), so its wash is LAYERED over its paper; the data cells are
 * transparent and take the row's wash. Both must resolve to the same colour — which only holds if both use
 * mode-aware CSS vars (the bug was the port painting data washes from theme LITERALS baked to the light
 * scheme). Statically visible here: SELECTED (port, pre-selected row) and HIGHLIGHT (both trees). HOVER and
 * EXPANDED/NESTED are one gesture away — hover any row, expand any row — since :hover can't be forced
 * without a pseudo-states addon.
 */

type Row = { id: string; name: string; province: string; age: number; tier: string; coins: number };

const rows: Row[] = [
  { id: '1', name: 'Mara', province: 'Ontario', age: 31, tier: 'Gold', coins: 12400 },
  { id: '2', name: 'Toshko', province: 'Alberta', age: 27, tier: 'Silver', coins: 8800 },
  { id: '3', name: 'Goshko', province: 'Alberta', age: 19, tier: 'Bronze', coins: 3200 },
  { id: '4', name: 'Bobko', province: 'Ontario', age: 57, tier: 'Platinum', coins: 21900 },
];

// Port columns (raw TanStack ColumnDefs via beamCells) and organism columns (BeamColumn) — same data, two
// authoring surfaces, so the harness exercises each tree's real render path.
const nextColumns: ColumnDef<Row, unknown>[] = [
  beamCells.text({ id: 'name', header: 'Name', accessor: (r) => r.name }),
  beamCells.text({ id: 'province', header: 'Province', accessor: (r) => r.province }),
  beamCells.number({ id: 'age', header: 'Age', accessor: (r) => r.age }),
  beamCells.text({ id: 'tier', header: 'Tier', accessor: (r) => r.tier }),
  beamCells.number({ id: 'coins', header: 'Coins', accessor: (r) => r.coins }),
];

const orgColumns: BeamColumn<Row>[] = [
  { key: 'name', header: 'Name', render: (r) => r.name },
  { key: 'province', header: 'Province', render: (r) => r.province },
  { key: 'age', header: 'Age', render: (r) => r.age, align: 'right' },
  { key: 'tier', header: 'Tier', render: (r) => r.tier },
  { key: 'coins', header: 'Coins', render: (r) => r.coins, align: 'right' },
];

const nestedRows: Row[] = rows.slice(0, 2);

/** The expansion payload — a NESTED table, so nested-row washes get the same one-glance check as top-level. */
function NestedPanel() {
  return (
    <Box sx={{ p: 1 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
        Nested table — its rows must hover/select as one surface too.
      </Typography>
      <TableNext data={nestedRows} columns={nextColumns} getRowId={(r) => r.id} aria-label="Nested rows" />
    </Box>
  );
}

function Frame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Stack spacing={1}>
      <Typography variant="overline" color="text.secondary">
        {title}
      </Typography>
      {children}
    </Stack>
  );
}

const meta: Meta = {
  title: 'Components/Table/Row states (regression harness)',
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj;

export const RowStates: Story = {
  render: function RowStatesStory() {
    // Controlled selection so a row starts SELECTED (static seam check); still toggleable so hover-over-
    // selected is one gesture away.
    const [selection, setSelection] = useState<Record<string, boolean>>({ '2': true });
    return (
      <Stack spacing={4} sx={{ maxWidth: 860 }}>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Row-state invariant — rail + data cells are ONE surface, no seam
          </Typography>
          <Typography variant="body2" color="text.secondary" component="div">
            Row <strong>2</strong> starts selected; row <strong>3</strong> is highlighted. Verify, in{' '}
            <strong>both</strong> modes (flip the <code>mode</code> global):
            <Box component="ul" sx={{ m: 0, mt: 0.5, pl: 2.5 }}>
              <li>the forced rows show a continuous wash across the rail cell AND the data cells;</li>
              <li>hover any row (incl. the selected one, and under horizontal scroll) — still one surface;</li>
              <li>expand a row — the nested table's rows tint the same way.</li>
            </Box>
          </Typography>
        </Paper>

        <Frame title="Wave-2 port (TableNext) — sticky rail">
          <TableNext
            data={rows}
            columns={nextColumns}
            getRowId={(r) => r.id}
            rowSelection={selection}
            onRowSelectionChange={setSelection}
            highlightRowId="3"
            expandAll={false}
            aria-label="Port row states"
            actionRail={{
              select: { onSelect: () => undefined, onSelectAll: () => undefined },
              menu: (r) => [{ id: 'view', label: `View ${r.name}`, onSelect: () => undefined }],
              expand: () => <NestedPanel />,
            }}
          />
        </Frame>

        <Frame title="Organism Table — the pre-migration tree (unchanged; MUI paints its washes from vars)">
          <Table
            columns={orgColumns}
            rows={rows}
            getRowId={(r) => r.id}
            selectable
            highlightRowId="3"
            renderExpanded={() => <NestedPanel />}
            aria-label="Organism row states"
          />
        </Frame>
      </Stack>
    );
  },
};
