import type { ReactNode } from 'react';
import { Box, Stack } from '@betty/beam';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import type { Linking } from './useLinking';

/**
 * ItemRow — the one row skeleton behind RolesRail rows and ItemBox rows
 * (view + edit). Marker and per-site behavior vary by props; the row shape,
 * spacing, dimming, and the linking handler set are defined once here.
 */
export interface ItemRowProps {
  /** Which data-* the row carries → data-role-id | data-permission-id (linking identity). */
  linkKind: 'role' | 'permission';
  linkId: string;
  /**
   * The linking handler set (from useLinking's roleProps). Present on role
   * rows — the only linking triggers; omitted on permission rows, which are
   * dimming targets only (detail-page §5).
   */
  handlers?: ReturnType<Linking['roleProps']>;
  dimmed: boolean;
  /** Leading marker slot: checkbox | dot | (future provenance ticks). */
  marker: ReactNode;
  label: ReactNode;
  /** Marker/label cross-axis alignment. Roles + view rows = 'center'; edit permission rows = 'start'. */
  // align?: 'center' | 'start';
  tabIndex?: number;
  onClick?: () => void;
  /** Roles rows are chip-like (borderRadius); permission rows are flat. */
  rounded?: boolean;
  /** Roles rows set a cursor; permission rows don't. */
  cursor?: 'default' | 'pointer';
}

export function ItemRow({
  linkKind,
  linkId,
  handlers,
  dimmed,
  marker,
  label,
  // align = 'start',
  tabIndex,
  onClick,
  rounded,
  cursor,
}: ItemRowProps) {
  const dataAttr = linkKind === 'role' ? { 'data-role-id': linkId } : { 'data-permission-id': linkId };

  return (
    <Stack
      direction="row"
      spacing={1}
      {...dataAttr}
      tabIndex={tabIndex}
      onMouseEnter={handlers?.onMouseEnter}
      onMouseLeave={handlers?.onMouseLeave}
      onFocus={handlers?.onFocus}
      onBlur={handlers?.onBlur}
      onClick={onClick}
      sx={{
        p: 1,
        alignItems: 'start',
        transition: 'opacity 120ms',
        opacity: dimmed ? 0.35 : 1,
        ...(rounded ? { borderRadius: 1 } : {}),
        ...(cursor ? { cursor } : {}),
      }}
    >
      {marker}
      {label}
    </Stack>
  );
}

/** The small filled dot used as the read-only row marker (view mode). */
export function ItemDot() {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" sx={{ width: 20, height: 20, flexShrink: 0 }}>
      <FiberManualRecordIcon sx={{ fontSize: 7 }} />
    </Box>
  );
}
