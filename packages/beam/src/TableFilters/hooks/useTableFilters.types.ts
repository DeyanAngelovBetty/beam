// PORTED from official Beam (beam-alex @ b40e815) — verbatim shapes.
import type { TablePaginationState } from '../TableFilters.types';
import type { TableFiltersUrlSync } from '../TableFilters.helpers';

export type FilterApplyReason = 'apply' | 'clear';

export type UseTableFiltersOptions<TFilters extends object> = {
  initialValues: TFilters;
  initialPagination?: Partial<TablePaginationState>;
  onAppliedChange?: (filters: TFilters, reason: FilterApplyReason) => void;
  /**
   * Persist applied filters (and pagination) to the URL query string and restore them on first load.
   * Pass `true` for defaults, or an object to set a namespace / history strategy.
   */
  urlSync?: boolean | TableFiltersUrlSync;
};
