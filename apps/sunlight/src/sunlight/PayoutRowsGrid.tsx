import {
  Stack,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@betty/beam';
import { formatPayout, type PayoutRow, type RewardType } from './payoutConfigs';

/**
 * PayoutRowsGrid — the designed expansion content for a payout config (per the
 * Figma mock). This is the VIEW half of the future two-mode PayoutRow pattern
 * (view ↔ edit), so it's named for the grid, not the mode.
 *
 * Structure: Win Message | Probability | Prize Type | Prize Value. Win Message
 * and Probability are MERGED across a row's reward lines (rowSpan) and
 * top-aligned; each reward renders its own type/value line with an inner
 * separator. Zero-probability rows sit in the same grid, visually quiet.
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

// Rules: a vertical rule after Win Message + Probability; an inner separator
// between reward lines; a boundary between payout rows. All the divider token
// for now — the inner rule is a candidate for a future quieter variant.
const V_RULE = { borderRight: 1, borderColor: 'divider' }; // styling: pending design pass
const INNER = { borderBottom: 1, borderColor: 'divider' }; // styling: pending design pass
const BOUNDARY = { borderBottom: 1, borderColor: 'divider' }; // styling: pending design pass
const NO_BORDER = { borderBottom: 0 };

const formatProbability = (p: number) =>
  p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function PayoutRowsGrid({ rows }: { rows: PayoutRow[] }) {
  return (
    <Stack spacing={1.5} sx={{ py: 1 }}>
      <Paper variant="outlined" sx={{ width: 'fit-content', overflow: 'hidden' }}>
        <Table size="small" aria-label="Payout rows" sx={{ '& td, & th': { width: 'fit-content', verticalAlign: 'top' } }}>
          <TableHead>
            <TableRow>
              <TableCell sx={V_RULE}>Win Message</TableCell>
              <TableCell align="right" sx={V_RULE}>
                Probability
              </TableCell>
              <TableCell align="left">Prize Type</TableCell>
              <TableCell align="right">Prize Value</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, ri) => {
              // A no-reward row (e.g. "No win") still renders one line, dashed.
              const rewards: (typeof row.rewards[number] | null)[] = row.rewards.length
                ? row.rewards
                : [null];
              const span = rewards.length;
              const dim = { opacity: row.probability === 0 ? DIMMED_OPACITY : 1 };
              const lastPayout = ri === rows.length - 1;
              const mergedBottom = lastPayout ? NO_BORDER : BOUNDARY;
              return rewards.map((rw, i) => {
                const lastReward = i === span - 1;
                const cellBottom = !lastReward ? INNER : lastPayout ? NO_BORDER : BOUNDARY;
                return (
                  <TableRow key={`${ri}-${i}`}>
                    {i === 0 && (
                      <>
                        <TableCell rowSpan={span} sx={{ ...V_RULE, ...mergedBottom, ...dim }}>
                          {row.winMessage}
                        </TableCell>
                        <TableCell rowSpan={span} align="right" sx={{ ...V_RULE, ...mergedBottom, ...dim }}>
                          {formatProbability(row.probability)}
                        </TableCell>
                      </>
                    )}
                    <TableCell align="left" sx={{ ...cellBottom, ...dim }}>
                      {rw ? PRIZE_TYPE_LABEL[rw.rewardType] : '—'}
                    </TableCell>
                    <TableCell align="right" sx={{ ...cellBottom, ...dim }}>
                      {rw ? formatPayout(rw.amount) : '—'}
                    </TableCell>
                  </TableRow>
                );
              });
            })}
          </TableBody>
        </Table>
      </Paper>
    </Stack>
  );
}
