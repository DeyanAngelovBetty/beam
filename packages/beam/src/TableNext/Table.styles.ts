import { alpha, type Theme } from '@mui/material/styles';
import type { SxProps } from '@mui/material/styles';
import type { CSSProperties } from 'react';

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

export const body: SxProps<Theme> = (theme: Theme) => {
  const palette = theme.palette;
  const sel = alpha(palette.primary.main, palette.action.selectedOpacity + palette.action.hoverOpacity);
  return {
    '& > .table-dataRow:hover, & > .table-dataRow:has(+ .table-detailsRow:hover), & > .table-dataRow:hover + .table-detailsRow, & > .table-detailsRow:hover':
      { backgroundColor: palette.action.hover },
    '& > .table-dataRow.Mui-selected:hover, & > .table-dataRow.Mui-selected:has(+ .table-detailsRow:hover), & > .table-dataRow.Mui-selected:hover + .table-detailsRow.Mui-selected, & > .table-detailsRow.Mui-selected:hover':
      { backgroundColor: sel },
    '& > .table-dataRow.Mui-selected > .table-actionRailCell::before': {
      backgroundColor: alpha(palette.primary.main, palette.action.selectedOpacity),
    },
    '& > .table-dataRow:hover > .table-actionRailCell::before, & > .table-dataRow:has(+ .table-detailsRow:hover) > .table-actionRailCell::before':
      { backgroundColor: palette.action.hover },
    '& > .table-dataRow.Mui-selected:hover > .table-actionRailCell::before, & > .table-dataRow.Mui-selected:has(+ .table-detailsRow:hover) > .table-actionRailCell::before':
      { backgroundColor: sel },
  };
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
