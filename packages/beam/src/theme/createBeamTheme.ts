import { createTheme, type Theme } from '@mui/material/styles';
import { products, derived, type BrandName, type ProductName } from './tokens';
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
            default: t.surfaces.screen, // Figma: brand bg/screen
            paper: t.surfaces.overlay, // Figma: brand bg/overlay/base
          },
        },
      },
    },
    shape: { borderRadius: 8 },
    typography: {
      // Brand-differentiated typeface (Figma: brand fontFamily → typography alias).
      // Webfont loading is the app's job: see .storybook/preview-head.html.
      // TODO: sync the rest of the typography collection (sizes, weights)
      fontFamily: `"${t.fontFamily}", "Helvetica", "Arial", sans-serif`,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          ':root': {
            '--beam-page-gradient': derived.pageGradient,
            // Spine motif tokens (detail-page §2). All scheme-invariant
            // formulas, so one :root block serves both modes.
            '--beam-spine-default': derived.spine.default,
            '--beam-spine-warning': derived.spine.warning,
            '--beam-spine-danger': derived.spine.danger,
            // Motion tokens (shell-grammar §4) — Beam's first. Duration + easing
            // are independently addressable (durations may become Figma number
            // variables; easings stay code strings), plus a composed shorthand.
            // Shipped unused: choreography is the bench pass.
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
        },
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
