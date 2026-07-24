import { createContext, useContext, useMemo, useState } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import { ThemeProvider, CssBaseline, createBeamTheme, BeamAppShell } from '@betty/beam';
import type { BrandName } from '@betty/beam';
import { buildSunlightNav } from './sunlight/navItems';
import { LoyaltyStatusPage } from './sunlight/LoyaltyStatusPage';
import { PlaceholderPage } from './sunlight/PlaceholderPage';
import { UsersPage } from './sunlight/UsersPage';
import { RolesPage } from './sunlight/RolesPage';
import { UserPage } from './sunlight/UserPage';
import { RolePage } from './sunlight/RolePage';

// Vite's base path becomes the router basename: '/' in dev, '/beam/sunlight/'
// on Pages. Trailing slash trimmed (react-router matches without it).
const BASENAME = import.meta.env.BASE_URL.replace(/\/+$/, '') || '/';

// Brand is runtime state, but the router must stay stable (recreating it would
// reset history), so brand rides a context that the shell reads — not a router
// dependency.
const BrandContext = createContext<{ brand: BrandName; setBrand: (b: BrandName) => void }>({
  brand: 'ontario',
  setBrand: () => {},
});

/** The persistent shell around every route. A data-router layout route. */
function Layout() {
  const { brand, setBrand } = useContext(BrandContext);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const nav = buildSunlightNav({ pathname, navigate });

  return (
    <BeamAppShell title="SUNLIGHT" product="sunlight" navItems={nav} brand={brand} onBrandChange={setBrand}>
      <Outlet />
    </BeamAppShell>
  );
}

// A data router (createBrowserRouter) — required for route guards (useBlocker
// on the User edit page). Created once at module scope so it never resets.
const router = createBrowserRouter(
  [
    {
      element: <Layout />,
      children: [
        { index: true, element: <LoyaltyStatusPage /> },
        { path: 'perks', element: <PlaceholderPage title="Perks" /> },
        { path: 'payout-tables', element: <PlaceholderPage title="Payout Tables" /> },
        { path: 'prize-wall', element: <PlaceholderPage title="Prize Wall" /> },
        { path: 'users', element: <UsersPage /> },
        { path: 'users/:id', element: <UserPage /> },
        { path: 'users/:id/edit', element: <UserPage edit /> },
        { path: 'roles', element: <RolesPage /> },
        { path: 'roles/:id', element: <RolePage /> },
        { path: '*', element: <PlaceholderPage title="Not found" /> },
      ],
    },
  ],
  { basename: BASENAME }
);

/**
 * Sunlight is a back office: operators manage multiple jurisdictions from one
 * seat, so brand is a RUNTIME context switch (header dropdown) — unlike the
 * player-facing SDK. Switching brand rebuilds the theme; light/dark stays a
 * CSS-variable attribute flip.
 */
export function App() {
  const [brand, setBrand] = useState<BrandName>('ontario');
  const theme = useMemo(() => createBeamTheme(brand), [brand]);
  const brandCtx = useMemo(() => ({ brand, setBrand }), [brand]);

  return (
    <ThemeProvider theme={theme} defaultMode="dark" noSsr>
      <CssBaseline />
      <BrandContext.Provider value={brandCtx}>
        <RouterProvider router={router} />
      </BrandContext.Provider>
    </ThemeProvider>
  );
}
