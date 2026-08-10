import { createContext, useContext, useMemo, useState } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import { ThemeProvider, CssBaseline, createBeamTheme, BeamAppShell, Box } from '@betty/beam';
import type { BrandName } from '@betty/beam';
import SUNLIGHT_MARK from './assets/SUNLIGHT.svg';
import { buildSunlightNav } from './sunlight/navItems';
import { ShellFooter } from './sunlight/ShellFooter';
import { LoyaltyStatusPage } from './sunlight/LoyaltyStatusPage';
import { LoyaltyStatusEditor } from './sunlight/LoyaltyStatusEditor';
import { PendingApprovalsPage } from './sunlight/PendingApprovalsPage';
import { PlaceholderPage } from './sunlight/PlaceholderPage';
import { UsersPage } from './sunlight/UsersPage';
import { RolesPage } from './sunlight/RolesPage';
import { UserPage } from './sunlight/UserPage';
import { RolePage } from './sunlight/RolePage';
import { PerksPage } from './sunlight/PerksPage';
import { PayoutConfigsPage } from './sunlight/PayoutConfigsPage';
import { PayoutConfigEditor } from './sunlight/PayoutConfigEditor';
import { GameConfigsPage } from './sunlight/GameConfigsPage';
import { GameConfigEditor } from './sunlight/GameConfigEditor';
import { DefaultGameConfigsPage } from './sunlight/DefaultGameConfigsPage';
import { MetaGamePresetsPage } from './sunlight/MetaGamePresetsPage';
import { MetaGamePresetEditor } from './sunlight/MetaGamePresetEditor';

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

// Brand mark is app-owned (shell-grammar §3) but PAINTED from the token system: a
// CSS-masked silhouette (the .svg stays the source) filled by a brand-hued gradient
// pinned to --beam-mark-l, so it follows the ramp instead of carrying hardcoded
// colours. Same treatment as Gaspar, reusing the global --beam-mark-l. -webkit-mask
// for Safari.
const MARK_MASK = {
  height: 20,
  aspectRatio: '207 / 36', // the SUNLIGHT wordmark's intrinsic ratio
  display: 'block',
  maskImage: `url(${SUNLIGHT_MARK})`,
  WebkitMaskImage: `url(${SUNLIGHT_MARK})`,
  maskSize: 'contain',
  WebkitMaskSize: 'contain',
  maskRepeat: 'no-repeat',
  WebkitMaskRepeat: 'no-repeat',
  maskPosition: 'left center',
  WebkitMaskPosition: 'left center',
} as const;

const MARK_GRADIENT =
  'linear-gradient(115deg, ' +
  'oklch(from var(--mui-palette-primary-main) var(--beam-mark-l) c h), ' +
  'oklch(from var(--beam-gradient-hue-b) var(--beam-mark-l) c h), ' +
  'oklch(from var(--mui-palette-primary-main) var(--beam-mark-l) c calc(h + 45)))';

// Ghost = the same mask DESATURATED (chroma 0 → grey), a watermark that reads as
// absence — not a dim logo competing with the live mark.
const MARK_GHOST = 'oklch(from var(--mui-palette-primary-main) var(--beam-mark-l) 0 h)';

const brandMark = {
  color: <Box role="img" aria-label="Sunlight" sx={{ ...MARK_MASK, background: MARK_GRADIENT }} />,
  ghost: <Box aria-hidden sx={{ ...MARK_MASK, background: MARK_GHOST, opacity: 0.16 }} />,
};

/** The persistent shell around every route. A data-router layout route. */
function Layout() {
  const { brand, setBrand } = useContext(BrandContext);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const nav = buildSunlightNav({ pathname, navigate });

  return (
    <BeamAppShell
      brandMark={brandMark}
      navItems={nav}
      persistKey="beam.shell.sunlight"
      footer={<ShellFooter brand={brand} onBrandChange={setBrand} />}
    >
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
        // Maker-checker tracer: the loyalty ladder is fixed, so the editor only edits an
        // existing status (no /new). Approvals is the reviewer's queue.
        { path: 'loyalty-status/:id', element: <LoyaltyStatusEditor /> },
        { path: 'pending-approvals', element: <PendingApprovalsPage /> },
        { path: 'perks', element: <PerksPage /> },
        { path: 'payout-configs', element: <PayoutConfigsPage /> },
        { path: 'payout-configs/new', element: <PayoutConfigEditor /> },
        { path: 'payout-configs/:id', element: <PayoutConfigEditor /> },
        { path: 'game-configs', element: <GameConfigsPage /> },
        { path: 'game-configs/new', element: <GameConfigEditor /> },
        { path: 'game-configs/:id', element: <GameConfigEditor /> },
        { path: 'default-game-configs', element: <DefaultGameConfigsPage /> },
        { path: 'meta-game-presets', element: <MetaGamePresetsPage /> },
        { path: 'meta-game-presets/new', element: <MetaGamePresetEditor /> },
        { path: 'meta-game-presets/:id', element: <MetaGamePresetEditor /> },
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
