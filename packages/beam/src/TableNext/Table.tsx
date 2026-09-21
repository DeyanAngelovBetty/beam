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
import InputAdornment from '@mui/material/InputAdornment';
import Tooltip from '@mui/material/Tooltip';
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
 * SCOPE (batch 2a): official core + actionRail + the additive lanes (bulkActions, rowAccent, searchable,
 * jumpToPage, highlightRowId, columnManager) are re-seated and build-verified. The `stickyChrome` PINNING
 * mechanism (bucket/clone/tiers/snap) is NOT re-ported here — it is deferred to Gaspar TransactionsPage's
 * migration (2b), its sole consumer, where it is exercised + browser-verifiable. In 2a `stickyChrome` is
 * accepted and dev-warns against `maxHeight`, but does not yet pin. Exported under `TableNext` while it
 * coexists with the old organism `Table` (renamed to the canonical `Table` at 2f).
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
    stickyChrome,
    columnManager,
    bulkActions,
    onBulkAction,
    sortable = false,
    searchable = false,
    jumpToPage = false,
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
  const effectiveMaxHeight = stickyChrome ? undefined : maxHeight;

  const [scrolledX, setScrolledX] = useState(false);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const expand = actionRail?.expand;
  const menu = actionRail?.menu;
  // Selection is on when the caller passes actionRail.select OR the bulkActions lane (which drives it).
  const railSelect = actionRail?.select ?? (bulkActions ? { onSelect: () => undefined, onSelectAll: () => undefined } : undefined);
  const hasRail = Boolean(expand || menu || railSelect || rowAccent);

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
      header: ({ table }) => <TableHeaderActions table={table} expand={!!expand} select={railSelect} />,
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
    return [railCol, ...base];
  }, [columns, expand, menu, railSelect, rowAccent, hasRail]);

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
      ...(cm.enabled ? { columnOrder: cm.columnOrder, columnVisibility: cm.columnVisibility } : {}),
    },
    ...(sortable ? { onSortingChange: setSorting } : {}),
    onRowSelectionChange: setRowSelection,
    ...(searchable ? { onGlobalFilterChange: setGlobalFilter } : {}),
    ...(cm.enabled ? { onColumnOrderChange: cm.onColumnOrderChange, onColumnVisibilityChange: cm.onColumnVisibilityChange } : {}),
  });

  const resolvedPaginationDisabled = Boolean(paginationDisabled || loading);
  const rows = table.getRowModel().rows;
  const displayRows = searchable ? table.getFilteredRowModel().rows : rows;

  // ── Bulk strip (lane) ──────────────────────────────────────────────────────────────────────────
  const batchHintId = useId();
  const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original);
  const selectedIds = table.getSelectedRowModel().rows.map((r) => r.id);
  const selectedCount = selectedIds.length;
  const resolvedBulkActions = typeof bulkActions === 'function' ? bulkActions(selectedRows) : bulkActions;
  const stripEl =
    resolvedBulkActions && resolvedBulkActions.length > 0 ? (
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minHeight: 44, px: 1, borderBottom: '1px solid', borderColor: 'divider', flexWrap: 'wrap' }}>
        {resolvedBulkActions.map((a) => (
          <BulkActionButton
            key={a.id}
            action={a}
            zeroSelection={selectedCount === 0}
            disabled={selectedCount === 0 || Boolean(a.disabled)}
            batchHintId={batchHintId}
            onFire={(optionId) => {
              onBulkAction?.(a.id, selectedIds, optionId);
              table.resetRowSelection();
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
  const paginationEl = pagination ? (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
      {jumpToPage && <JumpToPage page={pagination.page} pageCount={pageCount} onJump={(p) => pagination.onChange({ page: p, pageSize: pagination.pageSize })} />}
      <MuiTablePagination
        component="div"
        count={totalCount ?? 0}
        page={Math.max(0, pagination.page - 1)}
        rowsPerPage={pagination.pageSize}
        rowsPerPageOptions={TABLE_PAGE_SIZE_OPTIONS as unknown as number[]}
        disabled={resolvedPaginationDisabled}
        onPageChange={(_, p) => pagination.onChange({ page: p + 1, pageSize: pagination.pageSize })}
        onRowsPerPageChange={(e) => pagination.onChange({ page: 1, pageSize: Number(e.target.value) })}
        sx={styles.pagination}
      />
    </Box>
  ) : null;
  const footerContent =
    cm.enabled || paginationEl ? (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pl: 0.5 }}>
          {cm.enabled && (
            <BeamColumnManager columns={managerColumns} catalog={cm.catalog} onToggle={(id) => toggleColumn(id)} onMove={(id, dir) => moveColumn(id, dir)} onReorder={(id, to) => reorderColumn(id, to)} onReset={cm.reset} />
          )}
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
  function moveColumn(id: string, dir: 'up' | 'down') {
    const order = managerColumns.map((c) => c.id);
    const from = order.indexOf(id);
    const to = dir === 'up' ? from - 1 : from + 1;
    if (to < 0 || to >= order.length) return;
    order.splice(to, 0, order.splice(from, 1)[0]);
    cm.onColumnOrderChange([ACTION_RAIL_ID, ...order]);
  }
  function reorderColumn(id: string, to: number) {
    const order = managerColumns.map((c) => c.id);
    const from = order.indexOf(id);
    order.splice(to, 0, order.splice(from, 1)[0]);
    cm.onColumnOrderChange([ACTION_RAIL_ID, ...order]);
  }

  return (
    <Paper
      aria-label={ariaLabel}
      elevation={elevation}
      variant={variant ?? 'outlined'}
      data-beam-sticky-chrome={undefined /* 2a: stickyChrome pinning deferred to 2b; no contract emitted yet */}
      sx={styles.tableWrapper(elevation)}
    >
      <Loader loading={!!loading} placement="top" />
      {searchable && (
        <Toolbar variant="dense" sx={{ px: 1 }}>
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
      {stripEl}
      <TableContainer
        className={scrolledX ? 'table-scrolledX' : undefined}
        onScroll={hasRail ? (event) => setScrolledX(event.currentTarget.scrollLeft > 0) : undefined}
        sx={styles.tableContainer(effectiveMaxHeight)}
      >
        <MuiTable size="small" stickyHeader={stickyHeader}>
          <TableHead>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
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
                      className={isRail ? 'table-actionRailCell' : undefined}
                      sx={{ ...(isRail ? (styles.actionRailHeader as object) : {}), ...(meta.width ? { width: meta.width } : {}) }}
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
                  sx={styles.dataRow(Boolean(onRowClick))}
                >
                  {row.getVisibleCells().map((cell) => {
                    const isRail = cell.column.id === ACTION_RAIL_ID;
                    const meta = colMeta(cell.column.columnDef as ColumnDef<unknown, unknown>);
                    return (
                      <TableCell
                        key={cell.id}
                        align={meta.align}
                        className={isRail ? 'table-actionRailCell' : undefined}
                        sx={{ ...(isRail ? (styles.actionRailCell as object) : {}), ...(meta.align === 'right' ? { fontVariantNumeric: 'tabular-nums' } : {}) }}
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
                      </Collapse>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            ))}
          </TableBody>
        </MuiTable>
      </TableContainer>
      {footerContent}
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
      variant="outlined"
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
