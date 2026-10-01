import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
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
import { PAGE_GUTTER, PAGE_TOP_GAP, CONTENT_BOTTOM, CONTENT_INLINE, CONTENT_GUTTER_LEFT_COLLAPSED, LOGO_BAR_HEIGHT, NAV_INSET, BORDER_RADIUS_24 } from '../theme/tokens';
import { beamGradientBorder } from '../theme/gradientBorder';

const DRAWER_WIDTH = 264; // narrow-viewport modal drawer paper (unchanged)
// Floating nav (§6.20): a 258px glass panel inset NAV_INSET inside a 270px docked rail column.
const RAIL_WIDTH = 270;
const PANEL_WIDTH = 258;
// Calm gradient-border rim for the floating panel (both states) — interaction 'none' (no tracking/spin),
// mixing toward the canvas base it floats over. Replaces the docked separation shadow.
const NAV_BORDER_SX = beamGradientBorder({ interaction: 'none', surface: 'var(--mui-palette-background-default)', radius: BORDER_RADIUS_24 });
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
const VT_GHOST = 'beam-shell-ghost'; // fades out: the peek's watermark
const VT_PANEL = 'beam-shell-sidebar'; // grows/collapses: the locked panel
const VT_CONTENT = 'beam-shell-content'; // reflows: full-width ↔ right column

