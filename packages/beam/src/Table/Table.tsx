import { Fragment, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ComponentType, type MouseEvent, type ReactNode } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getExpandedRowModel,
  type Column,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
  type ExpandedState,
} from '@tanstack/react-table';
import { useTheme } from '@mui/material/styles';
import MuiTable from '@mui/material/Table';
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
import { ActionMenu } from '../ActionMenu/ActionMenu';
import type { BeamRowAction } from '../ActionMenu/ActionMenu.types';
import type { BeamColumn, TableProps, BeamIdentityLinkProps, BeamBulkAction } from './Table.types';
import { useColumnManager } from './useColumnManager';
import { BeamColumnManager, type ManagerColumn } from './BeamColumnManager';
import { PAGE_TOP_GAP, CONTENT_BOTTOM, PAGE_SECTION_GAP, CHROME_PIN_OFFSET, FIELD_TWIN_HEIGHT, SHORT_VP_TIER1, SHORT_VP_TIER2, SHORT_VP_TIER3, RAIL_SEAT, BUTTON_PAD_X, belowHeightQuery, aboveHeightQuery, pageBackdropSx } from '../theme/tokens';
import { meta } from '../theme/textStyles';

// Scroll-affordance edge shadows — truth-conditional cues shown only while content actually scrolls
// under an edge. BOTH edges are the same soft gradient: a 24px band of the theme tint
// (`--beam-edge-shadow`, derived.edgeShadow) fading away from the edge — the left mirrors the right.
const EDGE_TINT = 'var(--beam-edge-shadow)';
const EDGE_WIDTH = 24; // px band width, shared by both edges so they read as siblings

/**
 * stickyChromeGapSx — the CEILING half of the sticky-chrome contract, applied to a page's section
 * container (the `Stack` that holds the grid). Mirrors the FLOOR's `main:has(...)` on the shell: when the
 * container directly holds a `[data-beam-sticky-chrome]` grid, its `gap` collapses to 0 and every section
 * EXCEPT the one immediately before the grid (whose seam the bucket's ceiling padding takes over) and the
 * last re-gains the spacing as `margin-bottom` — so at rest the layout is pixel-identical, and pinned the
 * bucket sits flush at the top with its own ceiling. `:has`-gated → inert until a sticky grid is present,
 * and it wins on natural specificity (the container's own class + `:has` beats its `spacing` gap, no
 * `!important`, unlike a global CSS rule). Spread it onto the section Stack alongside `spacing={PAGE_SECTION_GAP}`.
 */
export const stickyChromeGapSx = {
  '&:has(> [data-beam-sticky-chrome])': {
    // Adopt the TOP padding the shell donated (PAGE_TOP_GAP — ordinary page rhythm, 1×spacing; density
    // rework 2026-09-23). Owned by the Stack it now SCROLLS with the content, so the bucket pins flush near
    // the true viewport top; at rest the space is identical to a non-sticky page.
    pt: PAGE_TOP_GAP,
    gap: 0,
    '& > *:not(:has(+ [data-beam-sticky-chrome])):not(:last-child)': { mb: PAGE_SECTION_GAP },
    // The section immediately BEFORE the grid carries `PAGE_SECTION_GAP − the pin offset` as its margin, so
    // the visible rest gap stays PAGE_SECTION_GAP (24px): the bucket's ceiling `pt` is a CONSTANT
    // CHROME_PIN_OFFSET (now 24px = the section gap), so mb (24−24 = 0) + band (24px) = 24px. The band IS
    // the whole rest gap; the section sits flush against it, and the band paints TRANSPARENT at rest
    // (::before fades in only when stuck). (px: the spacing×8 − offset arithmetic can't be an sx multiple.)
    '& > *:has(+ [data-beam-sticky-chrome])': { mb: `${PAGE_SECTION_GAP * 8 - CHROME_PIN_OFFSET}px` },
    // SNAP POINT 1 (hardening #2): the TRUE page top (scroll 0) is the snap position, NOT the first section.
    // The Stack's border-box top sits at scroll 0 (the shell donates its pt, so `main` pt:0; the Stack's own
    // pt is INSIDE its border box), so snap-align on the Stack ITSELF makes scroll 0 a snap point — at rest
    // the page is already there, no initial-snap-on-load jump. (The old first-child target sat CONTENT_TOP
    // below 0, so proximity yanked the page down on load.) Scoped by the same :has contract → retires at tier 3.
    scrollSnapAlign: 'start',
    // TIER 2 (ceiling collapses): the ceiling band → 0, so the pre-grid section reverts from its negative
    // absorb-margin to the NORMAL section gap (band no longer there to absorb). In step with the bucket's
    // `pt: 0` and the snap's scroll-margin-top: 0 — one threshold, three coordinated collapses.
    [`@media ${belowHeightQuery(SHORT_VP_TIER2)}`]: {
      '& > *:has(+ [data-beam-sticky-chrome])': { mb: PAGE_SECTION_GAP },
    },
  },
};

