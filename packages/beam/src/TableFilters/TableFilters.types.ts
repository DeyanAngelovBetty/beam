// PORTED from official Beam (beam-alex @ b40e815) — TableFilters/TableFilters.types.ts, verbatim shapes.
// The typed filter-definition model: each control is keyed to a field of `TFilters`, so the definitions
// array can only reference real filter keys. Consumed by TableFilters + useTableFilters.

type FilterKey<TFilters> = Extract<keyof TFilters, string>;

type StringFilterKey<TFilters> = {
  [K in FilterKey<TFilters>]-?: TFilters[K] extends string ? K : never;
}[FilterKey<TFilters>];

type DateTimeFilterKey<TFilters> = {
  [K in FilterKey<TFilters>]-?: null extends TFilters[K]
    ? TFilters[K] extends string | null
      ? K
      : never
    : never;
}[FilterKey<TFilters>];

type BaseFilterDefinition<TKey extends PropertyKey> = {
  key: TKey;
  label: string;
  disabled?: boolean;
};

export type TextFilterDefinition<TFilters> = {
  [K in StringFilterKey<TFilters>]: BaseFilterDefinition<K> & {
    control: 'text';
    placeholder?: string;
  };
}[StringFilterKey<TFilters>];

export type SelectFilterDefinition<TFilters> = {
  [K in FilterKey<TFilters>]: BaseFilterDefinition<K> & {
    control: 'select';
    options: readonly {
      label: string;
      value: TFilters[K];
    }[];
  };
}[FilterKey<TFilters>];

export type DateTimeFilterDefinition<TFilters> = {
  [K in DateTimeFilterKey<TFilters>]: BaseFilterDefinition<K> & {
    control: 'dateTime';
  };
}[DateTimeFilterKey<TFilters>];

/** A single filter control — text, select, or dateTime — keyed to a field of `TFilters`. */
export type TableFilterDefinition<TFilters> =
  | TextFilterDefinition<TFilters>
  | SelectFilterDefinition<TFilters>
  | DateTimeFilterDefinition<TFilters>;

/** Draft-state controller for a filter bar. Produced by `useTableFilters`. */
export type TableFiltersController<TFilters extends object> = {
  /** Current (unapplied) filter values. */
  draft: TFilters;
  setDraftValue: <K extends keyof TFilters>(key: K, value: TFilters[K]) => void;
  /** Commit the draft (fires the consumer's query). */
  apply: () => void;
  /** Reset all filters to their empty state. */
  clear: () => void;
  /** Whether there is anything to clear. */
  canClear: boolean;
  /** Whether the draft differs from the applied state. */
  isDraft: boolean;
};

// Wave 2 (2a): the local copies are gone — `TablePaginationState`/`TablePaginationController` now live in
// the official-shape Table port and are re-exported here so existing importers are unaffected.
export type { TablePaginationState, TablePaginationController } from '../TableNext/Table.types';
