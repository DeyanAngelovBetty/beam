import { createTheme, type Theme } from '@mui/material/styles';
import { products, productFonts, surfaceSeeds, gradientSeeds, borderIntensity, markLightness, titleSeeds, derived, type BrandName, type ProductName } from './tokens';
import { meta } from './textStyles';

/**
 * Beam theme factory.
 *
 * BRAND is deploy-time (token set selection); MODE is runtime (MUI
 * colorSchemes as CSS variables — attribute flip on <html>, no re-render).
 *
 * State opacities: hover/selected/focus map to MUI action opacities.
 * focusVisible (30%) and outlinedBorder (50%) are kit-level component
 * concerns — exposed via tokens for component overrides in a later pass.
 */
export function createBeamTheme(brand: BrandName, product: ProductName = 'sunlight'): Theme {
  const t = products[product][brand];
  // Product-scoped typeface pair. Every stack ends in a system sans.
  const f = productFonts[product];
  const bodyFont = `"${f.body}", "Helvetica", "Arial", sans-serif`;
  const titleFont = `"${f.title}", "Helvetica", "Arial", sans-serif`;
  const titleWeight = f.titleWeight; // seed (Figma twin product/font/titleWeight) → whole heading scale
  // Gradient title dials (BeamPageHeader). tint is per-mode; underline weight/fade per-product.
  const ti = titleSeeds[product];
  // Product-scoped surface ramp. The step's PRODUCT half bakes here (per scheme);
  // its MODE half flips on the data-beam-mode seam below (product is a theme
  // rebuild, so it resolves at construction — no second seam). Anchor = surface 0.
  const s = surfaceSeeds[product];
  // Product-scoped page-mesh seeds. hue-b + intensity bake per scheme here (the
  // product half); the mode half flips on the data-beam-mode seam below. intensity
  // carries its unit so it drops straight into the color-mix percentage slot.
  const g = gradientSeeds[product];
  // Edge highlight lift — how many surface steps ABOVE the rail's top stop the 1px
  // light catch sits. Summed with the nav offsets in JS (seed arithmetic, not colour
  // maths) so --beam-nav-edge-offset stays a single var and doesn't re-raise the
  // channel high-water mark (§7). TUNABLE — expect to adjust once the catch is visible.
  // Glass edge catch, PER SCHEME — the recurring surface asymmetry (navOffset, dot
  // opacity, glass alpha, now this). DARK has headroom above the rail, so a POSITIVE
  // lift brightens into a light catch. LIGHT is already near-white, so a positive lift
  // is indistinguishable from white (a hard bright line); a small NEGATIVE lift reads
  // as a definition/refraction line instead — how real glass shows its edge on white.
  // `alpha` keeps it a catch of light, not a drawn stroke, on the translucent pane.
  // ⚠️ If the light edge VANISHES on review, the fix is raising light `alpha` toward
  // 0.5 while KEEPING the negative lift — do NOT flip the lift positive (that's glare,
  // the thing this avoids). Commented consts, no Figma seed. TUNABLE.
  const EDGE = {
    dark: { lift: 2, alpha: 0.5 },
    light: { lift: -1.5, alpha: 0.5 }, // alpha raised from 0.35 — the refraction line was too faint
  };
  // Well shadow the DOCKED rail receives from the content plane above it, per scheme
  // (the recurring surface asymmetry, 5th time). LIGHT stronger — a shadow on a
  // near-white surface is the readable separation cue, and this is where it earns its
  // keep. DARK light-touch: 0.06 may be invisible, which is FINE — dark already
  // separates via the rail's own tint + edge catch, and a heavy shadow on near-black
  // reads as a smudge. Do NOT crank it. Tunable, no Figma seed.
  const WELL_SHADOW = { dark: 0.06, light: 0.14 };
  const navEdgeOffset = {
    dark: s.dark.navOffset + s.dark.navSpread + EDGE.dark.lift,
    light: s.light.navOffset + s.light.navSpread + EDGE.light.lift,
  };

  const action = {
    hoverOpacity: t.states.hover,
    selectedOpacity: t.states.selected,
    focusOpacity: t.states.focus,
  };

  return createTheme({
    cssVariables: {
      colorSchemeSelector: 'data-beam-mode',
    },
    colorSchemes: {
      light: {
        palette: {
          divider: derived.tableBorder.light,
          ...({ TableCell: { border: derived.tableBorder.light } } as object),
          primary: {
            main: t.light.primary0,
            dark: t.light.primaryDown1,
            light: t.light.primaryUp1,
            contrastText: t.light.contrastText,
          },
          action,
          background: {
            // Aliases to the REGISTERED ramp. The anchor hex now lives in --beam-surface-anchor
            // (emitted per scheme below); the ramp derives from it, so a live anchor change
            // re-derives the whole surface chain. Byte-identical: ramp-0 = anchor, ramp-1 = the
            // old paper formula.
            default: 'var(--beam-ramp-0)', // surface 0 — the page
            paper: 'var(--beam-ramp-1)', // surface 1 — one step up
            // Both are var() refs MUI can't extract a channel from; skip channel-gen (nothing
            // reads *Channel — verified). Same trick paper already used.
            ...({ defaultChannel: undefined, paperChannel: undefined } as object),
          },
        },
      },
      dark: {
        palette: {
          divider: derived.tableBorder.dark,
          ...({ TableCell: { border: derived.tableBorder.dark } } as object),
          primary: {
            main: t.dark.primary0,
            dark: t.dark.primaryDown1,
            light: t.dark.primaryUp1,
            contrastText: t.dark.contrastText,
          },
          action,
          background: {
            // Aliases to the registered ramp (see the light block). Anchor lives in
            // --beam-surface-anchor; ramp-0 = anchor, ramp-1 = the old paper formula.
            default: 'var(--beam-ramp-0)', // surface 0 — the page
            paper: 'var(--beam-ramp-1)', // surface 1 — one step up
            // Both are var() refs MUI can't channel-extract; skip channel-gen (nothing reads it).
            ...({ defaultChannel: undefined, paperChannel: undefined } as object),
          },
        },
      },
    },
    shape: { borderRadius: 8 },
    typography: {
      // Product-scoped title/body pair (Figma: product/font/{title,body}). The BODY face
      // is the base fontFamily — the workhorse for data, `meta` keys (textStyles.ts omits
      // fontFamily on purpose, so it inherits THIS), and everything below headline. The
      // TITLE face binds to the heading scale h1–h6 only, so expressive type lives at
      // headline size and never in data. No organism sets a fontFamily; BeamPageHeader's
      // h4 title inherits the title face for free. Webfont loading is the app's job (§4.5).
      // The title WEIGHT is now a seed too (Figma twin product/font/titleWeight), shared by
      // the whole heading scale h1–h6 exactly as the face is — one edit restyles every
      // heading. No fontWeight appears in any organism. TODO: sync the rest (sizes).
      fontFamily: bodyFont,
      h1: { fontFamily: titleFont, fontWeight: titleWeight },
      h2: { fontFamily: titleFont, fontWeight: titleWeight },
      h3: { fontFamily: titleFont, fontWeight: titleWeight },
      h4: { fontFamily: titleFont, fontWeight: titleWeight },
      h5: { fontFamily: titleFont, fontWeight: titleWeight },
      h6: { fontFamily: titleFont, fontWeight: titleWeight },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          ':root': {
            // Page mesh (§2): one derived formula, resolving through the two
            // product+mode-scoped seeds below. :root defaults are DARK (defaultMode);
            // the data-beam-mode rules flip them. Painted on a fixed layer in
            // BeamAppShell — behind everything, occluded by the opaque ramp surfaces.
            '--beam-page-mesh': derived.pageMesh,
            '--beam-gradient-hue-b': g.dark.hueB,
            '--beam-gradient-intensity': `${g.dark.intensity}%`,
            // Mesh dot layer. Pitch/size are scheme-invariant; only opacity flips
            // (a dark dot on near-white reads louder, so light is held lower).
            '--beam-dot-color': derived.dotColor,
            '--beam-dot-pitch': `${g.dark.dotPitch}px`,
            '--beam-dot-size': `${g.dark.dotSize}px`,
            '--beam-dot-opacity': String(g.dark.dotOpacity),
            // Gradient-border intensity (opt-in beamGradientBorder). Per-scheme
            // dial: light needs more than dark. :root default = dark.
            '--beam-border-intensity': `${borderIntensity.dark.calm}%`,
            '--beam-border-intensity-hover': `${borderIntensity.dark.hover}%`,
            // Brand-mark lightness (app-owned mask consumes it). :root default = dark.
            '--beam-mark-l': String(markLightness.dark),
            // Native `color-scheme` DEFAULT (§5). Themes the browser's OWN
            // widgets — scrollbars, native <select>, date/time inputs,
            // checkbox/radio, Chrome autofill — which MUI's token palette never
            // touches. defaultMode is dark, so :root guards the no-attribute /
            // SSR frame to dark; the data-beam-mode rules below flip it per mode
            // with NO theme rebuild (§5) — same layer + posture as
            // --beam-surface-step. DISTINCT from MUI's `colorSchemes` config,
            // which themes our TOKENS: two mechanisms, confusingly similar names.
            // MUI's own enableColorScheme can't supply this default under
            // cssVariables (its html default is gated `!theme.vars`), and its
            // per-mode rules land in baseStyles AHEAD of our styleOverrides — so
            // a :root guard added on top would win at equal specificity and pin
            // light mode dark. Hence hand-written here, :root FIRST so the
            // attribute rules below (later, equal specificity) override it.
            // Cascade analysis pinned to MUI v7.3.11 — re-verify on any major bump.
            colorScheme: 'dark',
            // Spine motif tokens (detail-page §2). All scheme-invariant
            // formulas, so one :root block serves both modes.
            '--beam-spine-default': derived.spine.default,
            '--beam-spine-warning': derived.spine.warning,
            '--beam-spine-danger': derived.spine.danger,
            // Surface ramp (§9), now LOAD-BEARING and MATERIALIZED as a chain: the anchor
            // SEED (the ONE hex, per scheme) → the registered ramp (formula once per slot) →
            // aliases. The anchor + step :root defaults are this product's DARK values
            // (defaultMode), guarding SSR / the no-attribute frame; the mode selectors below
            // flip them with NO theme rebuild (§5).
            '--beam-surface-anchor': s.dark.anchor,
            '--beam-surface-step': String(s.dark.step),
            '--beam-surface-nav-offset': String(s.dark.navOffset),
            '--beam-surface-nav-chroma': String(s.dark.navChroma),
            '--beam-surface-nav-spread': String(s.dark.navSpread),
            // The ramp — formula ONCE per slot, from the anchor seed. Registered <color>
            // (above) so these COMPUTE to resolved colours. Mode-invariant: the anchor + step
            // they read flip per scheme, so the ramp flips with them.
            '--beam-ramp--1': derived.ramp.sunken,
            '--beam-ramp-0': derived.ramp.anchor,
            '--beam-ramp-1': derived.ramp.paper,
            '--beam-ramp-2': derived.ramp.raised,
            '--beam-ramp-3': derived.ramp.top,
            // Elevation aliases — point at the ramp, never repeat the formula. Roles:
            // 0 = background.default, 1 = background.paper, 2 = Menu/Popover, 3 = Dialog.
            // `--beam-surface--1` (sunken) reserved — no consumer this pass.
            '--beam-surface--1': 'var(--beam-ramp--1)',
            '--beam-surface-1': 'var(--beam-ramp-1)',
            '--beam-surface-2': 'var(--beam-ramp-2)',
            '--beam-surface-3': 'var(--beam-ramp-3)',
            // Rail background — one swappable recipe, consumed at the two rail sites.
            '--beam-nav-surface': derived.navSurface,
            // Frosted-glass rail. Blur is scheme-invariant; alpha + saturate flip.
            '--beam-nav-glass-alpha': String(s.dark.navGlassAlpha),
            '--beam-nav-glass-blur': `${s.dark.navGlassBlur}px`,
            '--beam-nav-glass-saturate': String(s.dark.navGlassSaturate),
            '--beam-nav-edge': derived.navEdge,
            '--beam-nav-edge-offset': String(navEdgeOffset.dark),
            '--beam-nav-edge-alpha': String(EDGE.dark.alpha),
            '--beam-nav-shadow': derived.navShadow,
            '--beam-nav-shadow-alpha': String(WELL_SHADOW.dark),
            // Motion tokens (shell-grammar §4) — Beam's first. Duration + easing
            // are independently addressable (durations may become Figma number
            // variables; easings stay code strings), plus a composed shorthand.
            // Consumed by the ignition choreography below; retune the values in
            // tokens.ts `derived.motion`.
            '--beam-motion-quick-duration': derived.motion.quick.duration,
            '--beam-motion-quick-easing': derived.motion.quick.easing,
            '--beam-motion-quick':
              'var(--beam-motion-quick-duration) var(--beam-motion-quick-easing)',
            '--beam-motion-move-duration': derived.motion.move.duration,
            '--beam-motion-move-easing': derived.motion.move.easing,
            '--beam-motion-move':
              'var(--beam-motion-move-duration) var(--beam-motion-move-easing)',
            '--beam-motion-fade-duration': derived.motion.fade.duration,
            '--beam-motion-fade-easing': derived.motion.fade.easing,
            '--beam-motion-fade':
              'var(--beam-motion-fade-duration) var(--beam-motion-fade-easing)',
            // Gradient title dials (BeamPageHeader). `tint` is per-MODE (:root = dark
            // default; the mode selectors flip it). underline weight + fade are per-product,
            // mode-invariant — the underline's mode variance comes free via background.default
            // in its color-mix. Dial tint→0% / weight→0px to turn the treatment off.
            '--beam-title-tint': ti.tint.dark,
            '--beam-title-underline-weight': ti.underlineWeight,
            '--beam-title-underline-fade': ti.underlineFade,
            // Underline tuck depth (per-product geometry) + halo-clone blur (per MODE —
            // :root = dark default; the mode selectors flip it). Halo → 0px = no separation.
            '--beam-title-underline-offset': ti.underlineOffset,
            '--beam-title-halo': ti.halo.dark,
          },
          // Mode-scoped surface step (TRACER): set on the same data-beam-mode
          // layer MUI flips its palette vars on, so a mode change updates the
          // step — and thus --beam-surface-1 — with NO theme rebuild (§5). The
          // formula var stays in :root; only its input flips here.
          '[data-beam-mode="light"]': {
            colorScheme: 'light',
            '--beam-surface-anchor': s.light.anchor,
            '--beam-surface-step': String(s.light.step),
            '--beam-surface-nav-offset': String(s.light.navOffset),
            '--beam-surface-nav-chroma': String(s.light.navChroma),
            '--beam-surface-nav-spread': String(s.light.navSpread),
            '--beam-nav-glass-alpha': String(s.light.navGlassAlpha),
            '--beam-nav-glass-saturate': String(s.light.navGlassSaturate),
            '--beam-nav-edge-offset': String(navEdgeOffset.light),
            '--beam-nav-edge-alpha': String(EDGE.light.alpha),
            '--beam-nav-shadow-alpha': String(WELL_SHADOW.light),
            '--beam-gradient-hue-b': g.light.hueB,
            '--beam-gradient-intensity': `${g.light.intensity}%`,
            '--beam-dot-opacity': String(g.light.dotOpacity),
            '--beam-border-intensity': `${borderIntensity.light.calm}%`,
            '--beam-border-intensity-hover': `${borderIntensity.light.hover}%`,
            '--beam-mark-l': String(markLightness.light),
            '--beam-title-tint': ti.tint.light,
            '--beam-title-halo': ti.halo.light,
          },
          '[data-beam-mode="dark"]': {
            colorScheme: 'dark',
            '--beam-surface-anchor': s.dark.anchor,
            '--beam-surface-step': String(s.dark.step),
            '--beam-surface-nav-offset': String(s.dark.navOffset),
            '--beam-surface-nav-chroma': String(s.dark.navChroma),
            '--beam-surface-nav-spread': String(s.dark.navSpread),
            '--beam-nav-glass-alpha': String(s.dark.navGlassAlpha),
            '--beam-nav-glass-saturate': String(s.dark.navGlassSaturate),
            '--beam-nav-edge-offset': String(navEdgeOffset.dark),
            '--beam-nav-edge-alpha': String(EDGE.dark.alpha),
            '--beam-nav-shadow-alpha': String(WELL_SHADOW.dark),
            '--beam-gradient-hue-b': g.dark.hueB,
            '--beam-gradient-intensity': `${g.dark.intensity}%`,
            '--beam-dot-opacity': String(g.dark.dotOpacity),
            '--beam-border-intensity': `${borderIntensity.dark.calm}%`,
            '--beam-border-intensity-hover': `${borderIntensity.dark.hover}%`,
            '--beam-mark-l': String(markLightness.dark),
            '--beam-title-tint': ti.tint.dark,
            '--beam-title-halo': ti.halo.dark,
          },

          // Page mesh — a FIXED paint layer behind the whole document. `position:
          // fixed` = composited, no repaint on scroll (the reason it moved off the
          // tall content element). z-index -1 + opaque ramp surfaces means it shows
          // ONLY in page-background gaps — never through Paper/Menu/Dialog. It sits
          // behind the Drawer too (viewport-fixed): deliberate — a translucent
          // Drawer treatment later will let the mesh show through as a feature, not
          // a surprise. Decorative, so pointer-events: none.
          'body::before': {
            content: '""',
            position: 'fixed',
            inset: 0,
            zIndex: -1,
            pointerEvents: 'none',
            backgroundColor: 'var(--mui-palette-background-default)',
            backgroundImage: 'var(--beam-page-mesh)',
            // 4 layers now (dot + 3 radials). Matching 4-value lists so the radials
            // do NOT inherit the dot tile: the dot tiles at pitch, the radials fill
            // (auto) and don't repeat. This is the coupling that would break the mesh.
            backgroundSize: 'var(--beam-dot-pitch) var(--beam-dot-pitch), auto, auto, auto',
            backgroundRepeat: 'repeat, no-repeat, no-repeat, no-repeat',
          },

          // Gradient-border angle (opt-in beamGradientBorder). Registered as an
          // @property so it's a typed <angle> and can be INTERPOLATED — an
          // unregistered custom prop cannot animate. `inherits: false` so the
          // angle doesn't leak into nested bordered elements. The keyframe spins
          // one full turn; elements run it paused and resume on hover.
          '@property --beam-border-angle': {
            syntax: "'<angle>'",
            inherits: 'false',
            initialValue: '135deg',
          },
          // Gradient-border rim width (beamGradientBorder). The pseudo-rim's own width;
          // registered <length> so it INTERPOLATES — an unregistered custom prop would
          // snap, not transition (same trap as the angle). Calm 1px → hover 2px, grown
          // OUTWARD on the pseudo (no layout, out of flow). `inherits: false` so it
          // doesn't leak into nested bordered elements — the pseudo sets its own.
          '@property --beam-ring': {
            syntax: "'<length>'",
            inherits: 'false',
            initialValue: '1px',
          },
          // Surface ramp, REGISTERED as <color> so the browser COMPUTES the oklch(from …)
          // formula to a resolved colour — getComputedStyle('--beam-ramp-N') returns a real
          // value, not the formula string. That makes the browser the formula engine for the
          // bake lane and the Theme Lab panel (both READ the ramp). inherits: true so the
          // resolved colours are available everywhere. initialValue is a never-used fallback
          // (the formula is always set at :root); transparent makes a resolution failure LOUD.
          '@property --beam-ramp--1': { syntax: "'<color>'", inherits: 'true', initialValue: 'transparent' },
          '@property --beam-ramp-0': { syntax: "'<color>'", inherits: 'true', initialValue: 'transparent' },
          '@property --beam-ramp-1': { syntax: "'<color>'", inherits: 'true', initialValue: 'transparent' },
          '@property --beam-ramp-2': { syntax: "'<color>'", inherits: 'true', initialValue: 'transparent' },
          '@property --beam-ramp-3': { syntax: "'<color>'", inherits: 'true', initialValue: 'transparent' },
          '@keyframes beam-border-spin': {
            to: { '--beam-border-angle': '495deg' },
          },
          // Gradient-title underline reveal (BeamPageHeader): a left-anchored scaleX sweep on
          // page mount. transform-only (no layout). Driven by the `move` motion pair, so the
          // reduced-motion kill switch (which zeroes --beam-motion-move-duration) lands it
          // instantly at scaleX(1) — static AND visible, never absent.
          '@keyframes beam-title-underline-reveal': {
            from: { transform: 'scaleX(0)' },
            to: { transform: 'scaleX(1)' },
          },

          // Estate-wide reduced-motion kill switch (shell-grammar §4): zero the
          // duration vars at the injection layer. Everything built on the motion
          // tokens collapses to instant — one switch, no per-component checks.
          // (Easings are left intact; a 0ms duration makes them moot.)
          '@media (prefers-reduced-motion: reduce)': {
            ':root': {
              '--beam-motion-quick-duration': '0ms',
              '--beam-motion-move-duration': '0ms',
              '--beam-motion-fade-duration': '0ms',
            },
          },

          /*
           * ── The ignition choreography (shell-grammar §4) ──────────────────
           * These rules drive the lock/unlock morph. They live HERE, beside the
           * motion vars, and NOT in the component — because that's where the
           * browser looks.
           *
           * View Transitions in one paragraph: `document.startViewTransition()`
           * is the browser's Smart-Animate. It screenshots the page BEFORE your
           * DOM change and AFTER, matches the two by `view-transition-name`
           * (think Figma layer name), and tweens each matched pair between its
           * old and new screenshot. The tween runs on throwaway pseudo-elements
           * — `::view-transition-group|old|new(NAME)` — mounted at the DOCUMENT
           * ROOT for the length of the transition (~300ms), painted on top of
           * the live page. So motion is styled by targeting those pseudos
           * globally; a rule scoped inside a component would never match them.
           * The names are set inline in BeamAppShell.tsx: `brandmark`, `ghost`,
           * `sidebar`, `content`.
           *
           * What each rule does:
           *  - root silenced — without it the browser cross-fades the ENTIRE
           *    page. We want only the four named parts to move.
           *  - brandmark / sidebar / content → `move`: the mark travels, the
           *    panel grows/collapses, the content reflows — one clock, so they
           *    read as a single movement.
           *  - ghost (old only) → `fade`: the peek's watermark fades out as the
           *    color mark lands.
           * Every duration/easing comes from a motion var — never a literal
           * here (that is the whole point of the tokens). Reduced motion is
           * handled upstream (the component skips startViewTransition) and the
           * kill switch above zeros these durations too.
           *
           * Inspect/scrub: DevTools ▸ Animations. Trigger a lock, then drag the
           * panel's slider to step the ~300ms frame-by-frame; the
           * `::view-transition-*` pseudos appear under the document root in the
           * Elements tree while it runs.
           * ──────────────────────────────────────────────────────────────────
           */
          '::view-transition-group(root), ::view-transition-old(root), ::view-transition-new(root)':
            { animation: 'none' },
          // The brand mark travels between the strip and the locked panel header.
          '::view-transition-group(beam-shell-brandmark), ::view-transition-old(beam-shell-brandmark), ::view-transition-new(beam-shell-brandmark)':
            {
              animationDuration: 'var(--beam-motion-move-duration)',
              animationTimingFunction: 'var(--beam-motion-move-easing)',
            },
          // The locked panel grows in (lock) / collapses out (unlock).
          '::view-transition-group(beam-shell-sidebar), ::view-transition-old(beam-shell-sidebar), ::view-transition-new(beam-shell-sidebar)':
            {
              animationDuration: 'var(--beam-motion-move-duration)',
              animationTimingFunction: 'var(--beam-motion-move-easing)',
            },
          // The content reflows: full-width ↔ right column.
          '::view-transition-group(beam-shell-content), ::view-transition-old(beam-shell-content), ::view-transition-new(beam-shell-content)':
            {
              animationDuration: 'var(--beam-motion-move-duration)',
              animationTimingFunction: 'var(--beam-motion-move-easing)',
            },
          // The ghost watermark fades out (peek → locked promotion).
          '::view-transition-old(beam-shell-ghost)': {
            animationDuration: 'var(--beam-motion-fade-duration)',
            animationTimingFunction: 'var(--beam-motion-fade-easing)',
          },
        },
      },
      // Stack rhythm is real CSS `gap`, never injected child margins (BEAM.md
      // styling rules, 2026-07-30). Estate-wide default so every Stack composes
      // by gap; margin-based spacing is off the table for layout rhythm.
      MuiStack: {
        defaultProps: { useFlexGap: true },
      },
      // Category rules — the code twin of Figma TEXT/EFFECT STYLES (not variables).
      // One decision here restyles every instance everywhere: zero component edits.
      MuiPaper: {
        styleOverrides: {
          rounded: {
            // "Operational surfaces are soft" — rounder radius plus squircle
            // corner geometry (CSS Borders L5, Chrome 139+; progressive
            // enhancement — unsupported browsers keep the plain radius).
            borderRadius: 24,
            cornerShape: 'squircle',
          },
        },
      },
      // Overlay surfaces sit ABOVE cards on the ramp: a menu/popover is surface 2,
      // a dialog surface 3 (the top position — the reserved slot, taken here). This
      // corrects the old ordering bug where paper rendered lighter than nothing
      // above it: today a menu opened over a card was DARKER than that card
      // (paper L 0.228 sat above overlay L 0.210). Now arithmetic guarantees the
      // order. Menu renders its Paper through Popover, so MuiPopover covers both.
      // Drawer is shell chrome, NOT an overlay — deliberately left as-is (a
      // persistent nav sits alongside content, not above it; shell pass owns it).
      MuiPopover: {
        styleOverrides: { paper: { backgroundColor: 'var(--beam-surface-2)' } },
      },
      MuiDialog: {
        styleOverrides: { paper: { backgroundColor: 'var(--beam-surface-3)' } },
      },
      // The `meta` category rule (detail-page §3): keys everywhere speak one
      // caps voice. One definition (theme/textStyles), several bindings.
      MuiTableCell: {
        styleOverrides: {
          head: { ...meta, paddingTop: 12, paddingBottom: 12 },
          footer: { ...meta },
        },
      },
      // Our pagination renders as a <div>, not a footer cell — same recipe here
      MuiTablePagination: {
        styleOverrides: {
          selectLabel: { ...meta },
          displayedRows: { ...meta },
        },
      },
      // Form-field labels are keys too. Base color from meta; MUI's focused/
      // error classes still win (higher specificity), so the field states hold.
      MuiInputLabel: {
        styleOverrides: {
          root: {
            ...meta,
            // meta IS the final size — one caps voice everywhere — so the
            // in-the-notch (shrunk) label must render at exactly meta, NOT
            // meta × 0.75. MUI's default shrink is
            // `translate(14px, -9px) scale(0.75)`, whose math assumes a 1rem
            // label scaled to 12px; meta ships at its own size, so that scale
            // both shrinks the wrong amount and mis-positions the label on the
            // border. Neutralize the scale, re-center with a corrected Y.
            '&.MuiInputLabel-shrink': {
              transform: 'translate(14px, -5px) scale(1)', // Y offset: Deyan tunes on the bench
            },
          },
        },
      },
      // Notch gap geometry. The legend sizes the border's gap; it must predict
      // the label's TRUE rendered width and register to the label's left edge.
      MuiOutlinedInput: {
        styleOverrides: {
          notchedOutline: {
            // FULL mirror — MUI mirrors only the label text at a font-size, not
            // meta's transform or tracking, so the legend under-predicts the
            // caps/tracked label. Carry all three, coupled to meta (no literals).
            // (fontWeight deliberately not mirrored — meta's 300 vs the legend's
            // 400 is a sub-px residual, outside this concern.)
            '& legend': {
              fontSize: meta.fontSize,
              textTransform: meta.textTransform,
              letterSpacing: meta.letterSpacing,
            },
            '& legend > span': {
              // LEFT-REGISTRATION is the doctrine. The label's left edge — its
              // shrink translate-X (14px) — is the fixed datum: flush with the
              // input value, it never moves. The rule's left break is placed
              // relative to that datum, so paddingLeft is coupled:
              //   paddingLeft = label translate-X (14) − fieldset padding-inline (MUI's 8) = 6
              // Preserve this identity — if the 14px translate or the 8px
              // fieldset padding ever changes, paddingLeft must follow, or the
              // left break drifts off the datum.
              paddingLeft: 6,
              // paddingRight is a free optical value — no identity attached.
              // Starts at 6; tuned on the bench (including compensating the
              // trailing space letterSpacing leaves after the last glyph).
              paddingRight: 4, // side gap: Deyan tunes on the bench
            },
          },
        },
      },
      // Last body row sits on the Paper edge — no divider against the curve
      MuiTableBody: {
        styleOverrides: {
          root: {
            // Direct children only — a descendant selector here leaks into
            // nested tables and strips their HEADER borders (learned the
            // hard way: a thead's only row is also its :last-of-type).
            '& > .MuiTableRow-root:last-of-type > .MuiTableCell-root': {
              borderBottom: 'none',
            },
          },
        },
      },
    },
  });
}
