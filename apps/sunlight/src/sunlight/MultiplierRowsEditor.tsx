import { useState } from 'react';
import {
  Box,
  Button,
  Stack,
  MuiTable as Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Section,
  BeamStat,
} from '@betty/beam';
import type { BeamStatSeverity } from '@betty/beam';
import AddIcon from '@mui/icons-material/Add';
import { RowActionsKebab, RowDragHandle, useRowReorder } from './rowActionRail';
import {
  emptyMultiplierRow,
  validateMultiplierRows,
  type EditorMultiplierRow,
} from './payoutConfigForm';

/**
 * MultiplierRowsEditor — the EDIT half of the Wheel of Wins multiplier-sector table. Convergence pass
 * (2026-09-25): the SAME bleed `Section` + toolbar-stats + leading-rail grammar as Payout Sectors.
 * Multiplier sectors ARE positional (their index is the wheel position) → `orderable` is declared TRUE
 * here: the kebab carries Move up / Move down + the drag-handle slot (drag pass). Public sector numbers
 * are index + 1. The model description reads in the Section body ABOVE the table (the empty-state slot).
 */
export function MultiplierRowsEditor({
  rows,
  onChange,
  showAllErrors = false,
}: {
  rows: EditorMultiplierRow[];
  onChange: (rows: EditorMultiplierRow[]) => void;
  showAllErrors?: boolean;
}) {
  const validation = validateMultiplierRows(rows);
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
    validation.status === 'exact' ? undefined : validation.status === 'under' ? 'warning' : 'error';
  // Multiplier sectors are always positional → always drag-reorderable (kebab Move stays the keyboard path).
  const { draggingIndex, rowProps, handleProps, liftedRowSx } = useRowReorder(rows, onChange);

  return (
    <Section
      title="Multiplier Sectors"
      aria-label="Multiplier sectors"
      isEdit
      bleed
      toolbar={
        <>
          <Button size="small" variant="text" startIcon={<AddIcon />} onClick={addRow}>
            Add Sector
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <Stack direction="row" spacing={4} sx={{ alignItems: 'flex-start' }}>
            <BeamStat label="Total probability" value={`${validation.total}%`} severity={severity} />
            <BeamStat label="Remaining" value={`${validation.remaining}%`} severity={severity} />
          </Stack>
        </>
      }
    >
      {/* Inset one-liners in the Section pad, ABOVE the bleeding table: the model description, then
          the aggregate error / empty-state (the table stays the direct bleed child — contract). */}
      <Typography variant="body2" color="text.secondary" sx={{ px: 2, pb: 1 }}>
        The selected multiplier applies to every reward in the independently selected payout sector.
      </Typography>
      {validation.aggregate && showError('aggregate') && rows.length > 0 && (
        <Typography variant="body2" color="error" role="alert" sx={{ px: 2, pb: 1 }}>
          {validation.aggregate}
        </Typography>
      )}
      {rows.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ px: 2, pb: 1 }} role={showError('aggregate') ? 'alert' : undefined}>
          No sectors yet — add at least one.
        </Typography>
      )}
      <Table
        size="small"
        aria-label="Multiplier sectors"
        sx={{ '& td, & th': { verticalAlign: 'top !important' } }}
      >
        <TableHead>
          <TableRow>
            <TableCell aria-label="Row actions" sx={{ width: '1%' }} />
            <TableCell align="right">Sector</TableCell>
            <TableCell align="right">Probability (%)</TableCell>
            <TableCell align="right">Multiplier</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => {
            const rowError = validation.rows[index];
            return (
              <TableRow key={row._key} {...rowProps(index)} sx={draggingIndex === index ? liftedRowSx : undefined}>
                {/* LEADING RAIL — the drag handle + the kebab (orderable → Move up/down). */}
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  <Stack direction="row" sx={{ alignItems: 'center' }}>
                    <RowDragHandle handleProps={handleProps} />
                    <RowActionsKebab
                      label="multiplier sector"
                      index={index}
                      count={rows.length}
                      orderable
                      onMoveUp={() => moveRow(index, -1)}
                      onMoveDown={() => moveRow(index, 1)}
                      onDelete={() => deleteRow(row._key)}
                    />
                  </Stack>
                </TableCell>
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
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Section>
  );
}
