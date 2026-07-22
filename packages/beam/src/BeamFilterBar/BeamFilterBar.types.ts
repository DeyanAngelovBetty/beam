import type { ReactNode } from 'react';

/**
 * BeamFilterBar — the list-screen filter surface (grammar doc §1).
 *
 * v1: a built-in search field, per-page promoted filters passed as children
 * (composition — a field-schema API is a later design decision), optional
 * date-range presets, and the Filter / Clear-all actions. The bar is
 * presentational: the page owns filter state and decides live-vs-submitted;
 * the bar just fires the callbacks and reflects `applied`.
 *
 * Deliberately NOT in v1 (grammar §1 is the north star, not this pass):
 * applied-filter chips, URL state, saved views, in-bar result count (the
 * count lives in the datagrid's pagination footer).
 */

export interface BeamFilterPreset {
  id: string;
  label: string;
}

export interface BeamFilterBarProps {
  /** Promoted filter fields. App-supplied until a field-schema API is designed. */
  children: ReactNode;

  /** Built-in search field. Renders only when onSearchChange is provided. */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;

  /** Quick date ranges, e.g. Today / Last 7 days. Omit for no preset row. */
  presets?: BeamFilterPreset[];
  activePreset?: string | null;
  onPresetChange?: (id: string | null) => void;

  /** Primary CTA, labeled "Filter". */
  onFilter?: () => void;
  /** "Clear all" text button, beside Filter. */
  onClearAll?: () => void;
  /**
   * Whether any filter is currently active. Drives the applied-state visuals:
   * a visible border on the bar and a filled Filter CTA. App-computed.
   */
  applied?: boolean;

  'aria-label': string;
}
