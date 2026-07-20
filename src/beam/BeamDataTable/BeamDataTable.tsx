import { Fragment, useMemo, useState } from 'react';
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
import Collapse from '@mui/material/Collapse';
import Box from '@mui/material/Box';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import type { BeamDataTableProps } from './BeamDataTable.types';

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
  renderExpanded,
  highlightRowId = null,
  onRowHover,
  emptyMessage = 'Nothing here yet.',
  'aria-label': ariaLabel,
}: BeamDataTableProps<Row>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [globalFilter, setGlobalFilter] = useState('');

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
  const visibleRows = table.getRowModel().rows;
  const extraCols = (selectable ? 1 : 0) + (renderExpanded ? 1 : 0);

  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
      {(searchable || (selectable && selectedIds.length > 0)) && (
        <Toolbar
          variant="dense"
          sx={{
            gap: 2,
            justifyContent: 'space-between',
            ...(selectedIds.length > 0 && { bgcolor: 'action.selected' }),
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          {selectedIds.length > 0 ? (
            <>
              <Typography variant="body2" fontWeight={500}>
                {selectedIds.length} selected
              </Typography>
              <Stack direction="row" spacing={1}>
                {bulkActions.map((a) => (
                  <Button
                    key={a.id}
                    size="small"
                    color={a.destructive ? 'error' : 'primary'}
                    onClick={() => {
                      onBulkAction?.(a.id, selectedIds);
                      table.resetRowSelection();
                    }}
                  >
                    {a.label}
                  </Button>
                ))}
              </Stack>
            </>
          ) : (
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
          )}
        </Toolbar>
      )}

      <TableContainer>
        <Table size="small" aria-label={ariaLabel}>
          <TableHead>
            <TableRow>
              {renderExpanded && <TableCell padding="checkbox" />}
              {selectable && (
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={table.getIsAllRowsSelected()}
                    indeterminate={table.getIsSomeRowsSelected()}
                    onChange={table.getToggleAllRowsSelectedHandler()}
                    inputProps={{ 'aria-label': 'Select all rows' }}
                  />
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
                  colSpan={columns.length + extraCols}
                  align="center"
                  sx={{ py: 6, color: 'text.secondary' }}
                >
                  {globalFilter ? `No results for “${globalFilter}”.` : emptyMessage}
                </TableCell>
              </TableRow>
            )}
            {visibleRows.map((row) => (
              <Fragment key={row.id}>
                <TableRow
                  hover
                  selected={row.getIsSelected()}
                  onMouseEnter={onRowHover ? () => onRowHover(row.id) : undefined}
                  onMouseLeave={onRowHover ? () => onRowHover(null) : undefined}
                  sx={highlightRowId === row.id ? { bgcolor: 'action.hover' } : undefined}
                >
                  {renderExpanded && (
                    <TableCell padding="checkbox">
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
                    </TableCell>
                  )}
                  {selectable && (
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={row.getIsSelected()}
                        onChange={row.getToggleSelectedHandler()}
                        inputProps={{ 'aria-label': `Select row ${row.id}` }}
                      />
                    </TableCell>
                  )}
                  {columns.map((c) => (
                    <TableCell key={c.key} align={c.align}>
                      {c.render(row.original)}
                    </TableCell>
                  ))}
                </TableRow>
                {renderExpanded && (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length + extraCols}
                      sx={{ py: 0, border: 0, ...(row.getIsExpanded() && { borderBottom: 1, borderColor: 'divider' }) }}
                    >
                      <Collapse in={row.getIsExpanded()} timeout="auto" unmountOnExit>
                        <Box sx={{ py: 2, px: 1 }}>{renderExpanded(row.original)}</Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {paginated && (
        <TablePagination
          component="div"
          count={table.getFilteredRowModel().rows.length}
          page={table.getState().pagination.pageIndex}
          onPageChange={(_, p) => table.setPageIndex(p)}
          rowsPerPage={table.getState().pagination.pageSize}
          onRowsPerPageChange={(e) => table.setPageSize(parseInt(e.target.value, 10))}
          rowsPerPageOptions={[5, 10, 25]}
        />
      )}
    </Paper>
  );
}
