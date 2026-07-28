import type { ReactNode } from 'react';
import type { ResponsiveStyleValue } from '@mui/system';

/**
 * BeamAppShell v2 — the frame every Beam product wears (shell-grammar.md).
 * Two persistent states, locked | closed; peek is closed's hover answer, not a
 * mode. No persistent app bar — the page owns its top edge (grammar §5).
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
  /** Makes a leaf navigable. Groups (with children) stay collapsible. */
  onClick?: () => void;
  /**
   * Renders as a divider + non-clickable subheader label; `children` become
   * flat, non-collapsible leaves beneath it. The "Administration" pattern.
   */
  section?: boolean;
}

/**
 * The product's logo, in the two surface-dependent variants the shell places
 * (grammar §3). Supplied by the consuming app — the shell never owns logos.
 */
export interface BeamBrandMark {
  /** Full-color mark for content-adjacent chrome: the strip and locked header. */
  color: ReactNode;
  /** Mono mark at heavy subdual — the peek's destination watermark (ghost). */
  ghost: ReactNode;
}

export interface BeamAppShellProps {
  navItems: BeamNavItem[];
  children: ReactNode;

  /** Logos (grammar §3). Falls back to the `title` wordmark when omitted. */
  brandMark?: BeamBrandMark;

  // ---- State model (grammar §1) — controlled OR uncontrolled ----
  /** Controlled lock state. When set, the parent owns it (no persistence). */
  locked?: boolean;
  /** Uncontrolled initial lock. Default: closed (false) — the novelty is the point. */
  defaultLocked?: boolean;
  onLockedChange?: (locked: boolean) => void;
  /**
   * localStorage key for the lock preference (uncontrolled only; `false`
   * disables persistence). Scope it per deployment — localStorage is
   * per-origin, and on Pages all products share one origin.
   */
  persistKey?: string | false;

  /**
   * App chrome slot — the sidebar footer zone (grammar §5). The old app bar's
   * jurisdiction switcher + mode toggle live here now, app-owned.
   */
  footer?: ReactNode;

  /**
   * Hover-intent timing (ms). Default to the tuned constants in the component;
   * overridable so the bench can dial them via controls before a value is
   * committed to the constant.
   */
  peekOpenDelayMs?: number;
  peekCloseGraceMs?: number;

  /**
   * Horizontal breathing room between content and the shell's edges — the
   * gutter (grammar §5). Responsive by doctrine: tighter on small screens,
   * opening at `md` where the drawer becomes an in-flow sidebar and content
   * gains a persistent neighbour. Horizontal only; vertical rhythm is the
   * page's (BeamPageHeader). MUI spacing units or any CSS length. Steps are
   * bench-tunable — see the component default.
   */
  contentGutter?: ResponsiveStyleValue<number | string>;

  /** Wordmark fallback when no brandMark is supplied. */
  title?: string;
}
