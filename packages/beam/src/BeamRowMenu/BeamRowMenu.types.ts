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
/** One entry of a menu action's submenu — carries its own handler (the row is closure-captured). */
export interface BeamRowActionOption {
  id: string;
  label: string;
  onSelect: () => void;
}

interface BeamRowActionBase {
  id: string;
  label: string;
  icon?: ReactNode;
  /** Error-tinted; grouped last (menu) / error color (bar). */
  destructive?: boolean;
  disabled?: boolean;
  /** Shown as a tooltip when disabled — say why it can't apply. */
  disabledReason?: string;
}

/**
 * BeamRowAction — a row's action, defined ONCE per datagrid as data (BeamDataTable `rowActions`). Every
 * surface projects this one definition, so surfaces cannot drift (list-grammar §3).
 *
 * A DISCRIMINATED UNION (grammar as types, the BeamBadge lesson): an action is EITHER **flat**
 * (`onSelect`, no `options`) or a **menu** (`options`, no `onSelect`) — an action with neither, or with
 * both, is unrepresentable. Rules every surface enforces: always LABELED; destructive reads error-tinted
 * (grouped last); ineligible is DISABLED with a reason (never silently hidden).
 */
export type BeamRowAction =
  | (BeamRowActionBase & { onSelect: () => void; options?: never })
  | (BeamRowActionBase & { options: BeamRowActionOption[]; onSelect?: never });

export interface BeamRowMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  items: BeamRowAction[];
  'aria-label'?: string;
}
