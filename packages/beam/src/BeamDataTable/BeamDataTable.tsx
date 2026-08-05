import { Fragment, useEffect, useId, useMemo, useRef, useState, type ComponentType, type MouseEvent } from 'react';
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
import type { BeamColumn, BeamDataTableProps, BeamIdentityLinkProps } from './BeamDataTable.types';
import { isWhiteSpaceLike } from 'typescript';

// Rail scroll-affordance elevation — a truth-conditional cue shown only while
// content actually scrolls under the pinned rail. Values are placeholders.
// elevation: Deyan tunes on the bench
const RAIL_SCROLLED_SHADOW = '4px 0 6px -3px rgba(0, 0, 0, 0.18)';
const RAIL_DIVIDER_INSET = 6; // px top/bottom inset so the rule doesn't bleed to the cell's vertical edges

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
      {actions.map((a) => {
        const button = (
          <Button
            key={a.id}
            variant="outlined"
            size="small"
            color={a.destructive ? 'error' : 'primary'}
            aria-disabled={a.disabled || undefined}
            startIcon={a.icon}
            onClick={() => {
              if (!a.disabled) a.onSelect();
            }}
            sx={a.disabled ? { opacity: 0.5 } : undefined}
          >
            {a.label}
          </Button>
        );
        return a.disabled && a.disabledReason ? (
          <Tooltip key={a.id} title={a.disabledReason}>
            {button}
          </Tooltip>
        ) : (
          button
        );
      })}
    </Stack>
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
  renderExpanded,
  showExpandedActions = true,
  rowActions,
  onRowClick,
  LinkComponent,
  highlightRowId = null,
  onRowHover,
  emptyMessage = 'Nothing here yet.',
  'aria-label': ariaLabel,
}: BeamDataTableProps<Row>) {
  const theme = useTheme();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [globalFilter, setGlobalFilter] = useState('');

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

  const table = useReactTable({
    data: rows,
    columns: columnDefs,
    getRowId,
    initialState: { pagination: { pageSize: defaultPageSize } },
    state: { sorting, rowSelection, expanded, globalFilter },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onExpandedChange: setExpanded,
    onGlobalFilterChange: setGlobalFilter,
    enableRowSelection: selectable,
    getRowCanExpand: () => Boolean(renderExpanded),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    ...(paginated ? { getPaginationRowModel: getPaginationRowModel() } : {}),
  });

  const selectedIds = Object.keys(rowSelection);
  const selectedCount = selectedIds.length;
  const batchHintId = useId();
  const visibleRows = table.getRowModel().rows;

  // Rail scroll affordance — BASE path. The scroll-state container query is the
  // enhancement (Chrome, pure CSS); where it's unsupported (Safari/Firefox) this
  // passive, rAF-throttled listener toggles data-rail-scrolled on the scroller.
  // Feature-gated so supporting engines run zero JS (squircle/grid-lanes posture).
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const supportsScrollState =
      typeof CSS !== 'undefined' && CSS.supports?.('container-type', 'scroll-state');
    if (supportsScrollState) return; // enhancement handles it — no listener
    let raf = 0;
    const apply = () => {
      raf = 0;
      el.dataset.railScrolled = el.scrollLeft > 0 ? 'true' : 'false';
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    apply();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // One pinned rail column holds all row controls, in fixed order
  // [select][kebab][expand] — each rendered only if enabled (grammar §3):
  // selection anchors the rail's outer edge; the expand caret sits innermost,
  // nearest the row content it opens.
  const railEnabled = Boolean(renderExpanded) || selectable || Boolean(rowActions);
  const railCol = railEnabled ? 1 : 0;

  const railStickySx = {
    position: 'sticky' as const,
    left: 0,
    pl: 0.5,
    width: '1%',
    verticalAlign: 'top',
    backgroundColor: 'background.paper',
    // Scroll-affordance elevation (constant geometry — pigment/elevation only,
    // detail-grammar §1). At scrollLeft 0 both are gone; a rightward shadow +
    // an inset right-edge divider fade in while content scrolls under the rail.
    // Both transition on the quick motion token (reduced-motion zeros it →
    // instant). Header + body rail cells inherit this via the shared spread.
    transition: 'box-shadow var(--beam-motion-quick)',
    boxShadow: '0 0 0 0 rgba(0, 0, 0, 0)',
    '&::after': {
      content: '""',
      position: 'absolute',
      top: `${RAIL_DIVIDER_INSET}px`,
      bottom: `${RAIL_DIVIDER_INSET}px`,
      right: 0,
      width: '1px',
      backgroundColor: 'divider',
      opacity: 0,
      transition: 'opacity var(--beam-motion-quick)',
      pointerEvents: 'none',
    },
    // Enhancement (Chrome): scroll-state container query — pure CSS, no JS. True
    // when there is content hidden toward the inline-start (i.e. scrolled right).
    '@container scroll-state(scrollable: inline-start)': {
      boxShadow: RAIL_SCROLLED_SHADOW,
      '&::after': { opacity: 1 },
    },
    // Base (Safari/Firefox): the scroll listener sets data-rail-scrolled on the
    // scroll container where scroll-state queries aren't supported.
    '[data-rail-scrolled="true"] &': { boxShadow: RAIL_SCROLLED_SHADOW },
    '[data-rail-scrolled="true"] &::after': { opacity: 1 },
  };

  const paginationEl = paginated ? (
    <TablePagination
      component="div"
      count={table.getFilteredRowModel().rows.length}
      page={table.getState().pagination.pageIndex}
      onPageChange={(_, p) => table.setPageIndex(p)}
      rowsPerPage={table.getState().pagination.pageSize}
      onRowsPerPageChange={(e) => table.setPageSize(parseInt(e.target.value, 10))}
      rowsPerPageOptions={[...new Set([5, 10, 25, defaultPageSize])].sort((a, b) => a - b)}
    />
  ) : null;

  return (
    <>
      {/* Batch actions — a persistent, UNBOXED strip on the page background,
          sitting between the filter bar and the table (grammar §4; §1.3 exempt:
          plain actions, not a raised container). The table owns selection and
          renders this itself. Constant geometry, variable enablement: every
          action always renders, disabled at zero selection. Destructive actions
          confirm. // styling: pending design pass */}
      {bulkActions.length > 0 && (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', px: 0.5, minHeight: 40 }}>
          {bulkActions.map((a) => {
            const disabled = selectedCount === 0;
            return (
              <Button
                key={a.id}
                size="small"
                color={a.destructive ? 'error' : 'primary'}
                // aria-disabled (not `disabled`) keeps the button focusable and
                // announced, so a screen-reader user discovers the action and,
                // via the hint, learns why it's inert. The handler no-ops when
                // disabled; enablement is also conveyed visually (opacity).
                aria-disabled={disabled}
                aria-describedby={disabled ? batchHintId : undefined}
                onClick={() => {
                  if (disabled) return;
                  if (
                    a.destructive &&
                    typeof window !== 'undefined' &&
                    !window.confirm(`${a.label} ${selectedCount} selected item(s)?`)
                  ) {
                    return;
                  }
                  onBulkAction?.(a.id, selectedIds);
                  table.resetRowSelection();
                }}
                sx={{ opacity: disabled ? 0.5 : 1 }}
              >
                {a.label}
              </Button>
            );
          })}
          {/* Why the actions are disabled — referenced by each disabled button. */}
          <Box
            component="span"
            id={batchHintId}
            sx={{
              position: 'absolute',
              width: 1,
              height: 1,
              p: 0,
              m: -1,
              overflow: 'hidden',
              clip: 'rect(0 0 0 0)',
              whiteSpace: 'nowrap',
              border: 0,
            }}
          >
            Select one or more rows to enable batch actions.
          </Box>
        </Stack>
      )}

      <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
        {/* Internal search is only for lists with no page-level filter bar;
            when search lives in BeamFilterBar this toolbar renders nothing. */}
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

      {/* The scroll container also queries its own scroll state (enhancement).
          The cast: 'scroll-state' is newer than csstype's container-type union. */}
      <TableContainer ref={scrollRef} sx={{ containerType: 'scroll-state' as 'normal' }}>
        <Table size="small" aria-label={ariaLabel}>
          <TableHead>
            <TableRow>
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
              {columns.map((c, i) => {
                const col = table.getAllColumns()[i];
                const sortDir = col.getIsSorted();
                return (
                  <TableCell
                    key={c.key}
                    align={c.align}
                    sx={{ width: c.width }}
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
          <TableBody>
            {visibleRows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={columns.length + railCol}
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
                  }}
                >
                  {railEnabled && (
                    <TableCell
                      className="beam-rail"
                      // padding="checkbox"
                      onClick={(e) => e.stopPropagation()}
                      sx={{ ...railStickySx, zIndex: 2, whiteSpace: 'nowrap' }}
                    >
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
                  {columns.map((c) => (
                    // Numeric-cell treatment: right-alignment signals a numeric column in
                    // this estate, so tabular figures are applied there — columns line up
                    // digit-for-digit. Requires the body face to carry tabular-nums (Geist
                    // does; it's why it was chosen over a geometric face). BEAM Appendix B.
                    <TableCell
                      key={c.key}
                      align={c.align}
                      sx={c.align === 'right' ? { fontVariantNumeric: 'tabular-nums' } : undefined}
                    >
                      {renderCell(c, row.original, LinkComponent)}
                    </TableCell>
                  ))}
                </TableRow>
                {renderExpanded && (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length + railCol}
                      sx={{ py: 0, border: 0, ...(row.getIsExpanded() && { borderBottom: 1, borderColor: 'divider' }) }}
                    >
                      <Collapse in={row.getIsExpanded()} timeout="auto" unmountOnExit>
                        <Box sx={{ py: 2, px: 1 }}>
                          {renderExpanded(row.original)}
                          {/* Optional organism-appended action bar — when shown,
                              it uses the same `actions` as the kebab. */}
                          {showExpandedActions && actions.length > 0 && <RowActionBar actions={actions} />}
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

      {/* Footer: selection count on the left, pagination on the right (grammar
          §4). The count is always present when selectable — constant geometry,
          zero-state included — and aria-live so its changes are announced. The
          footer border-top is the styling pass. // styling: pending design pass */}
      {selectable ? (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body2" aria-live="polite" sx={{ pl: 2, color: 'text.secondary' }}>
            {selectedCount === 0 ? '' : `${selectedCount} selected`}
          </Typography>
          {paginationEl ?? <Box />}
        </Box>
      ) : (
        paginationEl
      )}
      </Paper>
    </>
  );
}
