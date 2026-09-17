// PORTED from official Beam (beam-alex @ b40e815) — hook logic preserved (draft/applied, apply resets to
// page 1, clear, canClear, isDraft, pagination controller, back/forward sync). FLAGGED deviations:
//  • URL I/O uses react-router `useSearchParams` (Wave-1 ruling) instead of official's window.history on
//    location.search — correct under our HashRouter, and it mutates ONLY our filter + pagination params so
//    unrelated params (e.g. Gaspar's ?milestone) are never clobbered. This couples the hook to react-router
//    (a peerDependency); official's version was router-agnostic.
//  • DEFAULT_TABLE_PAGE_SIZE is local (official imports it from Table/Table.constants — Wave 2).
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { TablePaginationController, TablePaginationState } from '../TableFilters.types';
import type { UseTableFiltersOptions } from './useTableFilters.types';
import {
  readFiltersFromParams,
  readPaginationFromParams,
  setFilterParams,
  setPaginationParams,
  type TableFiltersUrlSync,
} from '../TableFilters.helpers';

const DEFAULT_TABLE_PAGE_SIZE = 10;
const eq = (a: unknown, b: unknown) => a === b || JSON.stringify(a) === JSON.stringify(b);

function useTableFilters<TFilters extends object>({
  initialValues,
  initialPagination,
  onAppliedChange,
  urlSync,
}: UseTableFiltersOptions<TFilters>) {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSyncOptions = useMemo<TableFiltersUrlSync | null>(
    () => (urlSync ? (urlSync === true ? {} : urlSync) : null),
    [urlSync],
  );
  const namespace = urlSyncOptions?.namespace;
  const historyMode = urlSyncOptions?.history ?? 'replace';

  const paginationDefaults = useMemo<TablePaginationState>(
    () => ({ page: initialPagination?.page ?? 1, pageSize: initialPagination?.pageSize ?? DEFAULT_TABLE_PAGE_SIZE }),
    [initialPagination?.page, initialPagination?.pageSize],
  );

  // Initial resolution from the URL (react-router searchParams = the hash query under HashRouter).
  const [resolvedInitial] = useState<TFilters>(() =>
    urlSyncOptions ? readFiltersFromParams(initialValues, searchParams, namespace) : initialValues,
  );
  const [draft, setDraft] = useState(resolvedInitial);
  const [applied, setApplied] = useState(resolvedInitial);
  const [paginationState, setPagination] = useState<TablePaginationState>(() =>
    urlSyncOptions ? readPaginationFromParams(paginationDefaults, searchParams, namespace) : paginationDefaults,
  );

  // Mutate ONLY our filter + pagination params, leaving unrelated params (e.g. ?milestone) intact.
  const writeUrl = useCallback(
    (nextFilters: TFilters, nextPagination: TablePaginationState) => {
      if (!urlSyncOptions) return;
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          setFilterParams(params, nextFilters, initialValues, namespace);
          setPaginationParams(params, nextPagination, paginationDefaults, namespace);
          return params;
        },
        { replace: historyMode === 'replace' },
      );
    },
    [urlSyncOptions, setSearchParams, initialValues, namespace, paginationDefaults, historyMode],
  );

  const canClear = useMemo(
    () => !eq(draft, initialValues) || !eq(applied, initialValues),
    [applied, draft, initialValues],
  );
  const isDraft = useMemo(() => !eq(draft, applied), [applied, draft]);

  const setDraftValue = useCallback(<K extends keyof TFilters>(key: K, value: TFilters[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  const apply = useCallback(() => {
    const resetPagination: TablePaginationState = { page: 1, pageSize: paginationState.pageSize };
    setApplied(draft);
    setPagination(resetPagination);
    writeUrl(draft, resetPagination);
    onAppliedChange?.(draft, 'apply');
  }, [draft, onAppliedChange, paginationState.pageSize, writeUrl]);

  const clear = useCallback(() => {
    const resetPagination: TablePaginationState = { page: 1, pageSize: paginationState.pageSize };
    setDraft(initialValues);
    setApplied(initialValues);
    setPagination(resetPagination);
    writeUrl(initialValues, resetPagination);
    onAppliedChange?.(initialValues, 'clear');
  }, [initialValues, onAppliedChange, paginationState.pageSize, writeUrl]);

  const resetDraft = useCallback(() => setDraft(applied), [applied]);

  const changePagination = useCallback(
    (next: TablePaginationState) => {
      setPagination(next);
      writeUrl(applied, next);
    },
    [applied, writeUrl],
  );

  const pagination = useMemo<TablePaginationController>(
    () => ({ ...paginationState, onChange: changePagination }),
    [paginationState, changePagination],
  );

  // Back/forward (or any external URL change): react-router re-renders with fresh searchParams. Sync
  // applied/draft/pagination FROM the URL, but only when it actually differs from our applied state — so our
  // own writes (which set applied first) don't loop or re-fire onAppliedChange.
  useEffect(() => {
    if (!urlSyncOptions) return;
    const urlFilters = readFiltersFromParams(initialValues, searchParams, namespace);
    if (eq(urlFilters, applied)) return;
    const urlPagination = readPaginationFromParams(paginationDefaults, searchParams, namespace);
    setDraft(urlFilters);
    setApplied(urlFilters);
    setPagination(urlPagination);
    onAppliedChange?.(urlFilters, 'apply');
  }, [searchParams, urlSyncOptions, initialValues, namespace, paginationDefaults, applied, onAppliedChange]);

  return { draft, applied, setDraftValue, apply, clear, resetDraft, canClear, isDraft, pagination };
}

export default useTableFilters;
