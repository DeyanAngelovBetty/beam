import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box, Chip } from '@betty/beam';
import { KeyValuePanel } from './KeyValuePanel';

/**
 * KeyValuePanel — the reusable labelled key/value grid (meta-voice labels, responsive columns).
 * Values are ReactNodes, so chips/links drop in beside plain text. Its first consumer is the
 * Pending Approval detail page's Request-details panel; promotion to @betty/beam awaits a second.
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
          { label: 'Operation', value: <Chip label="Update" size="small" variant="outlined" /> },
          { label: 'Status', value: <Chip label="Pending" color="info" size="small" variant="outlined" /> },
          { label: 'Submitted by', value: 'Maja Novak' },
          { label: 'Submitted at', value: '2026-08-11' },
          { label: 'Reviewed by', value: '—' },
        ]}
      />
    </Box>
  ),
};
