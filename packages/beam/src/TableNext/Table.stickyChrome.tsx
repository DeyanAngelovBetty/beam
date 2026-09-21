import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import TableSortLabel from '@mui/material/TableSortLabel';
import type { Column } from '@tanstack/react-table';
import {
  CONTENT_BOTTOM,
  CHROME_CEILING_BAND,
  FIELD_TWIN_HEIGHT,
  SHORT_VP_TIER2,
  SHORT_VP_TIER3,
  belowHeightQuery,
  aboveHeightQuery,
  pageBackdropSx,
} from '../theme/tokens';
import { meta } from '../theme/textStyles';

/**
 * Table.stickyChrome — the stickyChrome pinning mechanism, PORTED VERBATIM from the current organism Table
 * (`Table/Table.tsx`) into the Wave-2 port (2b). The organism deferred this to its sole consumer's migration
 * (Gaspar TransactionsPage) where it is browser-verifiable; this module is that re-port. Everything here is
 * MODEL-AGNOSTIC — it operates on TanStack `Column`/`table` + pure geometry, never on a column's render
 * shape — so it carries over unchanged from the BeamColumn organism to the raw-ColumnDef port.
 *
 * The style helpers (`railStickySx`, `ceilingPaintSx`, `bucketStuckSx`, `footerStuckSx`, the border/z/edge
 * consts) and the effects hook (`useStickyChrome`) together reproduce the organism's DOM contract byte-for-
 * byte: the keep-list `data-beam-sticky-chrome` / `data-stuck` / `data-overflow-start|end` + `beam-*`
 * classes is LAW and unchanged. See docs/major-upgrades.md + Table-notes.md for the mechanism's rationale.
 */

// ── Edge-affordance tokens (shared by rail + right edge + stuck bands) ───────────────────────────────
export const EDGE_TINT = 'var(--beam-edge-shadow)';
export const EDGE_WIDTH = 24; // px band width, shared so the edges read as siblings

// z-index scale for the grid's layered surfaces — NAMED, not adjacent magic (see the organism's comment).
export const Z_ACCENT = 1; // severity accent bar, inside the rail cell
export const Z_RAIL_BODY = 2; // body rail cell
export const Z_EDGE = 2; // right-edge scroll overlay (inside the wrapper)
export const Z_CLONE_RAIL = 2; // clone's static rail overlay, above its animated track
export const Z_RAIL_HEADER = 3; // header rail cell
export const Z_CHROME = 4; // pinned bucket + footer — above the rail (Paper level)

const STUCK_BAND_DOWN = `linear-gradient(to bottom, ${EDGE_TINT}, transparent)`;
const STUCK_BAND_UP = `linear-gradient(to top, ${EDGE_TINT}, transparent)`;

// Border deconstruction (stickyChrome only) — the Paper drops its frame; three regions redraw it. The SIDE
// line reads as ONE continuous 1px `divider` because all three are full-bleed children applying this
// IDENTICAL spec. CARD_RADIUS + squircle mirror the MuiPaper `rounded` override.
export const SIDE_BORDER = { borderLeft: '1px solid', borderRight: '1px solid', borderColor: 'divider' };
export const CARD_RADIUS = 24; // mirrors createBeamTheme MuiPaper.rounded.borderRadius — keep in step
export const SQUIRCLE = { 'corner-shape': 'squircle' } as object; // CSS Borders L5 (Chrome 139+), progressive

/**
 * headerCellSx — the header clone's cell treatment, sourced from the SAME `meta` caps style the theme's
 * `MuiTableCell.head` applies to the real `th` (uppercase + 0.1em + 12px/300 + text.secondary). One source,
 * two consumers — the clone is not an approximation.
 */
export const headerCellSx = { ...meta, py: 0, px: 2 };

/**
 * The header's sort affordance — the ONE composition BOTH the real `th` and the clone consume, so they
 * can't diverge. `interactive: false` makes it POINTER-ONLY (`tabIndex: -1`) for the clone's aria-hidden
 * layer. Model-agnostic: operates purely on the TanStack `Column`.
 */
export function sortableHeaderContent<Row>(col: Column<Row, unknown>, header: ReactNode, interactive: boolean): ReactNode {
  if (!col.getCanSort()) return header;
  const sortDir = col.getIsSorted();
  return (
    <TableSortLabel
      active={Boolean(sortDir)}
      direction={sortDir || 'asc'}
      onClick={col.getToggleSortingHandler()}
      {...(interactive ? {} : { tabIndex: -1 })}
    >
      {header}
    </TableSortLabel>
  );
}

