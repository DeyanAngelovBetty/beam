import { useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  BeamStat,
} from '@betty/beam';
import type { BeamStatSeverity } from '@betty/beam';
import AddIcon from '@mui/icons-material/Add';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import {
  emptyMultiplierRow,
  validateMultiplierRows,
  type EditorMultiplierRow,
  type EditorRow,
} from './payoutConfigForm';

/** Wheel of Wins multiplier-sector editor. Public sector numbers are index + 1. */
export function MultiplierRowsEditor({
  rows,
  payoutRows,
  onChange,
  showAllErrors = false,
}: {
  rows: EditorMultiplierRow[];
  payoutRows: EditorRow[];
  onChange: (rows: EditorMultiplierRow[]) => void;
  showAllErrors?: boolean;
}) {
  const validation = validateMultiplierRows(rows, payoutRows);
  const [touched, setTouched] = useState<Set<string>>(() => new Set());
  const markTouched = (key: string) =>
    setTouched((current) => {
      const next = new Set(current);
      next.add(key);
      return next;
    });
  const showError = (key: string) => showAllErrors || touched.has(key);

  const setRow = (key: string, patch: Partial<EditorMultiplierRow>) =>
    onChange(rows.map((row) => (row._key === key ? { ...row, ...patch } : row)));
  const addRow = () => {
    markTouched('aggregate');
    onChange([...rows, emptyMultiplierRow()]);
  };
  const deleteRow = (key: string) => {
    markTouched('aggregate');
    onChange(rows.filter((row) => row._key !== key));
  };
  const moveRow = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const severity: BeamStatSeverity | undefined =
    validation.status === 'exact'
      ? undefined
      : validation.status === 'under'
        ? 'warning'
        : 'error';

  return (
    <Box sx={{ width: 'fit-content' }}>
      <Stack spacing={1.5}>
        <Stack spacing={0.5}>
          <Typography variant="h6" component="h2">
            Multiplier Sectors
          </Typography>
          <Typography variant="body2" color="text.secondary">
            The selected multiplier applies to every reward in the independently selected payout sector.
          </Typography>
        </Stack>

        <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Button size="small" startIcon={<AddIcon />} onClick={addRow}>
            Add Sector
          </Button>
          <Stack spacing={0.5}>
            <Stack direction="row" spacing={4} sx={{ alignItems: 'flex-start' }}>
              <BeamStat label="Total probability" value={`${validation.total}%`} severity={severity} />
              <BeamStat label="Remaining" value={`${validation.remaining}%`} severity={severity} />
            </Stack>
            {validation.aggregate && showError('aggregate') && (
              <Typography variant="body2" color="error" role="alert">
                {validation.aggregate}
              </Typography>
            )}
            {validation.multiplication && (
              <Typography variant="body2" color="error" role="alert">
                {validation.multiplication}
              </Typography>
            )}
          </Stack>
        </Stack>

        <Paper variant="outlined" sx={{ width: 'fit-content', overflow: 'hidden' }}>
          <Table
            size="small"
            aria-label="Multiplier sectors"
            sx={{ '& td, & th': { width: 'fit-content', verticalAlign: 'top' } }}
          >
            <TableHead sx={{ '& th': { pb: 2.5 } }}>
              <TableRow>
                <TableCell align="right">Sector</TableCell>
                <TableCell align="right">Probability (%)</TableCell>
                <TableCell align="right">Multiplier</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} sx={{ py: 3, color: 'text.secondary' }}>
                    No sectors yet — add at least one.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((row, index) => {
                const rowError = validation.rows[index];
                return (
                  <TableRow key={row._key}>
                    <TableCell align="right">{index + 1}</TableCell>
                    <TableCell align="right">
                      <TextField
                        size="small"
                        sx={{ width: 110 }}
                        value={row.probabilityPct}
                        onChange={(event) => setRow(row._key, { probabilityPct: event.target.value })}
                        onBlur={() => {
                          markTouched(`probability:${row._key}`);
                          markTouched('aggregate');
                        }}
                        error={Boolean(rowError?.probability && showError(`probability:${row._key}`))}
                        helperText={showError(`probability:${row._key}`) ? rowError?.probability : undefined}
                        slotProps={{ htmlInput: { inputMode: 'decimal', 'aria-label': `Probability percent, multiplier sector ${index + 1}` } }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        size="small"
                        sx={{ width: 120 }}
                        value={row.multiplier}
                        onChange={(event) => setRow(row._key, { multiplier: event.target.value })}
                        onBlur={() => markTouched(`multiplier:${row._key}`)}
                        error={Boolean(rowError?.multiplier && showError(`multiplier:${row._key}`))}
                        helperText={showError(`multiplier:${row._key}`) ? rowError?.multiplier : undefined}
                        slotProps={{ htmlInput: { inputMode: 'decimal', 'aria-label': `Multiplier, sector ${index + 1}` } }}
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Move up">
                          <span>
                            <IconButton
                              size="small"
                              aria-label={`Move multiplier sector ${index + 1} up`}
                              disabled={index === 0}
                              onClick={() => moveRow(index, -1)}
                            >
                              <ArrowUpwardIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Move down">
                          <span>
                            <IconButton
                              size="small"
                              aria-label={`Move multiplier sector ${index + 1} down`}
                              disabled={index === rows.length - 1}
                              onClick={() => moveRow(index, 1)}
                            >
                              <ArrowDownwardIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Delete sector">
                          <IconButton
                            size="small"
                            aria-label={`Delete multiplier sector ${index + 1}`}
                            onClick={() => deleteRow(row._key)}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
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
