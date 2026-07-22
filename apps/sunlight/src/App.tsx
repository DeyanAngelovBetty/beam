import { useMemo, useState } from 'react';
import { ThemeProvider, CssBaseline, createBeamTheme, BeamAppShell } from '@betty/beam';
import type { BrandName } from '@betty/beam';
import { buildSunlightNav, type SunlightPage } from './sunlight/navItems';
import { LoyaltyStatusPage } from './sunlight/LoyaltyStatusPage';
import { PlaceholderPage } from './sunlight/PlaceholderPage';

/**
 * Sunlight is a back office: operators manage multiple jurisdictions from
 * one seat, so brand is a RUNTIME context switch here (header dropdown) —
 * unlike the player-facing SDK, where brand stays deploy-time. Switching
 * brand rebuilds the theme (rare event, acceptable); switching light/dark
 * stays a CSS-variable attribute flip (frequent event, free).
 *
 * Page navigation is local state, not a router — the demo has a handful of
 * screens and no URLs to own yet.
 */
export function App() {
  const [brand, setBrand] = useState<BrandName>('ontario');
  const [page, setPage] = useState<SunlightPage>('loyalty-status');
  const theme = useMemo(() => createBeamTheme(brand), [brand]);

  const nav = buildSunlightNav({ active: page, onNavigate: setPage });

  return (
    <ThemeProvider theme={theme} defaultMode="dark" noSsr>
      <CssBaseline />
      <BeamAppShell
        title="SUNLIGHT"
        product="sunlight"
        navItems={nav}
        brand={brand}
        onBrandChange={setBrand}
      >
        {renderPage(page)}
      </BeamAppShell>
    </ThemeProvider>
  );
}

function renderPage(page: SunlightPage) {
  switch (page) {
    case 'loyalty-status':
      return <LoyaltyStatusPage />;
    case 'perks':
      return <PlaceholderPage title="Perks" />;
    case 'payout-tables':
      return <PlaceholderPage title="Payout Tables" />;
    case 'prize-wall':
      return <PlaceholderPage title="Prize Wall" />;
    case 'users':
      return <PlaceholderPage title="Users" />;
    case 'roles':
      return <PlaceholderPage title="Roles" />;
  }
}
