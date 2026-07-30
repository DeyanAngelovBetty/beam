import type { ReactNode } from 'react';

/**
 * BeamRowAction — a row's action, defined ONCE per datagrid as data
 * (BeamDataTable `rowActions`). Every surface that manifests it — the rail
 * kebab, the expanded-row action bar, any future surface — projects this one
 * definition, so surfaces cannot drift (list-grammar §3).
 *
 * Rules every surface enforces so lists act the same:
 *  - actions are always LABELED (never icon-only)
 *  - destructive actions read as error-tinted (grouped last in the menu)
 *  - ineligible actions are DISABLED with a reason — never silently hidden
 *    (to hide an action, don't return it from `rowActions`)
 */
export interface BeamRowAction {
  id: string;
  label: string;
  icon?: ReactNode;
  /** The row is already captured by the `(row) => …` closure, so no arg. */
  onSelect: () => void;
  /** Error-tinted; grouped last (menu) / error color (bar). */
  destructive?: boolean;
  disabled?: boolean;
  /** Shown as a tooltip when disabled — say why it can't apply. */
  disabledReason?: string;
}

export interface BeamRowMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  items: BeamRowAction[];
  'aria-label'?: string;
}