/**
 * stickyChromeExitSx — spread onto a page section (a filter panel, a summary card) that sits ABOVE a
 * sticky-chrome grid, so it scales + fades + lifts as it slides up UNDER the pinned bucket (the nerdy.dev
 * scroll-axis treatment). Progress rides a `view()` scroll-progress timeline over `animation-range: exit`,
 * inset by the bucket's measured height (`--beam-bucket-height`, published by the grid onto the scroll
 * parent) so the exit line is the CHROME edge, not the viewport top. The keyframes (`beam-panel-exit`) live
 * in the theme.
 *
 * PROGRESSIVE (grammar posture): the whole treatment is `@supports (animation-timeline: view())`-gated —
 * Chrome-family only; elsewhere the panel just scrolls under, today's behavior. And it's nested under
 * `prefers-reduced-motion: no-preference`, so reduced-motion disables the scale/fade (the frost, being
 * static, stays). One helper, two gates, mirroring `stickyChromeGapSx`.
 */
export const stickyChromeExitSx = {
  '@supports (animation-timeline: view())': {
    '@media (prefers-reduced-motion: no-preference)': {
      // view(block <start-inset> <end-inset>): inset the scrollport's TOP by the bucket's height so "exit"
      // completes as the section reaches the chrome edge, not the viewport top. Longhands, not the
      // `animation` shorthand (which would reset animation-timeline). `both` fill holds the end state while
      // the section is gone and the identity start state before it enters exit.
      animationName: 'beam-panel-exit',
      animationTimeline: 'view(block var(--beam-bucket-height, 0px) auto)',
      animationRange: 'exit',
      animationFillMode: 'both',
      animationTimingFunction: 'linear',
      willChange: 'transform, opacity',
    },
  },
} as object;

