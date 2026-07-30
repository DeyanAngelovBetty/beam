import type { MouseEvent } from 'react';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import type { BeamPageHeaderProps, BeamBackLink } from './BeamPageHeader.types';

/**
 * The breadcrumb back link (§4 anatomy). Real anchor when `href` is given;
 * SPA interception via `onClick` on plain left-click only (modified/middle
 * clicks reach the browser). No href → an accessible button (screen-state
 * callbacks with no URL).
 */
function BackLink({ back }: { back: BeamBackLink }) {
  const isAnchor = Boolean(back.href);
  const handleClick = (e: MouseEvent) => {
    if (!back.onClick) return;
    if (isAnchor) {
      // Let ⌘/ctrl/shift/middle clicks do their native thing (new tab, etc.).
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
    }
    back.onClick();
  };
  return (
    <Link
      component={isAnchor ? 'a' : 'button'}
      href={back.href}
      onClick={handleClick}
      underline="hover"
      color="text.secondary"
      variant="body2"
      sx={{ alignSelf: 'flex-start', cursor: 'pointer' }}
    >
      ← {back.label}
    </Link>
  );
}

export function BeamPageHeader({
  title,
  back,
  status,
  description,
  action,
  secondaryActions,
  summary,
}: BeamPageHeaderProps) {
  return (
    <Stack spacing={2}>
      {back && <BackLink back={back} />}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ sm: 'center' }}
        justifyContent="space-between"
      >
        <Stack spacing={0.5} alignItems="flex-start">
          <Typography variant="h4" component="h1">
            {title}
          </Typography>
          {/* Status/identity slot — under the title, above the description (§4). */}
          {status}
          {description && (
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          )}
        </Stack>
        {/* Secondary actions sit to the left of the primary action. */}
        {(action || secondaryActions) && (
          <Stack direction="row" spacing={1} alignItems="center">
            {secondaryActions}
            {action}
          </Stack>
        )}
      </Stack>

      {summary && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack direction="row" spacing={4} flexWrap="wrap" useFlexGap>
            {summary}
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}
