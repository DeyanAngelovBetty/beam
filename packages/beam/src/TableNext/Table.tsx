import * as styles from './Table.styles';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MuiTable from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import MuiTablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import SearchIcon from '@mui/icons-material/Search';
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type RowData,
  type RowSelectionState,
  type SortingState,
} from '@tanstack/react-table';
import { Fragment, memo, useId, useMemo, useState } from 'react';
import { Loader } from '../Loader/Loader';
import { useColumnManager } from '../Table/useColumnManager';
import { BeamColumnManager } from '../Table/BeamColumnManager';
import { TABLE_PAGE_SIZE_OPTIONS } from './Table.constants';
import { TableActions, TableHeaderActions } from './TableActions/TableActions';
import type { BeamBulkAction, TableProps } from './Table.types';
import {
  CONTENT_BOTTOM,
  CHROME_CEILING_BAND,
  FIELD_TWIN_HEIGHT,
  SHORT_VP_TIER1,
  SHORT_VP_TIER2,
  belowHeightQuery,
  pageBackdropSx,
} from '../theme/tokens';
import {
  useStickyChrome,
  sortableHeaderContent,
  headerCellSx,
  railStickySx,
  ceilingPaintSx,
  bucketStuckSx,
  footerStuckSx,
  containerTypeScrollState,
  SIDE_BORDER,
  CARD_RADIUS,
  SQUIRCLE,
  EDGE_TINT,
  EDGE_WIDTH,
  Z_RAIL_BODY,
  Z_RAIL_HEADER,
  Z_CLONE_RAIL,
  Z_EDGE,
  Z_CHROME,
} from './Table.stickyChrome';

const ACTION_RAIL_ID = '__table_action_rail' as const;

/** Column meta channel — lane extensions (align/width/defaultHidden/sortable) ride here on the raw ColumnDef. */
type ColMeta = { align?: 'left' | 'right' | 'center'; width?: number | string; defaultHidden?: boolean; sortable?: boolean };
const colMeta = (cd: ColumnDef<unknown, unknown>): ColMeta => (cd.meta as ColMeta | undefined) ?? {};
const colId = (cd: ColumnDef<unknown, unknown>, i: number): string =>
  cd.id ?? (cd as { accessorKey?: string }).accessorKey ?? String(i);

/**
 * Table — the Wave-2 official-API port. Rendered with only the official-subset props it is identical to
 * official Beam's Table (thin themed renderer over a TanStack core). Everything past `actionRail` is a
 * LANE EXTENSION, inert when absent.
 *
 * STICKY CHROME (batch 2b): the full page-owns-scroll pinning mechanism (bucket/clone/tiers/snap/
 * reachability/re-anchor) is re-ported from the organism Table into this render tree — see
 * `./Table.stickyChrome`. It gates on `stickyChrome`/`effectiveSticky`, so the OFFICIAL-SUBSET (non-sticky)
 * path stays byte-identical to 2a. Three organism BASE treatments are re-seated here ONLY under sticky, as
 * PARITY DUPLICATION so Gaspar renders indistinguishably from today: (1) 44px body-row density, (2) the
 * EDGE_TINT rail scroll-affordance (`railStickySx`), (3) the 100cqw expanded-panel pinning. Their named exit
 * is the density-consolidation follow-up (wave2-proposal §6(a)) — when body density moves to the theme, the
 * duplication collapses and the rail/expand treatments get evaluated for lane-style vs theme placement.
 * Exported under `TableNext` while it coexists with the organism `Table` (canonical name at 2f).
 */
