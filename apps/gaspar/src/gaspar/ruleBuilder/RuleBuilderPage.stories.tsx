import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box } from '@betty/beam';
import { RuleBuilderPage } from './RuleBuilderPage';

/**
 * Rule Builder (RuleSet v2) — the engine's rule TREE, two lenses over one tree. Tree-as-truth: the
 * canvas is a derived projection (deterministic layout, labeled True/False/step edges), so there is
 * no free placement to drift. Select a node → the inspector edits it (data-driven fact picker keyed
 * on the catalog's valueType/enumType, an operator picker, per-type action editors, add step / add
 * else / delete under the tree guards). Flip to the grid lens for a scannable flatten. Import opens
 * an engine rule file unmodified (or migrates a v1 rule set with a warnings panel); Export emits the
 * engine schema natively.
 *
 * Honest-canvas demo (the Lab surfaces-board precedent): the REAL page + REAL seed store (the
 * sanitized `acme-main` routing policy, built on the demo facts catalog), live, not mocked.
 * @xyflow/react is themed purely through its --xy-* variables mapped to Beam tokens — no colour
 * literals, no stylesheet fork.
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
