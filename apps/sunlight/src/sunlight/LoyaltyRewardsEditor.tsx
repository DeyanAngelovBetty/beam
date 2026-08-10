import { useState } from 'react';
import {
  Stack,
  Box,
  Button,
  Typography,
  TextField,
  IconButton,
  Tooltip,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@betty/beam';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import { emptyReward, type EditorReward, type RewardErrors } from './loyaltyStatusForm';

/**
 * LoyaltyRewardsEditor — the reward-rows grid for the loyalty-status editor. Same shape as
 * PayoutRowsEditor (controlled: rows in, onChange out; add/remove rows + per-field edit),
 * but rewards here are FLAT (no nested rewards, no probability live-check). ≥1 reward is an
 * aggregate rule (delete may empty the grid; Submit blocks), not structural prevention.
 *
 * Editable → interactive surface → bordered Paper (detail-grammar §1.2). Scaffold plain.
 */
export function LoyaltyRewardsEditor({
  rows,
  onChange,
  errors,
  showAllErrors = false,
}: {
  rows: EditorReward[];
  onChange: (rows: EditorReward[]) => void;
  errors: RewardErrors[];
  showAllErrors?: boolean;
}) {
  const [touched, setTouched] = useState<Set<string>>(() => new Set());
  const markTouched = (key: string) => setTouched((current) => new Set(current).add(key));
  const showError = (key: string) => showAllErrors || touched.has(key);

  const setRow = (key: string, patch: Partial<EditorReward>) =>
    onChange(rows.map((r) => (r._key === key ? { ...r, ...patch } : r)));
  const addRow = () => onChange([...rows, emptyReward()]);
  const deleteRow = (key: string) => onChange(rows.filter((r) => r._key !== key));

  const cell = (
    row: EditorReward,
    field: keyof Omit<EditorReward, '_key'>,
    label: string,
    err: string | undefined,
    ri: number,
    width: number,
  ) => (
    <TextField
      size="small"
      sx={{ width }}
      value={row[field]}
      onChange={(e) => setRow(row._key, { [field]: e.target.value })}
      onBlur={() => markTouched(`${field}:${row._key}`)}
      error={Boolean(err && showError(`${field}:${row._key}`))}
      helperText={showError(`${field}:${row._key}`) ? err : undefined}
      slotProps={{ htmlInput: { 'aria-label': `${label}, reward row ${ri + 1}` } }}
    />
  );

  return (
    <Box sx={{ width: 'fit-content' }}>
      <Stack spacing={1.5}>
        <Typography variant="h6" component="h2">
          Claimable rewards
        </Typography>

        {/* Section action: left-aligned strip above the organism it owns (detail-grammar §4). */}
        <Box>
          <Button size="small" startIcon={<AddIcon />} onClick={addRow}>
            Add reward
          </Button>
        </Box>

        <Paper variant="outlined" sx={{ width: 'fit-content', overflow: 'hidden' }}>
          <Table size="small" sx={{ '& td, & th': { verticalAlign: 'top' } }}>
            <TableHead sx={{ '& th': { pb: 2.5 } }}>
              <TableRow>
                <TableCell>Points to claim</TableCell>
                <TableCell>Reward type</TableCell>
                <TableCell align="right">Reward amount</TableCell>
                <TableCell align="right">Expiry hours</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} sx={{ py: 3, color: 'text.secondary' }}>
                    No rewards yet — add at least one.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((row, ri) => {
                const e = errors[ri] ?? {};
                return (
                  <TableRow key={row._key}>
                    <TableCell>{cell(row, 'pointsToClaim', 'Points to claim', e.pointsToClaim, ri, 130)}</TableCell>
                    <TableCell>{cell(row, 'rewardType', 'Reward type', e.rewardType, ri, 120)}</TableCell>
                    <TableCell align="right">{cell(row, 'rewardAmount', 'Reward amount', e.rewardAmount, ri, 120)}</TableCell>
                    <TableCell align="right">{cell(row, 'expiryHours', 'Expiry hours', e.expiryHours, ri, 110)}</TableCell>
                    <TableCell>
                      <Tooltip title="Delete reward">
                        <IconButton
                          size="small"
                          aria-label={`Delete reward row ${ri + 1}`}
                          onClick={() => deleteRow(row._key)}
                        >
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
      </Stack>
    </Box>
  );
}
