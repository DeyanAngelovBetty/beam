import {
  Stack,
  Box,
  Button,
  Typography,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  BeamStat,
} from '@betty/beam';
import type { BeamStatSeverity, BeamStatTone } from '@betty/beam';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { PRIZE_TYPE_LABEL, type RewardType } from './payoutConfigs';
import {
  REWARD_TYPES,
  emptyRow,
  emptyReward,
  firstUnusedType,
  validateRows,
  type EditorRow,
} from './payoutConfigForm';

/**
 * PayoutRowsEditor — the EDITABLE sibling of PayoutRowsGrid, deliberately the
 * same skeleton (Win Message | Probability | Rewards, now + a row-actions
 * column) so view and edit read as one table (our oldest doctrine). Controlled:
 * `rows` in, `onChange` out. Renders the inline validation + the Live Check.
 *
 * Minimums (list-grammar: structural prevention for local rules, validation for
 * aggregate rules): ≥1 reward per row is PREVENTED (Remove disabled at the last
 * reward); ≥1 row overall is a VALIDATION aggregate (rows may empty, Save
 * blocks). Duplicate reward types are prevented structurally — the Type select
 * offers only types unused in that row.
 *
 * Scaffold plain — spacing / severity pigment / placement is Deyan's bench pass.
 */
export function PayoutRowsEditor({
  rows,
  onChange,
}: {
  rows: EditorRow[];
  onChange: (rows: EditorRow[]) => void;
}) {
  const v = validateRows(rows);

  const setRow = (key: string, patch: Partial<EditorRow>) =>
    onChange(rows.map((r) => (r._key === key ? { ...r, ...patch } : r)));
  const setReward = (rowKey: string, rKey: string, patch: Partial<EditorRow['rewards'][number]>) =>
    onChange(
      rows.map((r) =>
        r._key === rowKey
          ? { ...r, rewards: r.rewards.map((rw) => (rw._key === rKey ? { ...rw, ...patch } : rw)) }
          : r
      )
    );
  const addRow = () => onChange([...rows, emptyRow()]);
  const deleteRow = (key: string) => onChange(rows.filter((r) => r._key !== key)); // may empty → aggregate error
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

  // Live Check severity (detail §2): exact = quiet · under = warning · over = danger.
  const severity: BeamStatSeverity | undefined =
    v.status === 'exact' ? undefined : v.status === 'under' ? 'warning' : 'danger';
  const remainingTone: BeamStatTone =
    v.status === 'exact' ? 'default' : v.status === 'under' ? 'warning' : 'error';

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle2" color="text.secondary">
          Payout Rows
        </Typography>
        <Button size="small" startIcon={<AddIcon />} onClick={addRow}>
          Add Row
        </Button>
      </Stack>

      {/* Editable → interactive surface, so bordered (detail-grammar §1.2). */}
      <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
        <Table size="small" sx={{ '& td, & th': { verticalAlign: 'top' } }}>
          <TableHead>
            <TableRow>
              <TableCell>Win Message</TableCell>
              <TableCell align="right">Probability (%)</TableCell>
              <TableCell>Rewards</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} sx={{ py: 3, color: 'text.secondary' }}>
                  No rows yet — add at least one.
                </TableCell>
              </TableRow>
            )}
            {rows.map((row, ri) => {
              const rowErr = v.rows[ri];
              const canAddReward = Boolean(firstUnusedType(row.rewards));
              return (
                <TableRow key={row._key}>
                  <TableCell>
                    <TextField
                      size="small"
                      fullWidth
                      multiline
                      maxRows={4}
                      value={row.winMessage}
                      onChange={(e) => setRow(row._key, { winMessage: e.target.value })}
                      error={Boolean(rowErr?.winMessage)}
                      helperText={rowErr?.winMessage}
                      inputProps={{ 'aria-label': `Win message, row ${ri + 1}` }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <TextField
                      size="small"
                      sx={{ width: 110 }}
                      value={row.probabilityPct}
                      onChange={(e) => setRow(row._key, { probabilityPct: e.target.value })}
                      error={Boolean(rowErr?.probability)}
                      helperText={rowErr?.probability}
                      inputProps={{ inputMode: 'decimal', 'aria-label': `Probability percent, row ${ri + 1}` }}
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
                          <Stack key={rw._key} direction="row" spacing={1} alignItems="flex-start">
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
                              error={Boolean(amtErr)}
                              helperText={amtErr}
                              inputProps={{ inputMode: 'numeric', 'aria-label': `Amount, reward ${rwi + 1}, row ${ri + 1}` }}
                            />
                            {/* ≥1 reward per row is structural — Remove disabled at the last. */}
                            <Tooltip title={lastReward ? 'A row needs at least one reward.' : 'Remove reward'}>
                              <span>
                                <IconButton
                                  size="small"
                                  aria-label={`Remove reward ${rwi + 1}, row ${ri + 1}`}
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
                            <Button
                              size="small"
                              startIcon={<AddIcon />}
                              disabled={!canAddReward}
                              onClick={() => addReward(row._key)}
                            >
                              Add Reward
                            </Button>
                          </span>
                        </Tooltip>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    {/* ≥1 row overall is a VALIDATION aggregate — delete allowed to empty. */}
                    <Tooltip title="Delete row">
                      <IconButton size="small" aria-label={`Delete row ${ri + 1}`} onClick={() => deleteRow(row._key)}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>

      {/* The Live Check — BeamStat severity's first real consumer (detail §2). */}
      <Stack direction="row" spacing={4} alignItems="flex-start">
        <BeamStat label="Total probability" value={`${v.total}%`} severity={severity} />
        <BeamStat label="Remaining" value={`${v.remaining}%`} tone={remainingTone} />
      </Stack>
      {v.aggregate && (
        <Typography variant="body2" color="error" role="alert">
          {v.aggregate}
        </Typography>
      )}
    </Stack>
  );
}
