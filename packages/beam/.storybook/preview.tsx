import React, { useEffect, useMemo } from 'react';
import type { Preview, Decorator } from '@storybook/react-vite';
import { ThemeProvider, useColorScheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { MemoryRouter } from 'react-router-dom';
import { createBeamTheme } from '../src/theme/createBeamTheme';
import type { BrandName, ProductName, ThemeMode } from '../src/theme/tokens';

/** Applies the toolbar mode via MUI's color-scheme mechanism (attribute flip). */
function ModeSync({ mode, children }: { mode: ThemeMode; children: React.ReactNode }) {
  const { setMode } = useColorScheme();
  useEffect(() => {
    setMode(mode);
  }, [mode, setMode]);
  return <>{children}</>;
}

const withBeamTheme: Decorator = (Story, context) => {
  const brand = context.globals.brand as BrandName;
  const mode = context.globals.mode as ThemeMode;
  const product = context.globals.product as ProductName;
  const theme = useMemo(() => createBeamTheme(brand, product), [brand, product]);

  return (
    <ThemeProvider theme={theme} defaultMode={mode} noSsr>
      <ModeSync mode={mode}>
        <CssBaseline />
        <Story />
      </ModeSync>
    </ThemeProvider>
  );
};

/**
 * Default Router context (2026-10-06): many components reach react-router (`useSearchParams` via
 * `useTableFilters`, `useNavigate`, `<Link>`), so every story gets a `MemoryRouter` here instead of each
 * re-wrapping one. Stories that bring their OWN router — the sunlight page/editor stories use a DATA router
 * (`createMemoryRouter`/`RouterProvider`) with per-story route state, which THROWS if nested — opt out with
 * `parameters: { router: false }`.
 */
const withRouter: Decorator = (Story, context) =>
  context.parameters?.router === false ? <Story /> : (
    <MemoryRouter>
      <Story />
    </MemoryRouter>
  );

/**
 * Chrome TREATMENT dev switch (2026-10-06, gate 1a — TEMPORARY, until the Theme Lab three-way control lands
 * in 1b). Writes `data-beam-chrome` on <html>; the treatment presets (createBeamTheme) + chromeSurface() do
 * the rest in one paint. `platter-glass` is the shipping default (identical to no attribute).
 */
const withChrome: Decorator = (Story, context) => {
  const chrome = context.globals.chrome as string;
  useEffect(() => {
    const el = document.documentElement;
    el.setAttribute('data-beam-chrome', chrome);
    return () => el.removeAttribute('data-beam-chrome');
  }, [chrome]);
  return <Story />;
};

const preview: Preview = {
  decorators: [withBeamTheme, withRouter, withChrome],
  globalTypes: {
    mode: {
      description: 'Theme mode (palette collection modes)',
      toolbar: {
        title: 'Mode',
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Midnight Light' },
          { value: 'dark', title: 'Midnight Dark' },
        ],
        dynamicTitle: true,
      },
    },
    brand: {
      description: 'Brand / jurisdiction (jurisdiction collection modes)',
      toolbar: {
        title: 'Brand',
        icon: 'globe',
        items: [
          { value: 'ontario', title: 'Ontario' },
          { value: 'alberta', title: 'Alberta' },
        ],
        dynamicTitle: true,
      },
    },
    product: {
      description: 'Product (product collection modes)',
      toolbar: {
        title: 'Product',
        icon: 'component',
        items: [
          { value: 'sunlight', title: 'Sunlight' },
          { value: 'gaspar', title: 'Gaspar (demo)' },
        ],
        dynamicTitle: true,
      },
    },
    chrome: {
      description: 'Chrome treatment (dev switch — temporary, gate 1a)',
      toolbar: {
        title: 'Chrome',
        icon: 'contrast',
        items: [
          { value: 'platter-glass', title: 'Platter · glass (default)' },
          { value: 'platter-gradient', title: 'Platter · gradient' },
          { value: 'just-glass', title: 'Just-glass' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    product: 'sunlight',
    mode: 'dark',
    brand: 'ontario',
    chrome: 'platter-glass',
  },
  parameters: {
    controls: { matchers: { color: /(background|color)$/i } },
    backgrounds: { disable: true }, // theme owns the background
  },
};

export default preview;
