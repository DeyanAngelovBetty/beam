import type { SxProps, Theme } from '@mui/material/styles';

/**
 * beamGradientBorder — opt-in "lit edge" treatment. A conic gradient rim drawn by an
 * absolutely-positioned `::after` that sits just OUTSIDE the element and grows OUTWARD
 * on hover (1px calm → 2px), so the card's own box never changes size and nothing in
 * layout moves. Replaces the earlier inset-mask (which only made the border look thinner
 * from the inside); this genuinely grows the rim outward.
 *
 * WHY A PSEUDO, NOT `scale()`: growth is an ABSOLUTE px change (`--beam-ring`), so a
 * narrow KPI card and a wide Trend card get the same 2px rim — `scale()` is relative
 * (mismatched rims across a row) and distorts the corner radius. `--beam-ring` is a
 * registered `@property <length>` so it INTERPOLATES; unregistered it would snap.
 *
 * CONCENTRIC CORNERS: the pseudo's radius is `card-radius + ring` and grows with the
 * ring, so the rim stays concentric with the corner instead of pinching. `radius` MUST
 * equal the element's own border-radius (default 24 = `MuiPaper.rounded`).
 *
 * SQUIRCLE: `corner-shape` does NOT inherit to pseudo-elements, so it is set EXPLICITLY
 * on the pseudo to match a squircle surface (see docs/derived-color-tokens.md). Without
 * it the rim would be a plain-radius ring around a squircle card — an obvious mismatch.
 *
 * STACKING: `z-index: -1` puts the rim behind the element's own background — the outward
 * ring shows on the page, the center is hidden under the card, so it never paints over
 * content, and an over-reaching rim tucks behind a neighbour instead of colliding. This
 * relies on the element NOT establishing its own stacking context (no transform/opacity/
 * filter/z-index on it); every current consumer complies.
 *
 * SURFACE: `surface` MUST be the actual surface behind the element (a var) — the stops
 * mix toward it so it's a lit edge, not a rainbow. Defaults to `background.paper`
 * (surface 1); pass `--beam-surface-2/-3` for Menu/Dialog.
 *
 * ANIMATION: `interactive` runs the rotation PAUSED on the pseudo and resumes it on hover
 * (never restarts — that would snap back to initial-value), lifts the intensity, and
 * grows the ring to 2px. It stays paused under prefers-reduced-motion — static but lit.
 * The angle var (`inherits: false`) is animated ON the pseudo so it reaches the gradient.
 *
 * TRACK (`track`): the pointer leads, the bright sector follows. Instead of the spin, the rim's
 * `from` angle reads --beam-track-angle (an INHERITING var the element writes via
 * usePointerAngleTracking), so the bright stop faces the cursor on hover. Keeps the 1→2px grow +
 * intensity lift; drops the spin. The angle rides a transition so writes ease: MOVE (longer) at
 * rest so it eases home, overridden to QUICK (shorter, magnetic) while `[data-beam-tracking]` is on
 * (the hook sets that attr on enter, removes on leave). Mutually exclusive with `interactive`.
 *
 * The `@property --beam-ring`, `--beam-border-angle`, `--beam-track-angle`, the keyframes, and the
 * intensity vars are registered once in `createBeamTheme` (MuiCssBaseline).
 */
export function beamGradientBorder(opts?: {
  surface?: string;
  interactive?: boolean;
  /** Pointer-tracked bright sector (opt-in flourish; pair with usePointerAngleTracking on the same
   *  element's ref). Supersedes `interactive`'s spin — keeps the hover grow, drops the rotation. */
  track?: boolean;
  radius?: number;
}): SxProps<Theme> {
  const surface = opts?.surface ?? 'var(--mui-palette-background-paper)';
  const track = opts?.track ?? false;
  const interactive = (opts?.interactive ?? false) && !track; // track supersedes the spin
  const hoverGrow = interactive || track; // both lift intensity + grow the ring 1→2px on hover
  const radius = opts?.radius ?? 24; // must equal the element's border-radius (MuiPaper.rounded)
  const i = 'var(--beam-border-intensity)';
  const stops = [
    `color-mix(in oklch, var(--mui-palette-primary-main) ${i}, ${surface})`,
    `color-mix(in oklch, var(--beam-gradient-hue-b) ${i}, ${surface})`,
    `color-mix(in oklch, oklch(from var(--mui-palette-primary-main) l c calc(h + 45)) ${i}, ${surface})`,
    `color-mix(in oklch, var(--mui-palette-primary-main) ${i}, ${surface})`, // wrap back to hue-a
  ].join(', ');

  return {
    // The pseudo is the containing block's out-of-flow rim; the element itself carries
    // NO border (the pseudo is the entire rim — a 1px own-border would double it).
    position: 'relative',
    border: 'none',
    '&::after': {
      content: '""',
      position: 'absolute',
      // Negative inset → grows OUTWARD; the element's box is never touched. Radius
      // tracks the ring so the rim stays concentric with the corner.
      inset: 'calc(-1 * var(--beam-ring))',
      borderRadius: `calc(${radius}px + var(--beam-ring))`,
      cornerShape: 'squircle', // corner-shape does NOT inherit — set explicitly to match the card
      border: 'var(--beam-ring) solid transparent',
      // Spin mode reads --beam-border-angle (pseudo-animated); track mode reads --beam-track-angle
      // (element-written, inherited here). Same first stop = the bright sector either way.
      background: `conic-gradient(from ${track ? 'var(--beam-track-angle)' : 'var(--beam-border-angle)'}, ${stops}) border-box`,
      pointerEvents: 'none',
      // Behind the card's own bg: outward ring shows, center hidden → never over content.
      zIndex: -1,
      // Registered <length>/<angle> → interpolate; the motion tokens respect reduced-motion. In
      // track mode the angle eases at the LONGER (move) rate at rest — that is the ease-home.
      transition: track
        ? '--beam-ring var(--beam-motion-quick), --beam-track-angle var(--beam-motion-move)'
        : '--beam-ring var(--beam-motion-quick)',
      ...(interactive && {
        animation: 'beam-border-spin 6s linear infinite',
        animationPlayState: 'paused',
      }),
    },
    ...(hoverGrow && {
      '&:hover': {
        // Intensity is a plain (inheriting) var, so lifting it on the element reaches
        // the pseudo's stops.
        '--beam-border-intensity': 'var(--beam-border-intensity-hover)',
      },
      '&:hover::after': {
        // `--beam-ring` is `inherits: false`, so grow it ON the pseudo, and (spin only) resume the
        // rotation from where it paused (never restart).
        '--beam-ring': '2px',
        ...(interactive && { animationPlayState: 'running' }),
      },
    }),
    ...(interactive && {
      // Reduced motion: never resume the spin. Still lit; the ring still grows (the
      // motion token's duration is zeroed, so it snaps rather than glides).
      '@media (prefers-reduced-motion: reduce)': {
        '&:hover::after': { animationPlayState: 'paused' },
      },
    }),
    ...(track && {
      // While the hook is actively tracking, the angle eases at the SHORT (quick) rate — a magnetic
      // lean, not lag. Removing the attr (pointerleave) reverts to the move-rate ease-home above.
      '&[data-beam-tracking="on"]::after': {
        transition: '--beam-ring var(--beam-motion-quick), --beam-track-angle var(--beam-motion-quick)',
      },
    }),
  };
}