// Frosted-glass rail — ONE recipe applied at both rail sites (locked panel +
// narrow MuiDrawer-paper). Extending it (alpha, blur, saturate, the edge) happens
// HERE, not per-site. The nav-surface gradient is now translucent (its stops carry
// --beam-nav-glass-alpha), and backdrop-filter blurs + re-saturates what shows
// through (blur desaturates; the boost makes it a tinted pane, not fog).
//   • blur stays at the 24px seed — a bigger radius erases the 56px mesh dots, the
//     only structure the backdrop has.
//   • The lit EDGE is a ::after pseudo (1px top+right inner catch, the rail's own
//     tint lifted — never white), so it adds no width and doesn't collide with the
//     peek's drop shadow. `position` is added by each site (the locked panel is
//     static → relative; the drawer paper is already MUI-fixed → leave it).
//   • Fallback: where backdrop-filter is unsupported, recompute the gradient fully
//     opaque (alpha 1) — a translucent unblurred smear looks broken; plain is
//     intentional. backdrop-filter is simply ignored where unsupported.
//   • No `will-change`: it can force a layer that breaks the effect outright.
const NAV_GLASS_SX = {
  background: 'var(--beam-nav-surface)',
  backdropFilter: 'blur(var(--beam-nav-glass-blur)) saturate(var(--beam-nav-glass-saturate))',
  WebkitBackdropFilter: 'blur(var(--beam-nav-glass-blur)) saturate(var(--beam-nav-glass-saturate))',
  '&::after': {
    content: '""',
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    // Inherit the panel's radius or the square pseudo overhangs the rounded
    // corner (a hard right-angle around the peek). Works for every state — locked
    // (r0), peek (r2 top/bottom-right), narrow — each inherits its own radius.
    borderRadius: 'inherit',
    borderTop: '1px solid var(--beam-nav-edge)',
    borderRight: '1px solid var(--beam-nav-edge)',
  },
  '@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))': {
    '--beam-nav-glass-alpha': '1',
  },
  // Accessibility: a viewer who asks for less transparency gets the opaque rail (same alpha=1 path as the
  // no-backdrop-filter fallback) — the glass is decorative, the nav must stay legible.
  '@media (prefers-reduced-transparency: reduce)': {
    '--beam-nav-glass-alpha': '1',
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
  const ghostMark = brandMark?.ghost ?? <Wordmark title={title} ghost />;
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
          // Fills its wrap (the outer border Box owns size/position now — floating nav, §6.20).
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          // Nav rail — the shared frosted-glass recipe (NAV_GLASS_SX): a translucent tinted gradient +
          // backdrop-filter, in BOTH states now. `position: relative` so the lit-edge ::after insets to the
          // panel; the backdrop-filter + VT name here are exactly why the GRADIENT BORDER lives on the outer
          // wrap, not this element (its own ::after + stacking context are taken).
          position: 'relative',
          overflow: 'hidden', // clip nav content to the radius; the wrap's border ::after is outside, unaffected
          ...NAV_GLASS_SX,
          // Constant-geometry transparent border (keeps box geometry so locked↔peek doesn't reflow); the lit
          // --beam-nav-edge catch is the glass's visible edge.
          borderStyle: 'solid',
          borderWidth: '1px',
          borderColor: 'transparent',
          // Floating panel, both states: radius borderRadius/24. Peek keeps its drop shadow; the DOCKED panel
          // drops the old 6px separation shadow — the gradient border on the wrap replaces it (§6.20).
          borderRadius: `${BORDER_RADIUS_24}px`,
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
              {/* Ghost = the destination marker: where the brand lands on lock. */}
              <Box style={{ viewTransitionName: VT_GHOST }} sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                {ghostMark}
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
        // Page gutters (§6.19, 2026-09-29): every edge is PAGE_GUTTER (3×) in BOTH nav states; only the LEFT
        // is nav-state-aware — it opens to CONTENT_GUTTER_LEFT_COLLAPSED when collapsed to clear the floating
        // toggle. Gated on the shell's collapsed state (`effectiveLocked`), not viewport width. (`contentGutter`
        // is vestigial — no app passes it — kept this pass; not read here anymore.)
        pr: PAGE_GUTTER,
        pl: effectiveLocked ? PAGE_GUTTER : CONTENT_GUTTER_LEFT_COLLAPSED,
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

  // ---- ONE frame, all nav states (BEAM.md §6.17). A SINGLE grid container renders in every state, with
  // `main` as its CONSTANT keyed last child — so collapse/expand/peek swaps only the chrome sibling and NEVER
  // remounts the page. LOCKED adds a real 264px rail column (in-flow, so the column can animate, grammar §4);
  // COLLAPSED/NARROW drops to a single `1fr` column and layers its chrome (strip, hover zone, peek, drawer)
  // OUT OF FLOW (absolute / portalled) — consuming no grid track, so `main` keeps the sole cell and never
  // wraps to a second row. The rail is a plain full-height cell (main owns the scroll, no sticky needed). ----
  const frameContent = (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: effectiveLocked ? `${RAIL_WIDTH}px 1fr` : '1fr',
        height: '100%',
      }}
    >
      {effectiveLocked ? (
        // Rail cell (270); the panel floats inside it — inset NAV_INSET (12) top/bottom/left, 258 wide. The
        // gradient border rides the OUTER wrap (no filter/VT/z-index → its z-−1 ::after shows on the canvas
        // in the inset gap), the glass panel is the inner. overflow visible so the ring isn't clipped.
        <Box component="nav" key="beam-shell-rail" sx={{ position: 'relative', height: '100%' }}>
          <Box sx={{ position: 'absolute', top: NAV_INSET, bottom: NAV_INSET, left: NAV_INSET, width: PANEL_WIDTH, ...NAV_BORDER_SX }}>
            {panel('locked')}
          </Box>
        </Box>
      ) : (
        // CLOSED (wide) or NARROW: brand strip + peek/drawer on demand. All `absolute` within appFrame (NOT
        // `fixed` to the viewport), so they sit BELOW the app-alert bar and out of the grid flow. Keyed as a
        // single fragment so `main` stays the same-index, same-key sibling as in the locked branch.
        <Fragment key="beam-shell-chrome">
          {/* Brand strip (grammar §3): hamburger + color mark, top-left, no bar. */}
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: 'center', position: 'absolute', top: 0, left: 0, zIndex: theme.zIndex.appBar, height: STRIP_HEIGHT, px: 1 }}
          >
            {/* Hamburger, dual role (grammar §3, §6): wide = lock toggle (hover still
                peeks); narrow = open the modal drawer, no lock. */}
            <Tooltip title={isWide ? `Lock sidebar open · ${LOCK_SHORTCUT_LABEL}` : 'Open navigation'}>
              <IconButton
                ref={hamburgerRef}
                aria-label={isWide ? 'Lock sidebar open' : 'Open navigation'}
                aria-expanded={isWide ? effectiveLocked : peekOpen}
                aria-controls={panelId}
                aria-keyshortcuts={isWide ? LOCK_ARIA_KEYSHORTCUTS : undefined}
                onMouseEnter={isWide ? scheduleOpen : undefined}
                onClick={() => {
                  if (isWide) lockOpen();
                  else if (peekOpen) closeNow();
                  else openNow();
                }}
              >
                <MenuIcon />
              </IconButton>
            </Tooltip>
            {/* Collapsed-strip brand mark — OFF by default estate-wide (Chavdar 2026-09-28, BEAM.md §6.16): the
                collapsed rail shows only the expand/collapse control, so the top band is reclaimed for content +
                the sticky chrome. Opt back in with `showCollapsedBrandMark`. Expanded panel keeps its mark. */}
            {showCollapsedBrandMark && (
              <Box style={{ viewTransitionName: VT_BRANDMARK }} sx={{ display: 'flex', alignItems: 'center' }}>
                {colorMark}
              </Box>
            )}
          </Stack>

          {/* Left-edge hover zone opens the peek (wide, closed). */}
          {isWide && !peekOpen && (
            <Box
              onMouseEnter={scheduleOpen}
              sx={{ position: 'absolute', top: 0, left: 0, width: 8, height: '100%', zIndex: theme.zIndex.appBar - 1 }}
            />
          )}

          {isWide ? (
            peekOpen && (
              // Peek = floating panel, non-modal (grammar §2, §6). Inset below the strip so the strip stays
              // visible; left: NAV_INSET so the gradient-border ring clears appFrame's overflow:hidden (not
              // left:0). This Box is the border WRAP (no filter/VT); the glass panel is its child.
              <Box
                sx={{
                  position: 'absolute',
                  top: STRIP_HEIGHT,
                  left: NAV_INSET,
                  width: PANEL_WIDTH,
                  height: `calc(100% - ${STRIP_HEIGHT * 2}px)`,
                  zIndex: theme.zIndex.appBar - 1,
                  ...NAV_BORDER_SX,
                }}
              >
                {panel('peek')}
              </Box>
            )
          ) : (
            // Narrow: the peek wearing mobile clothes — a modal drawer.
            <Drawer
              variant="temporary"
              open={peekOpen}
              onClose={closeNow}
              ModalProps={{ keepMounted: true }}
              sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH, border: 0, ...NAV_GLASS_SX } }}
            >
              {panel('peek', true)}
            </Drawer>
          )}
        </Fragment>
      )}

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
      {appAlert}
      {/* minHeight:0 = the flexbox footgun guard: without it a flex child refuses to shrink below
          its content, main's internal scroll never engages, and the document scrolls instead. */}
      <Box sx={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>{frameContent}</Box>
    </Box>
  );
}
