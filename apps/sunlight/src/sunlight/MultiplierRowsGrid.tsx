import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@betty/beam';
import type { MultiplierRow } from './payoutConfigs';

const DIMMED_OPACITY = 0.35; // matches zero-probability payout sectors
const BOUNDARY = { borderBottom: 1, borderColor: 'divider' };
const NO_BORDER = { borderBottom: 0 };

const formatPercent = (probability: number) =>
  `${(probability * 100).toLocaleString('en-US', { maximumFractionDigits: 4 })}%`;

export function MultiplierRowsGrid({ rows }: { rows: MultiplierRow[] }) {
  return (
    <Paper variant="outlined" sx={{ width: 'fit-content', overflow: 'hidden' }}>
      <Table
        size="small"
        aria-label="Multiplier sectors"
        sx={{ '& td, & th': { width: 'fit-content', verticalAlign: 'top' } }}
      >
        <TableHead>
          <TableRow>
            <TableCell align="right">Sector</TableCell>
            <TableCell align="right">Probability</TableCell>
            <TableCell align="right">Multiplier</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => {
            const dim = { opacity: row.probability === 0 ? DIMMED_OPACITY : 1 };
            const bottom = index === rows.length - 1 ? NO_BORDER : BOUNDARY;
            return (
              <TableRow key={index}>
                <TableCell align="right" sx={{ ...bottom, ...dim }}>
                  {index + 1}
                </TableCell>
                <TableCell align="right" sx={{ ...bottom, ...dim }}>
                  {formatPercent(row.probability)}
                </TableCell>
                <TableCell align="right" sx={{ ...bottom, ...dim }}>
                  {row.multiplier}×
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Paper>
  );
}
