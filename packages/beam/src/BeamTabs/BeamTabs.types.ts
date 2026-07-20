import type { ReactElement } from 'react';

/**
 * BeamTabs — the page's section switcher, with optional one-level nesting.
 *
 * Nesting exists as a CAPABILITY, not a default: two levels of tab
 * navigation compete with the drawer for "where am I", so Sunlight and
 * Gaspar deliberately use one level. Midnight's Payments tab genuinely has
 * two, which is why the capability exists at all.
 *
 * ⚠️ PLACEHOLDER (2026-07-20) pending the Figma pass.
 */

export interface BeamTabItem {
  id: string;
  label: string;
  /** Narrower than ReactNode because MUI's Tab.icon is. */
  icon?: ReactElement;
  /** One level of sub-tabs; deeper nesting is deliberately not supported. */
  children?: Omit<BeamTabItem, 'children'>[];
}

export interface BeamTabsProps {
  items: BeamTabItem[];
  value: string;
  onChange: (id: string) => void;
  /** Required only when the active item has children. */
  subValue?: string;
  onSubChange?: (id: string) => void;
  'aria-label': string;
}
