import { type Theme } from '@mui/material/styles';
import type { SxProps } from '@mui/material/styles';
import type { CSSProperties } from 'react';

// ROW-STATE WASHES — CSS VARS, mode-aware. IDENTICAL expressions to createBeamTheme's `MuiTable` rail
// wash (2b/9), so a hovered/selected row's rail cell and its data cells resolve to ONE surface — same
// colour, no seam — in every mode.
//
// ⚠️ DIVERGENCE FROM OFFICIAL (deliberate; upstream-pitch candidate — see docs/beam-alignment.md §4).
// This EDITS the ported `body` below, it is NOT a marked LANE addition: official's `body` paints these
// washes from theme LITERALS (`theme.palette.action.hover`, `alpha(theme.palette.primary.main, …)`) —
// resolved ONCE from the default scheme. That is latently broken under MUI `cssVariables` + any NON-default
// colour scheme: the literal bakes the default (light) values and can't track `data-beam-mode`. REGRESSION
// (2026-09-23): on Gaspar (defaultMode="dark") the light literal went invisible on the dark surface while
// the var-based rail lit — the row split in two. Pitch to upstream: read `theme.vars` here.
//
// `action.hover` (neutral) for hover; `primary @ selectedOpacity` for selected (MUI's own selected-row
// colour, so the rest-state data cells — painted by MUI's built-in `.Mui-selected` — match exactly);
// their sum for selected+hover. The organism Table needs no equivalent: its rows carry MUI's `hover`/
// `selected` props, so MUI already paints them from `theme.vars` (mode-aware) — it was never broken.
const ROW_WASH_HOVER = 'var(--mui-palette-action-hover)';
const ROW_WASH_SELECTED = 'rgba(var(--mui-palette-primary-mainChannel) / var(--mui-palette-action-selectedOpacity))';
const ROW_WASH_SELECTED_HOVER =
  'rgba(var(--mui-palette-primary-mainChannel) / calc(var(--mui-palette-action-selectedOpacity) + var(--mui-palette-action-hoverOpacity)))';

// PORTED from official Beam (beam-alex @ b40e815) `Table/Table.styles.ts`, adapting official-theme
// helpers (`t.vars.overlays`, `theme.alpha`) to MUI's `alpha` + palette. All of the Table's sx lives
// here (official has no inline sx). Lane additions (the rowAccent palette) are marked LANE.

export const tableWrapper = (elevation?: number): SxProps<Theme> => ({
  overflow: 'hidden',
  position: 'relative',
  boxShadow: 0,
  '& .MuiTableCell-head': {
    backgroundColor: 'background.paper',
    // official reads t.vars.overlays[elevation]; optional-chained so it degrades cleanly under our theme.
    backgroundImage: (t: Theme) => (t as unknown as { vars?: { overlays?: Record<number, string> } }).vars?.overlays?.[elevation ?? 1],
  },
});

export const tableContainer = (maxHeight: CSSProperties['height']): SxProps<Theme> => ({
  maxHeight,
  overflowY: 'auto',
  '&.table-scrolledX .table-actionRailCell::after': { opacity: 1 },
});

export const actionRailCell: SxProps<Theme> = {
  position: 'sticky',
  left: 0,
  zIndex: 2,
  width: '1%',
  whiteSpace: 'nowrap',
  px: 1,
  backgroundColor: 'background.paper',
  transition: 'background-color 0.15s ease',
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: 0,
    zIndex: 0,
    pointerEvents: 'none',
    backgroundColor: 'background.paper',
    transition: 'background-color 0.15s ease',
    '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 6,
    right: 0,
    bottom: 6,
    width: '1px',
    zIndex: 2,
    pointerEvents: 'none',
    backgroundColor: 'divider',
    boxShadow: '4px 0 6px -2px color-mix(in oklch, var(--mui-palette-text-primary) 22%, transparent)',
    opacity: 0,
    transition: 'opacity 0.15s ease',
    '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
  },
  '& > *': { position: 'relative', zIndex: 1 },
};

export const actionRailHeader: SxProps<Theme> = { ...(actionRailCell as object), zIndex: 3 };

export const body: SxProps<Theme> = {
  '& > .table-dataRow:hover, & > .table-dataRow:has(+ .table-detailsRow:hover), & > .table-dataRow:hover + .table-detailsRow, & > .table-detailsRow:hover':
    { backgroundColor: ROW_WASH_HOVER },
  '& > .table-dataRow.Mui-selected:hover, & > .table-dataRow.Mui-selected:has(+ .table-detailsRow:hover), & > .table-dataRow.Mui-selected:hover + .table-detailsRow.Mui-selected, & > .table-detailsRow.Mui-selected:hover':
    { backgroundColor: ROW_WASH_SELECTED_HOVER },
  '& > .table-dataRow.Mui-selected > .table-actionRailCell::before': { backgroundColor: ROW_WASH_SELECTED },
  '& > .table-dataRow:hover > .table-actionRailCell::before, & > .table-dataRow:has(+ .table-detailsRow:hover) > .table-actionRailCell::before':
    { backgroundColor: ROW_WASH_HOVER },
  '& > .table-dataRow.Mui-selected:hover > .table-actionRailCell::before, & > .table-dataRow.Mui-selected:has(+ .table-detailsRow:hover) > .table-actionRailCell::before':
    { backgroundColor: ROW_WASH_SELECTED_HOVER },
};

export const emptyTable: SxProps<Theme> = { py: 6, color: 'text.secondary' };
export const pagination: SxProps<Theme> = { borderBottom: 0 };
export const dataRow = (onRowClick: boolean): SxProps<Theme> => ({ cursor: onRowClick ? 'pointer' : 'default' });
export const expandCell = (isExpanded: boolean): SxProps<Theme> => ({
  p: 0,
  border: 0,
  borderBottom: 1,
  borderColor: isExpanded ? 'divider' : 'transparent',
});
export const expandWrapper: SxProps<Theme> = { p: 2, display: 'flex', flexDirection: 'column', gap: 2 };
export const expandActionsWrapper: SxProps<Theme> = { display: 'flex', gap: 1, alignItems: 'center' };

// ── LANE ─────────────────────────────────────────────────────────────────────────────────────────
// rowAccent: grammar hue → semantic palette key (theme picks the hex). ACCENT_WIDTH px bar in the rail.
export const ACCENT_PALETTE: Record<string, string> = { danger: 'error', warning: 'warning', success: 'success', 'in-progress': 'info' };
export const ACCENT_WIDTH = 3;
