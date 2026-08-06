import type { SxProps, Theme } from '@mui/material/styles';

/**
 * beamGradientBorder — opt-in "lit edge" treatment (Kevin Powell's two-background
 * technique). A conic gradient painted in `border-box` shows only through a 1px
 * transparent border; a solid `padding-box` layer of the actual surface masks
 * the interior. Reuses the page-mesh tint points (primary · hue-b · primary+45°)
 * mixed toward the surface, so border and background come from one palette.
 *
 * CONSTANT GEOMETRY: the border is `1px solid transparent` at ALL times — calm is
 * just a low-intensity conic, so nothing appears on hover and nothing reflows.
 *
 * SURFACE: `surface` MUST be the actual surface behind the element (a var), or the
 * padding-box mask is wrong. Defaults to `background.paper` (surface 1); pass
 * `--beam-surface-2/-3` for Menu/Dialog.
 *
 * ANIMATION: `interactive` runs the rotation PAUSED and resumes it on hover (never
 * restarts — that would snap back to initial-value), and lifts the intensity. It
 * stays paused under prefers-reduced-motion — static but still visible.
 *
 * The `@property --beam-border-angle`, the keyframes, and the intensity vars are
 * registered once in `createBeamTheme` (MuiCssBaseline).
 */
export function beamGradientBorder(opts?: {
  surface?: string;
  interactive?: boolean;
}): SxProps<Theme> {
  const surface = opts?.surface ?? 'var(--mui-palette-background-paper)';
  const interactive = opts?.interactive ?? false;
  const i = 'var(--beam-border-intensity)';
  const stops = [
    `color-mix(in oklch, var(--mui-palette-primary-main) ${i}, ${surface})`,
    `color-mix(in oklch, var(--beam-gradient-hue-b) ${i}, ${surface})`,
    `color-mix(in oklch, oklch(from var(--mui-palette-primary-main) l c calc(h + 45)) ${i}, ${surface})`,
    `color-mix(in oklch, var(--mui-palette-primary-main) ${i}, ${surface})`, // wrap back to hue-a
  ].join(', ');

  return {
    // Border is PERMANENTLY 2px (constant geometry forever). An inset box-shadow in
    // the SURFACE colour masks the inner `--beam-border-mask` px from inside, so the
    // border READS as calm 1px. Hover drops the mask to 0 → the full 2px gradient
    // shows — apparent weight changes with nothing moving (box-shadow is out of
    // layout; border-box grows the border inward). The mask reuses `surface` (the
    // same var the padding-box uses), so it's correct on surface 1/2/3. Transition
    // the MASK width, never border-width; `--beam-border-mask` is an @property
    // <length> so it interpolates, and the motion token respects reduced-motion.
    border: '2px solid transparent',
    background: [
      `linear-gradient(${surface}, ${surface}) padding-box`,
      `conic-gradient(from var(--beam-border-angle), ${stops}) border-box`,
    ].join(', '),
    boxShadow: `inset 0 0 0 var(--beam-border-mask) ${surface}`,
    transition: '--beam-border-mask var(--beam-motion-quick)',
    ...(interactive && {
      animation: 'beam-border-spin 6s linear infinite',
      animationPlayState: 'paused',
      '&:hover': {
        // Lift the intensity + reveal the full 2px (mask → 0) and RESUME the
        // rotation from wherever it paused (not restart).
        '--beam-border-intensity': 'var(--beam-border-intensity-hover)',
        '--beam-border-mask': '0px',
        animationPlayState: 'running',
      },
      // Reduced motion: never resume the spin. Still lit; the mask still snaps
      // (the motion token's duration is zeroed), so weight still changes, instantly.
      '@media (prefers-reduced-motion: reduce)': {
        '&:hover': { animationPlayState: 'paused' },
      },
    }),
  };
}
