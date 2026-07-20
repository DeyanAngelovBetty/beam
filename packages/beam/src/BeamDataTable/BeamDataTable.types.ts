import type { ReactNode } from 'react';

/**
 * BeamDataTable — the dense operational table.
 *
 * v2: headless engine is TanStack Table; Beam owns 100% of the rendered
 * surface (MUI atoms + tokens). Features map to the Yoda audit:
 *  - bulk selection (audit §3.12: "no bulk selection anywhere")
 *  - pagination (audit §3.12: 5,700–22,000px unpaginated pages)
 *  - sorting + search (audit §2.7 done as table capability, not per-page)
 *  - row expansion (audit §2.4: progressive disclosure — the keeper pattern)
 */

export interface BeamColumn<Row> {
  key: string;
  header: string;
  /** Cell renderer — Beam owns all markup. */
  render: (row: Row) => ReactNode;
  /**
   * Raw value accessor. Providing it makes the column sortable and
   * includes it in global search. Omit for purely visual columns.
   */
  getValue?: (row: Row) => string | number;
  align?: 'left' | 'right' | 'center';
  width?: number | string;
}

export interface BeamBulkAction {
  id: string;
  label: string;
  destructive?: boolean;
}

export interface BeamDataTableProps<Row> {
  columns: BeamColumn<Row>[];
  rows: Row[];
  getRowId: (row: Row) => string;
  /** Checkboxes + bulk toolbar */
  selectable?: boolean;
  bulkActions?: BeamBulkAction[];
  onBulkAction?: (actionId: string, selectedIds: string[]) => void;
  /** Global search field above the table (searches columns with getValue) */
  searchable?: boolean;
  /** Built-in pagination footer */
  paginated?: boolean;
  /** Enables per-row expansion — progressive disclosure (Yoda §2.4) */
  renderExpanded?: (row: Row) => ReactNode;
  /** Externally highlight a row (relational navigation — audit §3.9) */
  highlightRowId?: string | null;
  /** Report row hover for cross-widget linking */
  onRowHover?: (rowId: string | null) => void;
  emptyMessage?: string;
  'aria-label': string;
}