/** Nearest scrollable ancestor (overflow y auto/scroll) — the sticky scroll owner. null ⇒ the viewport. */
export function getScrollParent(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null;
  while (node) {
    const oy = getComputedStyle(node).overflowY;
    if (oy === 'auto' || oy === 'scroll') return node;
    node = node.parentElement;
  }
  return null;
}

// ── Sticky style helpers (verbatim; pure style objects) ──────────────────────────────────────────────

/**
 * railStickySx — the rail cell's sticky-left treatment (PARITY DUPLICATION with the organism Table; see the
 * density-consolidation follow-up in wave2-proposal §6(a) — evaluated then for lane-style vs theme
 * placement). Two edge layers appear together while content scrolls under the rail: a crisp 1px `divider`
 * (::before) and a soft EDGE_TINT gradient (::after), both anchored to the rail's ACTUAL right edge, toggled
 * by the ancestor wrapper's `data-overflow-start`. Applied only under stickyChrome; the official-subset path
 * keeps official's `actionRailCell`.
 */
// The rail is ALWAYS leading (official's placement; the estate bans a trailing control rail — BEAM.md §6),
// so this pins `left: 0`. Two edge layers appear together while content scrolls under the rail's RIGHT edge:
// a crisp 1px `divider` (::before) and a soft EDGE_TINT gradient (::after) fading rightward. Applied only
// under stickyChrome; the official-subset path keeps official's `actionRailCell`.
export const railStickySx = {
  position: 'sticky' as const,
  left: 0,
  pl: 0.5,
  width: '1%',
  verticalAlign: 'middle',
  // Sit at the row datum: zero the block padding so the rail cell never grows the row (the controls fit
  // inside FIELD_TWIN_HEIGHT). The header row has no per-row density sx, so the rail cell must zero its own.
  paddingTop: 0,
  paddingBottom: 0,
  backgroundColor: 'background.paper',
  '&::before': {
    content: '""', position: 'absolute', right: 0, top: 0, bottom: 0, width: '1px',
    backgroundColor: 'divider', opacity: 0, transition: 'opacity var(--beam-motion-quick)', pointerEvents: 'none',
  },
  '&::after': {
    content: '""', position: 'absolute', left: '100%', top: 0, bottom: 0, width: EDGE_WIDTH,
    background: `linear-gradient(to right, ${EDGE_TINT}, transparent)`, opacity: 0,
    transition: 'opacity var(--beam-motion-quick)', pointerEvents: 'none',
  },
  '@container scroll-state(scrollable: inline-start)': { '&::before': { opacity: 1 }, '&::after': { opacity: 1 } },
  '[data-overflow-start="true"] &::before': { opacity: 1 },
  '[data-overflow-start="true"] &::after': { opacity: 1 },
};

export const containerTypeScrollState = { containerType: 'scroll-state' as 'normal' };

export const bucketStuckSx = {
  '&::after': {
    content: '""', position: 'absolute', left: 0, right: 0, top: '100%', height: EDGE_WIDTH,
    background: STUCK_BAND_DOWN, pointerEvents: 'none',
  },
};

/** CEILING PAINT — the opaque page band the logo floats over, stuck-gated with an opacity FADE (transparent
 *  at rest so the negative-margin overlap is invisible; opaque page when stuck). */
export const ceilingPaintSx = {
  '&::before': {
    content: '""', position: 'absolute', inset: 0, ...pageBackdropSx, opacity: 0,
    transition: 'opacity var(--beam-motion-quick)',
  },
  '&[data-stuck="top"]::before': { opacity: 1 },
  '@container scroll-state(stuck: top)': { '&::before': { opacity: 1 } },
};

export const footerStuckSx = {
  '&::before': {
    content: '""', position: 'absolute', left: 0, right: 0, bottom: '100%', height: EDGE_WIDTH,
    background: STUCK_BAND_UP, pointerEvents: 'none',
  },
};

// ── The effects hook ─────────────────────────────────────────────────────────────────────────────────

export interface StickyChromeRefs {
  scrollRef: React.RefObject<HTMLDivElement>;
  wrapperRef: React.RefObject<HTMLDivElement>;
  theadRowRef: React.RefObject<HTMLTableRowElement>;
  cloneTrackRef: React.RefObject<HTMLDivElement>;
  bucketRef: React.RefObject<HTMLDivElement>;
  footerRef: React.RefObject<HTMLDivElement>;
  topSentinelRef: React.RefObject<HTMLDivElement>;
  bottomSentinelRef: React.RefObject<HTMLDivElement>;
  paperRef: React.RefObject<HTMLDivElement>;
}

