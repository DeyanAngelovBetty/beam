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
import type { BeamAppShellProps, BeamNavItem } from './BeamAppShell.types';

const DRAWER_WIDTH = 264;
const STRIP_HEIGHT = 56;

// timing: Deyan tunes on the bench
const PEEK_OPEN_DELAY_MS = 250;
// timing: Deyan tunes on the bench
const PEEK_CLOSE_GRACE_MS = 300;

const DEFAULT_PERSIST_KEY = 'beam.shell.locked';

// Horizontal content gutter (grammar §5). Opens at `md` — the same boundary as
// `isWide`, where the drawer becomes an in-flow sidebar and content gains a
// persistent neighbour to breathe against. No lg/xl step: past md the layout is
// stable; ultrawide is a content max-width job, not an ever-widening gutter.
const DEFAULT_CONTENT_GUTTER = { xs: 2, sm: 4, md: 7 }; // 16 / 32 / 56px — gutter steps: Deyan tunes on the bench

// Vertical rhythm is NOT the gutter. Parked on the shell provisionally; it
// migrates to BeamPageHeader's rhythm once that organism leaves placeholder.
const CONTENT_VERTICAL = { xs: 2, md: 10 };

// View-transition names — the "layer names" the ignition matches on (grammar
// §4). Each names exactly one element per state so the browser can morph
// between positions; the choreography that times them lives in createBeamTheme.
const VT_BRANDMARK = 'beam-shell-brandmark'; // travels: strip ↔ locked header
const VT_GHOST = 'beam-shell-ghost'; // fades out: the peek's watermark
const VT_PANEL = 'beam-shell-sidebar'; // grows/collapses: the locked panel
const VT_CONTENT = 'beam-shell-content'; // reflows: full-width ↔ right column

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
    <ListItemButton selected={item.selected} onClick={item.onClick} sx={inset ? { pl: 4 } : undefined}>
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

export function BeamAppShell({
  navItems,
  children,
  brandMark,
  locked,
  defaultLocked,
  onLockedChange,
  persistKey = DEFAULT_PERSIST_KEY,
  footer,
  peekOpenDelayMs = PEEK_OPEN_DELAY_MS,
  peekCloseGraceMs = PEEK_CLOSE_GRACE_MS,
  contentGutter = DEFAULT_CONTENT_GUTTER,
  title,
}: BeamAppShellProps) {
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
          width: DRAWER_WIDTH,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.paper',
          // Constant-geometry border (detail grammar §1) — present in both
          // natures; nature changes radius + elevation, not geometry.
          borderStyle: 'solid',
          borderWidth: nature === 'peek' ? '1px 1px 1px 0' : '0 1px 0 0',
          borderColor: 'divider',
          ...(floating ? { 
            borderRadius: 2, 
            borderTopLeftRadius: 0, 
            borderBottomLeftRadius: 0, 
            boxShadow: 8 } : { borderRadius: 0 }),
        }}
      >
        {/* Panel header — brand mark + chevrons (grammar §3). */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ px: 1.5, minHeight: STRIP_HEIGHT, borderBottom: 1, borderColor: 'divider' }}
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
      // Named for the ignition (grammar §4): morphs full-width ↔ right column on
      // lock/unlock. Present in both states, so its group genuinely reflows.
      style={{ viewTransitionName: VT_CONTENT }}
      sx={{
        minWidth: 0,
        // minHeight pins old/new snapshot heights equal so the reflow morph is
        // horizontal-only — otherwise short pages warp vertically mid-transition.
        minHeight: '100vh',
        // Horizontal = the gutter (responsive). Vertical = provisional rhythm,
        // off the gutter scale on purpose; unlocked top is strip clearance
        // (structural overlay-compensation, not rhythm).
        px: contentGutter,
        pb: CONTENT_VERTICAL,
        // pt: effectiveLocked ? CONTENT_VERTICAL : `${STRIP_HEIGHT}px`,
        pt: CONTENT_VERTICAL,
        backgroundImage: 'var(--beam-page-gradient)',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {children}
    </Box>
  );

  // ---- LOCKED (wide): in-flow panel + content, as a grid so the column can
  // later animate (grammar §4). ----
  if (effectiveLocked) {
    return (
      <Box sx={{ display: 'grid', gridTemplateColumns: `${DRAWER_WIDTH}px 1fr`, minHeight: '100vh' }}>
        <Box component="nav" sx={{ position: 'sticky', top: 0, height: '100vh' }}>
          {panel('locked')}
        </Box>
        {main}
      </Box>
    );
  }

  // ---- CLOSED (wide) or NARROW: brand strip + content; peek/drawer on demand. ----
  return (
    <Box sx={{ minHeight: '100vh', position: 'relative' }}>
      {/* Brand strip (grammar §3): hamburger + color mark, top-left, no bar. */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{ position: 'fixed', top: 0, left: 0, zIndex: theme.zIndex.appBar, height: STRIP_HEIGHT, px: 1 }}
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
        <Box style={{ viewTransitionName: VT_BRANDMARK }} sx={{ display: 'flex', alignItems: 'center' }}>
          {colorMark}
        </Box>
      </Stack>

      {/* Left-edge hover zone opens the peek (wide, closed). */}
      {isWide && !peekOpen && (
        <Box
          onMouseEnter={scheduleOpen}
          sx={{ position: 'fixed', top: 0, left: 0, width: 8, height: '100vh', zIndex: theme.zIndex.appBar - 1 }}
        />
      )}

      {main}

      {isWide ? (
        peekOpen && (
          // Peek = floating panel, non-modal (grammar §2, §6). Inset below the
          // strip so the strip stays visible.
          <Box
            sx={{
              position: 'fixed',
              top: STRIP_HEIGHT,
              left: 0,
              // height: `calc(100vh - ${STRIP_HEIGHT + 8}px)`,
              height: `calc(100vh - ${STRIP_HEIGHT * 2}px)`,
              zIndex: theme.zIndex.appBar - 1,
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
          sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH, border: 0 } }}
        >
          {panel('peek', true)}
        </Drawer>
      )}
    </Box>
  );
}
