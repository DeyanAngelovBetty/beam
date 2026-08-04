import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box, Stack, Typography, Checkbox } from '@betty/beam';
import { ItemRow, ItemDot } from './ItemRow';
import { ProvenanceTicks } from './ItemBox';

/**
 * Lab bench for the app-local ItemRow — the shared row skeleton behind
 * RolesRail and ItemBox. Scaffold only: the states come from
 * detail-page-grammar §5/§6 (view row, edit checked/unchecked, dimmed via
 * linking, provenance marker), not invented. No styling beyond what ItemRow
 * and the parked stubs already render.
 *
 * A Lab entry is a question, not a home (BEAM.md §9).
 */

// The bench never links anything — inert handlers stand in for useLinking's set.
const noopHandlers = {
  onMouseEnter: () => {},
  onMouseLeave: () => {},
  onFocus: () => {},
  onBlur: () => {},
};

type MarkerKind = 'dot' | 'checkbox' | 'ticks';

interface DemoArgs {
  mode: 'view' | 'edit';
  label: string;
  dimmed: boolean;
  marker: MarkerKind;
  /** Edit rows only: drives the checkbox and the ungranted (disabled) label. */
  checked: boolean;
}

/** Maps the synthetic bench args onto a real ItemRow. */
function DemoRow({ mode, label, dimmed, marker, checked }: DemoArgs) {
  const isEdit = mode === 'edit';

  const markerNode =
    marker === 'ticks' ? (
      <ProvenanceTicks roleIds={['player-ops', 'live-ops']} />
    ) : marker === 'checkbox' ? (
      <Checkbox size="small" checked={checked} onChange={() => {}} slotProps={{ input: { 'aria-label': label } }} sx={{ p: 0 }} />
    ) : (
      <ItemDot />
    );

  return (
    <ItemRow
      linkKind="permission"
      linkId="demo"
      handlers={noopHandlers}
      dimmed={dimmed}
      tabIndex={isEdit ? undefined : 0}
      marker={markerNode}
      label={
        <Typography variant="body2" sx={{ color: isEdit && !checked ? 'text.disabled' : 'text.primary' }}>
          {label}
        </Typography>
      }
    />
  );
}

const meta = {
  title: 'Lab/Sunlight/ItemRow',
  render: (args) => (
    <Box sx={{ maxWidth: 360 }}>
      <DemoRow {...args} />
    </Box>
  ),
  args: { mode: 'view', label: 'View player overview', dimmed: false, marker: 'dot', checked: true },
  argTypes: {
    mode: { control: 'radio', options: ['view', 'edit'] },
    marker: { control: 'radio', options: ['dot', 'checkbox', 'ticks'] },
    label: { control: 'text' },
    dimmed: { control: 'boolean' },
    checked: { control: 'boolean' },
  },
} satisfies Meta<DemoArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** View row — read-only, dot marker. */
export const ViewRow: Story = {
  args: { mode: "view", marker: 'dot', label: 'View player overview' },
};

/** Edit row, granted — checkbox checked, label at full strength. */
export const EditRowChecked: Story = {
  args: { mode: 'edit', marker: 'checkbox', checked: true, label: 'View transactions' },
};

/** Edit row, not granted — checkbox unchecked, label dimmed (text.disabled). */
export const EditRowUnchecked: Story = {
  args: { mode: 'edit', marker: 'checkbox', checked: false, label: 'Adjust balances' },
};

/** A long §6 label that wraps to two lines. */
export const WrappingLabel: Story = {
  args: {
    mode: 'view',
    marker: 'dot',
    label: 'Refund transactions and reverse settled payments up to the configured daily limit',
  },
};

/** Dimmed by linking — the opacity the row takes when another item is active. */
export const DimmedByLinking: Story = {
  args: { mode: 'view', marker: 'dot', label: 'View loyalty', dimmed: true },
};

/** Provenance ticks in the marker slot — the parked stub, on the bench, styling untouched. */
export const WithProvenanceTicks: Story = {
  args: { mode: 'view', marker: 'ticks', label: 'Grant loyalty rewards' },
};

/** All states, stacked for side-by-side eyeballing. */
export const AllStates: Story = {
  render: () => (
    <Stack spacing={1} sx={{ maxWidth: 360 }}>
      <DemoRow mode="view" marker="dot" label="View player overview" dimmed={false} checked />
      <DemoRow mode="edit" marker="checkbox" checked label="View transactions" dimmed={false} />
      <DemoRow mode="edit" marker="checkbox" checked={false} label="Adjust balances" dimmed={false} />
      <DemoRow
        mode="view"
        marker="dot"
        label="Refund transactions and reverse settled payments up to the configured daily limit"
        dimmed={false}
        checked
      />
      <DemoRow mode="view" marker="dot" label="View loyalty" dimmed checked />
      <DemoRow mode="view" marker="ticks" label="Grant loyalty rewards" dimmed={false} checked />
    </Stack>
  ),
};
