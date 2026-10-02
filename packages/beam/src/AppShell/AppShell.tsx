import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import ListSubheader from '@mui/material/ListSubheader';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Stack from '@mui/material/Stack';
import useMediaQuery from '@mui/material/useMediaQuery';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import type { AppShellProps, BeamNavItem } from './AppShell.types';
import { PAGE_GUTTER, PAGE_TOP_GAP, CONTENT_BOTTOM, CONTENT_INLINE, LOGO_BAR_HEIGHT, BORDER_RADIUS_24, CHROME_PLATTER_OFFSET } from '../theme/tokens';
import { chromePlatterLayers } from '../theme/platter';
import { BeamSvgDefs, BEAM_GLASS_FILTER_ID } from '../BeamSvgDefs';

const DRAWER_WIDTH = 264; // narrow-viewport modal drawer paper (unchanged)
// Floating nav (§6.20): a 258px panel inset by the page gutter (PAGE_GUTTER = 24 at md) inside a 282px docked
// rail column. The inset IS the page gutter — one gutter value estate-wide, so the nav reads PAGE_GUTTER (no
// separate NAV_INSET token).
const RAIL_WIDTH = 282; // 258 panel + 24 (PAGE_GUTTER) left inset
const PANEL_WIDTH = 258;
const COLLAPSED_RAIL_WIDTH = 60; // the collapsed nav column — holds just the toggle (brand mark off, §6.16)
const PAGE_GUTTER_PX = PAGE_GUTTER.md * 8; // 24px — the page gutter as raw px, for position props (sx position props aren't spacing-scaled)
const NAV_GLASS_FILTER_ID = BEAM_GLASS_FILTER_ID;
// Offset as a LIVE var (Theme Lab tunes it; fallback = the token). Both the platter geometry AND main's docked
// left padding read it, so dragging offset moves the fringe + the content gutter in the same paint (§6.20).
const CHROME_PLATTER_OFFSET_VAR = `var(--beam-chrome-offset, ${CHROME_PLATTER_OFFSET}px)`;
// The CHROME platter rim behind the floating nav panel (both states) — the SHARED two-layer rig (glass ::after
// + gradient ::before, display-gated by the `--beam-chrome-*-on` vars), identical to every other chrome
// consumer (BeamChrome). Flipping fill is one paint across all of them; the Theme Lab's Chrome Platter section
// drives the `--beam-chrome-*` dials. Glass refraction reads the `#beam-nav-glass-noise` filter rendered below.
const NAV_BORDER_SX = chromePlatterLayers({ radius: BORDER_RADIUS_24, refract: NAV_GLASS_FILTER_ID });
// The floating brand strip's height. Since the density rework (2026-09-23) the sticky chrome NO LONGER
// derives its pin offset from this (it pins at CHROME_PIN_OFFSET and shares the top band with the toggle,
// cleared horizontally by the collapsed gutter). Local name for the shell's own strip height.
const STRIP_HEIGHT = LOGO_BAR_HEIGHT;

// timing: Deyan tunes on the bench
const PEEK_OPEN_DELAY_MS = 250;
// timing: Deyan tunes on the bench
const PEEK_CLOSE_GRACE_MS = 300;

const DEFAULT_PERSIST_KEY = 'beam.shell.locked';

// Horizontal content gutter (grammar §5). Opens at `md` — the same boundary as
// `isWide`, where the drawer becomes an in-flow sidebar and content gains a
// persistent neighbour to breathe against. No lg/xl step: past md the layout is
// stable; ultrawide is a content max-width job, not an ever-widening gutter.
// Inline gutter — retuned md 7→5 (2026-09-12). Sourced from CONTENT_INLINE so it stays one value.
const DEFAULT_CONTENT_GUTTER = CONTENT_INLINE; // { xs: 2, sm: 4, md: 5 } — 16 / 32 / 40px

// Vertical rhythm is NOT the gutter — top/bottom now split (CONTENT_TOP / CONTENT_BOTTOM) and SHARED from
// tokens so the sticky footer floor can take over the bottom padding without drift (imported above).

