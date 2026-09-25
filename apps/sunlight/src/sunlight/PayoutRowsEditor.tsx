import { useState, type ChangeEvent } from 'react';
import {
  Stack,
  Box,
  Button,
  Typography,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Section,
  MuiTable as Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  BeamStat,
  Radio,
} from '@betty/beam';
import type { BeamStatSeverity } from '@betty/beam';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { PRIZE_TYPE_LABEL, type RewardType } from './payoutConfigs';
import { RowActionsKebab, RowDragHandle, useRowReorder } from './rowActionRail';
import {
  REWARD_TYPES,
  emptyRow,
  emptyReward,
  firstUnusedType,
  validateRows,
  type EditorRow,
} from './payoutConfigForm';

/**
 * PayoutRowsEditor — the EDIT half of the Payout Sectors / Payout Rows table. Convergence pass
 * (2026-09-25): wrapped in a bleed `Section` (title + toolbar-stats lane), row controls moved to the
 * LEADING rail + kebab (trailing action column retired), per-reward × kept on the reward line.
 *
 * EDITOR GRID (BEAM.md §6.7 exemption): view rows sit at 44, edit rows grow as tall as the form needs
 * (a row hosts a rewards collection) — the view↔edit toggle may reflow, and that's sanctioned here.
 *
 * `orderable` is DECLARED by the caller (not inferred): true → positional sectors (drag slot + kebab
 * Move up/down + the Sector number column); false → plain rows (kebab = Delete only). Minimums:
 * ≥1 reward per row is structural (Remove disabled at the last); ≥1 row is a validation aggregate.
 */
