import type { MouseEvent } from 'react';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import type { BeamPageHeaderProps, BeamBackLink } from './BeamPageHeader.types';
import Box from '@mui/material/Box';

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
  color="text.secondary"
  variant="body2"
  underline="none"
  sx={{
    alignSelf: 'flex-start',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 0.5,
    '& .BeamPageHeader-backLabel': { textDecoration: 'none' },
    '&:hover .BeamPageHeader-backLabel, &:focus-visible .BeamPageHeader-backLabel': {
      textDecoration: 'underline',
      textUnderlineOffset: '0.2em',
    },
  }}
>
  <Box component="span" aria-hidden>&#60;-</Box>
  <span className="BeamPageHeader-backLabel">{back.label}</span>
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
        sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
      >
        <Stack spacing={0.5} sx={{ alignItems: 'flex-start' }}>
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
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            {secondaryActions}
            {action}
          </Stack>
        )}
      </Stack>

      {summary && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack direction="row" spacing={4} useFlexGap sx={{ flexWrap: 'wrap' }}>
            {summary}
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}