// View-transition names — the "layer names" the ignition matches on (grammar
// §4). Each names exactly one element per state so the browser can morph
// between positions; the choreography that times them lives in createBeamTheme.
const VT_BRANDMARK = 'beam-shell-brandmark'; // travels: strip ↔ locked header
const VT_PANEL = 'beam-shell-sidebar'; // grows/collapses: the locked panel
const VT_CONTENT = 'beam-shell-content'; // reflows: full-width ↔ right column

// Frosted glass for the NARROW modal drawer — converged onto the FINAL locked glass recipe (2026-10-02), so
// it's no longer the odd one out: blur + NOISE refraction carry it, a single TINT is the fill, and the 1px
// --beam-nav-edge border is the only edge (no saturate, no ::after edge-light, no shadow). Same vars as the
// nav platter glass + the bench, so all glass in the estate is one recipe.
//   • blur stays at the seed; the refraction reads the #beam-nav-glass-noise filter rendered in the shell.
//   • Fallback: no backdrop-filter / reduced transparency → force the tint fully opaque (a translucent
//     unblurred smear looks broken; plain opaque is intentional).
//   • No `will-change`: it can force a layer that breaks the effect outright.
const NAV_GLASS_SX = {
  background: 'color-mix(in oklab, var(--beam-chrome-tint-base, var(--mui-palette-background-paper)) var(--beam-chrome-tint, 15%), transparent)',
  backdropFilter: `blur(var(--beam-chrome-blur)) url(#${NAV_GLASS_FILTER_ID})`,
  WebkitBackdropFilter: `blur(var(--beam-chrome-blur)) url(#${NAV_GLASS_FILTER_ID})`,
  border: '1px solid var(--beam-nav-edge)', // the only edge
  '@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))': {
    '--beam-chrome-tint': '100%',
  },
  // Accessibility: a viewer who asks for less transparency gets the opaque rail (same tint:100% path as the
  // no-backdrop-filter fallback) — the glass is decorative, the nav must stay legible.
  '@media (prefers-reduced-transparency: reduce)': {
    '--beam-chrome-tint': '100%',
  },
};

// The lock shortcut — ONE definition, used by both the keydown listener and
// the chevron tooltips. Platform-aware: ⌘ on Mac, Ctrl elsewhere.
const LOCK_KEY = '\\';
const IS_MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform);
const LOCK_SHORTCUT_LABEL = IS_MAC ? '⌘\\' : 'Ctrl+\\';
// aria-keyshortcuts form of the same chord (space-separated alternatives) —
// the keydown listener accepts either modifier, so both are advertised.
const LOCK_ARIA_KEYSHORTCUTS = `Meta+${LOCK_KEY} Control+${LOCK_KEY}`;

// ---- ignition seam (grammar §4) ----
// The lock flip is routed through a view transition so CSS can later morph the
// swap (the ghost→gradient ignition). Progressive enhancement, squircle posture:
// feature-detected, and skipped when motion is reduced. No lib-type dependency —
// startViewTransition isn't in the DOM typings on our target yet.
type ViewTransitionStarter = (callback: () => void) => unknown;

