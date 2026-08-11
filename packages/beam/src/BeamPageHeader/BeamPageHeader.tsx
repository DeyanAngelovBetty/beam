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
          {/* The title renders TWICE inside one h1: a HALO clone underneath (impersonates
              the canvas to carve a skip-ink gap between glyph edges and the underline) and
              the GRADIENT fill on top (defines the box). text-shadow can't do this — with
              background-clip:text the gradient IS the background and a shadow paints above
              it, smearing the fill; a layered clone separates cleanly. The halo is
              aria-hidden + unselectable, so the title announces & copies ONCE. */}
          <Typography
            variant="h4"
            component="h1"
            sx={{
              position: 'relative',
              // Isolate so the z-ladder stays LOCAL — a bare negative z falls behind PARENT
              // backgrounds (the old inline -1 worked by accident of ambient stacking).
              // Ladder inside this context, bottom → top: underline ::after (z1) · halo (z2)
              // · gradient (z3).
              isolation: 'isolate',
              // Reserved block space — CONSTANT GEOMETRY: the ::after is out of flow and this
              // padding is fixed, so the scaleX reveal never shifts layout.
              pb: 'calc(var(--beam-title-underline-weight) + 4px)',
              // UNDERLINE (z1, bottom) — tucked BEHIND the glyphs (marker posture) by
              // --beam-title-underline-offset. Under the FULL text box (one line, not per
              // line). Reveal: scaleX 0→1 on mount, `move` pair, transform-only; reduced
              // motion zeroes the duration → lands static at scaleX(1), visible.
              '&::after': {
                content: '""',
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 'var(--beam-title-underline-offset)',
                zIndex: 1,
                height: 'var(--beam-title-underline-weight)',
                borderRadius: 'var(--beam-title-underline-weight)',
                backgroundImage:
                  'linear-gradient(to right, var(--mui-palette-primary-main), color-mix(in oklch, var(--mui-palette-primary-main) var(--beam-title-underline-fade), var(--mui-palette-background-default)))',
                transformOrigin: 'left',
                transform: 'scaleX(1)',
                animation:
                  'beam-title-underline-reveal var(--beam-motion-move-duration) var(--beam-motion-move-easing)',
              },
              // HALO clone (z2) — absolute over the box, so it tracks the fill's wrapping for
              // free. Colour = the CANVAS (background.default), NEVER a black literal (the
              // anchor changes this afternoon), with a soft same-colour blur
              // (--beam-title-halo). Halo 0px = separation off. aria-hidden + no
              // pointer/select → the title is announced & copied once.
              '& .BeamPageHeader-titleHalo': {
                position: 'absolute',
                inset: 0,
                zIndex: 2,
                pointerEvents: 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                color: 'var(--mui-palette-background-default)',
                textShadow: '0 0 var(--beam-title-halo) var(--mui-palette-background-default)',
              },
              // GRADIENT fill (z3, top) — in NORMAL FLOW, so it DEFINES the box (the halo
              // tracks it → wrapping stays correct for free). Contrast-safe: left stop pure
              // text-primary, far end mixes --beam-title-tint of primary → L pinned near text.
              '& .BeamPageHeader-titleFill': {
                position: 'relative',
                zIndex: 3,
                backgroundImage:
                  'linear-gradient(to right, var(--mui-palette-text-primary), color-mix(in oklch, var(--mui-palette-primary-main) var(--beam-title-tint), var(--mui-palette-text-primary)))',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                WebkitTextFillColor: 'transparent',
              },
            }}
          >
            <span aria-hidden className="BeamPageHeader-titleHalo">
              {title}
            </span>
            <span className="BeamPageHeader-titleFill">{title}</span>
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
