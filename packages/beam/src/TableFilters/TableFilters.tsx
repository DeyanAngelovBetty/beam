// PORTED from official Beam (beam-alex @ b40e815) — TableFilters/TableFilters.tsx. Structure, grid, and
// Filter/Clear buttons are faithful. One flagged deviation: the `dateTime` control renders a native
// `<TextField type="datetime-local">` because official's `DateTimePicker` (Localization suite) isn't ported.
import { Box, Button, MenuItem, Paper, TextField } from '@mui/material';
import { memo, useCallback, type FormEventHandler } from 'react';
import type { TableFilterDefinition, TableFiltersController } from './TableFilters.types';

/**
 * Filter bar driven by a typed filter shape. `definitions` describe the controls (their keys are
 * constrained to `TFilters`); `controller` holds draft state and apply/clear — build it with the
 * `useTableFilters` hook. Set `applying` while a server query is in flight.
 */
export type TableFiltersProps<TFilters extends object> = {
  /** One control definition per filter key you want to expose. */
  definitions: readonly TableFilterDefinition<TFilters>[];
  /** Draft state + apply/clear, typically from `useTableFilters`. */
  controller: TableFiltersController<TFilters>;
  /** Disables inputs while an apply is in flight (server-side filtering). */
  applying?: boolean;
};

function TableFiltersInner<TFilters extends object>({
  definitions,
  controller,
  applying = false,
}: TableFiltersProps<TFilters>) {
  const { draft: values, setDraftValue: onValueChange, apply: onApply, clear: onClear, canClear, isDraft } = controller;

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    onApply();
  };

  const renderFilter = useCallback(
    (definition: TableFilterDefinition<TFilters>) => {
      const value = values[definition.key];

      if (definition.control === 'text') {
        return (
          <TextField
            key={definition.key}
            placeholder={definition.placeholder || definition.label}
            value={value}
            disabled={definition.disabled || applying}
            size="small"
            fullWidth
            onChange={(event) => onValueChange(definition.key, event.target.value as TFilters[typeof definition.key])}
          />
        );
      }

      if (definition.control === 'dateTime') {
        return (
          <TextField
            key={definition.key}
            type="datetime-local"
            label={definition.label}
            value={(value as string | null) ?? ''}
            disabled={definition.disabled || applying}
            size="small"
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
            onChange={(event) => onValueChange(definition.key, event.target.value as TFilters[typeof definition.key])}
          />
        );
      }

      const selectedIndex = definition.options.findIndex((option) => Object.is(option.value, value));

      return (
        <TextField
          key={definition.key}
          select
          label={definition.label}
          value={selectedIndex < 0 ? '' : selectedIndex}
          disabled={definition.disabled || applying}
          size="small"
          fullWidth
          onChange={(event) => {
            const option = definition.options[Number(event.target.value)];
            if (option) onValueChange(definition.key, option.value as TFilters[typeof definition.key]);
          }}
        >
          {definition.options.map((option, index) => (
            <MenuItem key={`${definition.key}-${index}`} value={index}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      );
    },
    [applying, onValueChange, values],
  );

  return (
    <Paper
      component="form"
      onSubmit={handleSubmit}
      variant="outlined"
      sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}
    >
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' },
        }}
      >
        {definitions.map(renderFilter)}
      </Box>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <Button variant={isDraft ? 'contained' : 'outlined'} loading={applying} type="submit">
          Filter
        </Button>
        <Button variant="text" onClick={onClear} disabled={!canClear || applying} type="button">
          Clear All
        </Button>
      </Box>
    </Paper>
  );
}

// memo cast preserves the generic signature (official's pattern).
export const TableFilters = memo(TableFiltersInner) as typeof TableFiltersInner;
