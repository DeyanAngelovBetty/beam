import { createTheme, type Theme } from '@mui/material/styles';
import { products, derived, type BrandName, type ProductName } from './tokens';

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

  // Table meta text — one recipe for header, footer, and pagination labels
  // (the code twin of a single Figma text style: table/meta)
  const tableMetaText = (theme: Theme) => ({
    textTransform: 'uppercase' as const,
    fontSize: theme.typography.pxToRem(11),
    lineHeight: 1.2,
    fontWeight: 400,
    letterSpacing: '0.06em',
    color: (theme.vars || theme).palette.text.secondary,
  });

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
            borderRadius: 26,
            cornerShape: 'squircle',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: ({ theme }) => ({
            ...tableMetaText(theme),
            paddingTop: 12,
            paddingBottom: 12,
          }),
          footer: ({ theme }) => tableMetaText(theme),
        },
      },
      // Our pagination renders as a <div>, not a footer cell — same recipe here
      MuiTablePagination: {
        styleOverrides: {
          selectLabel: ({ theme }) => tableMetaText(theme),
          displayedRows: ({ theme }) => tableMetaText(theme),
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
