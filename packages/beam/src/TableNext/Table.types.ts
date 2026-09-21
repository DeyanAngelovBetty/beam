import type { CSSProperties, ReactNode } from 'react';
import type { PaperProps } from '@mui/material/Paper';
import type { RowData, TableOptions, ColumnDef } from '@tanstack/react-table';
import type { BeamBadgeHue } from '../BeamBadge/BeamBadge.types';
// LANE types reused from the current organism until 2f (when the old Table is deleted and these move
// here). They ride the raw-ColumnDef model unchanged.
import type {
  BeamBulkAction,
  BeamActionOption,
  BeamColumnManagerConfig,
  BeamCatalogColumn,
} from '../Table/Table.types';

export type { ColumnDef };
export type { BeamBulkAction, BeamActionOption, BeamColumnManagerConfig, BeamCatalogColumn };

/**
 * ActionMenuItem — PORTED from official Beam (`ActionMenu/ActionMenu.types.ts`). A single row-action.
 * FLAT ONLY (no nested submenu — a Wave-2 boundary: our old `BeamRowAction`'s `options` submenu has no
 * official shape; consumers flatten it, per the proposal §2.1/§6c).
 */
export type ActionMenuItem = {
  id: string;
  label: string;
  /** Tooltip shown when the item is enabled. */
  tooltip?: string;
  icon?: ReactNode;
  /** Groups the item below a divider and tints it with the error color. */
  destructive?: boolean;
  disabled?: boolean;
  /** Tooltip shown when the item is disabled (explain why). */
  disabledTooltip?: string;
  onSelect: () => void;
};

/**
 * TableActionRail — PORTED verbatim from official (`Table/Table.types.ts`). Per-row controls in the
 * leading (pinned-first) action-rail column.
 */
export type TableActionRail<TData> = {
  /** Returns the content revealed when a row is expanded; enables the expand toggle. */
  expand?: (row: TData) => ReactNode;
  /** Enables row/all selection with the given handlers. */
  select?: {
    onSelect: (row: TData, selected: boolean) => unknown;
    onSelectAll: (selected: boolean) => unknown;
  };
  /** Returns the {@link ActionMenuItem}s for a row's overflow menu. */
  menu?: (row: TData) => ActionMenuItem[];
};

/** Controlled pagination — PORTED verbatim from official. `page` is 1-based. */
export type TablePaginationState = {
  /** Page index, starting from 1. */
  page: number;
  pageSize: number;
};
export type TablePaginationController = TablePaginationState & {
  onChange: (pagination: TablePaginationState) => unknown;
};

/**
 * The identity link renders through this component (moved off `Table` into `beamCells.link`). Default: a
 * real MUI `<a href>`; apps with a router pass an adapter that keeps the href but intercepts left-click.
 */
export interface BeamIdentityLinkProps {
  href: string;
  onClick?: React.MouseEventHandler;
  children: ReactNode;
}

/**
 * TableProps — official Beam's `Table` API, VERBATIM (Wave 2). Rendered with ONLY the official-subset
 * props it is identical to official's Table under Beam's theme (the "official-subset-identical" rule).
 * Everything after `actionRail` is an ADDITIVE LANE EXTENSION — inert when its prop is absent.
 */
export type TableProps<TData extends RowData> = Pick<TableOptions<TData>, 'data' | 'columns'> & {
  /** Stable row identity — required for selection, expansion, and keys. */
  getRowId: NonNullable<TableOptions<TData>['getRowId']>;
  stickyHeader?: boolean;
  onRowClick?: (row: TData) => unknown;
  onRowHover?: (row: TData) => unknown;
  onRowLeave?: (row: TData) => unknown;
  /** Internal-scroll height (official). Mutually exclusive with the `stickyChrome` lane — see below. */
  maxHeight?: CSSProperties['height'];
  /** Message shown when `data` is empty. */
  emptyMessage?: string;
  loading?: boolean;
  elevation?: PaperProps['elevation'];
  variant?: PaperProps['variant'];
  /** Optional per-row expand / select / menu controls (the leading action-rail column). */
  actionRail?: TableActionRail<TData>;

  // ── LANE EXTENSIONS (additive; absent ⇒ official behavior) ───────────────────────────────────────
  /**
   * PAGE-OWNS-SCROLL pinning (the stickyChrome lane): the header bucket pins to the scrollport top, the
   * footer to the bottom; the page owns the scroll (no internal scroll region). EITHER/OR with
   * `maxHeight` — passing both dev-warns and `stickyChrome` wins (BEAM.md §6). DOM contracts:
   * `data-beam-sticky-chrome`, `data-stuck`, `data-overflow-start/end`.
   */
  stickyChrome?: boolean;
  /** Opt-in column show/hide + reorder + persistence (+ "awaiting data" catalog). */
  columnManager?: BeamColumnManagerConfig;
  /** Batch actions (array, or a `(selectedRows) => …` factory). Renders the bulk strip; drives selection. */
  bulkActions?: BeamBulkAction[] | ((selectedRows: TData[]) => BeamBulkAction[]);
  onBulkAction?: (actionId: string, selectedIds: string[], optionId?: string) => void;
  /**
   * SORTABLE columns (lane) — OFF by default so official-subset props render NO sort affordance (official
   * Table has no sorting; sortable-by-default would break subset-identical in the UI). When `true`, accessor
   * columns become sortable (clickable `TableSortLabel` headers); a column opts OUT via its
   * `meta.sortable === false`. Upstream-pitch note: official Table has no sorting at all.
   */
  sortable?: boolean;
  /** Built-in global search field above the grid (searches accessor values). */
  searchable?: boolean;
  /** "Page N of M" jump control in the footer. */
  jumpToPage?: boolean;
  /** Per-row severity accent bar in the rail region (decorative; requires the rail). */
  rowAccent?: (row: TData) => BeamBadgeHue | undefined;
  /** Externally highlight a row (relational navigation — the DashboardBench cross-widget link). */
  highlightRowId?: string | null;
  /** Additive-optional (NOT required — requiring it would break subset-identical construction). */
  'aria-label'?: string;
} & (
    | { pagination?: undefined; totalCount?: never; paginationDisabled?: never }
    | { pagination: TablePaginationController; totalCount: number; paginationDisabled?: boolean }
  );