export interface UseStickyChromeResult {
  /** opted-in AND tall enough to pin (tier 3) AND the grid overflows the viewport (reachable). */
  effectiveSticky: boolean;
  refs: StickyChromeRefs;
  cloneWidths: number[];
  cloneHeight: number;
}

/**
 * useStickyChrome — the organism's stickyChrome state + refs + 6 effects, ported verbatim (deps adjusted to
 * the port's CONTROLLED pagination: re-anchor keys off the 1-based `page`/`pageSize` props). Reachability +
 * tier-3 disengagement fold into `effectiveSticky`; the width-sync/stuck-IO/bucket-height/overflow effects
 * mirror the organism's, keyed on `effectiveSticky` and the width-sync deps.
 */
export function useStickyChrome(opts: {
  enabled: boolean; // the `stickyChrome` prop
  rowsOnPage: number; // visible rows this page — reachability + width-sync
  hasPagination: boolean; // re-anchor guard
  page?: number; // 1-based (re-anchor dep)
  pageSize?: number; // re-anchor + width-sync dep
  widthSyncKey: unknown[]; // [columnOrder, columnVisibility, sorting, leafColumnsLength]
}): UseStickyChromeResult {
  const { enabled, rowsOnPage, hasPagination, page, pageSize, widthSyncKey } = opts;

  const scrollRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const theadRowRef = useRef<HTMLTableRowElement>(null);
  const cloneTrackRef = useRef<HTMLDivElement>(null);
  const bucketRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const didAnchorMount = useRef(false);

  const [cloneWidths, setCloneWidths] = useState<number[]>([]);
  const [cloneHeight, setCloneHeight] = useState(0);

  // TIER 3 — below SHORT_VP_TIER3 the grid can't leave MIN_MEANINGFUL_ROWS visible even with the ceiling
  // collapsed, so stickyChrome forfeits its last pins. matchMedia read SYNCHRONOUSLY so a squashed first
  // paint never flashes sticky.
  const [tooShortForSticky, setTooShortForSticky] = useState(() =>
    typeof window !== 'undefined' && enabled ? window.matchMedia(belowHeightQuery(SHORT_VP_TIER3)).matches : false,
  );
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    const mq = window.matchMedia(belowHeightQuery(SHORT_VP_TIER3));
    const sync = () => setTooShortForSticky(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, [enabled]);

  // PIN REACHABILITY — arithmetic (never measured height), so expanding a row can't toggle engagement.
  const pinThreshold = FIELD_TWIN_HEIGHT * (3 + rowsOnPage) + CONTENT_BOTTOM.md * 8 + CHROME_CEILING_BAND;
  const [pinUnreachable, setPinUnreachable] = useState(() =>
    typeof window !== 'undefined' && enabled ? window.matchMedia(aboveHeightQuery(pinThreshold)).matches : false,
  );
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    const mq = window.matchMedia(aboveHeightQuery(pinThreshold));
    const sync = () => setPinUnreachable(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, [enabled, pinThreshold]);

  const effectiveSticky = enabled && !tooShortForSticky && !pinUnreachable;

  // OVERFLOW + horizontal clone scroll-sync — sets data-overflow-start/end on wrapper + bucket; JS clone
  // transform fallback where CSS scroll-driven animation is absent. rAF-throttled.
  useEffect(() => {
    if (!effectiveSticky) return;
    const el = scrollRef.current;
    const wrap = wrapperRef.current;
    if (!el || !wrap) return;
    const cssScrollSync = typeof CSS !== 'undefined' && CSS.supports?.('animation-timeline', 'scroll()');
    let raf = 0;
    const apply = () => {
      raf = 0;
      const maxScroll = el.scrollWidth - el.clientWidth;
      const start = el.scrollLeft > 0 ? 'true' : 'false';
      const end = el.scrollLeft < maxScroll - 1 ? 'true' : 'false';
      wrap.dataset.overflowStart = start;
      wrap.dataset.overflowEnd = end;
      if (bucketRef.current) {
        bucketRef.current.dataset.overflowStart = start;
        bucketRef.current.dataset.overflowEnd = end;
      }
      if (!cssScrollSync && cloneTrackRef.current) cloneTrackRef.current.style.transform = `translateX(${-el.scrollLeft}px)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    apply();
    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onScroll) : null;
    ro?.observe(el);
    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      ro?.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [effectiveSticky]);

  // WIDTH SYNC — measure the REAL header cells' rendered widths + row height, hand them to the clone.
  useLayoutEffect(() => {
    if (!effectiveSticky) return;
    const measure = () => {
      const rowEl = theadRowRef.current;
      if (!rowEl) return;
      const ws = Array.from(rowEl.children).map((c) => (c as HTMLElement).getBoundingClientRect().width);
      setCloneWidths((prev) => (prev.length === ws.length && prev.every((w, i) => Math.abs(w - ws[i]) < 0.5) ? prev : ws));
      const h = rowEl.getBoundingClientRect().height;
      setCloneHeight((prev) => (Math.abs(prev - h) < 0.5 ? prev : h));
    };
    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (theadRowRef.current) ro?.observe(theadRowRef.current);
    if (wrapperRef.current) ro?.observe(wrapperRef.current);
    window.addEventListener('resize', measure);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveSticky, pageSize, rowsOnPage, ...widthSyncKey]);

  // STUCK DETECTION — IntersectionObserver sets `data-stuck`; sentinels bracket the pinned chrome.
  useEffect(() => {
    if (!effectiveSticky || typeof IntersectionObserver === 'undefined') return;
    const root = getScrollParent(bucketRef.current);
    const observe = (sentinel: HTMLDivElement | null, target: HTMLDivElement | null, edge: 'top' | 'bottom', rootMargin: string) => {
      if (!sentinel || !target) return null;
      const io = new IntersectionObserver(
        ([entry]) => {
          target.dataset.stuck = entry.isIntersecting ? '' : edge;
        },
        { root, rootMargin, threshold: 0 },
      );
      io.observe(sentinel);
      return io;
    };
    const top = observe(topSentinelRef.current, bucketRef.current, 'top', '0px 0px 0px 0px');
    const bottom = observe(bottomSentinelRef.current, footerRef.current, 'bottom', '0px 0px 0px 0px');
    return () => {
      top?.disconnect();
      bottom?.disconnect();
    };
  }, [effectiveSticky]);

  // Publish the bucket's measured height as `--beam-bucket-height` on the SCROLL PARENT (the exit timeline
  // inset read by stickyChromeExitSx). Measured, never assumed.
  useEffect(() => {
    if (!effectiveSticky) return;
    const bucket = bucketRef.current;
    const host = getScrollParent(bucket);
    if (!bucket || !host) return;
    const publish = () => host.style.setProperty('--beam-bucket-height', `${Math.round(bucket.getBoundingClientRect().height)}px`);
    publish();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(publish) : null;
    ro?.observe(bucket);
    window.addEventListener('resize', publish);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', publish);
      host.style.removeProperty('--beam-bucket-height');
    };
  }, [effectiveSticky]);

  // DETERMINISTIC RE-ANCHOR on page/size change — scroll the page scroller INSTANTLY to the pinned landing
  // (or page top). Reachability recomputed SYNCHRONOUSLY from rows-on-page. Skips first mount. Keyed on the
  // port's CONTROLLED 1-based pagination props.
  useLayoutEffect(() => {
    if (!hasPagination || !enabled) return;
    if (!didAnchorMount.current) {
      didAnchorMount.current = true;
      return;
    }
    const sp = getScrollParent(paperRef.current);
    if (!sp || !paperRef.current) return;
    const reachable = FIELD_TWIN_HEIGHT * (3 + rowsOnPage) + CONTENT_BOTTOM.md * 8 + CHROME_CEILING_BAND >= window.innerHeight;
    const willStick = enabled && !tooShortForSticky && reachable;
    const snapMargin = window.matchMedia(belowHeightQuery(SHORT_VP_TIER2)).matches ? 0 : CHROME_CEILING_BAND;
    const target = willStick
      ? sp.scrollTop + paperRef.current.getBoundingClientRect().top - sp.getBoundingClientRect().top - snapMargin
      : 0;
    sp.scrollTo({ top: target, behavior: 'instant' as ScrollBehavior });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  return {
    effectiveSticky,
    refs: { scrollRef, wrapperRef, theadRowRef, cloneTrackRef, bucketRef, footerRef, topSentinelRef, bottomSentinelRef, paperRef },
    cloneWidths,
    cloneHeight,
  };
}
