import type { SxProps, Theme } from '@mui/material/styles';

/**
 * beamPlatter — the decorative layer SERVED BEHIND a box (the "platter"). A single absolutely-positioned
 * `::after` that sits `offset` OUTSIDE the element at `z-index: -1`, so it reads as the outward ring on a
 * card, or — behind an OPAQUE box (the nav panel) — as a fringe peeking out around it. The box itself stays
 * a plain surface; all treatment lives on the platter. Two fills:
 *   - `gradient` — the conic lit-edge foundation + interaction tiers (none / hover-step / hover-spin / track).
 *   - `glass`    — the liquid-glass treatment (backdrop blur of the canvas + tint + edge light).
 *
 * WHY A PSEUDO, NOT `scale()`: outward growth is an ABSOLUTE px change (`--beam-ring`), so a narrow and a
 * wide card get the same rim — `scale()` is relative (mismatched rims) and distorts the radius. `--beam-ring`
 * is a registered `@property <length>` so it INTERPOLATES.
 *
 * OFFSET: outward extent. Omitted = today's `--beam-ring` (1px calm → 2px hover), so existing gradient
 * callers (dashboard/landing cards) are byte-identical. A number pins a STATIC offset (the nav: 4px). The
 * platter radius is CONCENTRIC: `calc(radius + offset)` — it grows with the offset so the corner never
 * pinches. `radius` MUST equal the box's own border-radius (default 24 = `MuiPaper.rounded`).
 *
 * SQUIRCLE: `corner-shape` does NOT inherit to pseudo-elements — set explicitly to match the box.
 *
 * STACKING: `z-index: -1` puts the platter behind the box's own background — the outward fringe shows on the
 * canvas, the centre hidden under the box. This relies on the element NOT establishing its own stacking
 * context (no transform/opacity/filter/z-index/view-transition-name). That is WHY the glass backdrop-filter
 * lives on the `::after`, never the box, and why a VT'd/filtered consumer must put the platter on a clean
 * outer wrap. ⚠️ This factory sets `position: relative`; if the element needs its OWN position (e.g.
 * `absolute`), spread `beamPlatter(...)` FIRST, then set `position` after it, or the relative wins silently.
 *
 * SURFACE (gradient): `surface` MUST be the actual surface behind the element — the stops mix toward it so
 * it's a lit edge, not a rainbow. Default `background.paper`; pass the canvas base for the floating nav.
 *
 * GRADIENT interaction — `hover-spin` runs the rotation PAUSED, resumes on hover (never restarts); `track`
 * reads `--beam-track-angle` (element-written via usePointerAngleTracking) so the bright sector faces the
 * cursor; both grow the ring 1→2px + lift intensity on hover. `none`/`hover-step` stay calm. Cross-hue stops
 * mix `in var(--beam-mix-space, oklab)` (docs/derived-color-tokens.md §2). The `@property` vars + keyframes
 * are registered once in `createBeamTheme` (MuiCssBaseline).
 */
