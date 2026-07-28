import { useMemo, useState } from 'react';
import { ThemeProvider, CssBaseline, createBeamTheme, BeamAppShell } from '@betty/beam';
import type { BrandName } from '@betty/beam';
import GASPAR_MARK from './assets/GASPAR.svg';
import { GASPAR_NAV } from './gaspar/navItems';
import { ShellFooter } from './gaspar/ShellFooter';
import { TransactionsPage } from './gaspar/TransactionsPage';

// Brand mark is app-owned (shell-grammar §3). Color for content-adjacent chrome;
// ghost = the same asset desaturated to a watermark. Ghost opacity is a bench
// value — the motion/polish pass owns it.
const brandMark = {
  color: <img src={GASPAR_MARK} alt="Gaspar" style={{ height: 20, display: 'block' }} />,
  ghost: (
    <img
      src={GASPAR_MARK}
      alt=""
      aria-hidden
      style={{ height: 20, display: 'block', filter: 'grayscale(1)', opacity: 0.16 }}
    />
  ),
};

/**
 * Gaspar — Betty's Payment Orchestrator back office.
 *
 * Structurally identical to Sunlight by design: same shell, same organisms,
 * same runtime jurisdiction switch. The only difference is the product axis
 * passed to createBeamTheme, which swaps the entire token set. That
 * sameness IS the demo — one Beam, many products.
 *
 * ⚠️ Gaspar's token values are glanceable DEMO placeholders, not its
 * identity (BEAM.md Appendix C). The real design pass is pending.
 */
export function App() {
  const [brand, setBrand] = useState<BrandName>('ontario');
  const theme = useMemo(() => createBeamTheme(brand, 'gaspar'), [brand]);

  return (
    <ThemeProvider theme={theme} defaultMode="dark" noSsr>
      <CssBaseline />
      <BeamAppShell
        brandMark={brandMark}
        navItems={GASPAR_NAV}
        persistKey="beam.shell.gaspar"
        footer={<ShellFooter brand={brand} onBrandChange={setBrand} />}
      >
        <TransactionsPage />
      </BeamAppShell>
    </ThemeProvider>
  );
}
