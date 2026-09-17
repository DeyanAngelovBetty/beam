// PORTED from official Beam (beam-alex @ b40e815) — TableFilters/TableFilters.helpers.ts.
// Two flagged deviations from the faithful port:
//  1) URL I/O: official mutates `window.location.search` via `window.history` — DEAD under our HashRouter
//     (query params live in the hash). Per the Wave-1 ruling, the read/write-to-URL is reimplemented via
//     react-router's `useSearchParams` inside the hook; here we keep only the PURE param logic (encode /
//     decode / diff-against-defaults), which operates on a plain `URLSearchParams`.
//  2) `lodash-es` isn't a dependency; `isEqual` is replaced with a JSON-based deep compare (filter values
//     are primitives or small option values — adequate; noted).

import type { TableFilterDefinition, TablePaginationState } from './TableFilters.types';

/** Identity helper that pins a filter definition array to a `TFilters` shape (verbatim from official). */
export const defineTableFilters = <TFilters extends object>(
  definitions: readonly TableFilterDefinition<TFilters>[],
): readonly TableFilterDefinition<TFilters>[] => definitions;

/** Configures how applied filters and pagination are mirrored to the URL query string (verbatim shape). */
export type TableFiltersUrlSync = {
  /** Prefix added to every param key, so several tables can share one URL. */
  namespace?: string;
  /** How the URL is updated when state changes. Defaults to `replace`. */
  history?: 'push' | 'replace';
};

export const PAGE_PARAM = 'page';
export const PAGE_SIZE_PARAM = 'pageSize';

const deepEqual = (a: unknown, b: unknown): boolean => a === b || JSON.stringify(a) === JSON.stringify(b);

export const paramKey = (key: string, namespace?: string) => (namespace ? `${namespace}.${key}` : key);

const encodeValue = (value: unknown): string =>
  typeof value === 'string' ? value : JSON.stringify(value);

const decodeValue = (raw: string, fallback: unknown): unknown => {
  switch (typeof fallback) {
    case 'string':
      return raw;
    case 'number': {
      const parsed = Number(raw);
      return Number.isFinite(parsed) ? parsed : fallback;
    }
    case 'boolean':
      return raw === 'true';
    default:
      try {
        return JSON.parse(raw);
      } catch {
        return raw;
      }
  }
};

/** Writes filter values into `params`, dropping any equal to its default (keeps shared links clean). */
export const setFilterParams = <TFilters extends object>(
  params: URLSearchParams,
  filters: TFilters,
  defaults: TFilters,
  namespace?: string,
): void => {
  for (const key of Object.keys(defaults) as (keyof TFilters)[]) {
    const name = paramKey(key as string, namespace);
    if (deepEqual(filters[key], defaults[key])) params.delete(name);
    else params.set(name, encodeValue(filters[key]));
  }
};

/** Writes page/pageSize into `params`, dropping any equal to its default. */
export const setPaginationParams = (
  params: URLSearchParams,
  pagination: TablePaginationState,
  defaults: TablePaginationState,
  namespace?: string,
): void => {
  const entries: [string, number][] = [
    [PAGE_PARAM, pagination.page],
    [PAGE_SIZE_PARAM, pagination.pageSize],
  ];
  const defaultsByParam: Record<string, number> = {
    [PAGE_PARAM]: defaults.page,
    [PAGE_SIZE_PARAM]: defaults.pageSize,
  };
  for (const [key, value] of entries) {
    const name = paramKey(key, namespace);
    if (value === defaultsByParam[key]) params.delete(name);
    else params.set(name, String(value));
  }
};

/** Reads the filter values encoded in `params`, restricted to the keys present in `initialValues`. */
export const readFiltersFromParams = <TFilters extends object>(
  initialValues: TFilters,
  params: URLSearchParams,
  namespace?: string,
): TFilters => {
  const result = { ...initialValues };
  for (const key of Object.keys(initialValues) as (keyof TFilters)[]) {
    const raw = params.get(paramKey(key as string, namespace));
    if (raw !== null) result[key] = decodeValue(raw, initialValues[key]) as TFilters[typeof key];
  }
  return result;
};

/** Reads page/pageSize from `params`, falling back to `defaults` when absent or invalid. */
export const readPaginationFromParams = (
  defaults: TablePaginationState,
  params: URLSearchParams,
  namespace?: string,
): TablePaginationState => {
  const read = (key: string, fallback: number) => {
    const raw = params.get(paramKey(key, namespace));
    if (raw === null) return fallback;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  return { page: read(PAGE_PARAM, defaults.page), pageSize: read(PAGE_SIZE_PARAM, defaults.pageSize) };
};
