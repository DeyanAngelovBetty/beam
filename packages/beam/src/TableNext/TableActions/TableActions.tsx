import Box from '@mui/material/Box';
import type { CellContext, Table } from '@tanstack/react-table';
import { useCallback, type MouseEvent } from 'react';
import type { ActionMenuItem, TableActionRail } from '../Table.types';
import TableExpand from './TableExpand';
import TableSelect from './TableSelect';
import TableMenu from './TableMenu';

/**
 * TableActions — PORTED from official Beam (`Table/TableActions`). The per-row content of the leading
 * action-rail column: select checkbox · overflow menu · expand caret (in official's order).
 */
export const TableActions = <TData,>({
  row,
  expand,
  select,
  menuItems,
}: {
  row: CellContext<TData, unknown>['row'];
  expand: boolean;
  select: TableActionRail<TData>['select'];
  menuItems: ActionMenuItem[] | undefined;
}) => {
  const isExpanded = row.getIsExpanded();
  const isSelected = row.getIsSelected();

  const handleExpand = useCallback(
    (e: MouseEvent<Element>) => {
      e.stopPropagation();
      row.toggleExpanded();
    },
    [row],
  );

  const handleSelect = useCallback(
    (e: MouseEvent<Element>) => {
      e.stopPropagation();
      const next = !isSelected;
      row.toggleSelected(next);
      select?.onSelect(row.original, next);
    },
    [isSelected, row, select],
  );

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
      {select && <TableSelect isSelected={isSelected} onClick={handleSelect} />}
      {menuItems && <TableMenu menuItems={menuItems} />}
      {expand && <TableExpand isExpanded={isExpanded} onClick={handleExpand} />}
    </Box>
  );
};

/** PORTED from official `Table/TableActions/TableHeaderActions` — the header rail cell (select-all + expand-all). */
export const TableHeaderActions = <TData,>({
  expand,
  select,
  table,
}: {
  expand: boolean;
  select: TableActionRail<TData>['select'];
  table: Table<TData>;
}) => {
  const areAllExpanded = table.getIsAllRowsExpanded();
  const areSomeExpanded = table.getIsSomeRowsExpanded();
  const areAllSelected = table.getIsAllRowsSelected();
  const areSomeSelected = table.getIsSomeRowsSelected();

  const handleExpand = useCallback(() => {
    if (areSomeExpanded && !areAllExpanded) {
      table.toggleAllRowsExpanded(true);
      return;
    }
    table.toggleAllRowsExpanded(!areAllExpanded);
  }, [areAllExpanded, areSomeExpanded, table]);

  const handleSelect = useCallback(() => {
    const next = !areAllSelected;
    table.toggleAllRowsSelected(next);
    select?.onSelectAll(next);
  }, [areAllSelected, select, table]);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      {select && <TableSelect isSelected={areAllSelected} onClick={handleSelect} indeterminate={areSomeSelected} />}
      {expand && <TableExpand isExpanded={areAllExpanded} onClick={handleExpand} />}
    </Box>
  );
};
