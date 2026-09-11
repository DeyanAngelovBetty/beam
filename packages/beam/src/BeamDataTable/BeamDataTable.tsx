import { Fragment, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ComponentType, type MouseEvent } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getExpandedRowModel,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
  type ExpandedState,
} from '@tanstack/react-table';
import { useTheme } from '@mui/material/styles';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableSortLabel from '@mui/material/TableSortLabel';
import TablePagination from '@mui/material/TablePagination';
import Paper from '@mui/material/Paper';
import Checkbox from '@mui/material/Checkbox';
import Toolbar from '@mui/material/Toolbar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Collapse from '@mui/material/Collapse';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { BeamRowMenu } from '../BeamRowMenu/BeamRowMenu';
import type { BeamRowAction } from '../BeamRowMenu/BeamRowMenu.types';
import type { BeamColumn, BeamDataTableProps, BeamIdentityLinkProps, BeamBulkAction } from './BeamDataTable.types';
import { useColumnManager } from './useColumnManager';
import { BeamColumnManager, type ManagerColumn } from './BeamColumnManager';
import { CONTENT_BOTTOM } from '../theme/tokens';

// Scroll-affordance edge shadows — truth-conditional cues shown only while content actually scrolls
// under an edge. BOTH edges are the same soft gradient: a 24px band of the theme tint
// (`--beam-edge-shadow`, derived.edgeShadow) fading away from the edge — the left mirrors the right.
const EDGE_TINT = 'var(--beam-edge-shadow)';
const EDGE_WIDTH = 24; // px band width, shared by both edges so they read as siblings

// Sticky-chrome (opt-in) — the pinned bucket/footer offset from the scrollport edge (the mock's ~20px).
const STICKY_OFFSET = 20;
// The stuck-side occlusion band: the SAME edge-affordance recipe as the rail/right edges (EDGE_TINT +
// EDGE_WIDTH), rotated to the horizontal — the top bucket casts DOWN, the bottom footer casts UP. Reuses
// the tokenised tint; if a distinct stuck-elevation recipe ever emerges, promote it to `derived` then.
const STUCK_BAND_DOWN = `linear-gradient(to bottom, ${EDGE_TINT}, transparent)`;
const STUCK_BAND_UP = `linear-gradient(to top, ${EDGE_TINT}, transparent)`;

// Border deconstruction (stickyChrome only) — the Paper drops its frame; three regions redraw it (bucket
// top+sides+top-radius · rows sides · footer sides+bottom+bottom-radius). The SIDE line reads as ONE
// continuous 1px `divider` because all three are FULL-BLEED children of the frame-less Paper and apply
// this IDENTICAL spec (same token, same width, same x) — alignment is guaranteed, not hoped. Neither
// side of a region junction adds a horizontal border, so no double-line and no gap. CARD_RADIUS +
// squircle mirror the MuiPaper `rounded` override (createBeamTheme) so the deconstructed corners match.
const SIDE_BORDER = { borderLeft: '1px solid', borderRight: '1px solid', borderColor: 'divider' };
const CARD_RADIUS = 24; // mirrors createBeamTheme MuiPaper.rounded.borderRadius — keep in step if it moves
const SQUIRCLE = { 'corner-shape': 'squircle' } as object; // CSS Borders L5 (Chrome 139+), progressive

/**
 * headerCellSx — the ONE header-cell text treatment, mirroring MUI's `TableCell` head (size small): body2
 * type + head weight/line-height/color + small padding, single-line. Consumed by BOTH the real `th` (in
 * sticky mode) AND the header clone cells, so the clone is a SHARED SOURCE of the real header, not an
 * approximation — same face, baseline, and line-breaking (the measured widths already match). Applying it
 * to the real th in sticky mode is visually neutral (it restates MUI's head values) apart from `nowrap`.
 */
export const headerCellSx = {
  fontSize: '0.875rem', // body2
  fontWeight: 500, // MUI head (fontWeightMedium)
  lineHeight: '1.5rem', // MUI head (pxToRem 24)
  letterSpacing: '0.01071em', // body2
  color: 'text.primary', // MUI head
  py: 0.75, // 6px — size small
  px: 2, // 16px — size small
  whiteSpace: 'nowrap' as const,
};

/** Nearest scrollable ancestor (overflow y auto/scroll) — the sticky scroll owner. null ⇒ the viewport
 *  (document scroll), the correct IntersectionObserver root in that case. */
function getScrollParent(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null;
  while (node) {
    const oy = getComputedStyle(node).overflowY;
    if (oy === 'auto' || oy === 'scroll') return node;
    node = node.parentElement;
  }
  return null;
}

// Severity accent (rowAccent): grammar hue → theme semantic palette key (theme picks the hex; no
// literals). The accent is status-truth — always visible, independent of the scroll affordance.
const ACCENT_PALETTE: Record<string, string> = { danger: 'error', warning: 'warning', success: 'success', 'in-progress': 'info' };
const ACCENT_WIDTH = 3; // px

/**
 * The kebab that opens a row's overflow menu. Dim at rest, full on row
 * hover and keyboard focus (the `.beam-kebab` class is targeted by the row).
 */
function RailKebab({ items }: { items: BeamRowAction[] }) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  return (
    <>
      <IconButton
        className="beam-kebab"
        size="small"
        aria-label="Row actions"
        onClick={(e) => {
          e.stopPropagation();
          setAnchorEl(e.currentTarget);
        }}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <BeamRowMenu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        items={items}
      />
    </>
  );
}

/**
 * The expanded-row action bar — the SAME `rowActions` projected as buttons
 * (grammar §3). The organism appends this below `renderExpanded` content; the
 * consumer never renders it, so the bar and the kebab can't drift.
 * Disabled actions use aria-disabled (focusable + announced) + a tooltip reason
 * + a no-op guard; destructive actions read error-tinted. Pigment is Deyan's.
 */
function RowActionBar({ actions }: { actions: BeamRowAction[] }) {
  return (
    <Stack direction="row" spacing={1} sx={{ pt: 2 }}>
      {actions.map((a) => (
        <RowActionBarItem key={a.id} action={a} />
      ))}
    </Stack>
  );
}

/** One action-bar button. Flat → fires onSelect; menu (options) → opens a small menu of its options —
 *  the same one definition the kebab projects as a submenu (grammar §3, surfaces can't drift). */
