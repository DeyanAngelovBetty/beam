import { useMemo } from 'react';
import type { ColumnOrderState, VisibilityState, OnChangeFn } from '@tanstack/react-table';
import type { BeamColumn, BeamColumnManagerConfig } from './Table.types';
import { useItemManager, type ManagerItem } from '../useItemManager';

/**
 * useColumnManager — Table's opt-in column manager, now a THIN ADAPTER over the generic `useItemManager`
 * (2026-10-06). It maps `BeamColumn` → `ManagerItem` and the generic order/visibility back onto TanStack's
 * `ColumnOrderState`/`VisibilityState`/`OnChangeFn`. All the state + merge + persistence logic lives in
 * `useItemManager`; the dashboard widget manager shares it. Persists to the SAME key as before —
 * `beam:grid:<storageKey>:columns:v1` (kind `'columns'`) — so saved layouts survive this refactor.
 */

export interface ColumnManagerState {
  enabled: boolean;
  catalog: { id: string; label: string }[];
  columnOrder: ColumnOrderState;
  columnVisibility: VisibilityState;
  onColumnOrderChange: OnChangeFn<ColumnOrderState>;
  onColumnVisibilityChange: OnChangeFn<VisibilityState>;
  reset: () => void;
}

export function useColumnManager<Row>(
  columns: BeamColumn<Row>[],
  config?: BeamColumnManagerConfig
): ColumnManagerState {
  const items = useMemo<ManagerItem[]>(
    () => columns.map((c) => ({ id: c.key, defaultHidden: c.defaultHidden })),
    [columns]
  );
  const m = useItemManager(items, config && { storageKey: config.storageKey, kind: 'columns', catalog: config.catalog });

  return {
    enabled: m.enabled,
    catalog: m.catalog,
    columnOrder: m.order,
    columnVisibility: m.visibility,
    // The generic ItemOnChange<T> is structurally TanStack's OnChangeFn<T> (updater value|fn); cast across.
    onColumnOrderChange: m.onOrderChange as OnChangeFn<ColumnOrderState>,
    onColumnVisibilityChange: m.onVisibilityChange as OnChangeFn<VisibilityState>,
    reset: m.reset,
  };
}
