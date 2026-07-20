import type { ReactNode } from 'react';

/**
 * BeamFilterBar — the list-screen filter surface: optional quick-range
 * presets, a responsive field area, and the search/clear actions.
 *
 * ⚠️ PLACEHOLDER (2026-07-20), and the thinnest of the four on purpose.
 * Fields are passed as children rather than declared as a schema, because
 * a field-schema API is a real design decision that deserves the Figma
 * pass rather than being improvised here. What this locks in is only the
 * *arrangement* — presets above, fields in a wrapping grid, actions last —
 * which is the part every list screen already agrees on.
 */

export interface BeamFilterPreset {
  id: string;
  label: string;
}

export interface BeamFilterBarProps {
  /** Filter controls. App-supplied until the schema API is designed. */
  children: ReactNode;
  /** Quick ranges, e.g. Today / Last 7 days. Omit for no preset row. */
  presets?: BeamFilterPreset[];
  activePreset?: string | null;
  onPresetChange?: (id: string | null) => void;
  onSearch?: () => void;
  onClear?: () => void;
  'aria-label': string;
}
