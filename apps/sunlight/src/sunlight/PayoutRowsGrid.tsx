import {
  Box,
  Typography,
  Section,
  BeamBool,
  BeamStat,
  MuiTable as Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@betty/beam';
import { formatRewards, type PayoutRow } from './payoutConfigs';

/**
 * PayoutRowsGrid — the VIEW half of the Payout Sectors / Payout Rows table. Convergence pass
 * (2026-09-25): wrapped in the SAME bleed `Section` shell as its editor twin — title + toolbar-stats
 * lane — so view↔edit read as one grammar (BEAM.md §6.7 editor-grid exemption: the shell is identical,
 * the interior reflows — view is read-only, so it carries NO leading action rail, no kebab).
 *
 * The toolbar shows TOTAL PROBABILITY only (no REMAINING, no severity): a saved record has nothing to
 * validate, so the danger channel would falsely imply live checking (the editor owns that).
 *
 * Structure (per Georgi, Slack 2026-07-30): [Sector] | [Top Prize] | Win Message | Probability | Rewards.
 * Rewards are ONE column, listed inline per row ("3 Coins, 2 Tokens").
 */

// Zero-probability rows read quiet — dimmed like ungranted ItemRows (opacity).
const DIMMED_OPACITY = 0.35; // styling: pending design pass

/** Probability displays as a percentage — stored 0..1, ×100, no trailing zeros. */
const formatPercent = (p: number) =>
  `${(p * 100).toLocaleString('en-US', { maximumFractionDigits: 4 })}%`;

/** Rewards inline: readable whole-number reward copy, comma-joined. Dashed if none. */
const rewardsLabel = (row: PayoutRow) => (row.rewards.length ? formatRewards(row.rewards) : '—');

export function PayoutRowsGrid({
  rows,
  orderable = false,
  showTopPrize = false,
}: {
  rows: PayoutRow[];
  /** Positional sectors — declared by the caller (isOrderablePayout), shows the Sector column + title. */
  orderable?: boolean;
  showTopPrize?: boolean;
}) {
  const total = rows.reduce((sum, row) => sum + row.probability, 0) * 100;
  const totalLabel = total.toLocaleString('en-US', { maximumFractionDigits: 4 });
  return (
    <Section
      title={orderable ? 'Payout Sectors' : 'Payout Rows'}
      aria-label={orderable ? 'Payout sectors' : 'Payout rows'}
      bleed
      toolbar={
        <>
          <Box sx={{ flexGrow: 1 }} />
          <BeamStat label="Total probability" value={`${totalLabel}%`} />
        </>
      }
    >
      {rows.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ px: 2, pb: 1 }}>
          {orderable ? 'No sectors configured.' : 'No rows configured.'}
        </Typography>
      )}
      <Table
        size="small"
        aria-label={orderable ? 'Payout sectors' : 'Payout rows'}
        sx={{ '& td, & th': { verticalAlign: 'top' } }}
      >
        <TableHead>
          <TableRow>
            {orderable && <TableCell align="right">Sector</TableCell>}
            {showTopPrize && <TableCell>Top Prize</TableCell>}
            <TableCell>Win Message</TableCell>
            <TableCell align="right">Probability</TableCell>
            <TableCell>Rewards</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, ri) => {
            const dim = { opacity: row.probability === 0 ? DIMMED_OPACITY : 1 };
            return (
              <TableRow key={row.id ?? ri}>
                {orderable && (
                  <TableCell align="right" sx={dim}>
                    {ri + 1}
                  </TableCell>
                )}
                {showTopPrize && (
                  <TableCell>
                    <BeamBool value={Boolean(row.isTopPrize)} />
                  </TableCell>
                )}
                <TableCell sx={dim}>{row.winMessage}</TableCell>
                <TableCell align="right" sx={dim}>
                  {formatPercent(row.probability)}
                </TableCell>
                <TableCell sx={dim}>{rewardsLabel(row)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Section>
  );
}
