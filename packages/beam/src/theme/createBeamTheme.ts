import { createTheme, type Theme } from '@mui/material/styles';
import { products, productFonts, surfaceSeeds, gradientSeeds, derived, type BrandName, type ProductName } from './tokens';
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
  // Product-scoped surface ramp. The step's PRODUCT half bakes here (per scheme);
  // its MODE half flips on the data-beam-mode seam below (product is a theme
  // rebuild, so it resolves at construction — no second seam). Anchor = surface 0.
  const s = surfaceSeeds[product];
  // Product-scoped page-mesh seeds. hue-b + intensity bake per scheme here (the
  // product half); the mode half flips on the data-beam-mode seam below. intensity
  // carries its unit so it drops straight into the color-mix percentage slot.
  const g = gradientSeeds[product];

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
            default: s.light.anchor, // surface 0 — the page (light anchor seed)
            paper: derived.surface.paper, // surface 1 — one compressed step up
            ...({ paperChannel: undefined } as object),
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
            default: s.dark.anchor, // surface 0 — the page (anchor seed)
            paper: derived.surface.paper, // surface 1 — one step up (derived)
            // paper is a relative-color expr MUI can't extract a channel from;
            // provide the key so it skips channel-gen silently. Nothing reads it.
            ...({ paperChannel: undefined } as object),
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
      // TODO: sync the rest of the typography collection (sizes, weights).
      fontFamily: bodyFont,
      h1: { fontFamily: titleFont },
      h2: { fontFamily: titleFont },
      h3: { fontFamily: titleFont },
      h4: { fontFamily: titleFont },
      h5: { fontFamily: titleFont },
      h6: { fontFamily: titleFont },
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
            // Surface ramp (§9), now LOAD-BEARING. The step's :root default is
            // this product's DARK step (defaultMode), guarding SSR / the
            // no-attribute frame; the mode selectors below flip it with NO theme
            // rebuild (§5). Each surface FORMULA is mode+product-invariant — it
            // resolves through --mui-palette-background-default and the step var.
            // Roles alias positions: 0 = background.default, 1 = background.paper,
            // 2 = Menu/Popover, 3 = Dialog. `--beam-surface--1` (sunken) is
            // emitted but reserved — no consumer this pass.
            '--beam-surface-step': String(s.dark.step),
            '--beam-surface--1': derived.surface.sunken,
            '--beam-surface-1': derived.surface.paper,
            '--beam-surface-2': derived.surface.raised,
            '--beam-surface-3': derived.surface.top,
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
          },
          // Mode-scoped surface step (TRACER): set on the same data-beam-mode
          // layer MUI flips its palette vars on, so a mode change updates the
          // step — and thus --beam-surface-1 — with NO theme rebuild (§5). The
          // formula var stays in :root; only its input flips here.
          '[data-beam-mode="light"]': {
            colorScheme: 'light',
            '--beam-surface-step': String(s.light.step),
            '--beam-gradient-hue-b': g.light.hueB,
            '--beam-gradient-intensity': `${g.light.intensity}%`,
          },
          '[data-beam-mode="dark"]': {
            colorScheme: 'dark',
            '--beam-surface-step': String(s.dark.step),
            '--beam-gradient-hue-b': g.dark.hueB,
            '--beam-gradient-intensity': `${g.dark.intensity}%`,
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
