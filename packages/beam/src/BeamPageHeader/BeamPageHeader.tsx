import type { MouseEvent } from 'react';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import type { BeamPageHeaderProps, BeamBackLink } from './BeamPageHeader.types';
import Box from '@mui/material/Box';

/**
 * Header actions are sized by the ORGANISM, never the page (the showExpandedActions lesson: one
 * definition, no per-call-site drift). One constant, pinned as the default for the actions slot;
 * call sites pass NO size. `medium` is the size the estate mostly wears (list "New" buttons +
 * every detail editor's Cancel/Save/Edit). The nested theme reaches every button in the slot —
 * even Stack-wrapped — and it's a shallow patch, so all Beam palette/cssVariable styling is kept.
 */
const HEADER_ACTION_SIZE = 'medium' as const;

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
  <Box component="span" aria-hidden sx={{ fontSize: '1.1em', lineHeight: 1 }}>&#8592;</Box>
  <span className="BeamPageHeader-backLabel">{back.label}</span>
</Link>
  );
}

// Fixed row heights (Figma PageHeader, node 12745:68663) — constant geometry. The breadcrumb row is
// ALWAYS reserved (back link hidden when absent) so the title sits at the SAME Y on every page and
// list↔detail navigation never jumps. The subtitle row is NOT reserved — it collapses when absent
// (stable per-page identity, no cross-page-type toggle). Asymmetry rationale in detail-grammar §4.
const ROW = { breadcrumb: 26, title: 41, subtitle: 24 } as const;

export function BeamPageHeader({
  title,
  back,
  status,
  description,
  subtitle,
  action,
  secondaryActions,
  summary,
}: BeamPageHeaderProps) {
  // The ONE sub-title slot. `subtitle` wins; else the DEPRECATED status + description render into the
  // same row (status then description, inline, gap 1) so both keep working through the migration.
  const subtitleContent =
    subtitle ??
    (status || description ? (
      <>
        {status}
        {description}
      </>
    ) : null);

  return (
    <Stack spacing={0}>
      {/* Breadcrumb row — always present (reserved); back link when given, else empty. */}
      <Box sx={{ height: ROW.breadcrumb, display: 'flex', alignItems: 'center' }}>{back && <BackLink back={back} />}</Box>

      {/* Title row — title | actions. Actions pin to THIS row (not centred against the text column);
          the subtitle flows full-width beneath. */}
      <Box sx={{ minHeight: ROW.title, display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ minWidth: 0 }}>
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
        </Box>
        {/* Secondary actions sit to the left of the primary action. The organism pins their size
            (HEADER_ACTION_SIZE) via a shallow theme patch — call sites pass no size. */}
        {(action || secondaryActions) && (
          <ThemeProvider
            theme={(outer) =>
              createTheme(outer, {
                components: {
                  MuiButton: { defaultProps: { size: HEADER_ACTION_SIZE } },
                  MuiIconButton: { defaultProps: { size: HEADER_ACTION_SIZE } },
                },
              })
            }
          >
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexShrink: 0 }}>
              {secondaryActions}
              {action}
            </Stack>
          </ThemeProvider>
        )}
      </Box>

      {/* Sub-title row — the ONE subtitle slot, NOT reserved (collapses when absent). Provides the
          description voice (body2/secondary) so text subtitles inherit it and chips render as-is. */}
      {subtitleContent && (
        <Box sx={{ minHeight: ROW.subtitle, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, typography: 'body2', color: 'text.secondary' }}>
          {subtitleContent}
        </Box>
      )}

      {/* DEPRECATED summary strip (2 sites migrating to DetailsPanel; outlined Paper violates the
          container ruling). Kept working this release. */}
      {summary && (
        <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
          <Stack direction="row" spacing={4} useFlexGap sx={{ flexWrap: 'wrap' }}>
            {summary}
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}
