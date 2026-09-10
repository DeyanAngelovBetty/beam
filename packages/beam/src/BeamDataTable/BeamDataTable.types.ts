import type { ComponentType, MouseEventHandler, ReactNode } from 'react';
import type { BeamRowAction } from '../BeamRowMenu/BeamRowMenu.types';
import type { BeamBadgeHue } from '../BeamBadge/BeamBadge.types';

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
  /**
   * Ships in the defs but starts hidden — a catalog column that exists but is
   * off by default until a user opts it in via the column manager. Inert unless
   * `columnManager` is enabled (with no manager there is no way to reveal it).
   */
  defaultHidden?: boolean;
}

/**
 * A non-rendered "awaiting data" ledger row for the column manager (bullet-3
 * spec, option b): a column the product knows about but has no data source for
 * yet. It appears in the manager popover disabled + annotated, and NEVER renders
 * as a real table column or participates in order/visibility persistence.
 */
export interface BeamCatalogColumn {
  id: string;
  label: string;
}

/**
 * Opt-in column manager: show/hide + reorder + persistence, all internal to the
 * organism. Absent ⇒ today's behavior, byte-identical. `storageKey` is required
 * (persistence without a stable identity is a bug factory).
 */
export interface BeamColumnManagerConfig {
  storageKey: string;
  /** Disabled "awaiting data" rows shown in the manager only (option b). */
  catalog?: BeamCatalogColumn[];
}

export interface BeamBulkAction {
  id: string;
  label: string;
  /** Error-tinted; also auto-confirms (see `confirm`). Grouped by convention last. */
  destructive?: boolean;
  /**
   * Page-computed eligibility. Disabled when the current selection can't take this action (on top of
   * the always-on zero-selection disable). Mirrors BeamRowAction — the bulk surface follows the same
   * "disable with a reason, never silently hide" doctrine the row kebab already does.
   */
  disabled?: boolean;
  /** Shown as a tooltip when `disabled` — say why the action can't apply to the selection. */
  disabledReason?: string;
  /** Confirm before firing even when not destructive (destructive already confirms). */
  confirm?: boolean;
  /**
   * Menu options. Present ⇒ the button opens a menu instead of firing directly; selecting fires
   * `onBulkAction(actionId, selectedIds, optionId)`. Options-actions skip the button-level confirm
   * (fine for export; a destructive menu option would want per-option confirm — a future addition).
   */
  options?: BeamActionOption[];
}

/** One entry of a bulk menu action (e.g. an export format). The organism owns the selection, so the
 *  handler is centralized in `onBulkAction`, keyed by `optionId`. */
export interface BeamActionOption {
  id: string;
  label: string;
}

export interface BeamDataTableProps<Row> {
  columns: BeamColumn<Row>[];
  rows: Row[];
  getRowId: (row: Row) => string;
  /** Checkboxes + bulk toolbar */
  selectable?: boolean;
  /**
   * Batch actions. An array, or a FACTORY resolved with the currently-selected rows — mirrors
   * `rowActions: (row) => …` so bulk actions can compute `disabled`/`disabledReason` against the
   * selection (the organism stays the single owner of selection state). Back-compat: an array works.
   */
  bulkActions?: BeamBulkAction[] | ((selectedRows: Row[]) => BeamBulkAction[]);
  onBulkAction?: (actionId: string, selectedIds: string[], optionId?: string) => void;
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
   * this one definition — NO opt-out: the rail kebab, AND (when the row expands)
   * the expanded bar below `renderExpanded`, left-aligned. One source of truth,
   * two projections. Return the actions for a given row; omit an action to hide
   * it. State-dependent actions (Enable ↔ Disable) return the right one from the
   * closure. (list-page-grammar §3 — the `showExpandedActions` opt-out that drifted
   * these apart was removed 2026-08-13.)
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
  /**
   * Opt-in column show/hide + reorder + persistence (bullet-3). Omit for today's
   * behavior — the capability is invisible until a grid asks for it.
   */
  columnManager?: BeamColumnManagerConfig;
  /**
   * Per-row SEVERITY ACCENT — a thin colored bar in the rail region, redundant reinforcement of the
   * row's status chip (the chip names, the accent locates; color is additive, never the sole carrier —
   * state-rendering-grammar spatial-accents note). Return a grammar hue for accented rows, `undefined`
   * for the rest. Requires the rail (v1 — rail-less fallback is a future decision). Decorative /
   * aria-hidden. Omit for byte-identical behavior.
   */
  rowAccent?: (row: Row) => BeamBadgeHue | undefined;
  'aria-label': string;
}
