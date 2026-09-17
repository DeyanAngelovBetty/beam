import { useMemo, useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline, createBeamTheme, AppShell } from '@betty/beam';
import type { BrandName } from '@betty/beam';
import { MIDNIGHT_NAV } from './midnight/navItems';
import { ShellFooter } from './midnight/ShellFooter';
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
 * (BeamPage, BeamStat, BeamTabs, TableFilters) are explicit
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
    // MemoryRouter: this demo navigates by local state, not routes — but the ported `useTableFilters`
    // controller depends on react-router's `useSearchParams` (Wave-1 URL-sync adaptation), so its
    // consumers need a Router in the tree. Memory (not Hash) keeps the demo's own state-nav untouched
    // and its filter bars purely in-memory (no URL sync is wired on these screens).
    <MemoryRouter>
      <ThemeProvider theme={theme} defaultMode="dark" noSsr>
        <CssBaseline />
        {/* NO Theme Lab entry here (deliberate, parked): Midnight renders as product 'sunlight',
            so a Lab mounted here would export sunlight-scoped combos from a demo retrofit shell —
            confusing provenance. If Midnight ever graduates to a real product axis, revisit. */}
        <AppShell
          title="MIDNIGHT"
          navItems={nav}
          persistKey="beam.shell.midnight"
          footer={<ShellFooter brand={brand} onBrandChange={setBrand} />}
        >
          {screen === 'search' ? (
            <PlayerSearchPage onOpenPlayer={() => setScreen('player')} />
          ) : (
            <PlayerPaymentsPage onBack={() => setScreen('search')} />
          )}
        </AppShell>
      </ThemeProvider>
    </MemoryRouter>
  );
}
