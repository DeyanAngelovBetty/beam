import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box } from '@betty/beam';
import { ActingAsSwitcher } from './ActingAsSwitcher';

/**
 * The demo Acting-as switcher — an always-visible persona list (not a dropdown), so the four-eyes
 * walkthrough is one click per hop. Radio semantics (role="radiogroup"/"radio", aria-checked); the
 * selected persona carries the accent avatar. Lives in the shell's sidebar footer in the app; here
 * it's shown at rail width. NOTE: it drives the shared module store — clicking switches the global
 * demo actor (a live tracer).
 */
const meta: Meta<typeof ActingAsSwitcher> = {
  title: 'Lab/Sunlight/ActingAsSwitcher',
  component: ActingAsSwitcher,
  decorators: [
    (Story) => (
      <Box sx={{ width: 240, border: 1, borderColor: 'divider', borderRadius: 1, py: 1 }}>
        <Story />
      </Box>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof ActingAsSwitcher>;

/** Four personas (2 makers · 2 checkers), one click to switch. Click a row to change the actor. */
export const Default: Story = {};
