import type { ReactNode } from 'react';
import { Box, Stack, Typography, IconButton } from '@betty/beam';
import type { SvgIconComponent } from '@mui/icons-material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import CloseIcon from '@mui/icons-material/Close';

/**
 * AppAlertBar — a full-width, in-flow app-level alert BAR (the Clarity app-level-alert posture:
 * a SOLID severity-filled bar that pushes content down, NOT a floating toast/snackbar). The shell
 * owns WHERE it sits (the `appAlert` slot); this owns how it LOOKS.
 *
 * Presentational only — the SHOW/HIDE transition (the whole app sliding down/up as the bar enters
 * or leaves) is owned by the wrapper that knows the bar's presence (PendingReviewAlert's grid
 * auto-height), because the shell can't observe whether an app-provided slot renders anything.
 *
 * POSTURE (Tanzu/Clarity reference):
 * - Solid severity fill (palette `<severity>.main`), no border, no tinting toward surface. A subtle
 *   "Betty glow" lifts it — a lit-from-above radial derived from the fill itself (§ below).
 * - Content colour is the severity's contrast pair (`<severity>.contrastText`), applied uniformly
 *   via `color` (currentColor) to the icon, message, CTA (outlined ghost), and dismiss.
 * - One centred cluster [icon · message · CTA]; dismiss (X) pinned top-right, outside the cluster.
 *
 * A11Y — severity is conveyed by the FILL and MUST also be conveyed by the TEXT: if the `message`
 * doesn't name the condition, that's the CALLER's job (colour is not a lone signal). Icon is
 * decorative (aria-hidden). role = `status` (info/success) or `alert` (warning/error — assertive
 * only where warranted). Dismiss carries its own aria-label; focus order is CTA → dismiss.
 *
 * CONTRAST — the MUI-default severity palette applies (the theme defines no severity seeds), and
 * its white contrastText fails WCAG AA 4.5:1 on several light-scheme fills (and dark error). This
 * is a palette-seed gap, flagged in the restyle report — NOT fudged here. Fix path: AA-compliant
 * severity seeds in tokens (a Figma decision), out of scope for a presentational restyle.
 *
 * PROPOSED ORGANISM filling a real gap (a STANDING condition needs a STANDING surface; our shared
 * set has only a transient toast). Product-local for now (BEAM.md §2); PROMOTION SOCKET once a
 * second product needs a persistent app-alert. A neutral/edit (non-severity) variant is DEFERRED
 * until a consumer wants it. (Not a toast system — transient outcome notices stay inline.)
 */

const SEVERITY: Record<'info' | 'warning' | 'error' | 'success', { Icon: SvgIconComponent; role: 'status' | 'alert' }> = {
  info: { Icon: InfoOutlinedIcon, role: 'status' },
  success: { Icon: CheckCircleOutlinedIcon, role: 'status' },
  warning: { Icon: WarningAmberOutlinedIcon, role: 'alert' },
  error: { Icon: ErrorOutlineOutlinedIcon, role: 'alert' },
};

export function AppAlertBar({
  severity = 'info',
  message,
  action,
  onDismiss,
  'aria-label': ariaLabel,
}: {
  severity?: 'info' | 'warning' | 'error' | 'success';
  message: ReactNode;
  /** The CTA. A plain MUI Button; the bar restyles it into an outlined currentColor ghost. */
  action?: ReactNode;
  /** Present → renders the dismiss X; absent → non-dismissible (no boolean to drift). */
  onDismiss?: () => void;
  'aria-label'?: string;
}) {
  const { Icon, role } = SEVERITY[severity];
  return (
    <Box
      role={role}
      aria-label={ariaLabel ?? 'App alert'}
      sx={{
        position: 'relative',
        width: '100%',
        // Content = the severity's contrast pair; currentColor carries it to icon, text, CTA, X.
        color: `var(--mui-palette-${severity}-contrastText)`,
        // Betty glow — a lit-from-above radial derived from the fill itself (the estate's idiom).
        // The two dials are component-local (NOT seeds), so the bench can tune the lift; it must
        // still read SOLID at a glance. Measured worst-case (glow peak) is in the contrast report.
        '--beam-alert-glow-mix': '85%',
        '--beam-alert-glow-extent': '60%',
        background: `radial-gradient(ellipse at 50% 0%, color-mix(in oklch, var(--mui-palette-${severity}-main) var(--beam-alert-glow-mix), white) 0%, transparent var(--beam-alert-glow-extent)), var(--mui-palette-${severity}-main)`,
      }}
    >
      {/* Centred cluster: [icon · message · CTA] as one unit. Symmetric horizontal padding leaves
          room for the pinned X and keeps the cluster centred even when the message wraps. */}
      <Stack
        direction="row"
        spacing={1.5}
        useFlexGap
        sx={{ flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', minHeight: 44, px: 6, py: 1 }}
      >
        <Icon fontSize="small" aria-hidden sx={{ flexShrink: 0 }} />
        <Typography variant="body2" sx={{ fontWeight: 500, textAlign: 'center' }}>
          {message}
        </Typography>
        {action && (
          // Restyle the caller's Button into the ghost CTA: currentColor border + label, uppercase.
          <Box
            sx={{
              flexShrink: 0,
              '& .MuiButton-root': { color: 'inherit', borderColor: 'currentColor', textTransform: 'uppercase' },
            }}
          >
            {action}
          </Box>
        )}
      </Stack>
      {onDismiss && (
        <IconButton
          aria-label="Dismiss alert"
          onClick={onDismiss}
          size="small"
          sx={{ position: 'absolute', top: 4, right: 4, color: 'inherit' }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      )}
    </Box>
  );
}