function RowActionBarItem({ action }: { action: BeamRowAction }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const hasOptions = Boolean(action.options);
  const button = (
    <Button
      variant="outlined"
      size="small"
      color={action.destructive ? 'error' : 'primary'}
      aria-disabled={action.disabled || undefined}
      aria-haspopup={hasOptions ? 'menu' : undefined}
      startIcon={action.icon}
      endIcon={hasOptions ? <ArrowDropDownIcon /> : undefined}
      onClick={(e) => {
        if (action.disabled) return;
        if (action.options) setAnchor(e.currentTarget);
        else action.onSelect();
      }}
      sx={action.disabled ? { opacity: 0.5 } : undefined}
    >
      {action.label}
    </Button>
  );
  const wrapped = action.disabled && action.disabledReason ? <Tooltip title={action.disabledReason}>{button}</Tooltip> : button;
  if (!action.options) return wrapped;
  return (
    <>
      {wrapped}
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)} slotProps={{ list: { dense: true } }}>
        {action.options.map((opt) => (
          <MenuItem key={opt.id} onClick={() => { setAnchor(null); opt.onSelect(); }}>{opt.label}</MenuItem>
        ))}
      </Menu>
    </>
  );
}

/**
 * A data cell. The identity column (isIdentity + getHref) renders as a real
 * link to the record's canonical page — genuine <a> semantics — and stops
 * click propagation so it navigates instead of firing the row's inspect.
 */
function renderCell<Row>(
  c: BeamColumn<Row>,
  row: Row,
  LinkComponent?: ComponentType<BeamIdentityLinkProps>
) {
  const content = c.render(row);
  if (c.isIdentity && c.getHref) {
    const stop = (e: MouseEvent) => e.stopPropagation();
    // App-supplied router link when given; else a plain, real anchor.
    if (LinkComponent) {
      return (
        <LinkComponent href={c.getHref(row)} onClick={stop}>
          {content}
        </LinkComponent>
      );
    }
    return (
      <Link
        href={c.getHref(row)}
        onClick={stop}
        underline="hover"
        color="primary"
        sx={{ fontWeight: 500 }}
      >
        {content}
      </Link>
    );
  }
  return content;
}

/**
 * One batch-action button. Plain actions fire directly (with the optional confirm); an action with
 * `options` becomes a menu trigger (▾) — selecting an option fires `onFire(optionId)`. Options-actions
 * skip the button-level confirm (per the ruling — export only; a destructive menu option would want
 * per-option confirm, a future addition). Disabled uses aria-disabled (focusable + announced); an
 * eligibility reason shows as a tooltip.
 */
function BulkActionButton({
  action,
  disabled,
  zeroSelection,
  batchHintId,
  count,
  onFire,
}: {
  action: BeamBulkAction;
  disabled: boolean;
  zeroSelection: boolean;
  batchHintId: string;
  count: number;
  onFire: (optionId?: string) => void;
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const hasOptions = Boolean(action.options?.length);
  const btn = (
    <Button
      size="small"
      color={action.destructive ? 'error' : 'primary'}
      aria-disabled={disabled}
      aria-haspopup={hasOptions ? 'menu' : undefined}
      aria-describedby={zeroSelection ? batchHintId : undefined}
      endIcon={hasOptions ? <ArrowDropDownIcon /> : undefined}
      onClick={(e) => {
        if (disabled) return;
        if (hasOptions) {
          setAnchor(e.currentTarget);
          return;
        }
        if (
          (action.confirm || action.destructive) &&
          typeof window !== 'undefined' &&
          !window.confirm(`${action.label} ${count} selected item(s)?`)
        ) {
          return;
        }
        onFire();
      }}
      sx={{ opacity: disabled ? 0.5 : 1 }}
    >
      {action.label}
    </Button>
  );
  const wrapped = action.disabled && action.disabledReason ? <Tooltip title={action.disabledReason}>{btn}</Tooltip> : btn;
  if (!hasOptions) return wrapped;
  return (
    <>
      {wrapped}
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)} slotProps={{ list: { dense: true } }}>
        {action.options!.map((opt) => (
          <MenuItem key={opt.id} onClick={() => { setAnchor(null); onFire(opt.id); }}>{opt.label}</MenuItem>
        ))}
      </Menu>
    </>
  );
}

/**
 * TanStack Table drives all state (sorting, filtering, selection,
 * expansion, pagination); Beam renders every pixel with themed MUI atoms.
 * Row states (hover/selected) come from palette.action tokens —
 * the Figma `_states` group earning its living.
 */
