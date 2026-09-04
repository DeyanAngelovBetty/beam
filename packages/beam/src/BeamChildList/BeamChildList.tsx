import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { meta } from '../theme/textStyles';
import type { BeamChildListProps } from './BeamChildList.types';

/**
 * BeamChildList — see BeamChildList.types. A view-only summary of child records: identity link
 * (the drill) + vital-sign columns, in an outlined card. Header cells wear the `meta` voice
 * (detail-grammar §3); the identity column links to the child page and a trailing chevron reads as
 * the drill affordance. No row/primary actions — the identity link IS the interaction.
 */
export function BeamChildList<Row>({
  'aria-label': ariaLabel,
  title,
  rows,
  getRowId,
  identityHeader,
  getIdentityLabel,
  getHref,
  LinkComponent,
  columns,
  emptyMessage = 'None.',
}: BeamChildListProps<Row>) {
  const Identity = LinkComponent;
  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
      {title && (
        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2">{title}</Typography>
        </Box>
      )}

      {rows.length === 0 ? (
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">{emptyMessage}</Typography>
        </Box>
      ) : (
        <Table size="small" aria-label={ariaLabel}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ ...meta }}>{identityHeader}</TableCell>
              {columns.map((c) => (
                <TableCell key={c.key} align={c.align ?? 'left'} sx={{ ...meta, width: c.width }}>
                  {c.header}
                </TableCell>
              ))}
              {/* drill-affordance column (chevron) — no header */}
              <TableCell aria-hidden sx={{ width: 40 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => {
              const href = getHref(row);
              const label = getIdentityLabel(row);
              return (
                <TableRow key={getRowId(row)} hover>
                  <TableCell component="th" scope="row">
                    {Identity ? (
                      <Identity href={href}>{label}</Identity>
                    ) : (
                      <Link href={href} underline="hover" color="primary">{label}</Link>
                    )}
                  </TableCell>
                  {columns.map((c) => (
                    <TableCell key={c.key} align={c.align ?? 'left'}>
                      {c.render(row)}
                    </TableCell>
                  ))}
                  <TableCell align="right" sx={{ color: 'text.secondary' }}>
                    <ChevronRightIcon fontSize="small" aria-hidden sx={{ display: 'block' }} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </Paper>
  );
}
