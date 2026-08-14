import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box, Button, Stack, Typography } from '@betty/beam';
import { AppAlertBar } from './AppAlertBar';

/**
 * AppAlertBar — the full-width, in-flow app-level alert bar (pushes content down; not a toast).
 * A proposed organism filling the persistent-messaging gap: a standing condition wants a standing
 * surface. Severity-tinted, message + action, reduced-motion-safe entrance.
 */
const meta: Meta<typeof AppAlertBar> = {
  title: 'Lab/Sunlight/AppAlertBar',
  component: AppAlertBar,
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof AppAlertBar>;

const review = <Button size="small" variant="outlined">Review</Button>;

export const Info: Story = {
  render: () => <AppAlertBar severity="info" aria-label="Review queue" message="2 change requests await your review" action={review} />,
};

export const Warning: Story = {
  render: () => <AppAlertBar severity="warning" message="Provider health degraded — some routes may be affected." action={<Button size="small" variant="outlined">Details</Button>} />,
};

/** In context — the bar sits above page content and pushes it down. */
export const InContext: Story = {
  render: () => (
    <Box>
      <AppAlertBar severity="info" aria-label="Review queue" message="1 change request awaits your review" action={review} />
      <Stack spacing={1} sx={{ p: 4 }}>
        <Typography variant="h5">Page content</Typography>
        <Typography variant="body2" color="text.secondary">…is pushed down by the bar, not covered by it.</Typography>
      </Stack>
    </Box>
  ),
};
