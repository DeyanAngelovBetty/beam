import { useMemo, useState } from 'react';
import { ThemeProvider, CssBaseline, createBeamTheme, BeamAppShell } from '@betty/beam';
import type { BrandName } from '@betty/beam';
import { SUNLIGHT_NAV } from './sunlight/navItems';
import { LoyaltyStatusPage } from './sunlight/LoyaltyStatusPage';

/**
 * Sunlight is a back office: operators manage multiple jurisdictions from
 * one seat, so brand is a RUNTIME context switch here (header dropdown) —
 * unlike the player-facing SDK, where brand stays deploy-time. Switching
 * brand rebuilds the theme (rare event, acceptable); switching light/dark
 * stays a CSS-variable attribute flip (frequent event, free).
 */
export function App() {
  const [brand, setBrand] = useState<BrandName>('ontario');
  const theme = useMemo(() => createBeamTheme(brand), [brand]);

  return (
    <ThemeProvider theme={theme} defaultMode="dark" noSsr>
      <CssBaseline />
      <BeamAppShell
        title="SUNLIGHT"
        product="sunlight"
        navItems={SUNLIGHT_NAV}
        brand={brand}
        onBrandChange={setBrand}
      >
        <LoyaltyStatusPage />
      </BeamAppShell>
    </ThemeProvider>
  );
}
