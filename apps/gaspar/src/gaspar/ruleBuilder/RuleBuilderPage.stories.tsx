import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box } from '@betty/beam';
import { RuleBuilderPage } from './RuleBuilderPage';

/**
 * Rule Builder — the ReactFlow canvas editor + grid lens, over the demo routing rule set.
 *
 * Honest-canvas demo (the Lab surfaces-board precedent): this renders the REAL page component with
 * the REAL seed store, inside a themed Storybook iframe — the override/edit machinery is live, not
 * mocked. Drag nodes, connect (the grammar refuses invalid drops), select → inspector, flip to the
 * grid lens, Import/Export. The seed is a plausible card-routing set (EU + provider-health →
 * Stripe/Adyen/Checkout) so it demos itself to a payments audience.
 *
 * @xyflow/react is themed purely through its --xy-* variables mapped to Beam tokens (GraphLens),
 * mirroring the dockview precedent — no colour literals, no stylesheet fork.
 */
const meta: Meta<typeof RuleBuilderPage> = {
  title: 'Gaspar/Rule Builder',
  component: RuleBuilderPage,
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof RuleBuilderPage>;

export const Default: Story = {
  render: () => (
    <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: 'background.default' }}>
      <RuleBuilderPage />
    </Box>
  ),
};
