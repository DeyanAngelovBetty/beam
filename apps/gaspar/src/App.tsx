import { lazy, Suspense, useMemo, useState } from 'react';
import { ThemeProvider, CssBaseline, createBeamTheme, BeamAppShell, Box, Typography, brandLogos, brandLogoMaskSx, logoGradient } from '@betty/beam';
import type { BrandName, BeamNavItem } from '@betty/beam';
import { GASPAR_NAV, type GasparView, type GasparNavItem } from './gaspar/navItems';
import { ShellFooter } from './gaspar/ShellFooter';
import { ThemeLabDrawer } from '@betty/beam-lab';
import { TransactionsPage } from './gaspar/TransactionsPage';
import { DashboardPage } from './gaspar/DashboardPage';

// Rule Builder carries @xyflow/react (gaspar's first heavy shipped dep) — LAZY-loaded so the
// canvas + d3/zustand only download when an operator opens the route (proposal Q5).
const RuleBuilderPage = lazy(() =>
  import('./gaspar/ruleBuilder/RuleBuilderPage').then((m) => ({ default: m.RuleBuilderPage })),
);

// Brand mark is app-owned (shell-grammar §3), but PAINTED from the token system.
// An <img>-loaded SVG is a separate document page CSS can't reach, so the mark is
// rendered as a CSS-MASKED silhouette (the .svg stays the source of truth) filled
// by a brand-hued gradient — so it follows the ramp instead of carrying its own
// hardcoded colours. -webkit-mask-* alongside mask-* for Safari.
//
// The logo is now Vasco's ENVELOPE (1045×264, wordmark = 45.5% of height, star bleed inside the
// 72/72 safe area). `brandLogoMaskSx` sizes the ENVELOPE from the WORDMARK height: passing the
// old 20px keeps the rendered wordmark pixel-identical (box grows to 44px; the safe area is part
// of the logo, as with any icon grid). Geometry lives in @betty/beam; the gradient recipe below
// is unchanged.
const MARK_MASK = brandLogoMaskSx(brandLogos.gaspar, 20);

// The logo gradient is now FOUR registered, Theme-Lab-overridable stop slots (@betty/beam
// `logoGradient()` + `derived.logoStops`). Defaults are today's three tint points — primary /
// hue-b / primary+45°, each pinned to --beam-mark-l for legibility — mapped collinearly onto the
// four slots, so this renders BYTE-IDENTICAL until a slot is overridden. Angle (115deg) is
// app-owned and unchanged this pass.
const MARK_GRADIENT = logoGradient();

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

  // Wire selected/onClick from the `view` tag at ANY depth (Rule Builder is nested under Routing).
  const navItems = useMemo<BeamNavItem[]>(() => {
    const wire = (item: GasparNavItem): BeamNavItem => {
      const { view: itemView, children, ...rest } = item;
      return {
        ...rest,
        ...(itemView ? { selected: view === itemView, onClick: () => setView(itemView) } : {}),
        ...(children ? { children: children.map(wire) } : {}),
      };
    };
    return GASPAR_NAV.map(wire);
  }, [view]);

  return (
    <ThemeProvider theme={theme} defaultMode="dark" noSsr>
      <CssBaseline />
      <BeamAppShell
        brandMark={brandMark}
        navItems={navItems}
        persistKey="beam.shell.gaspar"
        footer={<ShellFooter brand={brand} onBrandChange={setBrand} onOpenThemeLab={() => setLabOpen(true)} />}
      >
        {view === 'dashboard' && <DashboardPage />}
        {view === 'transactions' && <TransactionsPage />}
        {view === 'ruleBuilder' && (
          <Suspense fallback={<Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>Loading Rule Builder…</Typography>}>
            <RuleBuilderPage />
          </Suspense>
        )}
      </BeamAppShell>
      {/* Non-modal — the live app above IS the preview; it stays interactable. */}
      <ThemeLabDrawer open={labOpen} onClose={() => setLabOpen(false)} product="gaspar" jurisdiction={brand} />
    </ThemeProvider>
  );
}
