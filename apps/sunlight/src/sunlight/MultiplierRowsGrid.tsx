import {
  Box,
  Typography,
  Section,
  BeamStat,
  MuiTable as Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@betty/beam';
import type { MultiplierRow } from './payoutConfigs';

/**
 * MultiplierRowsGrid — the VIEW half of the Wheel of Wins multiplier-sector table. Same bleed `Section`
 * shell as its editor twin (title + Total-only toolbar); the model description reads in the Section body
 * ABOVE the table (muted body2, inset to the pad — the empty-state slot), matching the editor. View is
 * read-only: no leading action rail, no kebab (BEAM.md §6.7 exemption — shell identical, interior reflows).
 */

const DIMMED_OPACITY = 0.35; // matches zero-probability payout sectors

const formatPercent = (probability: number) =>
  `${(probability * 100).toLocaleString('en-US', { maximumFractionDigits: 4 })}%`;

export function MultiplierRowsGrid({ rows }: { rows: MultiplierRow[] }) {
  const total = rows.reduce((sum, row) => sum + row.probability, 0) * 100;
  const totalLabel = total.toLocaleString('en-US', { maximumFractionDigits: 4 });
  return (
    <Section
      title="Multiplier Sectors"
      aria-label="Multiplier sectors"
      bleed
      toolbar={
        <>
          <Box sx={{ flexGrow: 1 }} />
          <BeamStat label="Total probability" value={`${totalLabel}%`} />
        </>
      }
    >
      <Typography variant="body2" color="text.secondary" sx={{ px: 2, pb: 1 }}>
        The selected multiplier applies to every reward in the independently selected payout sector.
      </Typography>
      <Table
        size="small"
        aria-label="Multiplier sectors"
        sx={{ '& td, & th': { verticalAlign: 'top' } }}
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
            return (
              <TableRow key={index}>
                <TableCell align="right" sx={dim}>
                  {index + 1}
                </TableCell>
                <TableCell align="right" sx={dim}>
                  {formatPercent(row.probability)}
                </TableCell>
                <TableCell align="right" sx={dim}>
                  {row.multiplier}×
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Section>
  );
}
