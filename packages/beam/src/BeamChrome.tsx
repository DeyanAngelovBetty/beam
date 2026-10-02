import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';
import { chromePlatterLayers } from './theme/platter';
import { PAGE_GUTTER, BORDER_RADIUS_24, CHROME_PLATTER_OFFSET } from './theme/tokens';
import { BEAM_GLASS_FILTER_ID } from './BeamSvgDefs';

/**
 * BeamChrome — the `chrome` platter preset as a COMPONENT, so chrome surfaces (dialogs, popovers, menus, the
 * Theme Lab drawer) get the structure right BY CONSTRUCTION instead of re-deriving it (2026-10-02).
 *
 * It bakes in the three things a chrome platter needs — learned the hard way converting the Theme Lab:
 *   1. a CLEAN outer wrap that carries the platter `::after` — no `overflow` (it would CLIP the outward
 *      fringe), no background (it would HIDE the z-−1 fringe), no `backdrop-filter` of its own (a COMPETING
 *      filter breaks the platter's). The scroll + the solid surface live on the INNER panel.
 *   2. a SOLID inner panel (background.paper0 + the 1px edge) — the thing the viewer reads; it occludes the
 *      platter centre so the glass shows only as the fringe.
 *   3. the FLOAT GAP — `gap` (default `PAGE_GUTTER`) of margin so the panel floats off the frame on every side
 *      it's placed against, and the fringe shows ALL ROUND (not just one edge). This is the chrome rule; it
 *      lives here, not on each consumer.
 *
 * POSITIONING is the consumer's job: place BeamChrome inside a positioned, height-bounded parent (it defaults
 * to `position:absolute; inset:0` to fill one), and run any slide/scale TRANSFORM on that PARENT — never on
 * BeamChrome itself, so the platter wrap stays transform-free. The glass refraction needs `<BeamSvgDefs/>`
 * mounted somewhere in the document (AppShell renders it; mount it yourself in shell-less contexts).
 */
export interface BeamChromeProps {
  children?: ReactNode;
  /** Float gap to the frame (spacing units) — the fringe shows within it. Default `PAGE_GUTTER`. */
  gap?: number | { xs: number; md: number };
  /** Panel corner radius (px). Default `BORDER_RADIUS_24`. */
  radius?: number;
  /** Platter outward extent (px). Default the chrome offset (`CHROME_PLATTER_OFFSET`, 12). */
  offset?: number;
  /** Extra sx for the OUTER wrap — positioning goes here (default `position:absolute; inset:0`). */
  sx?: SxProps<Theme>;
  /** Extra sx for the SOLID inner panel — e.g. padding. */
  innerSx?: SxProps<Theme>;
  /** Forwarded to the outer wrap (role/aria for the surface). */
  role?: string;
  'aria-label'?: string;
}

export function BeamChrome({
  children,
  gap = PAGE_GUTTER,
  radius = BORDER_RADIUS_24,
  offset = CHROME_PLATTER_OFFSET,
  sx,
  innerSx,
  role,
  'aria-label': ariaLabel,
}: BeamChromeProps) {
  return (
    <Box
      role={role}
      aria-label={ariaLabel}
      sx={[
        // Clean outer wrap: the SHARED chrome platter — two coexisting layers (glass + gradient) gated by the
        // `--beam-chrome-*-on` vars, so a fill flip in the Theme Lab swaps THIS fringe and the nav's in one
        // paint. Reads `--beam-chrome-offset` live (fallback = the `offset` prop). NO overflow / bg /
        // backdrop-filter here — those are the three traps.
        chromePlatterLayers({ offset: `var(--beam-chrome-offset, ${offset}px)`, radius, refract: BEAM_GLASS_FILTER_ID }),
        { position: 'absolute', inset: 0, m: gap }, // fills a positioned parent; `position` wins over platter's relative
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {/* SOLID inner panel — the readable surface; owns scroll + padding so the outer wrap's fringe isn't clipped. */}
      <Box
        sx={[
          {
            height: '100%',
            bgcolor: 'background.paper0',
            border: '1px solid var(--beam-nav-edge)',
            borderRadius: `${radius}px`,
            cornerShape: 'squircle',
            overflow: 'auto',
          },
          ...(Array.isArray(innerSx) ? innerSx : [innerSx]),
        ]}
      >
        {children}
      </Box>
    </Box>
  );
}
