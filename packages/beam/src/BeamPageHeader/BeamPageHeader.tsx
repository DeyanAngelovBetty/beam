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
          <Typography
            variant="h4"
            component="h1"
            sx={{
              position: 'relative',
              // TEXT gradient — contrast-safe by construction: the left stop is pure
              // text-primary; only the far end mixes in --beam-title-tint of primary, so L
              // stays pinned near text. Clipped to the glyphs (WebkitTextFillColor guard).
              backgroundImage:
                'linear-gradient(to right, var(--mui-palette-text-primary), color-mix(in oklch, var(--mui-palette-primary-main) var(--beam-title-tint), var(--mui-palette-text-primary)))',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              WebkitTextFillColor: 'transparent',
              // Reserved block space for the underline — CONSTANT GEOMETRY: the ::after is
              // out of flow and this padding is fixed, so the scaleX reveal never shifts
              // layout (title wrap and the header's alignItems are unaffected).
              pb: 'calc(var(--beam-title-underline-weight) + 4px)',
              // Decorative UNDERLINE — the dramatic fade lives here. Under the FULL text box
              // (left:0/right:0 span the box), so a wrapping title gets ONE underline across
              // its box, not one per line. Reveal: left-anchored scaleX 0→1 on mount, via the
              // `move` motion pair; transform-only. Reduced-motion zeroes the duration → it
              // lands static at scaleX(1), visible (same standard as the gradient ring).
              '&::after': {
                content: '""',
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: 'var(--beam-title-underline-weight)',
                borderRadius: 'var(--beam-title-underline-weight)',
                backgroundImage:
                  'linear-gradient(to right, var(--mui-palette-primary-main), color-mix(in oklch, var(--mui-palette-primary-main) var(--beam-title-underline-fade), var(--mui-palette-background-default)))',
                transformOrigin: 'left',
                transform: 'scaleX(1)',
                animation:
                  'beam-title-underline-reveal var(--beam-motion-move-duration) var(--beam-motion-move-easing)',
              },
            }}
          >
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