export function BeamDataTable<Row>({
  columns,
  rows,
  getRowId,
  selectable = false,
  bulkActions = [],
  onBulkAction,
  searchable = false,
  paginated = false,
  defaultPageSize = 10,
  pageSizeOptions,
  jumpToPage = false,
  stickyChrome = false,
  renderExpanded,
  rowActions,
  onRowClick,
  LinkComponent,
  highlightRowId = null,
  onRowHover,
  emptyMessage = 'Nothing here yet.',
  columnManager,
  rowAccent,
  'aria-label': ariaLabel,
}: BeamDataTableProps<Row>) {
  const theme = useTheme();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [globalFilter, setGlobalFilter] = useState('');

  // Suspend row hover WHILE a Collapse animates. Rows translating under a stationary cursor during
  // expand/collapse otherwise latch `:hover` — browsers recompute hover on pointermove, not on layout
  // change — and keep the tint until the next move. We drop pointer-events on the tbody for the
  // duration (driven by the Collapse's onEnter/onExited, not timers). A counter, not a boolean, so
  // overlapping expand/collapse animations compose correctly.
  const [animatingCount, setAnimatingCount] = useState(0);
  const onCollapseStart = () => setAnimatingCount((n) => n + 1);
  const onCollapseEnd = () => setAnimatingCount((n) => Math.max(0, n - 1));

  // Translucent state layers, painted over the rail's opaque base so the
  // pinned column shows hover/selected exactly like a normal row instead of
  // ghosting the scrolled cells behind it (the hover-bleed fix).
  const action = (theme.vars || theme).palette.action;
  const hoverLayer = `linear-gradient(${action.hover}, ${action.hover})`;
  const selectedLayer = `linear-gradient(${action.selected}, ${action.selected})`;

  const columnDefs = useMemo<ColumnDef<Row>[]>(
    () =>
      columns.map((c) => ({
        id: c.key,
        header: c.header,
        accessorFn: c.getValue ?? (() => ''),
        enableSorting: Boolean(c.getValue),
        enableGlobalFilter: Boolean(c.getValue),
      })),
    [columns]
  );

  // Opt-in column manager. When disabled, NOTHING below is threaded into the table (no
  // columnVisibility/columnOrder state, no on…Change) — the table behaves exactly as before.
  const cm = useColumnManager(columns, columnManager);

  const table = useReactTable({
    data: rows,
    columns: columnDefs,
    getRowId,
    initialState: { pagination: { pageSize: defaultPageSize } },
    state: {
      sorting,
      rowSelection,
      expanded,
      globalFilter,
      ...(cm.enabled ? { columnVisibility: cm.columnVisibility, columnOrder: cm.columnOrder } : {}),
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onExpandedChange: setExpanded,
    onGlobalFilterChange: setGlobalFilter,
    ...(cm.enabled
      ? { onColumnVisibilityChange: cm.onColumnVisibilityChange, onColumnOrderChange: cm.onColumnOrderChange }
      : {}),
    enableRowSelection: selectable,
    getRowCanExpand: () => Boolean(renderExpanded),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    ...(paginated ? { getPaginationRowModel: getPaginationRowModel() } : {}),
  });

  // Render through the table's VISIBLE, ORDERED leaf columns (not the raw `columns` prop), resolving
  // each back to its BeamColumn by id. With no manager this is the declared order, all visible — the
  // render stays byte-identical. This is the reroute the column-manager spec required.
  const columnByKey = useMemo(() => new Map(columns.map((c) => [c.key, c])), [columns]);
  const leafColumns = table.getVisibleLeafColumns();
  const dataColSpan = leafColumns.length + (Boolean(renderExpanded) || selectable || Boolean(rowActions) ? 1 : 0);

  // Manager popover model: real columns in CURRENT order (hidden included), plus the enforced-≥1 guard.
  const managerColumns: ManagerColumn[] = cm.enabled
    ? (cm.columnOrder.length ? cm.columnOrder : columns.map((c) => c.key))
        .map((id) => columnByKey.get(id))
        .filter((c): c is BeamColumn<Row> => Boolean(c))
        .map((c) => ({ id: c.key, label: c.header, visible: cm.columnVisibility[c.key] !== false }))
    : [];
  const toggleColumn = (id: string) =>
    cm.onColumnVisibilityChange((old) => {
      const nowVisible = old[id] !== false;
      // Minimum one visible column — refuse to hide the last one (the UI also disables it).
      if (nowVisible && managerColumns.filter((c) => c.visible).length <= 1) return old;
      return { ...old, [id]: !nowVisible };
    });
  const moveColumn = (id: string, dir: 'up' | 'down') =>
    cm.onColumnOrderChange((old) => {
      const base = old.length ? [...old] : columns.map((c) => c.key);
      const i = base.indexOf(id);
      const j = dir === 'up' ? i - 1 : i + 1;
      if (i < 0 || j < 0 || j >= base.length) return old;
      [base[i], base[j]] = [base[j], base[i]];
      return base;
    });
  // Pointer-drag reorder — an array-move to an arbitrary index (the ▲/▼ arrows do adjacent swaps). Both
  // funnel through the SAME onColumnOrderChange, so the drag and the keyboard path can't diverge.
  const reorderColumn = (id: string, toIndex: number) =>
    cm.onColumnOrderChange((old) => {
      const base = old.length ? [...old] : columns.map((c) => c.key);
      const from = base.indexOf(id);
      if (from < 0 || toIndex < 0 || toIndex >= base.length || toIndex === from) return old;
      base.splice(toIndex, 0, base.splice(from, 1)[0]);
      return base;
    });

  const selectedIds = Object.keys(rowSelection);
  const selectedCount = selectedIds.length;
  // Resolve the bulk-actions factory (Option C) with the actual selected Row objects, so page-computed
  // eligibility (disabled/disabledReason) can reflect the selection. An array is used as-is.
  const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original);
  const resolvedBulkActions = typeof bulkActions === 'function' ? bulkActions(selectedRows) : bulkActions;
  const batchHintId = useId();
  const visibleRows = table.getRowModel().rows;

  // Perf instrument (point 4): behind a `perf=1` URL token so it works on BOTH dev and PROD builds
  // (HashRouter puts the token in the hash — we test the whole href). Logs render→commit ms for the
  // mounted page, the honest number for the 500-rows-without-virtualization question. Off by default.
  const perfStartRef = useRef(0);
  perfStartRef.current = paginated ? performance.now() : 0;
  useLayoutEffect(() => {
    if (!paginated || typeof window === 'undefined' || !/[?&#]perf=1\b/.test(window.location.href)) return;
    const ms = performance.now() - perfStartRef.current;
    // eslint-disable-next-line no-console
    console.info(`[BeamDataTable perf] ${visibleRows.length} rows × ${leafColumns.length} cols → ${ms.toFixed(1)}ms (render→commit)`);
  });

  // Scroll-affordance edges. `data-overflow-start` / `data-overflow-end` on the WRAPPER drive both
  // shadows: the rail-left shadow (start) and the container-right overlay (end). The rail ALSO has a
  // pure-CSS scroll-state enhancement (Chrome) that needs no JS; this passive, rAF-throttled listener
  // is the universal source for the right overlay (which can't be a scroll-state descendant) and the
  // fallback for the left. Recomputes on scroll AND resize (columns/viewport change overflow).
  const scrollRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  // Sticky-chrome machinery (opt-in). The header clone is a PRESENTATION mirror of the real thead: it
  // never computes its own widths — it copies the measured real-header widths (the rail-width precedent:
  // measure the layout, never hold a parallel belief), and mirrors the body's scrollLeft via translateX.
  const theadRowRef = useRef<HTMLTableRowElement>(null);
  const cloneTrackRef = useRef<HTMLDivElement>(null);
  const bucketRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  const [cloneWidths, setCloneWidths] = useState<number[]>([]);

  useEffect(() => {
    const el = scrollRef.current;
    const wrap = wrapperRef.current;
    if (!el || !wrap) return;
    // Where CSS scroll-driven animation is supported, the clone binds to a named scroll-timeline and the
    // JS mirror steps back for it (setting an inline transform here would freeze the animation). The rAF
    // listener keeps its OTHER jobs — the overflow attrs — everywhere.
    const cssScrollSync = typeof CSS !== 'undefined' && CSS.supports?.('animation-timeline', 'scroll()');
    let raf = 0;
    const apply = () => {
      raf = 0;
      const maxScroll = el.scrollWidth - el.clientWidth;
      wrap.dataset.overflowStart = el.scrollLeft > 0 ? 'true' : 'false';
      // 1px slack so sub-pixel widths don't leave a ghost shadow at the true end.
      wrap.dataset.overflowEnd = el.scrollLeft < maxScroll - 1 ? 'true' : 'false';
      // Fallback scroll-sync of the header clone (composited translate) — only where the CSS path is absent.
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
  }, []);

  // WIDTH SYNC — the review's center of gravity. Measure the REAL header cells' rendered widths and
  // hand them to the clone; re-measure on every event that can move column widths (container resize via
  // RO, and structurally: show/hide, reorder, page-size, row-count). Drift is structurally impossible
  // because the clone owns no width of its own.
  useLayoutEffect(() => {
    if (!stickyChrome) return;
    const measure = () => {
      const rowEl = theadRowRef.current;
      if (!rowEl) return;
      const ws = Array.from(rowEl.children).map((c) => (c as HTMLElement).getBoundingClientRect().width);
      setCloneWidths((prev) =>
        prev.length === ws.length && prev.every((w, i) => Math.abs(w - ws[i]) < 0.5) ? prev : ws,
      );
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
  }, [stickyChrome, cm.columnOrder, cm.columnVisibility, table.getState().pagination.pageSize, visibleRows.length, leafColumns.length]);

  // STUCK DETECTION — the estate's progressive posture: `@container scroll-state(stuck)` drives the
  // dressing + clone on Chrome (pure CSS, below), and this IntersectionObserver fallback sets a
  // `data-stuck` attr everywhere else. Sentinels bracket the pinned chrome; the scroll root is found by
  // walking to the nearest scrollable ancestor (AppShell `main` in Gaspar, the document in Storybook).
  useEffect(() => {
    if (!stickyChrome || typeof IntersectionObserver === 'undefined') return;
    const root = getScrollParent(bucketRef.current);
    const observe = (sentinel: HTMLDivElement | null, target: HTMLDivElement | null, edge: 'top' | 'bottom', rootMargin: string) => {
      if (!sentinel || !target) return null;
      const io = new IntersectionObserver(
        ([entry]) => {
          target.dataset.stuck = entry.isIntersecting ? '' : edge; // off-screen sentinel ⇒ chrome is stuck
        },
        { root, rootMargin, threshold: 0 },
      );
      io.observe(sentinel);
      return io;
    };
    const top = observe(topSentinelRef.current, bucketRef.current, 'top', `-${STICKY_OFFSET}px 0px 0px 0px`);
    const bottom = observe(bottomSentinelRef.current, footerRef.current, 'bottom', `0px 0px -${STICKY_OFFSET}px 0px`);
    return () => {
      top?.disconnect();
      bottom?.disconnect();
    };
  }, [stickyChrome]);

  // One pinned rail column holds all row controls, in fixed order
  // [select][kebab][expand] — each rendered only if enabled (grammar §3):
  // selection anchors the rail's outer edge; the expand caret sits innermost,
  // nearest the row content it opens.
  const railEnabled = Boolean(renderExpanded) || selectable || Boolean(rowActions);
  // (colSpan uses `dataColSpan`, computed up top from the visible leaf columns + the rail.)

  const railStickySx = {
    position: 'sticky' as const,
    left: 0,
    pl: 0.5,
    width: '1%',
    verticalAlign: 'top',
    backgroundColor: 'background.paper',
    // Scroll-affordance on the rail's right edge — TWO layers, different jobs, appearing together:
    //  ::before = a crisp 1px divider (theme `divider` token) that DEFINES the rail boundary;
    //  ::after  = a soft gradient (mirror of the container-right overlay: same EDGE_WIDTH, same
    //             --beam-edge-shadow tint) fading rightward, signalling the OCCLUSION.
    // Both anchor to the rail's ACTUAL right edge (::before at right:0, ::after at left:100%), so they
    // track the rail width as controls (checkbox/kebab/caret) change it — no hardcoded offset. Both are
    // hidden at scroll start and fade in together while content scrolls under the rail (quick motion
    // token; reduced-motion zeros it). Header + body rail cells inherit this via the shared spread.
    '&::before': {
      content: '""',
      position: 'absolute',
      right: 0,
      top: 0,
      bottom: 0,
      width: '1px',
      backgroundColor: 'divider',
      opacity: 0,
      transition: 'opacity var(--beam-motion-quick)',
      pointerEvents: 'none',
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      left: '100%',
      top: 0,
      bottom: 0,
      width: EDGE_WIDTH,
      background: `linear-gradient(to right, ${EDGE_TINT}, transparent)`,
      opacity: 0,
      transition: 'opacity var(--beam-motion-quick)',
      pointerEvents: 'none',
    },
    // Enhancement (Chrome): scroll-state container query — pure CSS, no JS. True
    // when there is content hidden toward the inline-start (i.e. scrolled right).
    '@container scroll-state(scrollable: inline-start)': {
      '&::before': { opacity: 1 },
      '&::after': { opacity: 1 },
    },
    // Base (all engines): the scroll listener sets data-overflow-start on the wrapper (an ancestor).
    // Coexists with the scroll-state enhancement above — same result when both are active.
    '[data-overflow-start="true"] &::before': { opacity: 1 },
    '[data-overflow-start="true"] &::after': { opacity: 1 },
  };

  // Rows-per-page choices: the per-grid override when given (with defaultPageSize merged), else the
  // light derived default — so no grid silently gains heavy sizes.
  const rowsPerPageOptions = [...new Set([...(pageSizeOptions ?? [5, 10, 25]), defaultPageSize])].sort((a, b) => a - b);
  const pageCount = table.getPageCount();
  const paginationEl = paginated ? (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
      {jumpToPage && (
        <JumpToPage
          pageIndex={table.getState().pagination.pageIndex}
          pageCount={pageCount}
          onJump={(p) => table.setPageIndex(p)}
        />
      )}
      <TablePagination
        component="div"
        count={table.getFilteredRowModel().rows.length}
        page={table.getState().pagination.pageIndex}
        onPageChange={(_, p) => table.setPageIndex(p)}
        rowsPerPage={table.getState().pagination.pageSize}
        onRowsPerPageChange={(e) => table.setPageSize(parseInt(e.target.value, 10))}
        rowsPerPageOptions={rowsPerPageOptions}
      />
    </Box>
  ) : null;

  // Stuck dressing — the occlusion band only, applied to the inner wrappers while pinned, via BOTH the
  // JS `data-stuck` attr (base, all engines) AND `@container scroll-state(stuck)` (Chrome enhancement).
  // Paper background is carried by the inners ALWAYS (not gated on stuck) — paper-on-paper at rest
  // (invisible), the opacity that stops rows ghosting when pinned (same rationale as the footer).
  const containerTypeScrollState = { containerType: 'scroll-state' as 'normal' };
  const bucketStuckSx = {
    '&::after': {
      content: '""', position: 'absolute', left: 0, right: 0, top: '100%', height: EDGE_WIDTH,
      background: STUCK_BAND_DOWN, pointerEvents: 'none',
    },
  };
  // Stuck footer dressing = the up-band only. The paper background is carried by the inner ALWAYS (below,
  // not gated on stuck) — paper-on-paper at rest (invisible), the opacity that stops rows ghosting when
  // pinned. So no bgcolor here; the base bg supersedes it.
  const footerStuckSx = {
    '&::before': {
      content: '""', position: 'absolute', left: 0, right: 0, bottom: '100%', height: EDGE_WIDTH,
      background: STUCK_BAND_UP, pointerEvents: 'none',
    },
  };

  // Header CLONE — presentation mirror of the real thead: measured widths, shown only while stuck.
  // aria-hidden (the real thead keeps semantics + sort controls). Horizontal scroll-sync: a CSS
  // scroll-driven animation binds the track to the body's named scroll-timeline where supported (below);
  // the rAF mirror is the fallback. `container-type: inline-size` on the outer makes `100cqw` the visible
  // width — the far endpoint `translateX(calc(-100% + 100cqw))` = -(fullWidth - visibleWidth), exact
  // because the track's width is the measured column sum.
  const railOffset = railEnabled ? 1 : 0;
  const cloneEl = stickyChrome ? (
    <Box
      className="beam-header-clone"
      aria-hidden
      sx={{
        display: 'none',
        '[data-stuck="top"] &': { display: 'block' },
        '@container scroll-state(stuck: top)': { display: 'block' },
        overflow: 'hidden',
        containerType: 'inline-size',
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Box
        ref={cloneTrackRef}
        sx={{
          display: 'flex',
          width: 'max-content',
          willChange: 'transform',
          '@keyframes beam-clone-scroll-sync': {
            from: { transform: 'translateX(0)' },
            to: { transform: 'translateX(calc(-100% + 100cqw))' },
          },
          // Scroll-driven sync where supported — progress along the body's scroll-timeline maps linearly
          // to the translate. Longhands (not the `animation` shorthand, which would reset animation-
          // timeline). Re-measuring column widths changes the track width, so `-100%`'s basis and the
          // timeline range recompute natively — no JS needed to keep it aligned on column changes.
          '@supports (animation-timeline: scroll())': {
            ...({
              'animation-name': 'beam-clone-scroll-sync',
              'animation-timing-function': 'linear',
              'animation-duration': 'auto',
              'animation-fill-mode': 'both',
              'animation-timeline': '--beam-body-scroll',
            } as object),
          },
        }}
      >
        {railEnabled && (
          // Rail region of the clone — mirrors the pinned rail styling (opaque base + right divider).
          <Box sx={{ flex: '0 0 auto', width: cloneWidths[0] ?? 0, boxSizing: 'border-box', bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider' }} />
        )}
        {leafColumns.map((col, i) => {
          const c = columnByKey.get(col.id);
          return (
            <Box
              key={col.id}
              // SHARED SOURCE with the real th — same headerCellSx (task 2), so face/baseline/line-breaking
              // are identical and the measured width lands the text on the same line. No approximation.
              sx={{
                ...headerCellSx,
                flex: '0 0 auto',
                width: cloneWidths[railOffset + i] ?? 0,
                boxSizing: 'border-box',
                textAlign: c?.align ?? 'left',
              }}
            >
              {c?.header}
            </Box>
          );
        })}
      </Box>
    </Box>
  ) : null;

  // Batch actions — a top SECTION of the grid surface (moved inside the Paper 2026-09-08, the
  // BeamPaper-sectioning pattern; DetailsPanel/PrizeWall precedent). Persistent when bulkActions is set;
  // constant geometry, variable enablement — every action renders, disabled at zero selection.
  const stripEl = resolvedBulkActions.length > 0 ? (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', gap: 1, px: 2, minHeight: 48, borderBottom: 1, borderColor: 'divider' }}>
      {resolvedBulkActions.map((a) => (
        <BulkActionButton
          key={a.id}
          action={a}
          // Zero selection always disables; a page-supplied `disabled` adds eligibility on top.
          zeroSelection={selectedCount === 0}
          disabled={selectedCount === 0 || Boolean(a.disabled)}
          batchHintId={batchHintId}
          count={selectedCount}
          onFire={(optionId) => {
            onBulkAction?.(a.id, selectedIds, optionId);
            table.resetRowSelection();
          }}
        />
      ))}
      {/* Why the actions are disabled — referenced by each disabled button. */}
      <Box
        component="span"
        id={batchHintId}
        sx={{ position: 'absolute', width: 1, height: 1, p: 0, m: -1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0 }}
      >
        Select one or more rows to enable batch actions.
      </Box>
    </Stack>
  ) : null;

  // The TOP BUCKET: strip + header clone, pinned to the scrollport top when stickyChrome. When off, the
  // strip renders bare (byte-identical). The inner carries the stuck dressing (both data-stuck + Chrome
  // scroll-state paths). The clone appears only while stuck, landing exactly where the real header
  // scrolls under, so the handoff reads seamless.
  const bucketEl = stickyChrome ? (
    <Box ref={bucketRef} sx={{ position: 'sticky', top: STICKY_OFFSET, zIndex: 2, ...containerTypeScrollState }}>
      <Box
        className="beam-bucket-inner"
        // Frame region: top + sides + top-radius — the card's ceiling edge, traveling with the pin. Opaque
        // paper ALWAYS (paper-on-paper at rest; the opacity that stops rows ghosting when pinned). Own bg +
        // border follow the radius; the down-band ::after (stuck dressing) extends BELOW, so no
        // overflow-clip here. Squircled corners to match the card floor.
        sx={{
          position: 'relative',
          bgcolor: 'background.paper',
          ...SIDE_BORDER,
          // WIDTH/STYLE longhands, NOT the `border-top` shorthand — the shorthand would reset border-top-
          // COLOR to currentColor (white on dark) landing after SIDE_BORDER's `border-color: divider`. The
          // footer's white-line lesson (notes' platform edge) applied to the ceiling.
          borderTopStyle: 'solid',
          borderTopWidth: '1px',
          borderTopLeftRadius: CARD_RADIUS,
          borderTopRightRadius: CARD_RADIUS,
          ...SQUIRCLE,
          '[data-stuck="top"] &': bucketStuckSx,
          '@container scroll-state(stuck: top)': bucketStuckSx,
        }}
      >
        {stripEl}
        {cloneEl}
      </Box>
    </Box>
  ) : (
    stripEl
  );

  // Footer content (manager + count + pagination) — unchanged; wrapped in a sticky positioner below when
  // stickyChrome so it pins to the scrollport bottom.
  const footerContent =
    selectable || cm.enabled ? (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pl: 0.5 }}>
          {cm.enabled && (
            <BeamColumnManager
              columns={managerColumns}
              catalog={cm.catalog}
              onToggle={toggleColumn}
              onMove={moveColumn}
              onReorder={reorderColumn}
              onReset={cm.reset}
            />
          )}
          {selectable && (
            // aria-live preserved across the move — the count still announces on change.
            <Typography variant="body2" aria-live="polite" sx={{ pl: cm.enabled ? 0 : 1.5, color: 'text.secondary' }}>
              {selectedCount === 0 ? '' : `${selectedCount} selected`}
            </Typography>
          )}
        </Box>
        {paginationEl ?? <Box />}
      </Box>
    ) : (
      paginationEl
    );

  const footerEl = stickyChrome ? (
    // OUTER = the page floor: pins flush to the scrollport bottom (bottom: 0), painted in the PAGE
    // background, and carrying the page's bottom spacing as its own padding — the spacing the shell gave
    // up (CONTENT_BOTTOM, the one shared source). Rows scrolling under sink into this page surface;
    // released at scroll-end the footer sits where it does today (the spacing merely changed owners).
    <Box
      ref={footerRef}
      sx={{ position: 'sticky', bottom: 0, zIndex: 2, bgcolor: 'background.default', pb: CONTENT_BOTTOM, ...containerTypeScrollState }}
    >
      {/* INNER = the bordered paper footer — opaque paper (reads as the card footer over the page-bg
          floor). Frame region: sides + bottom + bottom-radius — the card's floor edge, traveling with
          the pin (the up-band ::before extends ABOVE, so no overflow-clip here). Squircled corners. */}
      <Box
        className="beam-footer-inner"
        sx={{
          position: 'relative',
          bgcolor: 'background.paper',
          ...SIDE_BORDER,
          // WIDTH/STYLE longhands, NOT the `border-bottom` shorthand: the shorthand would reset
          // border-bottom-COLOR to currentColor (white on dark) since it'd land after SIDE_BORDER's
          // `border-color: divider`. Longhands leave the token color standing. (Same trap awaits any
          // partial-corner region — see notes; the bucket's top edge fixes the same way in the header pass.)
          borderBottomStyle: 'solid',
          borderBottomWidth: '1px',
          borderBottomLeftRadius: CARD_RADIUS,
          borderBottomRightRadius: CARD_RADIUS,
          ...SQUIRCLE,
          '[data-stuck="bottom"] &': footerStuckSx,
          '@container scroll-state(stuck: bottom)': footerStuckSx,
        }}
      >
        {footerContent}
      </Box>
    </Box>
  ) : (
    footerContent
  );

  return (
    <>
      <Paper
        variant="outlined"
        // CONTRACT: published when stickyChrome is on. BeamAppShell's `main:has([data-beam-sticky-chrome])`
        // gives up its bottom padding so this grid's footer floor takes it over (see BeamAppShell notes).
        data-beam-sticky-chrome={stickyChrome ? '' : undefined}
        sx={{
          // Non-sticky keeps the single-Paper frame (outlined border + radius) and clips to it. Sticky
          // DECONSTRUCTS the frame onto the three regions, so the Paper drops border + radius — and with
          // the radius gone, `overflow: clip`'s only job (corner-clipping) is gone too. It's RETIRED for
          // the mode → `visible`: sticky escapes to the scroll owner either way (neither clip nor visible
          // creates a scroll container), the TableContainer clips its own horizontal scroll, and the
          // stuck bands stay within their regions — nothing overflows the Paper needing a clip.
          overflow: stickyChrome ? 'visible' : 'hidden',
          ...(stickyChrome
            ? ({
                border: 'none',
                borderRadius: 0,
                // timeline-scope: expose the body's named scroll-timeline (defined on the TableContainer)
                // to the sibling header clone. The Paper is the common ancestor of both.
                'timeline-scope': '--beam-body-scroll',
              } as object)
            : {}),
        }}
      >
        {stickyChrome && <Box ref={topSentinelRef} aria-hidden sx={{ height: 0 }} />}
        {bucketEl}

        {/* Toolbar region: the internal search field ONLY (for lists with no page-level filter bar).
            The column-manager trigger moved to the footer (2026-09-08). So the toolbar now renders
            solely for `searchable` — when false it doesn't render at all, reclaiming its height
            (density installment #1). */}
        {searchable && (
          <Toolbar variant="dense" sx={{ gap: 2, borderBottom: 1, borderColor: 'divider' }}>
            <TextField
              size="small"
              placeholder="Search"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ width: 280 }}
            />
          </Toolbar>
        )}

      {/* Scroll-affordance wrapper: `container-type: inline-size` so the expanded panel's 100cqw
          resolves to the VISIBLE width (Fix 1), and `position: relative` to host the right-edge shadow
          overlay (Fix 2). The listener sets data-overflow-start/end here. Baseline container queries —
          independent of the scroller's scroll-state support. */}
      <Box
        ref={wrapperRef}
        sx={{
          position: 'relative',
          containerType: 'inline-size',
          // Rows region of the deconstructed frame (sticky only): SIDE borders only — the continuous
          // vertical lines between the bucket's top and the footer's bottom.
          ...(stickyChrome ? SIDE_BORDER : {}),
          '& .beam-edge-right': { opacity: 0, transition: 'opacity var(--beam-motion-quick)' },
          '&[data-overflow-end="true"] .beam-edge-right': { opacity: 1 },
        }}
      >
        {/* The scroll container also queries its own scroll state (enhancement).
            The cast: 'scroll-state' is newer than csstype's container-type union. */}
        <TableContainer
          ref={scrollRef}
          sx={{
            containerType: 'scroll-state' as 'normal',
            // Define the body's inline-axis scroll-timeline; the header clone animates along it (see the
            // clone track). Scoped to the Paper (timeline-scope) so the sibling clone can bind by name.
            ...(stickyChrome ? ({ 'scroll-timeline-name': '--beam-body-scroll', 'scroll-timeline-axis': 'inline' } as object) : {}),
          }}
        >
          <Table size="small" aria-label={ariaLabel}>
          <TableHead>
            <TableRow ref={theadRowRef}>
              {railEnabled && (
                // Header sits above the body rail cells if stickyHeader is ever
                // enabled, and above its own row's data cells now.
                <TableCell sx={{ ...railStickySx, zIndex: 3 }}>
                  {selectable && (
                    <Checkbox
                      checked={table.getIsAllRowsSelected()}
                      indeterminate={table.getIsSomeRowsSelected()}
                      onChange={table.getToggleAllRowsSelectedHandler()}
                      slotProps={{ input: { 'aria-label': 'Select all rows' } }}
                    />
                  )}
                </TableCell>
              )}
              {leafColumns.map((col) => {
                const c = columnByKey.get(col.id);
                if (!c) return null;
                const sortDir = col.getIsSorted();
                return (
                  <TableCell
                    key={c.key}
                    align={c.align}
                    // Sticky grids apply the SHARED headerCellSx so the clone matches the real header
                    // exactly (task 2). Non-sticky grids keep MUI's head defaults (byte-identical).
                    sx={{ ...(stickyChrome ? headerCellSx : {}), width: c.width }}
                    sortDirection={sortDir || false}
                  >
                    {col.getCanSort() ? (
                      <TableSortLabel
                        active={Boolean(sortDir)}
                        direction={sortDir || 'asc'}
                        onClick={col.getToggleSortingHandler()}
                      >
                        {c.header}
                      </TableSortLabel>
                    ) : (
                      c.header
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody sx={animatingCount > 0 ? { pointerEvents: 'none' } : undefined}>
            {visibleRows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={dataColSpan}
                  align="center"
                  sx={{ py: 6, color: 'text.secondary' }}
                >
                  {globalFilter ? `No results for “${globalFilter}”.` : emptyMessage}
                </TableCell>
              </TableRow>
            )}
            {visibleRows.map((row) => {
              const isHighlighted = highlightRowId === row.id;
              // One definition, projected to every surface (grammar §3): the
              // kebab and the expansion action bar both render from `actions`.
              const actions = rowActions ? rowActions(row.original) : [];
              const accentHue = rowAccent?.(row.original); // grammar hue | undefined
              return (
              <Fragment key={row.id}>
                <TableRow
                  hover
                  selected={row.getIsSelected()}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  onMouseEnter={onRowHover ? () => onRowHover(row.id) : undefined}
                  onMouseLeave={onRowHover ? () => onRowHover(null) : undefined}
                  sx={{
                    ...(onRowClick && { cursor: 'pointer' }),
                    ...(isHighlighted && { bgcolor: 'action.hover' }),
                    // Kebab: dim at rest, full on row hover and keyboard focus.
                    '& .beam-kebab': { opacity: 0.4, transition: 'opacity 120ms' },
                    '&:hover .beam-kebab, & .beam-kebab:focus-visible': { opacity: 1 },
                    // Rail state layers, composited over its opaque base so the
                    // pinned column tracks hover/selected without ghosting.
                    '&:hover .beam-rail': { backgroundImage: hoverLayer },
                    '&.Mui-selected .beam-rail': { backgroundImage: selectedLayer },
                    '&.Mui-selected:hover .beam-rail': {
                      backgroundImage: `${selectedLayer}, ${hoverLayer}`,
                    },
                    ...(isHighlighted && { '& .beam-rail': { backgroundImage: hoverLayer } }),
                     ...(row.getIsExpanded() && { borderTop: 2, borderColor: 'divider' }),
                  }}
                >
                  {railEnabled && (
                    <TableCell
                      className="beam-rail"
                      // padding="checkbox"
                      onClick={(e) => e.stopPropagation()}
                      sx={{ ...railStickySx, zIndex: 2, whiteSpace: 'nowrap' }}
                    >
                      {accentHue && (
                        // Severity accent — a thin bar at the row's LEADING edge, status-truth, ALWAYS
                        // visible (not scroll-conditional; the scroll affordance lives at the rail's
                        // right edge, no interplay). Decorative, aria-hidden.
                        <Box
                          aria-hidden
                          sx={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: `${ACCENT_WIDTH}px`,
                            pointerEvents: 'none',
                            zIndex: 1,
                            bgcolor: `${ACCENT_PALETTE[accentHue]}.main`,
                          }}
                        />
                      )}
                      <Stack direction="row" sx={{ alignItems: 'center' }}>
                        {selectable && (
                          <Checkbox
                            checked={row.getIsSelected()}
                            onChange={row.getToggleSelectedHandler()}
                            slotProps={{ input: { 'aria-label': `Select row ${row.id}` } }}
                          />
                        )}
                        {actions.length > 0 && <RailKebab items={actions} />}
                        {renderExpanded && (
                          <IconButton
                            size="small"
                            onClick={row.getToggleExpandedHandler()}
                            aria-label={row.getIsExpanded() ? 'Collapse row' : 'Expand row'}
                          >
                            {row.getIsExpanded() ? (
                              <KeyboardArrowDownIcon fontSize="small" />
                            ) : (
                              <KeyboardArrowRightIcon fontSize="small" />
                            )}
                          </IconButton>
                        )}
                      </Stack>
                    </TableCell>
                  )}
                  {leafColumns.map((col) => {
                    const c = columnByKey.get(col.id);
                    if (!c) return null;
                    // Numeric-cell treatment: right-alignment signals a numeric column in
                    // this estate, so tabular figures are applied there — columns line up
                    // digit-for-digit. Requires the body face to carry tabular-nums (Geist
                    // does; it's why it was chosen over a geometric face). BEAM Appendix B.
                    return (
                      <TableCell
                        key={c.key}
                        align={c.align}
                        sx={c.align === 'right' ? { fontVariantNumeric: 'tabular-nums' } : undefined}
                      >
                        {renderCell(c, row.original, LinkComponent)}
                      </TableCell>
                    );
                  })}
                </TableRow>
                {renderExpanded && (
                  // Detail row carries NO `hover` — only the data row above tints on hover.
                  <TableRow>
                    <TableCell
                      colSpan={dataColSpan}
                      // padding:0 — the td's inline padding otherwise displaces the sticky panel from its
                      // pinned left:0 and it wiggles across the sticky threshold while scrolling. The
                      // panel's inset moves onto the sticky box itself (below).
                      sx={{ p: 0, border: 0, ...(row.getIsExpanded() && { borderBottom: 3, borderColor: 'divider' }) }}
                      // sx={{ p: 0, border: 0, borderBottom: 2, borderColor: 'divider' }}
                    >
                      <Collapse
                        in={row.getIsExpanded()}
                        timeout="auto"
                        unmountOnExit
                        // Suspend tbody hover across the whole geometry change (both directions), so a
                        // row can't latch a stale :hover as it translates under a parked cursor.
                        onEnter={onCollapseStart}
                        onExit={onCollapseStart}
                        onEntered={onCollapseEnd}
                        onExited={onCollapseEnd}
                      >
                        {/* Fix 1: pin the panel to the VISIBLE scroll-area width. `100cqw` resolves to
                            the wrapper's inline-size (the container-query wrapper above); `sticky left:0`
                            keeps it put while columns scroll beneath — so the timeline + its action bar
                            never scroll sideways at any scroll position. The inline inset lives HERE (px)
                            now that the td has none — inside the sticky box, so it never shifts the pin. */}
                        <Box sx={{ position: 'sticky', left: 0, width: '100cqw', px: 2 }}>
                          <Box sx={{ py: 2, px: 1 }}>
                            {renderExpanded(row.original)}
                            {/* The expanded bar — UNCONDITIONAL when the row has actions (grammar §3,
                                no opt-out). Below panel content, left-aligned, same `actions` as the
                                kebab: one definition, two projections. */}
                            {actions.length > 0 && <RowActionBar actions={actions} />}
                          </Box>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
              );
            })}
          </TableBody>
        </Table>
        </TableContainer>
        {/* Right-edge scroll shadow — visible only while content continues off-screen to the right
            (data-overflow-end on the wrapper); gone at the end. Tint from the theme edge-shadow token. */}
        <Box
          className="beam-edge-right"
          aria-hidden
          sx={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            right: 0,
            width: EDGE_WIDTH,
            pointerEvents: 'none',
            zIndex: 2,
            background: `linear-gradient(to left, ${EDGE_TINT}, transparent)`,
          }}
        />
      </Box>

      {/* Footer: a left cluster — column-manager trigger (leftmost), then the aria-live selection
          count — and pagination on the right (grammar §4). Wrapped in a sticky positioner (footerEl)
          when stickyChrome; otherwise byte-identical. */}
      {footerEl}
      {stickyChrome && <Box ref={bottomSentinelRef} aria-hidden sx={{ height: 0 }} />}
      </Paper>
    </>
  );
}

/**
 * JumpToPage — the footer's "Page N of M" control (opt-in via `jumpToPage`). Enter commits, Esc reverts,
 * blur reverts (only Enter navigates). Out-of-range is REJECTED IN THE UI: the value clamps to `[1, M]`
 * on commit — never an error state, never a server-style failure. A tooltip hints the valid range while
 * the typed value is out of range. Disabled at a single page. Stays in sync with the arrows / size select.
 */
function JumpToPage({ pageIndex, pageCount, onJump }: { pageIndex: number; pageCount: number; onJump: (p: number) => void }) {
  const current = pageIndex + 1; // 1-based for humans
  const [value, setValue] = useState(String(current));
  const [outOfRange, setOutOfRange] = useState(false);
  const disabled = pageCount <= 1;

  // Re-sync when the page changes elsewhere (arrows, rows-per-page change resetting to page 1).
  useEffect(() => {
    setValue(String(current));
    setOutOfRange(false);
  }, [current]);

  const revert = () => {
    setValue(String(current));
    setOutOfRange(false);
  };
  const commit = () => {
    const n = parseInt(value, 10);
    if (Number.isNaN(n)) return revert();
    const clamped = Math.min(Math.max(n, 1), pageCount); // clamp — the in-UI rejection of out-of-range
    onJump(clamped - 1);
    setValue(String(clamped));
    setOutOfRange(false);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, pr: 1, whiteSpace: 'nowrap' }}>
      <Typography variant="body2" color="text.secondary">Page</Typography>
      <Tooltip title={`Enter 1–${pageCount}`} open={outOfRange && !disabled} arrow>
        <TextField
          size="small"
          value={value}
          disabled={disabled}
          onChange={(e) => {
            const v = e.target.value.replace(/[^0-9]/g, '');
            setValue(v);
            const n = parseInt(v, 10);
            setOutOfRange(v !== '' && (Number.isNaN(n) || n < 1 || n > pageCount));
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); commit(); }
            else if (e.key === 'Escape') { e.preventDefault(); revert(); }
          }}
          onBlur={revert}
          aria-label={`Page number, 1 to ${pageCount}`}
          slotProps={{ htmlInput: { inputMode: 'numeric', style: { width: 44, textAlign: 'center' } } }}
        />
      </Tooltip>
      <Typography variant="body2" color="text.secondary">of {pageCount}</Typography>
    </Box>
  );
}
