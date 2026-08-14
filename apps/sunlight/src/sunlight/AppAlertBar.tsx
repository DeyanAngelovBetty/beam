import type { ReactNode } from 'react';
import { Box, Stack, Typography } from '@betty/beam';

/**
 * AppAlertBar — a full-width, in-flow app-level alert BAR (the Clarity app-level-alert posture:
 * pushes content down, NOT a floating toast/snackbar). Severity-tinted surface + message + action,
 * meta-voice. The shell owns WHERE it sits (the `appAlert` slot); this owns how it LOOKS.
 *
 * Presentational only — the SHOW/HIDE transition (the whole app sliding down/up as the bar enters
 * or leaves) is owned by the wrapper that knows the bar's presence (PendingReviewAlert's grid
 * auto-height), because the shell can't observe whether an app-provided slot renders anything.
 *
 * PROPOSED ORGANISM, filling a real gap: our shared component set has only a transient toast, but a
 * STANDING condition (a queue awaiting review) needs a STANDING surface — a bar that's just there
 * until the condition clears. Product-local for now (BEAM.md §2); PROMOTION SOCKET: a plausible
 * Beam graduate once a second product needs a persistent app-alert. (Not a toast system — transient
 * outcome notices stay inline.)
 */
export function AppAlertBar({
  severity = 'info',
  message,
  action,
  'aria-label': ariaLabel,
}: {
  severity?: 'info' | 'success' | 'warning' | 'error';
  message: ReactNode;
  action?: ReactNode;
  'aria-label'?: string;
}) {
  return (
    <Box
      role="region"
      aria-label={ariaLabel ?? 'App alert'}
      sx={{
        width: '100%',
        // Severity tint via color-mix toward the page surface (the estate recipe) — a calm standing
        // bar, not an interrupt. A bottom rule in the full-strength severity colour anchors it.
        backgroundColor: `color-mix(in oklch, var(--mui-palette-${severity}-main) 14%, var(--mui-palette-background-default))`,
        borderBottom: '1px solid',
        borderColor: `${severity}.main`,
      }}
    >
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', px: { xs: 2, sm: 4, md: 7 }, py: 1 }}>
        <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }}>
          {message}
        </Typography>
        {action}
      </Stack>
    </Box>
  );
}