export function beamPlatter(opts?: {
  fill?: 'gradient' | 'glass';
  surface?: string;
  interaction?: 'none' | 'hover-step' | 'hover-spin' | 'track';
  /** Outward extent (px). Omitted → `--beam-ring` (today's 1px/2px grow). A number pins a static offset. */
  offset?: number;
  radius?: number;
  /**
   * GLASS only — id of an SVG displacement filter (feTurbulence→feDisplacementMap) appended to the
   * backdrop-filter AFTER the lighting layer, so the glass refracts the backdrop (the nav uses `'noise'`).
   * The consumer MUST render that filter in the document (AppShell does). Omitted → lighting only (no
   * refraction); degrades cleanly where the url() filter is unsupported (Safari/FF).
   */
  refract?: string;
}): SxProps<Theme> {
  const fill = opts?.fill ?? 'gradient';
  const radius = opts?.radius ?? 24;
  const ring = opts?.offset != null ? `${opts.offset}px` : 'var(--beam-ring)';
  const insetExpr = `calc(-1 * ${ring})`;
  const radiusExpr = `calc(${radius}px + ${ring})`;

  if (fill === 'glass') {
    // LOCKED recipe (2026-10-01): backdrop-filter is blur → (optional) refraction url(#id) → opacity-lift.
    // NO saturate, NO brightness, NO drop-shadow inside the filter (that was the heaviness).
    const glassFilter = opts?.refract
      ? `blur(var(--beam-nav-glass-blur)) url(#${opts.refract}) opacity(var(--beam-nav-glass-lift))`
      : `blur(var(--beam-nav-glass-blur)) opacity(var(--beam-nav-glass-lift))`;
    // Glass platter: a blurred fill behind the box, visible in the `offset` fringe (the opaque
    // box occludes the centre). The fill is a diagonal SHEEN over the translucent tint; the opacity-lift
    // bleeds a little un-blurred canvas back through for clarity; the box-shadow (inset rim-light + outer
    // drop) is the single shadow source and the "it's glass" cue. All values are mode-aware CSS vars
    // (NAV_GLASS, tokens.ts), so a mode flip reskins the glass with no rebuild. Fallbacks force opaque (alpha 1).
    return {
      position: 'relative',
      '&::after': {
        content: '""',
        position: 'absolute',
        inset: insetExpr,
        borderRadius: radiusExpr,
        cornerShape: 'squircle',
        zIndex: -1,
        pointerEvents: 'none',
        background: 'var(--beam-nav-sheen), var(--beam-nav-surface)', // diagonal sheen over the frosted tint
        backdropFilter: glassFilter,
        WebkitBackdropFilter: glassFilter,
        border: '1px solid var(--beam-nav-edge)', // the edge light
        // The ONLY shadow source (one total): inset rim-light (strength = --beam-nav-glass-rim) + outer drop.
        boxShadow: 'inset 0 0 14px -4px rgb(205 205 205 / var(--beam-nav-glass-rim)), 0 12px 32px -10px rgb(0 0 0 / 8%)',
        '@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))': {
          '--beam-nav-glass-alpha': '1',
        },
        '@media (prefers-reduced-transparency: reduce)': {
          '--beam-nav-glass-alpha': '1',
        },
      },
    };
  }

  // fill === 'gradient' — the conic foundation (byte-identical to the former beamPlatter when offset
  // is omitted: `ring` falls back to var(--beam-ring)).
  const surface = opts?.surface ?? 'var(--mui-palette-background-paper)';
  const interaction = opts?.interaction ?? 'none';
  const track = interaction === 'track';
  const spin = interaction === 'hover-spin'; // the former `interactive` rotation (Kevin-Powell, d94531a)
  const hoverGrow = spin || track; // lift intensity + grow the ring 1→2px on hover; none/hover-step stay calm
  const i = 'var(--beam-border-intensity)';
  const primary = `color-mix(in var(--beam-mix-space, oklab), var(--mui-palette-primary-main) ${i}, ${surface})`;
  const hueB = `color-mix(in var(--beam-mix-space, oklab), var(--beam-gradient-hue-b) ${i}, ${surface})`;
  const stops = [
    `${primary} 0%`,
    `${hueB} 20%`,
    `${hueB}`,
    `color-mix(in var(--beam-mix-space, oklab), ${hueB} 35%, ${surface}) 50%`,
    `${hueB}`,
    `${hueB} 80%`,
    `${primary} 100%`,
  ].join(', ');

  return {
    position: 'relative',
    border: 'none',
    '&::after': {
      content: '""',
      position: 'absolute',
      inset: insetExpr,
      borderRadius: radiusExpr,
      cornerShape: 'squircle',
      border: `${ring} solid transparent`,
      background: `conic-gradient(from ${track ? 'var(--beam-track-angle)' : 'var(--beam-border-angle)'}, ${stops}) border-box`,
      pointerEvents: 'none',
      zIndex: -1,
      transition: track
        ? '--beam-ring var(--beam-motion-quick), --beam-track-angle var(--beam-motion-move)'
        : '--beam-ring var(--beam-motion-quick)',
      ...(spin && {
        animation: 'beam-border-spin 6s linear infinite',
        animationPlayState: 'paused',
      }),
    },
    ...(hoverGrow && {
      '&:hover': {
        '--beam-border-intensity': 'var(--beam-border-intensity-hover)',
      },
      '&:hover::after': {
        '--beam-ring': '2px',
        ...(spin && { animationPlayState: 'running' }),
      },
    }),
    ...(spin && {
      '@media (prefers-reduced-motion: reduce)': {
        '&:hover::after': { animationPlayState: 'paused' },
      },
    }),
    ...(track && {
      '&[data-beam-tracking="on"]::after': {
        transition: '--beam-ring var(--beam-motion-quick), --beam-track-angle var(--beam-motion-quick)',
      },
    }),
  };
}