// z-index scale for the grid's layered surfaces — NAMED, not adjacent magic. The rail cells live INSIDE
// the affordance wrapper's stacking context (its container-type seals them), and the accent/edge live
// there too; the pinned CHROME (bucket + footer) sits at the Paper level ABOVE that whole context, and is
// additionally bumped above the rail's own z (defense-in-depth if containment ever fails to seal).
const Z_ACCENT = 1; // severity accent bar, inside the rail cell
const Z_RAIL_BODY = 2; // body rail cell
const Z_EDGE = 2; // right-edge scroll overlay (inside the wrapper)
const Z_CLONE_RAIL = 2; // clone's static rail overlay, above its animated track
const Z_RAIL_HEADER = 3; // header rail cell
const Z_CHROME = 4; // pinned bucket + footer — above the rail (Paper level)
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
 * headerCellSx — the header clone's cell treatment, sourced from the SAME `meta` caps style the theme's
 * `MuiTableCell.head` override applies to the real `th` (uppercase + 0.1em + 12px/300 + text.secondary,
 * textStyles.ts). One source, two consumers (the theme override + this clone) — the clone is NOT an
 * approximation; "LAST UPDATED" reads identically over the real header. Padding mirrors the real head cell
 * (12px vertical from the head override + 16px horizontal from size-small); white-space is left at the
 * table default (the real th doesn't force nowrap either), so line-breaking matches at equal widths.
 * Density (#2): padding-block 0, mirroring the real head's new padding — the clone's ROW height comes from
 * the measured `cloneHeight` (= the real 44px header), and the flex track centres these cells within it.
 */
export const headerCellSx = { ...meta, py: 0, px: 2 };

/**
 * The header's sort affordance — the ONE composition BOTH the real `th` and the clone consume, so they
 * can't diverge. The icon SIDE is NOT decided here: `TableSortLabel` has `flex-direction: inherit`, so it
 * flips for a right-aligned column ONLY because the cell sets `flex-direction: row-reverse` — MUI's
 * `TableCell align="right"` does that for the real th; the clone cell mirrors it (see the clone cell). The
 * label render is identical; `interactive: false` makes it POINTER-ONLY (`tabIndex: -1`) for the clone's
 * aria-hidden layer, so it never duplicates the real header's sort control in the a11y/tab tree.
 */
function sortableHeaderContent<Row>(col: Column<Row, unknown>, header: ReactNode, interactive: boolean): ReactNode {
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
      <ActionMenu
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
export function Table<Row>({
  columns,
  rows,
  getRowId,
  selectable = false,
  bulkActions = [],
  onBulkAction,
  searchable = false,
  paginated = false,
  defaultPageSize = 10,
  pagination,
  onPaginationChange,
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
}: TableProps<Row>) {
  const theme = useTheme();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [globalFilter, setGlobalFilter] = useState('');

  // TIER 3 of the short-viewport disengagement — the one tier CSS can't do (it swaps the RENDER path to the
  // plain card, not just styles). Below SHORT_VP_TIER3 the grid can't leave MIN_MEANINGFUL_ROWS rows visible
  // even with the ceiling collapsed, so stickyChrome forfeits its last pins: `effectiveSticky` goes false,
  // `data-beam-sticky-chrome` drops, and every :has() contract (shell padding, stickyChromeGapSx, the snap)
  // deactivates in step — the existing non-sticky path IS the fallback, no new layout. Initial state reads
  // matchMedia SYNCHRONOUSLY so a squashed first paint never flashes sticky. Tiers 1–2 stay pure CSS below.
  const [tooShortForSticky, setTooShortForSticky] = useState(() =>
    typeof window !== 'undefined' && stickyChrome
      ? window.matchMedia(belowHeightQuery(SHORT_VP_TIER3)).matches
      : false,
  );
  useEffect(() => {
    if (!stickyChrome || typeof window === 'undefined') return;
    const mq = window.matchMedia(belowHeightQuery(SHORT_VP_TIER3));
    const sync = () => setTooShortForSticky(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, [stickyChrome]);
  // (`effectiveSticky` is derived below, once `visibleRows` is known — it also folds in PIN_REACHABLE.)

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
    // Uncontrolled default seeds pageSize; when `pagination` is supplied the grid is CONTROLLED (state
    // below + onPaginationChange), so the URL can be the source of truth and pagination survives remount.
    ...(pagination ? {} : { initialState: { pagination: { pageSize: defaultPageSize } } }),
    state: {
      sorting,
      rowSelection,
      expanded,
      globalFilter,
      ...(pagination ? { pagination } : {}),
      ...(cm.enabled ? { columnVisibility: cm.columnVisibility, columnOrder: cm.columnOrder } : {}),
    },
    ...(onPaginationChange ? { onPaginationChange } : {}),
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

  // PIN REACHABILITY (hardening #2) — the engagement gate CSS can't express (it swaps the render path, and
  // the threshold varies with rows-on-page). The grid's chrome only pins if the grid is TALLER than the
  // viewport — otherwise it fits, never scrolls, and the pin is never reached, so the exit/snap/scrollbar
  // treatments would fire on a card that behaves like plain. Computed ARITHMETICALLY from rows-on-page
  // (visibleRows.length), never measured height — so expanding a row (measured taller, same row count) can
  // NEVER toggle engagement (no flicker at the boundary). Pure px, same constants discipline as the tiers
  // (NOT theme.spacing — cssVariables makes it return a calc() string → NaN; CONTENT_BOTTOM.md·8 instead):
  //   PIN_REACHABLE ⇔ FIELD_TWIN_HEIGHT·(3 + rowsOnPage) + CONTENT_BOTTOM.md·8 + CHROME_PIN_OFFSET ≥ vh
  // where 3 = strip + header + footer. `aboveHeightQuery` (min-height + ε) detects the strict-`>` unreachable
  // case; the threshold re-subscribes when rows-on-page changes (page-size flip / filter), so it re-evaluates.
  const pinThreshold = FIELD_TWIN_HEIGHT * (3 + visibleRows.length) + CONTENT_BOTTOM.md * 8 + CHROME_PIN_OFFSET;
  const [pinUnreachable, setPinUnreachable] = useState(() =>
    typeof window !== 'undefined' && stickyChrome
      ? window.matchMedia(aboveHeightQuery(pinThreshold)).matches
      : false,
  );
  useEffect(() => {
    if (!stickyChrome || typeof window === 'undefined') return;
    const mq = window.matchMedia(aboveHeightQuery(pinThreshold));
    const sync = () => setPinUnreachable(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, [stickyChrome, pinThreshold]);
  // The full engagement gate: opted-in AND tall enough to pin (tier 3) AND the grid overflows the viewport
  // (reachable). Unreachable behaves EXACTLY like tier 3 — the attr drops and the :has() cascade retires the
  // exit animation, snap, and scrollbar treatment (plain card, no new layout). Page-size flips re-evaluate.
  const effectiveSticky = stickyChrome && !tooShortForSticky && !pinUnreachable;

  // Perf instrument (point 4): behind a `perf=1` URL token so it works on BOTH dev and PROD builds
  // (HashRouter puts the token in the hash — we test the whole href). Logs render→commit ms for the
  // mounted page, the honest number for the 500-rows-without-virtualization question. Off by default.
  const perfStartRef = useRef(0);
  perfStartRef.current = paginated ? performance.now() : 0;
  useLayoutEffect(() => {
    if (!paginated || typeof window === 'undefined' || !/[?&#]perf=1\b/.test(window.location.href)) return;
    const ms = performance.now() - perfStartRef.current;
    // eslint-disable-next-line no-console
    console.info(`[Table perf] ${visibleRows.length} rows × ${leafColumns.length} cols → ${ms.toFixed(1)}ms (render→commit)`);
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
  const paperRef = useRef<HTMLDivElement>(null); // the grid Paper top = the pinned re-anchor target
  const didAnchorMount = useRef(false); // skip the re-anchor on first mount (only on page/size CHANGE)
  const [cloneWidths, setCloneWidths] = useState<number[]>([]);
  const [cloneHeight, setCloneHeight] = useState(0); // real header ROW height — the clone matches it so the crossover doesn't jump (the select-all checkbox makes the real header taller than the text cells)

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
      const start = el.scrollLeft > 0 ? 'true' : 'false';
      // 1px slack so sub-pixel widths don't leave a ghost shadow at the true end.
      const end = el.scrollLeft < maxScroll - 1 ? 'true' : 'false';
      wrap.dataset.overflowStart = start;
      wrap.dataset.overflowEnd = end;
      // Propagate the same flags onto the bucket so the CLONE's rail overlay (not a wrapper descendant)
      // shows its divider/gradient on scroll, exactly as the body rail does.
      if (bucketRef.current) {
        bucketRef.current.dataset.overflowStart = start;
        bucketRef.current.dataset.overflowEnd = end;
      }
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
    if (!effectiveSticky) return;
    const measure = () => {
      const rowEl = theadRowRef.current;
      if (!rowEl) return;
      const ws = Array.from(rowEl.children).map((c) => (c as HTMLElement).getBoundingClientRect().width);
      setCloneWidths((prev) =>
        prev.length === ws.length && prev.every((w, i) => Math.abs(w - ws[i]) < 0.5) ? prev : ws,
      );
      const h = rowEl.getBoundingClientRect().height; // match the real header row's height (checkbox etc.)
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
  }, [effectiveSticky, cm.columnOrder, cm.columnVisibility, table.getState().sorting, table.getState().pagination.pageSize, visibleRows.length, leafColumns.length]);

  // STUCK DETECTION — the estate's progressive posture: `@container scroll-state(stuck)` drives the
  // dressing + clone on Chrome (pure CSS, below), and this IntersectionObserver fallback sets a
  // `data-stuck` attr everywhere else. Sentinels bracket the pinned chrome; the scroll root is found by
  // walking to the nearest scrollable ancestor (AppShell `main` in Gaspar, the document in Storybook).
  useEffect(() => {
    if (!effectiveSticky || typeof IntersectionObserver === 'undefined') return;
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
    // Both edges pin flush (bucket top: 0, footer bottom: 0), so the sentinels trip stuck at the scrollport
    // edges — no root-margin offset (logo clearance is now the band's height, not a pin offset).
    const top = observe(topSentinelRef.current, bucketRef.current, 'top', '0px 0px 0px 0px');
    const bottom = observe(bottomSentinelRef.current, footerRef.current, 'bottom', '0px 0px 0px 0px');
    return () => {
      top?.disconnect();
      bottom?.disconnect();
    };
  }, [effectiveSticky]);

  // Publish the bucket's measured height as `--beam-bucket-height` on the SCROLL PARENT (the page owns the
  // scroll). A page section above the grid reads it via `stickyChromeExitSx` to inset its `view()` exit
  // timeline to the CHROME edge, not the viewport top. With the bucket pinned at top: 0, its measured height
  // IS the occlusion edge from the viewport top, so the exit range lands exactly at the true bucket bottom
  // (no offset term). Measured, never assumed (the rail-width precedent) — RO tracks strip/header height
  // changes (bulk-strip appearing, wrap, resize).
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

  // DETERMINISTIC RE-ANCHOR on page/size change (QoL): after the new layout commits (useLayoutEffect), scroll
  // the page scroller INSTANTLY (never smooth) to a calm landing — the grid's snap-2 pinned position when the
  // chrome will engage for the NEW rows-on-page, else page top. Reachability is recomputed SYNCHRONOUSLY from
  // rows-on-page (fresh this render) via the SAME arithmetic as the gate — never the (async, one-render-late)
  // pinUnreachable state, never measured height. The pinned target subtracts the Paper's active scroll-margin-
  // top so it lands exactly where proximity-snap rests (else proximity would fight it) — inheriting whichever
  // snap-2 offset constant is live (CHROME_PIN_OFFSET, or 0 once the ceiling collapses at tier 2). Skips the
  // first mount so a shared URL / refresh keeps its position.
  useLayoutEffect(() => {
    // Scoped to stickyChrome grids (the pin/snap machinery) — non-sticky grids keep their scroll position on
    // page change, no rider. `stickyChrome` (the prop) covers the opted-in-but-currently-unreachable case too.
    if (!paginated || !stickyChrome) return;
    if (!didAnchorMount.current) {
      didAnchorMount.current = true;
      return;
    }
    const sp = getScrollParent(paperRef.current);
    if (!sp || !paperRef.current) return;
    const reachable =
      FIELD_TWIN_HEIGHT * (3 + visibleRows.length) + CONTENT_BOTTOM.md * 8 + CHROME_PIN_OFFSET >= window.innerHeight;
    const willStick = stickyChrome && !tooShortForSticky && reachable;
    // Match the Paper's scroll-margin-top (0 once the ceiling collapses at tier 2, else CHROME_PIN_OFFSET).
    const snapMargin = window.matchMedia(belowHeightQuery(SHORT_VP_TIER2)).matches ? 0 : CHROME_PIN_OFFSET;
    const target = willStick
      ? sp.scrollTop + paperRef.current.getBoundingClientRect().top - sp.getBoundingClientRect().top - snapMargin
      : 0;
    sp.scrollTo({ top: target, behavior: 'instant' as ScrollBehavior });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table.getState().pagination.pageIndex, table.getState().pagination.pageSize]);

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
    // Density (#2): centre the rail controls in the 44px row (was 'top'). The controls (checkbox ~42,
    // size-small IconButtons ~30) all fit inside 44, so the row height comes from the constant, not the
    // rail — and the checkbox/kebab/caret sit centred against the centred data cells.
    verticalAlign: 'middle',
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
  // CEILING PAINT — the opaque page band the logo floats over, stuck-gated with an opacity FADE. The band
  // is a CONSTANT CHROME_PIN_OFFSET tall (the bucket's `pt`), so the card sits a fixed distance below the
  // bucket top — continuous through the pin, NO jump (sticky's contract IS constant geometry). At rest the
  // band overlaps the pre-grid section (the negative margin keeping the rest gap pixel-identical), so it must
  // paint TRANSPARENT there — hence a `::before` carrying pageBackdropSx at opacity 0, fading to 1 only when
  // stuck. Because it paints the FIXED-attachment backdrop, the fade lands on identical pixels wherever only
  // backdrop is behind; where the exiting panel is still behind, the fade cross-dissolves with the panel's
  // exit — a paint transition, never a layout shift. Pointer-transparent (inherits the outer's none).
  // (Frost RETIRED 2026-09-13 — tried twice, transparent then sheen-over-opaque; the exit animation is the
  // treatment, the band is page. See stickyChromeExitSx + Table-notes.)
  const ceilingPaintSx = {
    '&::before': {
      content: '""',
      position: 'absolute',
      inset: 0,
      ...pageBackdropSx,
      opacity: 0,
      transition: 'opacity var(--beam-motion-quick)',
    },
    '&[data-stuck="top"]::before': { opacity: 1 },
    // Chrome enhancement: the pseudo (a descendant of the outer container) queries the outer's stuck state.
    '@container scroll-state(stuck: top)': { '&::before': { opacity: 1 } },
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
  const cloneEl = effectiveSticky ? (
    <Box
      className="beam-header-clone"
      aria-hidden
      sx={{
        display: 'none',
        '[data-stuck="top"] &': { display: 'block' },
        '@container scroll-state(stuck: top)': { display: 'block' },
        overflow: 'hidden',
        // position: relative makes the clone the containing block for the rail overlay, so the overlay is
        // scoped to the CLONE region (the header row), NOT the bucket — the actions strip, a sibling
        // above, never enters its coordinate space (no strip-height measuring needed).
        position: 'relative',
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
          // Match the real header ROW height (the select-all checkbox makes it taller than the text
          // cells) and center the cells, so the crossover doesn't jump vertically.
          minHeight: cloneHeight,
          alignItems: 'center',
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
          // Rail SPACER (transparent): occupies the rail width so each column's track-offset equals the
          // body's table-offset (both from the same measured widths) — the column x-positions stay
          // aligned with the body. The VISIBLE rail is the static overlay below (outside the track).
          <Box sx={{ flex: '0 0 auto', width: cloneWidths[0] ?? 0 }} />
        )}
        {leafColumns.map((col, i) => {
          const c = columnByKey.get(col.id);
          return (
            <Box
              key={col.id}
              // SHARED SOURCE with the real th — same headerCellSx (meta) + the same sort composition
              // (sortableHeaderContent), so face/baseline/line-breaking AND the sort indicator match. The
              // one alignment subtlety MUI's TableCell handles for the th, mirrored here: a right-aligned
              // column sets `flex-direction: row-reverse`, which the TableSortLabel inherits — so the arrow
              // sits on the SAME side (icon-first) as the real header, not after the label.
              sx={{
                ...headerCellSx,
                flex: '0 0 auto',
                width: cloneWidths[railOffset + i] ?? 0,
                boxSizing: 'border-box',
                textAlign: c?.align ?? 'left',
                ...(c?.align === 'right' ? { flexDirection: 'row-reverse' } : {}),
              }}
            >
              {sortableHeaderContent(col, c?.header, false)}
            </Box>
          );
        })}
      </Box>
      {railEnabled && (
        // STATIC rail overlay — NOT animated: sits fixed at the clone's left exactly like the body's
        // sticky rail, columns sliding beneath it (occluded by its opaque paper). Mirrors the real HEADER
        // rail cell's contents — the select-all checkbox (when selectable) at the rail's left inset —
        // plus the body rail's stuck-left dressing: a 1px `divider` right edge (::before) + the occlusion
        // gradient (::after), shown on horizontal scroll via `data-overflow-start` (propagated onto the
        // bucket by the rAF listener). Width tracks the measured rail. aria-hidden overall (the real thead
        // keeps the semantic select-all); the checkbox is wired for POINTER only — non-focusable, so ops
        // gets genuine select-all from the pinned header while keyboard/AT use the real header (scroll up).
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: cloneWidths[0] ?? 0,
            zIndex: Z_CLONE_RAIL,
            bgcolor: 'background.paper',
            display: 'flex',
            alignItems: 'center',
            pl: 0.5, // mirrors railStickySx's left inset
            '&::before': {
              content: '""', position: 'absolute', right: 0, top: 0, bottom: 0, width: '1px',
              backgroundColor: 'divider', opacity: 0, transition: 'opacity var(--beam-motion-quick)', pointerEvents: 'none',
            },
            '&::after': {
              content: '""', position: 'absolute', left: '100%', top: 0, bottom: 0, width: EDGE_WIDTH,
              background: `linear-gradient(to right, ${EDGE_TINT}, transparent)`, opacity: 0,
              transition: 'opacity var(--beam-motion-quick)', pointerEvents: 'none',
            },
            '[data-overflow-start="true"] &::before': { opacity: 1 },
            '[data-overflow-start="true"] &::after': { opacity: 1 },
          }}
        >
          {selectable && (
            <Checkbox
              checked={table.getIsAllRowsSelected()}
              indeterminate={table.getIsSomeRowsSelected()}
              onChange={table.getToggleAllRowsSelectedHandler()}
              // Pointer-only: aria-hidden (parent) + non-focusable, so it never duplicates the real
              // header's select-all in the a11y/tab tree.
              slotProps={{ input: { tabIndex: -1, 'aria-hidden': true } }}
            />
          )}
        </Box>
      )}
    </Box>
  ) : null;

  // Batch actions — a top SECTION of the grid surface (moved inside the Paper 2026-09-08, the
  // Section-sectioning pattern; DetailsPanel/PrizeWall precedent). Persistent when bulkActions is set;
  // constant geometry, variable enablement — every action renders, disabled at zero selection.
  const stripEl = resolvedBulkActions.length > 0 ? (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', gap: 1, pl: `${RAIL_SEAT - BUTTON_PAD_X}px`, pr: 2, minHeight: FIELD_TWIN_HEIGHT, borderBottom: 1, borderColor: 'divider' }}>
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
  const bucketEl = effectiveSticky ? (
    // OUTER = the page CEILING. Pins at `top: 0` ALWAYS — sticky's contract is CONSTANT geometry through
    // the pin, so the card sits a fixed distance below the bucket top at every scroll position: no jump.
    // Logo clearance is the BAND HEIGHT, not a pin offset: `pt` is a constant CHROME_PIN_OFFSET (strip
    // height + breath), so the card clears the floating brand strip; the pre-grid section's negative margin
    // (stickyChromeGapSx) absorbs the extra at rest, keeping the rest gap pixel-identical. The band paints
    // via `ceilingPaintSx`'s stuck-gated ::before (opaque pageBackdropSx, opacity fade) — transparent at
    // rest (so the negative-margin overlap is invisible), opaque page when stuck (logo over page, rows
    // occluded). pointer-events:none so the transparent band doesn't eat clicks on the section beneath; the
    // inner re-enables auto.
    <Box
      ref={bucketRef}
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: Z_CHROME,
        pt: `${CHROME_PIN_OFFSET}px`,
        pointerEvents: 'none',
        ...ceilingPaintSx,
        ...containerTypeScrollState,
        // TIER 2 (footer already unstuck): below SHORT_VP_TIER2 the ceiling band would eat the row budget,
        // so it collapses to 0 — the chrome pins at the TRUE viewport top (logo clearance forfeited; on a
        // <328px viewport, rows win over clearance). stickyChromeGapSx reverts the pre-grid negative margin
        // in step, and the snap's scroll-margin-top collapses to 0 too, so all three stay coherent.
        [`@media ${belowHeightQuery(SHORT_VP_TIER2)}`]: { pt: 0 },
      }}
    >
      <Box
        className="beam-bucket-inner"
        // Frame region: top + sides + top-radius — the card's ceiling edge, traveling with the pin. Opaque
        // paper ALWAYS (paper-on-paper at rest; the opacity that stops rows ghosting when pinned). Own bg +
        // border follow the radius; the down-band ::after (stuck dressing) extends BELOW, so no
        // overflow-clip here. Squircled corners to match the card floor.
        sx={{
          position: 'relative',
          // Re-enable pointer events: the outer is pointer-events:none (so its transparent-at-rest ceiling
          // band doesn't eat clicks on the section it overlaps); the inner is the interactive chrome.
          pointerEvents: 'auto',
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pl: `${RAIL_SEAT}px` }}>{/* footer actions seat at RAIL_SEAT; the manage-columns button's −BUTTON_PAD_X margin lands its label on it */}
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
    ) : paginationEl ? (
      // Standalone footer band owns its top border — a CHROME BAND owns its borders (BEAM.md §6 border
      // principle: header owns its underline, footer its border-top). The selectable/manager branch above
      // already carries it (from the density pass); this mirrors it for a plain paginated table.
      <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>{paginationEl}</Box>
    ) : null;

  const footerEl = effectiveSticky ? (
    // OUTER = the page floor: pins flush to the scrollport bottom (bottom: 0), and PAINTS the page's own
    // backdrop (pageBackdropSx, fixed attachment — see the ceiling outer) so it's opaque + seamless,
    // carrying the page's bottom spacing as its padding (CONTENT_BOTTOM, the shell gave it up). Rows
    // transiting the band are occluded; released, the footer sits where it does today.
    <Box
      ref={footerRef}
      sx={{
        position: 'sticky',
        bottom: 0,
        zIndex: Z_CHROME,
        pb: CONTENT_BOTTOM,
        ...pageBackdropSx,
        ...containerTypeScrollState,
        // TIER 1 (cheapest pin to drop): below SHORT_VP_TIER1 the viewport can't hold the full chrome +
        // MIN_MEANINGFUL_ROWS, so the footer unsticks — pagination scrolls with the content instead of
        // pinning. Pure CSS; the pinned top (ceiling + bucket) stays until tier 2. (Pure-px module constant —
        // an in-component theme.spacing() computation returned NaN under cssVariables; see tokens.ts.)
        [`@media ${belowHeightQuery(SHORT_VP_TIER1)}`]: { position: 'static' },
      }}
    >
      {/* INNER = the bordered paper footer — opaque paper (reads as the card footer over the page-bg
          floor). Frame region: sides + bottom + bottom-radius — the card's floor edge, traveling with
          the pin (the up-band ::before extends ABOVE, so no overflow-clip here). Squircled corners. */}
      <Box
        className="beam-footer-inner"
        sx={{
          position: 'relative',
          // Density: the footer band is EXACTLY FIELD_TWIN_HEIGHT, border-box — its 1px bottom card-edge
          // border sits INSIDE the 44, identical to a body row's `height: 44` (was `minHeight`, which added
          // the border ON TOP → the extra ~2px vs the 52px toolbar). The toolbar min-height is capped to 44
          // in the theme, so nothing forces the band taller; the pagination centres within.
          height: FIELD_TWIN_HEIGHT,
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
        ref={paperRef}
        variant="outlined"
        // CONTRACT: published when stickyChrome is on. AppShell's `main:has([data-beam-sticky-chrome])`
        // gives up its bottom padding so this grid's footer floor takes it over (see AppShell notes).
        data-beam-sticky-chrome={effectiveSticky ? '' : undefined}
        sx={{
          // Non-sticky keeps the single-Paper frame (outlined border + radius) and clips to it. Sticky
          // DECONSTRUCTS the frame onto the three regions, so the Paper drops border + radius — and with
          // the radius gone, `overflow: clip`'s only job (corner-clipping) is gone too. It's RETIRED for
          // the mode → `visible`: sticky escapes to the scroll owner either way (neither clip nor visible
          // creates a scroll container), the TableContainer clips its own horizontal scroll, and the
          // stuck bands stay within their regions — nothing overflows the Paper needing a clip.
          overflow: effectiveSticky ? 'visible' : 'hidden',
          ...(effectiveSticky
            ? ({
                border: 'none',
                borderRadius: 0,
                // SURFACE cession completing the deconstruction: the Paper already ceded its BORDER to the
                // three regions; here it cedes its BACKGROUND to the rows region (below). In sticky mode
                // the Paper is pure STRUCTURE — positioning context + timeline-scope host — with zero
                // paint, so the transparent ceiling/floor outers reveal the page's fixed backdrop through
                // it (the mesh, not a color).
                backgroundColor: 'transparent',
                // timeline-scope: expose the body's named scroll-timeline (defined on the TableContainer)
                // to the sibling header clone. The Paper is the common ancestor of both.
                'timeline-scope': '--beam-body-scroll',
                // SNAP POINT 2 (A): the grid Paper is a snap target (proximity, set on the scroll owner via
                // the shell contract). scroll-margin-top: CHROME_PIN_OFFSET resolves the snap to the pinned
                // position; it collapses to 0 at TIER 2 in step with the ceiling band (dead sync otherwise).
                scrollSnapAlign: 'start',
                scrollMarginTop: `${CHROME_PIN_OFFSET}px`,
                [`@media ${belowHeightQuery(SHORT_VP_TIER2)}`]: { scrollMarginTop: 0 },
              } as object)
            : {}),
        }}
      >
        {effectiveSticky && <Box ref={topSentinelRef} aria-hidden sx={{ height: 0 }} />}
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
          // vertical lines between the bucket's top and the footer's bottom — AND the paper SURFACE the
          // Paper ceded (so rows still sit on paper now that the Paper paints nothing).
          ...(effectiveSticky ? { ...SIDE_BORDER, bgcolor: 'background.paper' } : {}),
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
            ...(effectiveSticky ? ({ 'scroll-timeline-name': '--beam-body-scroll', 'scroll-timeline-axis': 'inline' } as object) : {}),
            // Scrollbar (Task B, hardening): in-content scroller → THIN (slimmer than the primary page bar).
            // Same standard-vs-webkit mutual exclusivity as `body`: the standard `scrollbar-width` is GATED to
            // Firefox (@supports not selector(::-webkit-scrollbar)) so it never disables the webkit pseudos on
            // Chromium, where the webkit rule owns the size. On sticky grids the bar is HIDDEN (Task C interim:
            // it would otherwise float mid-page detached from any card edge; affordance carried by the edge
            // gradients + clone tracking + gestures; keyboard panning survives — none/display:none hide only
            // the visual bar). One value drives both engines' declarations.
            '@supports not selector(::-webkit-scrollbar)': { scrollbarWidth: effectiveSticky ? 'none' : 'thin' } as object,
            '&::-webkit-scrollbar': effectiveSticky ? { display: 'none' } : { height: 8, width: 8 },
          }}
        >
          <MuiTable size="small" aria-label={ariaLabel}>
          <TableHead>
            <TableRow ref={theadRowRef}>
              {railEnabled && (
                // Header sits above the body rail cells if stickyHeader is ever
                // enabled, and above its own row's data cells now. `beam-rail` (matching the body rail cell)
                // is the CSS contract that keeps its DELIBERATE opaque backing under the estate-wide
                // transparent-head theme rule (createBeamTheme MuiTableCell.head) — else a sticky-left rail
                // would let data columns show through on horizontal scroll. (Wave 2 2b/7.)
                <TableCell className="beam-rail" sx={{ ...railStickySx, zIndex: Z_RAIL_HEADER }}>
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
                    // The real header's text style is the theme's `MuiTableCell.head` (= `meta`); the clone
                    // sources the SAME `meta` via headerCellSx. So the th needs no per-cell style here —
                    // one source, and the earlier headerCellSx-on-th (a body2 approximation) is removed.
                    sx={{ width: c.width }}
                    sortDirection={sortDir || false}
                  >
                    {sortableHeaderContent(col, c.header, true)}
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
                    // Density (#2): the row converges on the 44px field-twin datum. `height` on a row acts
                    // as a MINIMUM; padding-block:0 on its data cells (below) drops the size-small vertical
                    // padding so the height comes from THIS constant, not the tallest cell (border-box keeps
                    // the 1px cell border inside 44 → 44, not 45). The rail controls all fit inside 44, so
                    // they no longer own the height. Expanded/empty rows aren't touched (their own cells).
                    height: FIELD_TWIN_HEIGHT,
                    '& > .MuiTableCell-root': { paddingTop: 0, paddingBottom: 0 },
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
                      sx={{ ...railStickySx, zIndex: Z_RAIL_BODY, whiteSpace: 'nowrap' }}
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
                            zIndex: Z_ACCENT,
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
        </MuiTable>
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
            zIndex: Z_EDGE,
            background: `linear-gradient(to left, ${EDGE_TINT}, transparent)`,
          }}
        />
      </Box>

      {/* Footer: a left cluster — column-manager trigger (leftmost), then the aria-live selection
          count — and pagination on the right (grammar §4). Wrapped in a sticky positioner (footerEl)
          when stickyChrome; otherwise byte-identical. */}
      {footerEl}
      {effectiveSticky && <Box ref={bottomSentinelRef} aria-hidden sx={{ height: 0 }} />}
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
          // Density (#2): padding 6px 0 (overriding the theme's 13px field padding) so the input sits INSIDE
          // the 44px footer with breathing room instead of filling it edge-to-edge. Width/centre unchanged.
          slotProps={{ htmlInput: { inputMode: 'numeric', style: { width: 44, textAlign: 'center', padding: '6px 0' } } }}
        />
      </Tooltip>
      <Typography variant="body2" color="text.secondary">of {pageCount}</Typography>
    </Box>
  );
}
