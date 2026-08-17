import type { SxProps, Theme } from '@mui/material/styles';

/**
 * BeamAlert SEED — the page-level-alert action doctrine, as a shared sx until it becomes a
 * component. The next page-level alert with actions imports this so the rulings are inherited.
 *
 * 1. FLAT ONLY. Page-level alert actions are always `variant="text"` (small). No outlined — the
 *    tinted alert surface already carries a border, so emphasis between actions is by ORDER
 *    (primary rightmost), never by variant. (The app-level bar keeps its outlined ghost CTA — a
 *    different surface, deliberately.)
 * 2. NEVER WRAP. The action cluster holds its size (`flexShrink: 0`, `whiteSpace: nowrap`,
 *    `alignSelf: center`); the MESSAGE column is the one that flexes/wraps. Give the two buttons a
 *    real gap, and the message keeps its right padding so the two don't kiss.
 * 3. MAX TWO actions on a page-level alert.
 */
export const pageAlertActionSx: SxProps<Theme> = {
  flexShrink: 0,
  whiteSpace: 'nowrap',
  alignSelf: 'center',
};

/** Gap between the (max two) page-level alert action buttons. */
export const PAGE_ALERT_ACTION_GAP = 1.5;