function getStartViewTransition(): ViewTransitionStarter | null {
  if (typeof document === 'undefined') return null;
  const doc = document as Document & { startViewTransition?: ViewTransitionStarter };
  return typeof doc.startViewTransition === 'function' ? doc.startViewTransition.bind(doc) : null;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function readInitialLock(controlled: boolean, persistKey: string | false, defaultLocked?: boolean): boolean {
  if (controlled) return false;
  if (persistKey && typeof window !== 'undefined') {
    try {
      const v = window.localStorage.getItem(persistKey);
      if (v === 'true') return true;
      if (v === 'false') return false;
    } catch {
      /* localStorage unavailable — fall through */
    }
  }
  return defaultLocked ?? false;
}

/** Wordmark fallback when no brandMark is supplied. Ghost = subdued mono. */
function Wordmark({ title, ghost = false }: { title?: string; ghost?: boolean }) {
  return (
    <Typography
      component="span"
      sx={{
        fontWeight: 700,
        letterSpacing: '0.08em',
        // Ghost subdual is a styling value — pending design pass; plain low-opacity for now.
        ...(ghost ? { color: 'text.primary', opacity: 0.16 } : {}),
      }}
    >
      {title ?? 'BEAM'}
    </Typography>
  );
}

function NavLeaf({ item, inset = false }: { item: BeamNavItem; inset?: boolean }) {
  return (
    <ListItemButton
      selected={item.selected}
      onClick={item.onClick}
      sx={(theme) => {
        // Same CSS-vars-aware access Table uses for hover overlays.
        const hover = (theme.vars || theme).palette.action.hover;
        return {
          ...(inset && { pl: 4 }),
          // Active item rises to PAPER (surface 1) out of the recessed rail — the
          // page at the altitude of the content it shows. Opaque paper REPLACES
          // MUI's faint action.selected tint; altitude carries the state.
          '&.Mui-selected': { backgroundColor: 'var(--mui-palette-background-paper)' },
          // Hover on the selected item composes action.hover OVER paper — the case
          // to judge: does the overlay read as ABOVE paper (outranking content)?
          '&.Mui-selected:hover': {
            backgroundColor: 'var(--mui-palette-background-paper)',
            backgroundImage: `linear-gradient(${hover}, ${hover})`,
          },
        };
      }}
    >
      {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
      <ListItemText primary={item.label} />
    </ListItemButton>
  );
}

function NavItem({ item }: { item: BeamNavItem }) {
  const [open, setOpen] = useState(item.defaultOpen ?? false);
  const children = item.children ?? [];

  if (item.section) {
    return (
      <>
        <Divider sx={{ my: 1 }} />
        <ListSubheader disableSticky sx={{ bgcolor: 'transparent', letterSpacing: '0.06em' }}>
          {item.label}
        </ListSubheader>
        {children.map((child) => (
          <NavLeaf key={child.label} item={child} />
        ))}
      </>
    );
  }

  if (children.length === 0) {
    return <NavLeaf item={item} />;
  }

  return (
    <>
      <ListItemButton selected={item.selected} onClick={() => setOpen(!open)}>
        {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
        <ListItemText primary={item.label} />
        {open ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
      </ListItemButton>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <List dense disablePadding>
          {children.map((child) => (
            <NavLeaf key={child.label} item={child} inset />
          ))}
        </List>
      </Collapse>
    </>
  );
}

export function AppShell({
  navItems,
  children,
  brandMark,
  showCollapsedBrandMark = false,
  locked,
  defaultLocked,
  onLockedChange,
  persistKey = DEFAULT_PERSIST_KEY,
  footer,
  appAlert,
  peekOpenDelayMs = PEEK_OPEN_DELAY_MS,
  peekCloseGraceMs = PEEK_CLOSE_GRACE_MS,
  contentGutter = DEFAULT_CONTENT_GUTTER,
  title,
}: AppShellProps) {
  const theme = useTheme();
  const isWide = useMediaQuery(theme.breakpoints.up('md'));

  // ---- lock state (controlled/uncontrolled + persistence) ----
  const isControlled = locked !== undefined;
  const [uncontrolled, setUncontrolled] = useState(() =>
    readInitialLock(isControlled, persistKey, defaultLocked)
  );
  const isLocked = isControlled ? Boolean(locked) : uncontrolled;
  const setLocked = useCallback(
    (nextLocked: boolean) => {
      const applyLock = () => {
        if (!isControlled) {
          setUncontrolled(nextLocked);
          if (persistKey && typeof window !== 'undefined') {
            try {
              window.localStorage.setItem(persistKey, String(nextLocked));
            } catch {
              /* ignore */
            }
          }
        }
        onLockedChange?.(nextLocked);
      };

      // Ignition seam (grammar §4): morph the lock swap through a view
      // transition when supported and motion is allowed; otherwise a plain,
      // instant flip. flushSync lands the uncontrolled DOM change inside the
      // snapshot; controlled consumers own their own commit timing.
      // NOTE (interim): until the choreography CSS names the transition, the
      // browser's default root crossfade plays here. Intentional — see the
      // commit that introduced this.
      const startViewTransition = getStartViewTransition();
      if (!startViewTransition || prefersReducedMotion()) {
        applyLock();
        return;
      }
      startViewTransition(() => flushSync(applyLock));
    },
    [isControlled, persistKey, onLockedChange]
  );

  // Below the breakpoint, locked is unavailable — the peek becomes a drawer.
  const effectiveLocked = isWide && isLocked;

  // ---- peek (ephemeral; hover intent + close grace) ----
  const [peekOpen, setPeekOpen] = useState(false);
  const openTimer = useRef<ReturnType<typeof setTimeout>>();
  const closeTimer = useRef<ReturnType<typeof setTimeout>>();
  const clearTimers = useCallback(() => {
    if (openTimer.current) clearTimeout(openTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);
  const scheduleOpen = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    openTimer.current = setTimeout(() => setPeekOpen(true), peekOpenDelayMs);
  }, [peekOpenDelayMs]);
  const scheduleClose = useCallback(() => {
    if (openTimer.current) clearTimeout(openTimer.current);
    closeTimer.current = setTimeout(() => setPeekOpen(false), peekCloseGraceMs);
  }, [peekCloseGraceMs]);
  const openNow = useCallback(() => {
    clearTimers();
    setPeekOpen(true);
  }, [clearTimers]);
  const closeNow = useCallback(() => {
    clearTimers();
    setPeekOpen(false);
  }, [clearTimers]);

  useEffect(() => clearTimers, [clearTimers]);

  // ---- focus bridge (two-trigger disclosure) ----
  // Locking unmounts the strip; unlocking unmounts the panel header. The
  // expand/collapse triggers are DIFFERENT elements, so focus must hop to the
  // counterpart or it drops to <body> (WCAG 2.4.3). Handlers record intent; the
  // layout effect moves focus once the transition has committed. The ref-flag
  // self-guards: initial mount and resize-driven flips leave it null (no-op).
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const closeChevronRef = useRef<HTMLButtonElement>(null);
  const pendingFocusRef = useRef<'lock' | 'unlock' | null>(null);

  const lockOpen = useCallback(() => {
    pendingFocusRef.current = 'lock';
    setLocked(true);
    closeNow();
  }, [setLocked, closeNow]);
  const lockClose = useCallback(() => {
    pendingFocusRef.current = 'unlock';
    setLocked(false);
  }, [setLocked]);

  useLayoutEffect(() => {
    const pending = pendingFocusRef.current;
    if (!pending) return;
    pendingFocusRef.current = null;
    const target = pending === 'lock' ? closeChevronRef.current : hamburgerRef.current;
    target?.focus();
  }, [effectiveLocked]);

  // ⌘\ / Ctrl+\ toggles lock (wide only) from anywhere; focus follows the flip.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === LOCK_KEY && isWide) {
        e.preventDefault();
        const next = !isLocked;
        pendingFocusRef.current = next ? 'lock' : 'unlock';
        setLocked(next);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isWide, isLocked, setLocked]);

  // Esc dismisses a peek.
  useEffect(() => {
    if (!peekOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeNow();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [peekOpen, closeNow]);

  // Locking closes any open peek (it's been promoted).
  useEffect(() => {
    if (effectiveLocked) closeNow();
  }, [effectiveLocked, closeNow]);

  const panelId = 'beam-shell-panel';
  const colorMark = brandMark?.color ?? <Wordmark title={title} />;
  const footerContent = footer;

  const navList = (
    <List dense component="nav" aria-label="Main navigation" sx={{ flexGrow: 1, overflowY: 'auto' }}>
      {navItems.map((item) => (
        <NavItem key={item.label} item={item} />
      ))}
    </List>
  );

  /** The panel — one content skeleton, two natures (grammar §2). */
  const panel = (nature: 'locked' | 'peek', drawer = false) => {
    const floating = nature === 'peek' && !drawer;
    return (
      <Box
        id={panelId}
        component="section"
        aria-label="Navigation panel"
        onMouseEnter={floating ? clearTimers : undefined}
        onMouseLeave={floating ? scheduleClose : undefined}
        // Named only in the locked nature — the peek is not part of the ignition
        // (it's plain CSS, grammar §4). Enter on lock / exit on unlock.
        style={nature === 'locked' && !drawer ? { viewTransitionName: VT_PANEL } : undefined}
        sx={{
          // Fills its wrap (the outer platter Box owns size/position — floating nav, §6.20).
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden', // clip nav content to the radius; the wrap's platter ::after is outside, unaffected
          borderRadius: `${BORDER_RADIUS_24}px`,
          cornerShape: 'squircle', // match the platter so the curves stay parallel (§6.20)
          // SOLID paper0 panel (floating nav, §6.20): 1px var(--beam-nav-edge). The GRADIENT PLATTER rides the
          // outer wrap (beamPlatter), so no glass/::after/stacking-context on this box — VT_PANEL can stay for
          // the morph. The NARROW DRAWER keeps the frosted glass (NAV_GLASS_SX): a modal surface, not the
          // floating platter.
          ...(drawer
            ? { ...NAV_GLASS_SX, borderStyle: 'solid', borderWidth: '1px', borderColor: 'transparent' }
            : { bgcolor: 'background.paper0', border: '1px solid var(--beam-nav-edge)' }),
          // Peek keeps its drop shadow; the docked panel's separation is the platter rim (no shadow).
          ...(floating ? { boxShadow: 8 } : {}),
        }}
      >
        {/* Panel header — brand mark + chevrons (grammar §3). */}
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: 'center', px: 1.5, minHeight: STRIP_HEIGHT, borderBottom: 1, borderColor: 'divider' }}
        >
          {drawer ? (
            // Narrow drawer: color mark + a close button. No ghost, no lock —
            // the drawer has no lock to promise (grammar open question).
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>{colorMark}</Box>
              <Tooltip title="Close">
                <IconButton aria-label="Close navigation" onClick={closeNow}>
                  <CloseIcon />
                </IconButton>
              </Tooltip>
            </>
          ) : nature === 'peek' ? (
            <>
              {/* Peek shows the REAL brand mark (matches Figma). No VT name here: the lock↔unlock brand morph
                  is VT_BRANDMARK between the collapsed toggle strip and the locked panel header — the peek is
                  a transient overlay riding the panel's own slide/fade, never part of that morph. */}
              <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                {colorMark}
              </Box>
              <Tooltip title={`Lock sidebar open · ${LOCK_SHORTCUT_LABEL}`}>
                <IconButton
                  aria-label="Lock sidebar open"
                  aria-keyshortcuts={LOCK_ARIA_KEYSHORTCUTS}
                  onClick={lockOpen}
                >
                  <KeyboardDoubleArrowRightIcon />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <>
              <Box style={{ viewTransitionName: VT_BRANDMARK }} sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                {colorMark}
              </Box>
              <Tooltip title={`Close sidebar · ${LOCK_SHORTCUT_LABEL}`}>
                <IconButton
                  ref={closeChevronRef}
                  aria-label="Close sidebar"
                  aria-expanded
                  aria-controls={panelId}
                  aria-keyshortcuts={LOCK_ARIA_KEYSHORTCUTS}
                  onClick={lockClose}
                >
                  <KeyboardDoubleArrowLeftIcon />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Stack>

        {navList}
        {footerContent && <Box sx={{ borderTop: 1, borderColor: 'divider' }}>{footerContent}</Box>}
      </Box>
    );
  };

  const main = (
    <Box
      component="main"
      // CONSTANT KEYED POSITION (BEAM.md §6.17): `main` is the single keyed child that survives every
      // nav-state swap — React updates the chrome sibling beside it but never remounts the page/Outlet.
      key="beam-shell-main"
      // Named for the ignition (grammar §4): morphs full-width ↔ right column on
      // lock/unlock. Present in both states, so its group genuinely reflows.
      style={{ viewTransitionName: VT_CONTENT }}
      // Collapsed-state marker for CSS/:has consumers (density rework 2026-09-23). Present only when the
      // sidebar is collapsed (closed/narrow); absent when the panel is locked (expanded).
      data-beam-nav-collapsed={effectiveLocked ? undefined : ''}
      sx={{
        // The SCROLL OWNER (chrome posture): the app scrolls INSIDE main, so the app-alert bar
        // (root's first row) and the rail stay put while content scrolls. Fills appFrame.
        minWidth: 0,
        minHeight: 0,
        height: '100%',
        overflowY: 'auto',
        // Page gutters (§6.20, 2026-10-01). Top / right / bottom are always PAGE_GUTTER. The LEFT is
        // nav-state-aware, because the floating nav owns the left space differently per state:
        //  • DOCKED — PAGE_GUTTER + CHROME_PLATTER_OFFSET (24 + 12 = 36px): the panel's platter fringe extends 12px
        //    into the gutter, so content opens an extra 12px to clear it and keep a true 24px gap to the fringe.
        //  • COLLAPSED (wide) — 0: the 60px nav column already supplies the left clearance.
        //  • NARROW — PAGE_GUTTER: the nav is a modal drawer OVER main (no column), so main keeps its full gutter.
        // This re-introduces a nav-state-aware left edge (the 2026-10-01 "PAGE_GUTTER on all edges" rule is
        // superseded) — now justified by the nav column + platter fringe owning the left space, not a floating
        // toggle. (`contentGutter` + `CONTENT_GUTTER_LEFT_COLLAPSED` stay vestigial — no consumer.)
        pr: PAGE_GUTTER,
        pl: effectiveLocked
          ? `calc(${PAGE_GUTTER.md * 8}px + ${CHROME_PLATTER_OFFSET_VAR})` // gutter + platter fringe (live via the offset var)
          : isWide
            ? 0 // collapsed: the 60px nav column is the clearance
            : PAGE_GUTTER, // narrow: drawer overlays main, keep the full gutter
        pb: CONTENT_BOTTOM,
        pt: PAGE_TOP_GAP,
        // STICKY-CHROME CONTRACT: a grid with `stickyChrome` publishes `data-beam-sticky-chrome`; it takes
        // over the page's TOP + BOTTOM spacing (footer floor, header ceiling), so main gives up BOTH its
        // top and bottom padding (side rhythm untouched). Padding on the SCROLL OWNER is fixed under a
        // sticky element (an 80px top shelf) — donating it to the page Stack (which scrolls) lets the
        // bucket pin flush at the true viewport top. `:has()` is Baseline; no fallback needed.
        // SNAP (A): with a sticky grid present, the page scroller gets `y proximity` snap — NEVER mandatory
        // (two snap points on a 500-row page would trap mid-row). Two targets: page top (the Stack's first
        // section) and the pinned grid (the Paper), both declared where they live. Scoped to the sticky
        // contract, so pages without a sticky grid are untouched, and at tier 3 (attr dropped) it goes away.
        '&:has([data-beam-sticky-chrome])': { pt: 0, pb: 0, scrollSnapType: 'y proximity' },
        // Page mesh moved to a fixed body::before layer (createBeamTheme MuiCssBaseline) — off
        // this tall scrolling element so it doesn't repaint on scroll, behind opaque surfaces.
      }}
    >
      {children}
    </Box>
  );

  // ---- ONE grid, all nav states (BEAM.md §6.17, §6.20). Columns `<nav> 1fr`; `<nav>` (key="beam-shell-rail")
  // is col 1 and `{main}` (key) is col 2 — both CONSTANT keyed children, so collapse/expand/peek only swaps
  // the nav column's contents + the grid template; `main` never remounts (its grid cell is pure CSS). The nav
  // panel FLOATS in every state; the gradient border always rides a clean OUTER wrap (no filter/VT/z-index →
  // its z-−1 ::after shows on the canvas), the glass panel is the inner child. ----
  const frameContent = (
    <Box
      sx={{
        display: 'grid',
        // Docked: 270 rail. Collapsed (wide): a 60 column holding the toggle. Narrow: no track — <nav> goes
        // absolute, main is the sole 1fr column.
        gridTemplateColumns: effectiveLocked
          ? `${RAIL_WIDTH}px 1fr`
          : isWide
            ? `${COLLAPSED_RAIL_WIDTH}px 1fr`
            : '1fr',
        height: '100%',
      }}
    >
      <Box
        component="nav"
        key="beam-shell-rail"
        aria-label="Primary"
        // Wide + collapsed: hovering the column peeks. (Docked has no hover; narrow taps the drawer.)
        onMouseEnter={!effectiveLocked && isWide && !peekOpen ? scheduleOpen : undefined}
        // DOCKED: a flex column, PADDING = the gaps (spacing-aware → 12/0/12/12); the border wrap is a flex
        // child that stretches (no absolute/inset maths/height calc). COLLAPSED (wide): a 60 column; z-index
        // HERE (not the wrap) lifts the peek over main; overflow visible so the ring isn't clipped. NARROW:
        // out of flow (main is the sole 1fr track); the hamburger floats top-left.
        sx={
          effectiveLocked
            ? ({ display: 'flex', height: '100%', pt: PAGE_GUTTER, pb: PAGE_GUTTER, pl: PAGE_GUTTER } as const)
            : isWide
              ? ({ position: 'relative', height: '100%', zIndex: theme.zIndex.appBar - 1 } as const)
              : ({ position: 'absolute', top: 0, left: 0, zIndex: theme.zIndex.appBar } as const)
        }
      >
        {effectiveLocked ? (
          // Border wrap (in flow, flex child) > glass panel. Keeps the border's own position:relative — no
          // clobber because nothing here needs absolute.
          <Box sx={{ flex: 1, minWidth: 0, ...NAV_BORDER_SX }}>
            {panel('locked')}
          </Box>
        ) : (
          <>
            {/* Toggle strip — the hamburger (wide = lock/dock, hover peeks; narrow = open drawer). Collapsed
                brand mark is OFF by default estate-wide (§6.16), so the 60 column shows only the control. */}
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minHeight: STRIP_HEIGHT, px: 1 }}>
              <Tooltip title={isWide ? `Lock sidebar open · ${LOCK_SHORTCUT_LABEL}` : 'Open navigation'}>
                <IconButton
                  ref={hamburgerRef}
                  aria-label={isWide ? 'Lock sidebar open' : 'Open navigation'}
                  aria-expanded={isWide ? effectiveLocked : peekOpen}
                  aria-controls={panelId}
                  aria-keyshortcuts={isWide ? LOCK_ARIA_KEYSHORTCUTS : undefined}
                  onClick={() => {
                    if (isWide) lockOpen();
                    else if (peekOpen) closeNow();
                    else openNow();
                  }}
                >
                  <MenuIcon />
                </IconButton>
              </Tooltip>
              {isWide && showCollapsedBrandMark && (
                <Box style={{ viewTransitionName: VT_BRANDMARK }} sx={{ display: 'flex', alignItems: 'center' }}>
                  {colorMark}
                </Box>
              )}
            </Stack>

            {isWide ? (
              peekOpen && (
                // Peek = the floating panel, sliding out of the 60 column. Border wrap (spread FIRST so our
                // `position:absolute` wins over the border's `relative`); top/bottom PINNED (no height calc);
                // left PAGE_GUTTER_PX so the ring clears appFrame's overflow:hidden. z-index lives on <nav>.
                <Box
                  sx={{
                    ...NAV_BORDER_SX,
                    position: 'absolute',
                    top: STRIP_HEIGHT,
                    left: PAGE_GUTTER_PX,
                    bottom: PAGE_GUTTER_PX,
                    width: PANEL_WIDTH,
                  }}
                >
                  {panel('peek')}
                </Box>
              )
            ) : (
              // Narrow: the peek wearing mobile clothes — a modal drawer (portalled, out of flow).
              <Drawer
                variant="temporary"
                open={peekOpen}
                onClose={closeNow}
                ModalProps={{ keepMounted: true }}
                sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH, ...NAV_GLASS_SX } }}
              >
                {panel('peek', true)}
              </Drawer>
            )}
          </>
        )}
      </Box>

      {main}
    </Box>
  );

  // ---- The two-row shell frame. Row 1 = the app-alert slot (full VIEWPORT width, in-flow,
  // auto height → absent slot is a zero-height row, byte-identical to no bar). Row 2 = appFrame,
  // the positioning universe for everything else: rail (all three states), brand strip, main,
  // gutters, view transitions. `position: relative` on appFrame means the `absolute` strip/rail/
  // peek anchor to a universe that STARTS BELOW the bar — no more strip-over-bar overlap. The bar
  // is OUTSIDE appFrame, so it is outside every view-transition group (chrome doesn't morph with
  // pages). Root is a FIXED viewport height so the app scrolls inside main, not the document. ----
  return (
    <Box sx={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Glass refraction filter — hoisted to BeamSvgDefs (idempotent, document-global by id) so chrome glass
          works outside the shell too. Rendering it here covers every app that mounts AppShell. */}
      <BeamSvgDefs />
      {appAlert}
      {/* minHeight:0 = the flexbox footgun guard: without it a flex child refuses to shrink below
          its content, main's internal scroll never engages, and the document scrolls instead. */}
      <Box sx={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>{frameContent}</Box>
    </Box>
  );
}
