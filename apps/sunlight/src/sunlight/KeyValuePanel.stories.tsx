import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box } from '@betty/beam';
import { KeyValuePanel } from './KeyValuePanel';

/**
 * KeyValuePanel — the reusable labelled key/value grid. Each pair now renders as a BeamStat
 * (meta label · value · vertical keyline) — the panel owns the responsive grid + paper; BeamStat is
 * the atom. NEUTRAL facts only (no severity). State (status/operation chips) is NOT here — it lives
 * once in the page header (detail-grammar), so these stories carry identity + timestamps only.
 *
 * DENSITY CHECK (bench): view WithManyRows in BOTH schemes. If the keylines at this density read as
 * a picket fence rather than rhythm, that's a spacing/size dial call (Deyan) — flag, don't ship loud.
 */
const meta: Meta<typeof KeyValuePanel> = {
  title: 'Lab/Sunlight/KeyValuePanel',
  component: KeyValuePanel,
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj<typeof KeyValuePanel>;

export const RequestDetails: Story = {
  render: () => (
    <Box sx={{ maxWidth: 720 }}>
      <KeyValuePanel
        aria-label="Request details"
        items={[
          { label: 'ID', value: 'a1b2c3' },
          { label: 'Entity', value: 'Topaz' },
          { label: 'Type', value: 'Loyalty status' },
          { label: 'Submitted by', value: 'Maja Novak' },
          { label: 'Submitted at', value: '2026-08-11' },
          { label: 'Reviewed by', value: '—' },
        ]}
      />
    </Box>
  ),
};

/** Density variant — the full CR-detail row set (incl. a canceled CR's "Canceled at"). The stress
 *  case for the keyline rhythm in a grid of many; judge in both schemes. */
export const WithManyRows: Story = {
  render: () => (
    <Box sx={{ maxWidth: 720 }}>
      <KeyValuePanel
        aria-label="Request details"
        items={[
          { label: 'ID', value: 'a1b2c3' },
          { label: 'Entity', value: 'Topaz' },
          { label: 'Type', value: 'Loyalty status' },
          { label: 'Submitted by', value: 'Maja Novak' },
          { label: 'Submitted at', value: '2026-08-11' },
          { label: 'Reviewed by', value: '—' },
          { label: 'Reviewed at', value: '—' },
          { label: 'Canceled at', value: '2026-08-12' },
        ]}
      />
    </Box>
  ),
};
