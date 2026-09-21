import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import ContentCopyIcon from '@mui/icons-material/ContentCopyRounded';
import type { ColumnDef, RowData } from '@tanstack/react-table';
import type { ComponentType, ReactNode } from 'react';
import { BeamStatusBadge } from '../BeamStatusBadge/BeamStatusBadge';
import type { BeamStatusBadgeProps } from '../BeamStatusBadge/BeamStatusBadge.types';
import { BeamBadge } from '../BeamBadge/BeamBadge';
import { BeamBool } from '../BeamStat/BeamStat';
import type { BeamBadgeProps } from '../BeamBadge/BeamBadge.types';
import type { BeamIdentityLinkProps } from './Table.types';

/**
 * beamCells — the helper library that replaces the retired `BeamColumn` render-owning model (Wave 2 §3).
 * Each helper RETURNS a raw TanStack `ColumnDef<TData>`: an `accessorFn` (the sort/search value), a
 * `header`, a `cell` renderer built from Beam atoms, and a `meta: { align, width }` channel the Table's
 * renderer reads. beamCells is OPTIONAL SUGAR — a bespoke column is always a raw `ColumnDef.cell`.
 */

type Align = 'left' | 'right' | 'center';
type Meta = { align?: Align; width?: number | string };
type Base<TData> = { id: string; header: string; accessor: (row: TData) => string | number; width?: number | string };

const def = <TData extends RowData>(id: string, header: string, accessor: (row: TData) => unknown, cell: (row: TData) => ReactNode, meta: Meta): ColumnDef<TData, unknown> => ({
  id,
  header,
  accessorFn: (row) => accessor(row),
  cell: (ctx) => cell(ctx.row.original),
  meta,
});

/** #1 plain text passthrough. */
export function text<TData extends RowData>({ id, header, accessor, align, width }: Base<TData> & { align?: Align }): ColumnDef<TData, unknown> {
  return def(id, header, accessor, (row) => String(accessor(row)), { align, width });
}

/** #2 identity link — a real `<a href>`, or a router adapter via `LinkComponent`; optional leading icon. */
export function link<TData extends RowData>({
  id,
  header,
  accessor,
  getHref,
  LinkComponent,
  icon,
  width,
}: Base<TData> & { getHref: (row: TData) => string; LinkComponent?: ComponentType<BeamIdentityLinkProps>; icon?: (row: TData) => ReactNode }): ColumnDef<TData, unknown> {
  const stop = (e: React.MouseEvent) => e.stopPropagation();
  return def(
    id,
    header,
    accessor,
    (row) => {
      const label = String(accessor(row));
      const body = icon ? (
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>{icon(row)}{label}</Box>
      ) : (
        label
      );
      return LinkComponent ? (
        <LinkComponent href={getHref(row)} onClick={stop}>{body}</LinkComponent>
      ) : (
        <Link href={getHref(row)} onClick={stop} underline="hover" color="primary" sx={{ fontWeight: 500 }}>{body}</Link>
      );
    },
    { width },
  );
}

/** #3 status badge via BeamStatusBadge (status/label from the page's `statusBadge()` mapping). */
export function statusBadge<TData extends RowData>({ id, header, accessor, badge, width }: Base<TData> & { badge: (row: TData) => Pick<BeamStatusBadgeProps, 'status' | 'label'> }): ColumnDef<TData, unknown> {
  return def(id, header, accessor, (row) => { const b = badge(row); return <BeamStatusBadge status={b.status} label={b.label} size="small" />; }, { width });
}

/** #4 grammar badge via BeamBadge (a page-owned TIER map spread). */
export function badge<TData extends RowData>({ id, header, accessor, tier, width }: Base<TData> & { tier: (row: TData) => BeamBadgeProps }): ColumnDef<TData, unknown> {
  return def(id, header, accessor, (row) => <BeamBadge {...tier(row)} size="small" />, { width });
}

/** #5 boolean via BeamBool (center-aligned). */
export function bool<TData extends RowData>({ id, header, accessor, width }: { id: string; header: string; accessor: (row: TData) => boolean; width?: number | string }): ColumnDef<TData, unknown> {
  return def(id, header, (row) => (accessor(row) ? 'yes' : 'no'), (row) => <BeamBool value={Boolean(accessor(row))} />, { align: 'center', width });
}

/** #6 timestamp — a page-supplied formatter of the raw value (e.g. local time + ISO tooltip). Right-aligned. */
export function timestamp<TData extends RowData>({ id, header, accessor, format, width }: Base<TData> & { format?: (value: string) => ReactNode }): ColumnDef<TData, unknown> {
  return def(id, header, accessor, (row) => (format ? format(String(accessor(row))) : String(accessor(row))), { align: 'right', width });
}

/** #7 copy-to-clipboard id cell (middle-truncate + tooltip + copy button). */
export function copyId<TData extends RowData>({ id, header, accessor, mono, width }: Base<TData> & { mono?: boolean }): ColumnDef<TData, unknown> {
  return def(
    id,
    header,
    accessor,
    (row) => {
      const value = String(accessor(row));
      return (
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
          <Tooltip title={value}>
            <Box component="span" sx={{ fontFamily: mono ? 'monospace' : undefined, whiteSpace: 'nowrap' }}>{value}</Box>
          </Tooltip>
          <Tooltip title="Copy">
            <IconButton size="small" aria-label={`Copy ${value}`} onClick={(e) => { e.stopPropagation(); void navigator.clipboard?.writeText(value); }} sx={{ flexShrink: 0 }}>
              <ContentCopyIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
        </Box>
      );
    },
    { width },
  );
}

/** #8 number/money — a page-supplied formatter (toFixed / toLocaleString / Intl). Right-aligned, tabular. */
export function number<TData extends RowData>({ id, header, accessor, format, width }: { id: string; header: string; accessor: (row: TData) => number; format?: (value: number) => ReactNode; width?: number | string }): ColumnDef<TData, unknown> {
  return def(id, header, accessor, (row) => (format ? format(accessor(row)) : accessor(row).toLocaleString()), { align: 'right', width });
}

/** #9 count — a length/count of the row. Right-aligned. */
export function count<TData extends RowData>({ id, header, accessor, width }: { id: string; header: string; accessor: (row: TData) => number; width?: number | string }): ColumnDef<TData, unknown> {
  return def(id, header, accessor, (row) => String(accessor(row)), { align: 'right', width });
}

export const beamCells = { text, link, statusBadge, badge, bool, timestamp, copyId, number, count };
