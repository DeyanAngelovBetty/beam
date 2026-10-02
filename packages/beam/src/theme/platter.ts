import type { SxProps, Theme } from '@mui/material/styles';
import { CHROME_PLATTER_OFFSET } from './tokens';

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
  /**
   * Outward extent. Omitted → `--beam-ring` (today's 1px/2px grow). A NUMBER pins a static px offset; a
   * STRING is used verbatim as a CSS length, so the nav can pass a live var (`var(--beam-chrome-offset)`).
   */
  offset?: number | string;
  radius?: number;
  /**
   * GLASS only — id of an SVG displacement filter (feTurbulence→feDisplacementMap) appended to the
   * backdrop-filter AFTER the lighting layer, so the glass refracts the backdrop (the nav uses `'noise'`).
   * The consumer MUST render that filter in the document (AppShell does). Omitted → lighting only (no
   * refraction); degrades cleanly where the url() filter is unsupported (Safari/FF).
   */
  refract?: string;
  /**
   * Which pseudo carries the platter — default `'after'`. Pass `'before'` to let TWO platters coexist on one
   * element (the nav stacks glass on `::after` + gradient on `::before` and toggles between them live).
   */
  pseudo?: 'before' | 'after';
  /**
   * A CSS value for the pseudo's `display` (e.g. `'var(--beam-chrome-glass-on, block)'`), so a consumer
   * can gate the layer on/off live via a var. Omitted → `display` is left to the default.
   */
  displayVar?: string;
}): SxProps<Theme> {
  const fill = opts?.fill ?? 'gradient';
  const radius = opts?.radius ?? 24;
  const ring = opts?.offset != null ? (typeof opts.offset === 'number' ? `${opts.offset}px` : opts.offset) : 'var(--beam-ring)';
  const insetExpr = `calc(-1 * ${ring})`;
  const radiusExpr = `calc(${radius}px + ${ring})`;
  const pseudoSel = opts?.pseudo === 'before' ? '::before' : '::after'; // which pseudo carries the platter
  const pseudoKey = `&${pseudoSel}`;
  const displayDecl = opts?.displayVar ? { display: opts.displayVar } : {};

  if (fill === 'glass') {
    // FINAL recipe (2026-10-01): backdrop-filter is blur → (optional) refraction url(#id). NO saturate,
    // brightness, opacity, or box-shadow — refraction + blur carry it, the 1px border is the only edge.
    const glassFilter = opts?.refract
      ? `blur(var(--beam-chrome-blur)) url(#${opts.refract})`
      : `blur(var(--beam-chrome-blur))`;
    // Glass platter: a blurred fill behind the box, visible in the `offset` fringe (the opaque box occludes
    // the centre). The fill is a single TINT — a wash of background.paper at `--beam-chrome-tint` (0 = no
    // background at all). Mode-aware via the themed var, so a mode flip reskins with no rebuild. Fallback
    // forces the surface opaque (alpha 1) where backdrop-filter is unsupported.
    return {
      position: 'relative',
      [pseudoKey]: {
        content: '""',
        position: 'absolute',
        inset: insetExpr,
        borderRadius: radiusExpr,
        cornerShape: 'squircle',
        zIndex: -1,
        pointerEvents: 'none',
        ...displayDecl,
        background: 'color-mix(in oklab, var(--beam-chrome-tint-base, var(--mui-palette-background-paper)) var(--beam-chrome-tint, 15%), transparent)',
        backdropFilter: glassFilter,
        WebkitBackdropFilter: glassFilter,
        border: '1px solid var(--beam-nav-edge)', // the only edge
        // No backdrop-filter / reduced transparency → force the tint fully opaque (a solid paper surface),
        // since a faint translucent tint with no blur behind it looks broken, not like glass.
        '@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))': {
          '--beam-chrome-tint': '100%',
        },
        '@media (prefers-reduced-transparency: reduce)': {
          '--beam-chrome-tint': '100%',
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
    [pseudoKey]: {
      content: '""',
      position: 'absolute',
      inset: insetExpr,
      borderRadius: radiusExpr,
      cornerShape: 'squircle',
      ...displayDecl,
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
      [`&:hover${pseudoSel}`]: {
        '--beam-ring': '2px',
        ...(spin && { animationPlayState: 'running' }),
      },
    }),
    ...(spin && {
      '@media (prefers-reduced-motion: reduce)': {
        [`&:hover${pseudoSel}`]: { animationPlayState: 'paused' },
      },
    }),
    ...(track && {
      [`&[data-beam-tracking="on"]${pseudoSel}`]: {
        transition: '--beam-ring var(--beam-motion-quick), --beam-track-angle var(--beam-motion-quick)',
      },
    }),
  };
}

/**
 * chromePlatterLayers — the CHROME preset's platter as the two coexisting fill layers: glass on `::after`,
 * gradient on `::before`, each gated by a shared display var (`--beam-chrome-glass-on` / `-gradient-on`). So
 * flipping the chrome fill is ONE paint that moves EVERY chrome consumer at once (the nav + BeamComponent
 * consumers like the Theme Lab, dialogs, popovers — all spread this). Reads the `--beam-chrome-*` dials:
 * offset/glass-on/gradient-on here, blur/tint/tint-base inside the glass branch. Spread onto a CLEAN wrap (no
 * overflow / background / backdrop-filter); set `position` AFTER it (it sets `position: relative`).
 */
export function chromePlatterLayers(opts?: {
  radius?: number;
  /** Outward extent. Default reads `--beam-chrome-offset` (live, Theme-Lab-tunable) with the token fallback. */
  offset?: number | string;
  /** The surface the GRADIENT fill mixes toward (what's behind the chrome). Default the canvas base. */
  surface?: string;
  /** SVG displacement filter id for the GLASS refraction (required for the glass fill to refract). */
  refract?: string;
}): SxProps<Theme> {
  const radius = opts?.radius ?? 24;
  const offset = opts?.offset ?? `var(--beam-chrome-offset, ${CHROME_PLATTER_OFFSET}px)`;
  const surface = opts?.surface ?? 'var(--mui-palette-background-default)';
  const glass = beamPlatter({ fill: 'glass', pseudo: 'after', displayVar: 'var(--beam-chrome-glass-on, block)', radius, offset, refract: opts?.refract });
  const gradient = beamPlatter({ fill: 'gradient', pseudo: 'before', displayVar: 'var(--beam-chrome-gradient-on, none)', interaction: 'none', surface, radius, offset });
  return { ...(glass as object), ...(gradient as object) } as SxProps<Theme>;
}