function TableInner<TData extends RowData>(props: TableProps<TData>) {
  const {
    data,
    columns,
    getRowId,
    stickyHeader,
    onRowClick,
    onRowHover,
    onRowLeave,
    maxHeight,
    emptyMessage,
    loading,
    elevation,
    variant,
    actionRail,
    expandAll = true,
    railPosition = 'leading',
    rowSelection: rowSelectionProp,
    onRowSelectionChange: onRowSelectionChangeProp,
    stickyChrome,
    columnManager,
    bulkActions,
    onBulkAction,
    sortable = false,
    searchable = false,
    jumpToPage = false,
    pageSizeOptions,
    rowAccent,
    highlightRowId,
    'aria-label': ariaLabel,
  } = props;
  const pagination = 'pagination' in props ? props.pagination : undefined;
  const totalCount = 'totalCount' in props ? props.totalCount : undefined;
  const paginationDisabled = 'paginationDisabled' in props ? props.paginationDisabled : undefined;

  if (process.env.NODE_ENV !== 'production' && maxHeight != null && stickyChrome) {
    // BEAM.md §6: either/or. stickyChrome (page-owns-scroll) wins; maxHeight (internal scroll) is ignored.
    console.warn('[beam Table] `maxHeight` and `stickyChrome` are mutually exclusive; ignoring `maxHeight` (stickyChrome wins).');
  }
  const sticky = Boolean(stickyChrome); // PARITY styling gate (density / rail / expand) — even when currently unreachable
  const effectiveMaxHeight = sticky ? undefined : maxHeight;

  const theme = useTheme();
  // Rail state layers, composited over the rail's opaque base so the pinned column tracks hover/selected
  // without ghosting (organism parity; sticky only).
  const action = (theme.vars || theme).palette.action;
  const hoverLayer = `linear-gradient(${action.hover}, ${action.hover})`;
  const selectedLayer = `linear-gradient(${action.selected}, ${action.selected})`;

  const [scrolledX, setScrolledX] = useState(false);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  // Selection is CONTROLLED when the page owns it (rowSelectionProp) — the server-shaped cross-page pattern;
  // else INTERNAL (per-page, 2a behaviour).
  const [internalRowSelection, setInternalRowSelection] = useState<RowSelectionState>({});
  const selectionControlled = rowSelectionProp !== undefined;
  const rowSelection = selectionControlled ? rowSelectionProp : internalRowSelection;
  const setRowSelection = selectionControlled ? (onRowSelectionChangeProp ?? (() => undefined)) : setInternalRowSelection;

  const expand = actionRail?.expand;
  const menu = actionRail?.menu;
  // Selection is on when the caller passes actionRail.select OR the bulkActions lane (which drives it).
  const railSelect = actionRail?.select ?? (bulkActions ? { onSelect: () => undefined, onSelectAll: () => undefined } : undefined);
  const hasRail = Boolean(expand || menu || railSelect || rowAccent);
  const railLeading = railPosition === 'leading';

  // Column manager (lane) — adapt the raw ColumnDefs to the (BeamColumn-shaped) useColumnManager input.
  const managerInput = useMemo(
    () => (columns as ColumnDef<unknown, unknown>[]).map((cd, i) => ({ key: colId(cd, i), header: '', defaultHidden: colMeta(cd).defaultHidden })),
    [columns],
  );
  const cm = useColumnManager(managerInput as never, columnManager);

  const resolvedColumns = useMemo<ColumnDef<TData, unknown>[]>(() => {
    // Per-column sort opt-out via `meta.sortable === false` (only bites when the table-level `sortable`
    // lane is on; when off, `enableSorting: sortable` below makes all columns unsortable regardless).
    const base = (columns as ColumnDef<TData, unknown>[]).map((cd) => {
      const s = colMeta(cd as ColumnDef<unknown, unknown>).sortable;
      return s === undefined ? cd : { ...cd, enableSorting: s };
    });
    if (!hasRail) return base;
    const railCol: ColumnDef<TData, unknown> = {
      id: ACTION_RAIL_ID,
      // Header rail: the expand-ALL caret is lane-gated (expandAll, default true → official keeps it); the
      // per-row expand carets below are unaffected.
      header: ({ table }) => <TableHeaderActions table={table} expand={Boolean(expand) && expandAll} select={railSelect} />,
      cell: ({ row }) => {
        const hue = rowAccent?.(row.original);
        return (
          <>
            {hue && (
              <Box
                aria-hidden
                sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${styles.ACCENT_WIDTH}px`, pointerEvents: 'none', zIndex: 1, bgcolor: `${styles.ACCENT_PALETTE[hue]}.main` }}
              />
            )}
            <TableActions row={row} expand={!!expand} select={railSelect} menuItems={menu?.(row.original)} />
          </>
        );
      },
      enableSorting: false,
      enableHiding: false,
    };
    return railLeading ? [railCol, ...base] : [...base, railCol];
  }, [columns, expand, expandAll, menu, railSelect, rowAccent, hasRail, railLeading]);

  // Column order MUST place the rail deterministically at `railPosition` — never let TanStack append the
  // unlisted rail column to the end (which silently flips it trailing whenever the column manager is
  // active). Normalize the manager's order to DATA columns, then inject the rail at the chosen edge. The
  // header, body, AND the sticky clone all read this one order → a placement disagreement is impossible.
  const dataColIds = useMemo(() => (columns as ColumnDef<unknown, unknown>[]).map((cd, i) => colId(cd, i)), [columns]);
  const effectiveColumnOrder = useMemo(() => {
    if (!cm.enabled) return undefined;
    const dataOrder = (cm.columnOrder.length ? cm.columnOrder : dataColIds).filter((id) => id !== ACTION_RAIL_ID);
    return railLeading ? [ACTION_RAIL_ID, ...dataOrder] : [...dataOrder, ACTION_RAIL_ID];
  }, [cm.enabled, cm.columnOrder, dataColIds, railLeading]);

  const table = useReactTable<TData>({
    data,
    columns: resolvedColumns,
    getCoreRowModel: getCoreRowModel(),
    // Sorting is a LANE (off by default → official-subset renders no sort affordance).
    ...(sortable ? { getSortedRowModel: getSortedRowModel() } : {}),
    ...(searchable ? { getFilteredRowModel: getFilteredRowModel() } : {}),
    ...(expand ? { getExpandedRowModel: getExpandedRowModel() } : {}),
    getRowCanExpand: () => Boolean(expand),
    getRowId,
    enableRowSelection: Boolean(railSelect),
    enableSorting: sortable,
    state: {
      ...(sortable ? { sorting } : {}),
      ...(searchable ? { globalFilter } : {}),
      rowSelection,
      ...(cm.enabled ? { columnOrder: effectiveColumnOrder, columnVisibility: cm.columnVisibility } : {}),
    },
    ...(sortable ? { onSortingChange: setSorting } : {}),
    onRowSelectionChange: setRowSelection,
    ...(searchable ? { onGlobalFilterChange: setGlobalFilter } : {}),
    ...(cm.enabled ? { onColumnOrderChange: cm.onColumnOrderChange, onColumnVisibilityChange: cm.onColumnVisibilityChange } : {}),
  });

  const resolvedPaginationDisabled = Boolean(paginationDisabled || loading);
  const rows = table.getRowModel().rows;
  const displayRows = searchable ? table.getFilteredRowModel().rows : rows;
  const leafColumns = table.getVisibleLeafColumns();
  const headerCells = table.getHeaderGroups().at(-1)?.headers ?? [];

  // ── Sticky chrome machinery (opt-in) ─────────────────────────────────────────────────────────────
  const { effectiveSticky, refs, cloneWidths, cloneHeight } = useStickyChrome({
    enabled: sticky,
    rowsOnPage: displayRows.length,
    hasPagination: pagination != null,
    page: pagination?.page,
    pageSize: pagination?.pageSize,
    widthSyncKey: [cm.columnOrder, cm.columnVisibility, sorting, leafColumns.length],
  });

  // ── Bulk strip (lane) ──────────────────────────────────────────────────────────────────────────
  const batchHintId = useId();
  // The bulk bucket counts + acts on the OWNED set: with controlled selection that spans every page
  // (Object of the page-owned RowSelectionState); internal selection is per-page (current row model). The
  // factory receives the CURRENT page's selected rows — a consumer needing cross-page eligibility resolves
  // it from its own full dataset by the owned ids.
  const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original);
  const selectedIds = selectionControlled ? Object.keys(rowSelection).filter((id) => rowSelection[id]) : table.getSelectedRowModel().rows.map((r) => r.id);
  const selectedCount = selectedIds.length;
  const resetSelection = () => (selectionControlled ? setRowSelection({}) : table.resetRowSelection());
  const resolvedBulkActions = typeof bulkActions === 'function' ? bulkActions(selectedRows) : bulkActions;
  const stripEl =
    resolvedBulkActions && resolvedBulkActions.length > 0 ? (
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minHeight: FIELD_TWIN_HEIGHT, px: sticky ? 2 : 1, borderBottom: '1px solid', borderColor: 'divider', flexWrap: 'wrap' }}>
        {resolvedBulkActions.map((a) => (
          <BulkActionButton
            key={a.id}
            action={a}
            zeroSelection={selectedCount === 0}
            disabled={selectedCount === 0 || Boolean(a.disabled)}
            batchHintId={batchHintId}
            onFire={(optionId) => {
              onBulkAction?.(a.id, selectedIds, optionId);
              resetSelection();
            }}
          />
        ))}
        <Box id={batchHintId} sx={{ position: 'absolute', width: 1, height: 1, p: 0, m: -1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0 }}>
          Select at least one row to enable batch actions.
        </Box>
      </Stack>
    ) : null;

  // ── Footer (column manager · selection count · pagination + jumpToPage) ─────────────────────────
  const managerColumns = useMemo(
    () =>
      table
        .getAllLeafColumns()
        .filter((c) => c.id !== ACTION_RAIL_ID)
        .map((c) => ({ id: c.id, label: headerLabel(c.columnDef.header), visible: c.getIsVisible() })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [table, cm.columnOrder, cm.columnVisibility],
  );
  const pageCount = pagination && totalCount != null ? Math.max(1, Math.ceil(totalCount / pagination.pageSize)) : 1;
  // Rows-per-page choices: the per-grid override merged with the CONTROLLED page size (so a grid never shows
  // a size it isn't on), else the port default. (Lane: `pageSizeOptions`.)
  const rowsPerPageOptions = pagination
    ? [...new Set([...(pageSizeOptions ?? (TABLE_PAGE_SIZE_OPTIONS as unknown as number[])), pagination.pageSize])].sort((a, b) => a - b)
    : (TABLE_PAGE_SIZE_OPTIONS as unknown as number[]);
  const paginationEl = pagination ? (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
      {jumpToPage && <JumpToPage page={pagination.page} pageCount={pageCount} onJump={(p) => pagination.onChange({ page: p, pageSize: pagination.pageSize })} />}
      <MuiTablePagination
        component="div"
        count={totalCount ?? 0}
        page={Math.max(0, pagination.page - 1)}
        rowsPerPage={pagination.pageSize}
        rowsPerPageOptions={rowsPerPageOptions}
        disabled={resolvedPaginationDisabled}
        onPageChange={(_, p) => pagination.onChange({ page: p + 1, pageSize: pagination.pageSize })}
        onRowsPerPageChange={(e) => pagination.onChange({ page: 1, pageSize: Number(e.target.value) })}
        sx={styles.pagination}
      />
    </Box>
  ) : null;
  // Selection count (organism parity; sticky only, so the official-subset footer is unchanged).
  const selectionCountEl = sticky && railSelect ? (
    <Typography variant="body2" aria-live="polite" sx={{ pl: cm.enabled ? 0 : 1.5, color: 'text.secondary' }}>
      {selectedCount === 0 ? '' : `${selectedCount} selected`}
    </Typography>
  ) : null;
  const footerContent =
    cm.enabled || selectionCountEl || paginationEl ? (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pl: 0.5 }}>
          {cm.enabled && (
            <BeamColumnManager columns={managerColumns} catalog={cm.catalog} onToggle={(id) => toggleColumn(id)} onMove={(id, dir) => moveColumn(id, dir)} onReorder={(id, to) => reorderColumn(id, to)} onReset={cm.reset} />
          )}
          {selectionCountEl}
        </Box>
        {paginationEl ?? <Box />}
      </Box>
    ) : null;

  function toggleColumn(id: string) {
    const visibleCount = managerColumns.filter((c) => c.visible).length;
    const target = managerColumns.find((c) => c.id === id);
    if (target?.visible && visibleCount <= 1) return; // keep ≥1 visible
    table.getColumn(id)?.toggleVisibility(); // routes through cm.onColumnVisibilityChange
  }
  // Store the DATA order only — the rail is re-injected at `railPosition` by `effectiveColumnOrder`.
  function moveColumn(id: string, dir: 'up' | 'down') {
    const order = managerColumns.map((c) => c.id);
    const from = order.indexOf(id);
    const to = dir === 'up' ? from - 1 : from + 1;
    if (to < 0 || to >= order.length) return;
    order.splice(to, 0, order.splice(from, 1)[0]);
    cm.onColumnOrderChange(order);
  }
  function reorderColumn(id: string, to: number) {
    const order = managerColumns.map((c) => c.id);
    const from = order.indexOf(id);
    order.splice(to, 0, order.splice(from, 1)[0]);
    cm.onColumnOrderChange(order);
  }

  // ── Sticky sub-elements (built only when effectiveSticky) ────────────────────────────────────────
  // The rail's ACTUAL index in the visible order (leading = 0, trailing = last) — the clone overlay reads
  // it, so clone + body place the rail from the one same source.
  const railIndex = headerCells.findIndex((h) => h.column.id === ACTION_RAIL_ID);
  const cloneEl = effectiveSticky ? (
    <Box
      className="beam-header-clone"
      aria-hidden
      sx={{
        display: 'none',
        '[data-stuck="top"] &': { display: 'block' },
        '@container scroll-state(stuck: top)': { display: 'block' },
        overflow: 'hidden',
        position: 'relative',
        containerType: 'inline-size',
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Box
        ref={refs.cloneTrackRef}
        sx={{
          display: 'flex',
          minHeight: cloneHeight,
          alignItems: 'center',
          width: 'max-content',
          willChange: 'transform',
          '@keyframes beam-clone-scroll-sync': {
            from: { transform: 'translateX(0)' },
            to: { transform: 'translateX(calc(-100% + 100cqw))' },
          },
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
        {headerCells.map((header, idx) => {
          if (header.column.id === ACTION_RAIL_ID) {
            // Rail SPACER (transparent) — reserves the rail width so each column's track-offset matches the
            // body; the VISIBLE rail is the static overlay below (outside the track).
            return <Box key={header.id} sx={{ flex: '0 0 auto', width: cloneWidths[idx] ?? 0 }} />;
          }
          const meta = colMeta(header.column.columnDef as ColumnDef<unknown, unknown>);
          const content = header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext());
          return (
            <Box
              key={header.id}
              sx={{
                ...headerCellSx,
                flex: '0 0 auto',
                width: cloneWidths[idx] ?? 0,
                boxSizing: 'border-box',
                textAlign: meta.align ?? 'left',
                ...(meta.align === 'right' ? { flexDirection: 'row-reverse' } : {}),
              }}
            >
              {sortableHeaderContent(header.column, content, false)}
            </Box>
          );
        })}
      </Box>
      {hasRail && (
        // STATIC rail overlay — fixed at the clone's rail edge exactly like the body's sticky rail (leading
        // → left, trailing → right), derived from `railLeading` + `railIndex` so it can't diverge from the
        // body. Mirrors the real header rail's select-all (pointer-only, aria-hidden) + the stuck-edge dressing.
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            [railLeading ? 'left' : 'right']: 0,
            top: 0,
            bottom: 0,
            width: cloneWidths[railIndex] ?? 0,
            zIndex: Z_CLONE_RAIL,
            bgcolor: 'background.paper',
            display: 'flex',
            alignItems: 'center',
            ...(railLeading ? { pl: 0.5 } : { pr: 0.5 }),
            '&::before': {
              content: '""', position: 'absolute', [railLeading ? 'right' : 'left']: 0, top: 0, bottom: 0, width: '1px',
              backgroundColor: 'divider', opacity: 0, transition: 'opacity var(--beam-motion-quick)', pointerEvents: 'none',
            },
            '&::after': {
              content: '""', position: 'absolute', [railLeading ? 'left' : 'right']: '100%', top: 0, bottom: 0, width: EDGE_WIDTH,
              background: `linear-gradient(to ${railLeading ? 'right' : 'left'}, ${EDGE_TINT}, transparent)`, opacity: 0,
              transition: 'opacity var(--beam-motion-quick)', pointerEvents: 'none',
            },
            [`[${railLeading ? 'data-overflow-start' : 'data-overflow-end'}="true"] &::before`]: { opacity: 1 },
            [`[${railLeading ? 'data-overflow-start' : 'data-overflow-end'}="true"] &::after`]: { opacity: 1 },
          }}
        >
          {railSelect && (
            <Checkbox
              checked={table.getIsAllRowsSelected()}
              indeterminate={table.getIsSomeRowsSelected()}
              onChange={table.getToggleAllRowsSelectedHandler()}
              slotProps={{ input: { tabIndex: -1, 'aria-hidden': true } }}
            />
          )}
        </Box>
      )}
    </Box>
  ) : null;

  const bucketEl = effectiveSticky ? (
    <Box
      ref={refs.bucketRef}
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: Z_CHROME,
        pt: `${CHROME_CEILING_BAND}px`,
        pointerEvents: 'none',
        ...ceilingPaintSx,
        ...containerTypeScrollState,
        [`@media ${belowHeightQuery(SHORT_VP_TIER2)}`]: { pt: 0 },
      }}
    >
      <Box
        className="beam-bucket-inner"
        sx={{
          position: 'relative',
          pointerEvents: 'auto',
          bgcolor: 'background.paper',
          ...SIDE_BORDER,
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

  const footerEl = effectiveSticky ? (
    <Box
      ref={refs.footerRef}
      sx={{
        position: 'sticky',
        bottom: 0,
        zIndex: Z_CHROME,
        pb: CONTENT_BOTTOM,
        ...pageBackdropSx,
        ...containerTypeScrollState,
        [`@media ${belowHeightQuery(SHORT_VP_TIER1)}`]: { position: 'static' },
      }}
    >
      <Box
        className="beam-footer-inner"
        sx={{
          position: 'relative',
          height: FIELD_TWIN_HEIGHT,
          bgcolor: 'background.paper',
          ...SIDE_BORDER,
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

  // Body-row parity treatments (organism density + rail state layers) — applied ONLY under sticky so the
  // official-subset path is unchanged. PARITY DUPLICATION → density-consolidation follow-up (wave2 §6(a)).
  const stickyRowSx = sticky
    ? {
        height: FIELD_TWIN_HEIGHT,
        '& > .MuiTableCell-root': { paddingTop: 0, paddingBottom: 0 },
        '& .beam-kebab': { opacity: 0.4, transition: 'opacity 120ms' },
        '&:hover .beam-kebab, & .beam-kebab:focus-visible': { opacity: 1 },
        '& .beam-rail .MuiCheckbox-root': { opacity: 1 },
        '& .beam-rail .MuiIconButton-root:not(.beam-kebab)': { opacity: 1 },
        '&:hover .beam-rail': { backgroundImage: hoverLayer },
        '&.Mui-selected .beam-rail': { backgroundImage: selectedLayer },
        '&.Mui-selected:hover .beam-rail': { backgroundImage: `${selectedLayer}, ${hoverLayer}` },
      }
    : undefined;

  return (
    <Paper
      ref={refs.paperRef}
      aria-label={ariaLabel}
      elevation={elevation}
      variant={variant ?? 'outlined'}
      // CONTRACT: published when stickyChrome engages. AppShell's `main:has([data-beam-sticky-chrome])`
      // cedes its bottom padding so the footer floor takes it over; stickyChromeGapSx cedes the top.
      data-beam-sticky-chrome={effectiveSticky ? '' : undefined}
      sx={{
        ...(styles.tableWrapper(elevation) as object),
        overflow: effectiveSticky ? 'visible' : 'hidden',
        ...(effectiveSticky
          ? ({
              border: 'none',
              borderRadius: 0,
              backgroundColor: 'transparent',
              'timeline-scope': '--beam-body-scroll',
              scrollSnapAlign: 'start',
              scrollMarginTop: `${CHROME_CEILING_BAND}px`,
              [`@media ${belowHeightQuery(SHORT_VP_TIER2)}`]: { scrollMarginTop: 0 },
            } as object)
          : {}),
      }}
    >
      <Loader loading={!!loading} placement="top" />
      {effectiveSticky && <Box ref={refs.topSentinelRef} aria-hidden sx={{ height: 0 }} />}
      {bucketEl}
      {searchable && (
        <Toolbar variant="dense" sx={{ px: 1, borderBottom: 1, borderColor: 'divider' }}>
          <TextField
            size="small"
            placeholder="Search"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            sx={{ width: 280 }}
            slotProps={{ input: { startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>) } }}
          />
        </Toolbar>
      )}
      <Box
        ref={refs.wrapperRef}
        sx={{
          position: 'relative',
          containerType: 'inline-size',
          ...(effectiveSticky ? { ...SIDE_BORDER, bgcolor: 'background.paper' } : {}),
          '& .beam-edge-right': { opacity: 0, transition: 'opacity var(--beam-motion-quick)' },
          '&[data-overflow-end="true"] .beam-edge-right': { opacity: 1 },
        }}
      >
        <TableContainer
          ref={refs.scrollRef}
          className={scrolledX ? 'table-scrolledX' : undefined}
          onScroll={!sticky && hasRail ? (event: React.UIEvent<HTMLDivElement>) => setScrolledX(event.currentTarget.scrollLeft > 0) : undefined}
          sx={{
            ...(styles.tableContainer(effectiveMaxHeight) as object),
            // Scroll-state container query for the rail's Chrome-native affordance (whenever sticky).
            ...(sticky ? containerTypeScrollState : {}),
            // The body's inline scroll-timeline the header clone animates along (effective only).
            ...(effectiveSticky ? ({ 'scroll-timeline-name': '--beam-body-scroll', 'scroll-timeline-axis': 'inline' } as object) : {}),
            // Sticky grids HIDE the in-content bar (it would float mid-page); affordance rides the edges + clone.
            ...(sticky
              ? {
                  '@supports not selector(::-webkit-scrollbar)': { scrollbarWidth: effectiveSticky ? 'none' : 'thin' } as object,
                  '&::-webkit-scrollbar': effectiveSticky ? { display: 'none' } : { height: 8, width: 8 },
                }
              : {}),
          }}
        >
          <MuiTable size="small" stickyHeader={stickyHeader}>
            <TableHead>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} ref={refs.theadRowRef}>
                  {headerGroup.headers.map((header) => {
                    const isRail = header.column.id === ACTION_RAIL_ID;
                    const meta = colMeta(header.column.columnDef as ColumnDef<unknown, unknown>);
                    const canSort = header.column.getCanSort();
                    const sortDir = header.column.getIsSorted();
                    const content = header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext());
                    return (
                      <TableCell
                        key={header.id}
                        colSpan={header.colSpan}
                        align={meta.align}
                        className={isRail ? (sticky ? 'beam-rail' : 'table-actionRailCell') : undefined}
                        sx={{
                          ...(isRail ? (sticky ? { ...railStickySx(railLeading), zIndex: Z_RAIL_HEADER } : (styles.actionRailHeader as object)) : {}),
                          ...(meta.width ? { width: meta.width } : {}),
                        }}
                      >
                        {canSort ? (
                          <TableSortLabel active={Boolean(sortDir)} direction={sortDir || 'asc'} onClick={header.column.getToggleSortingHandler()}>
                            {content}
                          </TableSortLabel>
                        ) : (
                          content
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableHead>
            <TableBody sx={styles.body}>
              {displayRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={table.getVisibleLeafColumns().length} align="center" sx={styles.emptyTable}>
                    {searchable && globalFilter ? `No results for "${globalFilter}".` : emptyMessage}
                  </TableCell>
                </TableRow>
              )}
              {displayRows.map((row) => (
                <Fragment key={row.id}>
                  <TableRow
                    className="table-dataRow"
                    selected={row.getIsSelected() || (highlightRowId != null && highlightRowId === row.id)}
                    onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                    onMouseEnter={onRowHover ? () => onRowHover(row.original) : undefined}
                    onMouseLeave={onRowLeave ? () => onRowLeave(row.original) : undefined}
                    sx={{ ...(styles.dataRow(Boolean(onRowClick)) as object), ...(stickyRowSx ?? {}) }}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const isRail = cell.column.id === ACTION_RAIL_ID;
                      const meta = colMeta(cell.column.columnDef as ColumnDef<unknown, unknown>);
                      return (
                        <TableCell
                          key={cell.id}
                          align={meta.align}
                          className={isRail ? (sticky ? 'beam-rail' : 'table-actionRailCell') : undefined}
                          onClick={isRail && sticky ? (e) => e.stopPropagation() : undefined}
                          sx={{
                            ...(isRail ? (sticky ? { ...railStickySx(railLeading), zIndex: Z_RAIL_BODY, whiteSpace: 'nowrap' } : (styles.actionRailCell as object)) : {}),
                            ...(meta.align === 'right' ? { fontVariantNumeric: 'tabular-nums' } : {}),
                          }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  {expand && (
                    <TableRow className="table-detailsRow" selected={row.getIsSelected()}>
                      <TableCell colSpan={row.getVisibleCells().length} sx={styles.expandCell(row.getIsExpanded())}>
                        <Collapse in={row.getIsExpanded()} timeout="auto" unmountOnExit>
                          {/* 100cqw sticky panel (organism parity; sticky only) so the expanded content stays
                              pinned to the visible width during horizontal scroll. Absent → plain wrapper. */}
                          <Box sx={sticky ? { position: 'sticky', left: 0, width: '100cqw' } : undefined}>
                            <Box sx={styles.expandWrapper}>
                              {expand(row.original)}
                              {menu && (
                                <Box sx={styles.expandActionsWrapper}>
                                  {menu(row.original).map((menuItem) => (
                                    <Button key={menuItem.id} variant="outlined" disabled={menuItem.disabled} startIcon={menuItem.icon} color={menuItem.destructive ? 'error' : 'primary'} onClick={menuItem.onSelect} size="small">
                                      {menuItem.label}
                                    </Button>
                                  ))}
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))}
            </TableBody>
          </MuiTable>
        </TableContainer>
        {effectiveSticky && (
          <Box
            className="beam-edge-right"
            aria-hidden
            sx={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: EDGE_WIDTH, pointerEvents: 'none', zIndex: Z_EDGE, background: `linear-gradient(to left, ${EDGE_TINT}, transparent)` }}
          />
        )}
      </Box>
      {footerEl}
      {effectiveSticky && <Box ref={refs.bottomSentinelRef} aria-hidden sx={{ height: 0 }} />}
    </Paper>
  );
}

function headerLabel(header: unknown): string {
  return typeof header === 'string' ? header : '';
}

/** Bulk-strip button — flat fires (with a confirm gate); with `options` it opens a format menu. */
function BulkActionButton({ action, disabled, zeroSelection, batchHintId, onFire }: { action: BeamBulkAction; disabled: boolean; zeroSelection: boolean; batchHintId: string; onFire: (optionId?: string) => void }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const hasOptions = Boolean(action.options?.length);
  const button = (
    <Button
      // Bulk-strip buttons are small TEXT/flat — the quietest tier of the button-hierarchy grammar
      // (loudness descends with scope; a table toolbar sits below the page header + filter panel). See
      // BEAM.md §6 button hierarchy. Lane-only code (official Table has no bulk actions).
      variant="text"
      size="small"
      color={action.destructive ? 'error' : 'primary'}
      aria-disabled={disabled || undefined}
      aria-haspopup={hasOptions ? 'menu' : undefined}
      aria-describedby={zeroSelection ? batchHintId : undefined}
      endIcon={hasOptions ? <ArrowDropDownIcon /> : undefined}
      onClick={(e) => {
        if (disabled) return;
        if (hasOptions) {
          setAnchor(e.currentTarget);
          return;
        }
        if ((action.confirm || action.destructive) && !window.confirm(`${action.label}?`)) return;
        onFire();
      }}
      sx={disabled ? { opacity: 0.5 } : undefined}
    >
      {action.label}
    </Button>
  );
  const wrapped = disabled && action.disabledReason ? <Tooltip title={action.disabledReason}>{button}</Tooltip> : button;
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

/** Jump-to-page footer control — "Page N of M". Calls `onJump(1-based page)`. */
function JumpToPage({ page, pageCount, onJump }: { page: number; pageCount: number; onJump: (page: number) => void }) {
  const [value, setValue] = useState(String(page));
  const disabled = pageCount <= 1;
  const commit = () => {
    const n = parseInt(value, 10);
    if (Number.isNaN(n)) { setValue(String(page)); return; }
    onJump(Math.min(Math.max(n, 1), pageCount));
  };
  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', pr: 1 }}>
      <Box component="span" sx={{ fontSize: 13, color: 'text.secondary' }}>Page</Box>
      <Tooltip title={`Enter 1–${pageCount}`}>
        <TextField
          size="small"
          value={value}
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setValue(String(page)); }}
          onBlur={() => setValue(String(page))}
          slotProps={{ htmlInput: { style: { width: 44, textAlign: 'center' }, 'aria-label': 'Jump to page' } }}
        />
      </Tooltip>
      <Box component="span" sx={{ fontSize: 13, color: 'text.secondary' }}>of {pageCount}</Box>
    </Stack>
  );
}

export const TableNext = memo(TableInner) as typeof TableInner;

export type { TableProps };