export function PayoutRowsEditor({
  rows,
  onChange,
  showAllErrors = false,
  orderable = false,
  showTopPrize = false,
}: {
  rows: EditorRow[];
  onChange: (rows: EditorRow[]) => void;
  showAllErrors?: boolean;
  orderable?: boolean;
  showTopPrize?: boolean;
}) {
  const v = validateRows(rows, orderable ? 'payout sector' : 'payout row');
  const [touched, setTouched] = useState<Set<string>>(() => new Set());
  const markTouched = (key: string) =>
    setTouched((current) => {
      const next = new Set(current);
      next.add(key);
      return next;
    });
  const showError = (key: string) => showAllErrors || touched.has(key);

  const setRow = (key: string, patch: Partial<EditorRow>) =>
    onChange(rows.map((r) => (r._key === key ? { ...r, ...patch } : r)));
  const selectTopPrize = (event: ChangeEvent<HTMLInputElement>) =>
    onChange(rows.map((row) => ({ ...row, isTopPrize: row._key === event.target.value })));
  const setReward = (rowKey: string, rKey: string, patch: Partial<EditorRow['rewards'][number]>) =>
    onChange(
      rows.map((r) =>
        r._key === rowKey
          ? { ...r, rewards: r.rewards.map((rw) => (rw._key === rKey ? { ...rw, ...patch } : rw)) }
          : r
      )
    );
  const addRow = () => {
    markTouched('aggregate');
    onChange([...rows, emptyRow()]);
  };
  const deleteRow = (key: string) => {
    markTouched('aggregate');
    onChange(rows.filter((r) => r._key !== key)); // may empty → aggregate error
  };
  const moveRow = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };
  const addReward = (rowKey: string) =>
    onChange(
      rows.map((r) => {
        if (r._key !== rowKey) return r;
        const t = firstUnusedType(r.rewards);
        return t ? { ...r, rewards: [...r.rewards, emptyReward(t)] } : r;
      })
    );
  const removeReward = (rowKey: string, rKey: string) =>
    onChange(
      rows.map((r) => (r._key === rowKey ? { ...r, rewards: r.rewards.filter((rw) => rw._key !== rKey) } : r))
    );

  // Live Check severity (detail §2): exact = quiet · under = warning · over = error. REMAINING ≠ 0 reads
  // danger here AND blocks Save — but the block is validateModel's own (rowsValid requires exact); this stat
  // only SURFACES it.
  const severity: BeamStatSeverity | undefined =
    v.status === 'exact' ? undefined : v.status === 'under' ? 'warning' : 'error';
  const positionLabel = orderable ? 'payout sector' : 'payout row';
  const columnCount = 1 + (orderable ? 1 : 0) + (showTopPrize ? 1 : 0) + 3; // rail + [sector] + [top] + msg/prob/rewards
  // Drag-to-reorder — only where order is data-meaningful (kebab Move stays the keyboard path).
  const { draggingIndex, rowProps, handleProps, liftedRowSx } = useRowReorder(rows, onChange);

  return (
    <Section
      title={orderable ? 'Payout Sectors' : 'Payout Rows'}
      aria-label={orderable ? 'Payout sectors' : 'Payout rows'}
      isEdit
      bleed
      // TOOLBAR STATS LANE (Section note): actions left (Add — small text/flat), derived stats right.
      toolbar={
        <>
          <Button size="small" variant="text" startIcon={<AddIcon />} onClick={addRow}>
            {orderable ? 'Add Sector' : 'Add Row'}
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <Stack direction="row" spacing={4} sx={{ alignItems: 'flex-start' }}>
            <BeamStat label="Total probability" value={`${v.total}%`} severity={severity} />
            {/* REMAINING ≠ 0 → danger ink (severity) — surfaces the Save gate (validateModel). */}
            <BeamStat label="Remaining" value={`${v.remaining}%`} severity={severity} />
          </Stack>
        </>
      }
    >
      {/* Inset one-liners in the Section pad, ABOVE the bleeding table (same slot as the empty-state):
          the aggregate error, then the empty-state. The table stays the DIRECT bleed child (contract). */}
      {v.aggregate && showError('aggregate') && rows.length > 0 && (
        <Typography variant="body2" color="error" role="alert" sx={{ px: 2, pb: 1 }}>
          {v.aggregate}
        </Typography>
      )}
      {rows.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ px: 2, pb: 1 }} role={showError('aggregate') ? 'alert' : undefined}>
          {orderable ? 'No sectors yet — add at least one.' : 'No rows yet — add at least one.'}
        </Typography>
      )}
      <Table
        size="small"
        aria-label={orderable ? 'Payout sectors' : 'Payout rows'}
        // Editor grid: cells top-align (fields sit at the row top, not centred in a tall row) — overrides
        // Section's density middle-align, per the §6.7 exemption.
        sx={{ '& td, & th': { verticalAlign: 'top !important' } }}
      >
        <TableHead>
          <TableRow>
            <TableCell aria-label="Row actions" sx={{ width: '1%' }} />
            {orderable && <TableCell align="right">Sector</TableCell>}
            {showTopPrize && <TableCell>Top Prize</TableCell>}
            <TableCell>Win Message</TableCell>
            <TableCell align="right">Probability (%)</TableCell>
            <TableCell>Rewards</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, ri) => {
            const rowErr = v.rows[ri];
            const canAddReward = Boolean(firstUnusedType(row.rewards));
            return (
              <TableRow
                key={row._key}
                {...(orderable ? rowProps(ri) : {})}
                sx={orderable && draggingIndex === ri ? liftedRowSx : undefined}
              >
                {/* LEADING RAIL — the drag handle (orderable only) + the kebab. */}
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  <Stack direction="row" sx={{ alignItems: 'center' }}>
                    {orderable && <RowDragHandle handleProps={handleProps} />}
                    <RowActionsKebab
                      label={positionLabel}
                      index={ri}
                      count={rows.length}
                      orderable={orderable}
                      onMoveUp={() => moveRow(ri, -1)}
                      onMoveDown={() => moveRow(ri, 1)}
                      onDelete={() => deleteRow(row._key)}
                    />
                  </Stack>
                </TableCell>
                {orderable && <TableCell align="right">{ri + 1}</TableCell>}
                {showTopPrize && (
                  <TableCell>
                    <Radio
                      value={row._key}
                      checked={Boolean(row.isTopPrize)}
                      onChange={selectTopPrize}
                      slotProps={{ input: { 'aria-label': `Top prize, row ${ri + 1}` } }}
                    />
                  </TableCell>
                )}
                <TableCell>
                  <TextField
                    size="small"
                    fullWidth
                    multiline
                    maxRows={4}
                    value={row.winMessage}
                    onChange={(e) => setRow(row._key, { winMessage: e.target.value })}
                    onBlur={() => markTouched(`winMessage:${row._key}`)}
                    error={Boolean(rowErr?.winMessage && showError(`winMessage:${row._key}`))}
                    helperText={showError(`winMessage:${row._key}`) ? rowErr?.winMessage : undefined}
                    slotProps={{ htmlInput: { 'aria-label': `Win message, ${positionLabel} ${ri + 1}` } }}
                  />
                </TableCell>
                <TableCell align="right">
                  <TextField
                    size="small"
                    sx={{ width: 110 }}
                    value={row.probabilityPct}
                    onChange={(e) => setRow(row._key, { probabilityPct: e.target.value })}
                    onBlur={() => {
                      markTouched(`probability:${row._key}`);
                      markTouched('aggregate');
                    }}
                    error={Boolean(rowErr?.probability && showError(`probability:${row._key}`))}
                    helperText={showError(`probability:${row._key}`) ? rowErr?.probability : undefined}
                    slotProps={{ htmlInput: { inputMode: 'decimal', 'aria-label': `Probability percent, ${positionLabel} ${ri + 1}` } }}
                  />
                </TableCell>
                <TableCell>
                  <Stack spacing={1}>
                    {row.rewards.map((rw, rwi) => {
                      const available = REWARD_TYPES.filter(
                        (t) => t === rw.rewardType || !row.rewards.some((o, i) => i !== rwi && o.rewardType === t)
                      );
                      const amtErr = rowErr?.rewards[rwi]?.amount;
                      const lastReward = row.rewards.length === 1;
                      return (
                        <Stack key={rw._key} direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
                          <TextField
                            select
                            size="small"
                            label="Type"
                            sx={{ width: 120 }}
                            value={rw.rewardType}
                            onChange={(e) => setReward(row._key, rw._key, { rewardType: e.target.value as RewardType })}
                          >
                            {available.map((t) => (
                              <MenuItem key={t} value={t}>
                                {PRIZE_TYPE_LABEL[t]}
                              </MenuItem>
                            ))}
                          </TextField>
                          <TextField
                            size="small"
                            label="Amount"
                            sx={{ width: 120 }}
                            value={rw.amount}
                            onChange={(e) => setReward(row._key, rw._key, { amount: e.target.value })}
                            onBlur={() => markTouched(`amount:${row._key}:${rw._key}`)}
                            error={Boolean(amtErr && showError(`amount:${row._key}:${rw._key}`))}
                            helperText={showError(`amount:${row._key}:${rw._key}`) ? amtErr : undefined}
                            slotProps={{ htmlInput: { inputMode: 'numeric', 'aria-label': `Amount, reward ${rwi + 1}, ${positionLabel} ${ri + 1}` } }}
                          />
                          {/* ≥1 reward per row is structural — Remove disabled at the last. Per-reward × stays
                              on the reward line (NOT the rail). */}
                          <Tooltip title={lastReward ? `A ${positionLabel} needs at least one reward.` : 'Remove reward'}>
                            <span>
                              <IconButton
                                size="small"
                                aria-label={`Remove reward ${rwi + 1}, ${positionLabel} ${ri + 1}`}
                                disabled={lastReward}
                                onClick={() => removeReward(row._key, rw._key)}
                              >
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Stack>
                      );
                    })}
                    <Box>
                      <Tooltip title={canAddReward ? 'Add reward' : 'Both reward types are used.'}>
                        <span>
                          <Button size="small" startIcon={<AddIcon />} disabled={!canAddReward} onClick={() => addReward(row._key)}>
                            Add Reward
                          </Button>
                        </span>
                      </Tooltip>
                    </Box>
                  </Stack>
                </TableCell>
              </TableRow>
            );
          })}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={columnCount} sx={{ height: 8, p: 0, border: 0 }} />
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Section>
  );
}
