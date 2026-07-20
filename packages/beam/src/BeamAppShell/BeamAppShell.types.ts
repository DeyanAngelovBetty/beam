import type { ReactNode } from 'react';
import type { BrandName, ProductName } from '../theme/tokens';

/**
 * BeamAppShell — the back-office frame: fixed AppBar, permanent/temporary
 * Drawer, jurisdiction switcher, mode toggle.
 *
 * Promoted from Sunlight when Gaspar became the second consumer, exactly as
 * BEAM.md §2's promotion path prescribes — not predicted in advance.
 * Everything that varied between the two products became a prop; everything
 * that didn't stayed inside.
 */

export interface BeamNavItem {
  label: string;
  icon?: ReactNode;
  /** Renders a collapsible sub-list */
  children?: BeamNavItem[];
  /** Marks the current destination (demo shells have no router) */
  selected?: boolean;
  /** Sub-list starts expanded */
  defaultOpen?: boolean;
}

export interface BeamAppShellProps {
  /** Wordmark in the drawer header, e.g. "SUNLIGHT" */
  title: string;
  /**
   * Which product's token set is mounted. The shell uses it to offer the
   * jurisdictions that product actually defines, so a new market added in
   * Figma appears in the switcher without a code change.
   */
  product: ProductName;
  navItems: BeamNavItem[];
  /**
   * Jurisdiction is RUNTIME state in a back office — operators manage
   * several from one seat (BEAM.md §5).
   */
  brand: BrandName;
  onBrandChange: (brand: BrandName) => void;
  children: ReactNode;
}
