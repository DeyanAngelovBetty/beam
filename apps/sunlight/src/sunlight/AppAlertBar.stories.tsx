import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box, Button, Stack, Typography } from '@betty/beam';
import { AppAlertBar } from './AppAlertBar';

/**
 * AppAlertBar — the full-width, in-flow app-level alert bar (Clarity posture: a solid severity
 * fill that pushes content down, not a toast). Severity fill + contrast-pair content + Betty glow.
 * View each story under both mode globals to see both schemes.
 */
const meta: Meta<typeof AppAlertBar> = {
  title: 'Lab/Sunlight/AppAlertBar',
  component: AppAlertBar,
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof AppAlertBar>;

const review = <Button size="small" variant="outlined">Review</Button>;

/** All four severities stacked — the glow should read as a quiet lift, the bar still solid. */
export const Severities: Story = {
  render: () => (
    <Stack>
      <AppAlertBar severity="info" message="2 change requests await your review" action={review} />
      <AppAlertBar severity="success" message="Configuration approved — the new revision is live." action={review} />
      <AppAlertBar severity="warning" message="Provider health degraded — some routes may be affected." action={<Button size="small" variant="outlined">Details</Button>} />
      <AppAlertBar severity="error" message="Settlement export failed — retry required before cut-off." action={<Button size="small" variant="outlined">Retry</Button>} />
    </Stack>
  ),
};

/** Dismissible — onDismiss present → the X renders (top-right, outside the cluster). */
export const WithDismiss: Story = {
  render: () => (
    <AppAlertBar severity="info" message="2 change requests await your review" action={review} onDismiss={() => {}} />
  ),
};

/** Non-dismissible — no onDismiss → no X (the pending-review standing condition uses this). */
export const NonDismissible: Story = {
  render: () => <AppAlertBar severity="info" message="2 change requests await your review" action={review} />,
};

/** Long message — the cluster wraps and stays centred; the X stays pinned top-right. */
export const LongMessage: Story = {
  render: () => (
    <Box sx={{ maxWidth: 520, mx: 'auto', border: 1, borderColor: 'divider' }}>
      <AppAlertBar
        severity="warning"
        message="A provider outage is affecting settlement routing across several jurisdictions; review the affected records and re-run any exports that stalled before the daily cut-off."
        action={<Button size="small" variant="outlined">Details</Button>}
        onDismiss={() => {}}
      />
    </Box>
  ),
};

/** In context — the bar sits above page content and pushes it down. */
export const InContext: Story = {
  render: () => (
    <Box>
      <AppAlertBar severity="info" message="1 change request awaits your review" action={review} />
      <Stack spacing={1} sx={{ p: 4 }}>
        <Typography variant="h5">Page content</Typography>
        <Typography variant="body2" color="text.secondary">…is pushed down by the bar, not covered by it.</Typography>
      </Stack>
    </Box>
  ),
};
