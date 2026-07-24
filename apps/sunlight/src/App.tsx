import { useMemo, useState, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
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

/**
 * Sunlight is a back office: operators manage multiple jurisdictions from
 * one seat, so brand is a RUNTIME context switch here (header dropdown) —
 * unlike the player-facing SDK, where brand stays deploy-time. Switching
 * brand rebuilds the theme (rare event, acceptable); switching light/dark
 * stays a CSS-variable attribute flip (frequent event, free).
 *
 * Navigation is real routing now (react-router) — deep pages have URLs, and
 * the app shell persists around every route.
 */
export function App() {
  const [brand, setBrand] = useState<BrandName>('ontario');
  const theme = useMemo(() => createBeamTheme(brand), [brand]);

  return (
    <ThemeProvider theme={theme} defaultMode="dark" noSsr>
      <CssBaseline />
      <BrowserRouter basename={BASENAME}>
        <ShellWithNav brand={brand} onBrandChange={setBrand}>
          <Routes>
            <Route path="/" element={<LoyaltyStatusPage />} />
            <Route path="/perks" element={<PlaceholderPage title="Perks" />} />
            <Route path="/payout-tables" element={<PlaceholderPage title="Payout Tables" />} />
            <Route path="/prize-wall" element={<PlaceholderPage title="Prize Wall" />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/users/:id" element={<UserPage />} />
            <Route path="/roles" element={<RolesPage />} />
            <Route path="/roles/:id" element={<RolePage />} />
            <Route path="*" element={<PlaceholderPage title="Not found" />} />
          </Routes>
        </ShellWithNav>
      </BrowserRouter>
    </ThemeProvider>
  );
}

/** Builds the nav from the current route so the active item tracks the URL. */
function ShellWithNav({
  brand,
  onBrandChange,
  children,
}: {
  brand: BrandName;
  onBrandChange: (b: BrandName) => void;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const nav = buildSunlightNav({ pathname, navigate });

  return (
    <BeamAppShell
      title="SUNLIGHT"
      product="sunlight"
      navItems={nav}
      brand={brand}
      onBrandChange={onBrandChange}
    >
      {children}
    </BeamAppShell>
  );
}
