import {
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@betty/beam';
import { formatPayout, type PayoutRow, type RewardType } from './payoutConfigs';

/**
 * PayoutRowsGrid — the expansion content for a payout config. This is the VIEW
 * half of the future two-mode PayoutRow pattern (view ↔ edit), so it's named
 * for the grid, not the mode.
 *
 * Structure (per Georgi, Slack 2026-07-30): Win Message | Probability | Rewards.
 * Rewards are ONE column, listed inline per row ("3.00 BTY, 2.00 Tokens").
 * The earlier merged-cell / rowSpan anatomy (a line per reward) was superseded
 * by product; it may return in the EDITOR half, where per-reward rows earn
 * their own controls.
 *
 * Styling ships structural + plain; marked values are Deyan's bench pass.
 */

/**
 * Prize type is a DISPLAY label over the domain reward type — the domain stays
 * Coins | Tokens. Candidate mapping for a future i18n / currency pass.
 */
const PRIZE_TYPE_LABEL: Record<RewardType, string> = { Coins: 'BTY', Tokens: 'Tokens' };

// Zero-probability rows read quiet — dimmed like ungranted ItemRows (opacity).
const DIMMED_OPACITY = 0.35; // styling: pending design pass

// Boundary between rows; last row closes on the container border.
const BOUNDARY = { borderBottom: 1, borderColor: 'divider' }; // styling: pending design pass
const NO_BORDER = { borderBottom: 0 };

/** Probability displays as a percentage — stored 0..1, ×100, no trailing zeros. */
const formatPercent = (p: number) =>
  `${(p * 100).toLocaleString('en-US', { maximumFractionDigits: 4 })}%`;

/** Rewards inline: "{value} {label}" per reward, comma-joined. Dashed if none. */
const rewardsLabel = (row: PayoutRow) =>
  row.rewards.length
    ? row.rewards.map((rw) => `${formatPayout(rw.amount)} ${PRIZE_TYPE_LABEL[rw.rewardType]}`).join(', ')
    : '—';

export function PayoutRowsGrid({ rows }: { rows: PayoutRow[] }) {
  return (
    <Paper variant="outlined" sx={{ width: 'fit-content', overflow: 'hidden' }}>
      <Table
        size="small"
        aria-label="Payout rows"
        sx={{ '& td, & th': { width: 'fit-content', verticalAlign: 'top' } }}
      >
        <TableHead>
          <TableRow>
            <TableCell>Win Message</TableCell>
            <TableCell align="right">Probability</TableCell>
            <TableCell>Rewards</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, ri) => {
            const dim = { opacity: row.probability === 0 ? DIMMED_OPACITY : 1 };
            const bottom = ri === rows.length - 1 ? NO_BORDER : BOUNDARY;
            return (
              <TableRow key={ri}>
                <TableCell sx={{ ...bottom, ...dim }}>{row.winMessage}</TableCell>
                <TableCell align="right" sx={{ ...bottom, ...dim }}>
                  {formatPercent(row.probability)}
                </TableCell>
                <TableCell sx={{ ...bottom, ...dim }}>{rewardsLabel(row)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Paper>
  );
}
