import type { ReactNode } from 'react';

/**
 * BeamRowMenu — the per-record overflow menu opened from the kebab in a
 * BeamDataTable row-controls rail (grammar doc §3).
 *
 * Rules the menu enforces so every list acts the same:
 *  - items are always LABELED (never icon-only)
 *  - destructive items are grouped last, behind an error-tinted divider
 *  - ineligible items are DISABLED with a tooltip reason — never hidden
 */

export interface BeamRowMenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  /** Renders in the error group at the bottom, in error color. */
  destructive?: boolean;
  disabled?: boolean;
  /** Shown as a tooltip when disabled — say why it can't apply. */
  disabledReason?: string;
}

export interface BeamRowMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  items: BeamRowMenuItem[];
  'aria-label'?: string;
}
