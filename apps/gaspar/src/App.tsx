import { useMemo, useState } from 'react';
import { ThemeProvider, CssBaseline, createBeamTheme, BeamAppShell, Box } from '@betty/beam';
import type { BrandName, BeamNavItem } from '@betty/beam';
import GASPAR_MARK from './assets/GASPAR.svg';
import { GASPAR_NAV, type GasparView } from './gaspar/navItems';
import { ShellFooter } from './gaspar/ShellFooter';
import { ThemeLabDrawer } from '@betty/beam-lab';
import { TransactionsPage } from './gaspar/TransactionsPage';
import { DashboardPage } from './gaspar/DashboardPage';

// Brand mark is app-owned (shell-grammar §3), but PAINTED from the token system.
// An <img>-loaded SVG is a separate document page CSS can't reach, so the mark is
// rendered as a CSS-MASKED silhouette (the .svg stays the source of truth) filled
// by a brand-hued gradient — so it follows the ramp instead of carrying its own
// hardcoded colours. -webkit-mask-* alongside mask-* for Safari.
const MARK_MASK = {
  height: 20,
  aspectRatio: '889 / 152', // the GASPAR wordmark's intrinsic ratio
  display: 'block',
  maskImage: `url(${GASPAR_MARK})`,
  WebkitMaskImage: `url(${GASPAR_MARK})`,
  maskSize: 'contain',
  WebkitMaskSize: 'contain',
  maskRepeat: 'no-repeat',
  WebkitMaskRepeat: 'no-repeat',
  maskPosition: 'left center',
  WebkitMaskPosition: 'left center',
} as const;

// The same three tint points as the page mesh / gradient border, pinned to the
// per-scheme mark lightness (--beam-mark-l) so the mark stays legible as the ramp
// moves. Hues stay brand (no computed complement — Gaspar stays teal).
const MARK_GRADIENT =
  'linear-gradient(115deg, ' +
  'oklch(from var(--mui-palette-primary-main) var(--beam-mark-l) c h), ' +
  'oklch(from var(--beam-gradient-hue-b) var(--beam-mark-l) c h), ' +
  'oklch(from var(--mui-palette-primary-main) var(--beam-mark-l) c calc(h + 45)))';

// Ghost = a DESATURATED watermark (chroma 0 → grey), not a dim logo — it reads as
// absence and doesn't compete with the live mark. Same silhouette + weight.
const MARK_GHOST = 'oklch(from var(--mui-palette-primary-main) var(--beam-mark-l) 0 h)';

const brandMark = {
  color: <Box role="img" aria-label="Gaspar" sx={{ ...MARK_MASK, background: MARK_GRADIENT }} />,
  ghost: <Box aria-hidden sx={{ ...MARK_MASK, background: MARK_GHOST, opacity: 0.16 }} />,
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
  // Minimal view switch — Gaspar has no router yet. Nav leaves that route carry a
  // `view` tag (navItems.tsx); we wire selected/onClick from it. Dashboard is the
  // default landing view; the bench lives in Storybook, not the app.
  const [view, setView] = useState<GasparView>('dashboard');
  const [labOpen, setLabOpen] = useState(false); // Theme Lab drawer (Gaspar only)
  const theme = useMemo(() => createBeamTheme(brand, 'gaspar'), [brand]);

  const navItems = useMemo<BeamNavItem[]>(
    () =>
      GASPAR_NAV.map(({ view: itemView, ...item }) =>
        itemView
          ? { ...item, selected: view === itemView, onClick: () => setView(itemView) }
          : item,
      ),
    [view],
  );

  return (
    <ThemeProvider theme={theme} defaultMode="dark" noSsr>
      <CssBaseline />
      <BeamAppShell
        brandMark={brandMark}
        navItems={navItems}
        persistKey="beam.shell.gaspar"
        footer={<ShellFooter brand={brand} onBrandChange={setBrand} onOpenThemeLab={() => setLabOpen(true)} />}
      >
        {view === 'dashboard' ? <DashboardPage /> : <TransactionsPage />}
      </BeamAppShell>
      {/* Non-modal — the live app above IS the preview; it stays interactable. */}
      <ThemeLabDrawer open={labOpen} onClose={() => setLabOpen(false)} product="gaspar" jurisdiction={brand} />
    </ThemeProvider>
  );
}
