import type { ComponentType, MouseEventHandler, ReactNode } from 'react';
import type { BeamRowAction } from '../BeamRowMenu/BeamRowMenu.types';

/**
 * The identity link renders through this component. Default: a real MUI
 * `<a href>` (middle-click / new-tab / copy-address). Apps with a router pass
 * an adapter that keeps the real href but intercepts a plain left-click for
 * smooth SPA navigation.
 */
export interface BeamIdentityLinkProps {
  href: string;
  onClick?: MouseEventHandler;
  children: ReactNode;
}

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
  /**
   * Marks this as the record's identity cell. Combined with getHref it
   * renders as a true link to the canonical record page — real <a>
   * semantics (middle-click, new-tab, copy-address). Grammar §2.
   */
  isIdentity?: boolean;
  /** Canonical route for the identity link. Required for the link to render. */
  getHref?: (row: Row) => string;
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
  /** Initial rows per page (paginated only). Default 10; added to the options. */
  defaultPageSize?: number;
  /** Enables per-row expansion — progressive disclosure (Yoda §2.4) */
  renderExpanded?: (row: Row) => ReactNode;
  /**
   * A row's actions, defined ONCE as data (grammar §3). Every surface projects
   * this one definition: the rail kebab, and — when the row is expanded — an
   * action bar the organism appends below `renderExpanded` (no opt-out; the
   * guarantee that surfaces can't drift is the feature). Return the actions for
   * a given row; omit an action to hide it. State-dependent actions (Enable ↔
   * Disable) are expressed by returning the right one from the closure.
   */
  rowActions?: (row: Row) => BeamRowAction[];
  /**
   * Row click means "inspect this record" (grammar §2). Fires for clicks
   * anywhere except the rail and the identity link. Sets a pointer cursor.
   */
  onRowClick?: (row: Row) => void;
  /** Overrides how the identity link renders (e.g. a router-aware anchor). */
  LinkComponent?: ComponentType<BeamIdentityLinkProps>;
  /** Externally highlight a row (relational navigation — audit §3.9) */
  highlightRowId?: string | null;
  /** Report row hover for cross-widget linking */
  onRowHover?: (rowId: string | null) => void;
  emptyMessage?: string;
  'aria-label': string;
}
