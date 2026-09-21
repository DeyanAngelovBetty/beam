import { useState } from 'react';
import { DEFAULT_TABLE_PAGE_SIZE } from './Table.constants';
import type { TablePaginationController, TablePaginationState } from './Table.types';

/**
 * useClientPagination — the demo-data adapter for the Wave-2 Table (which is server-shaped: it renders the
 * page it's given and never slices). Give it the FULL (post-filter) array; it returns `{ pageRows,
 * totalCount, pagination }` to spread onto the Table. Either bring your own 1-based controller (e.g.
 * `useTableFilters().pagination`, the URL source of truth — this removes the Wave-1 0-based↔1-based seam)
 * or let it own internal state.
 */
export function useClientPagination<T>(
  rows: T[],
  options?: { controller?: TablePaginationController; defaultPageSize?: number },
): { pageRows: T[]; totalCount: number; pagination: TablePaginationController } {
  const [internal, setInternal] = useState<TablePaginationState>({ page: 1, pageSize: options?.defaultPageSize ?? DEFAULT_TABLE_PAGE_SIZE });
  const pagination: TablePaginationController = options?.controller ?? { ...internal, onChange: (p) => setInternal(p) };
  const totalCount = rows.length;
  const start = (pagination.page - 1) * pagination.pageSize;
  const pageRows = rows.slice(start, start + pagination.pageSize);
  return { pageRows, totalCount, pagination };
}
