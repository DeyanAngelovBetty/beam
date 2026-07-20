import { useMemo, useState } from 'react';
import { ThemeProvider, CssBaseline, createBeamTheme, BeamAppShell } from '@betty/beam';
import type { BrandName } from '@betty/beam';
import { MIDNIGHT_NAV } from './midnight/navItems';
import { PlayerSearchPage } from './midnight/PlayerSearchPage';
import { PlayerPaymentsPage } from './midnight/PlayerPaymentsPage';

/**
 * Midnight retrofit slice — the player Payments tab and the Player Search
 * that leads to it, rebuilt in Beam.
 *
 * What is retrofitted is the SCREENS' JOB, not their markup: same data, same
 * operator tasks, none of the legacy layout. Midnight's current versions are
 * not well-considered examples, so copying them would bake their decisions
 * into Beam's first organisms — backwards. The organisms these screens use
 * (BeamPageHeader, BeamStat, BeamTabs, BeamFilterBar) are explicit
 * placeholders awaiting the Figma design pass.
 *
 * Uses Sunlight's token set: Midnight has no product axis of its own, and
 * inventing one before the retrofit is real would violate "axes earn their
 * existence" (BEAM.md §3.1).
 */

type Screen = 'search' | 'player';

export function App() {
  const [brand, setBrand] = useState<BrandName>('ontario');
  const [screen, setScreen] = useState<Screen>('search');
  const theme = useMemo(() => createBeamTheme(brand, 'sunlight'), [brand]);

  const nav = MIDNIGHT_NAV.map((item) =>
    item.label === 'Players' ? { ...item, selected: true } : item
  );

  return (
    <ThemeProvider theme={theme} defaultMode="dark" noSsr>
      <CssBaseline />
      <BeamAppShell
        title="MIDNIGHT"
        product="sunlight"
        navItems={nav}
        brand={brand}
        onBrandChange={setBrand}
      >
        {screen === 'search' ? (
          <PlayerSearchPage onOpenPlayer={() => setScreen('player')} />
        ) : (
          <PlayerPaymentsPage onBack={() => setScreen('search')} />
        )}
      </BeamAppShell>
    </ThemeProvider>
  );
}
