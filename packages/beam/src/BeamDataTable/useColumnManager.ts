import { useMemo, useState, useCallback } from 'react';
import type { ColumnOrderState, VisibilityState, OnChangeFn, Updater } from '@tanstack/react-table';
import type { BeamColumn, BeamColumnManagerConfig } from './BeamDataTable.types';

/**
 * useColumnManager — the state + persistence backbone for BeamDataTable's opt-in column manager.
 *
 * TanStack owns the actual table state (`columnVisibility`, `columnOrder`); this hook seeds it from
 * localStorage, persists user changes, and — the part that always goes wrong — MERGES a persisted
 * arrangement against the current column defs so a saved layout survives a deploy that adds/removes
 * columns. When `config` is absent the hook is inert and the table behaves exactly as before.
 *
 * Storage: key `beam:grid:<storageKey>:columns:v1`, payload `{ order: string[], hidden: string[] }`.
 * The `:v1` suffix is the schema escape hatch — bump it rather than migrating in place.
 */

interface Persisted {
  order: string[];
  hidden: string[];
}

const storageKeyFor = (storageKey: string) => `beam:grid:${storageKey}:columns:v1`;

function readPersisted(storageKey: string): Persisted | null {
  try {
    const raw = localStorage.getItem(storageKeyFor(storageKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;
    const { order, hidden } = parsed as Record<string, unknown>;
    if (!Array.isArray(order) || !Array.isArray(hidden)) return null;
    return {
      order: order.filter((x): x is string => typeof x === 'string'),
      hidden: hidden.filter((x): x is string => typeof x === 'string'),
    };
  } catch {
    return null; // private mode, quota, malformed JSON — treat as no persisted state
  }
}

function writePersisted(storageKey: string, value: Persisted) {
  try {
    localStorage.setItem(storageKeyFor(storageKey), JSON.stringify(value));
  } catch {
    /* ignore — persistence is best-effort */
  }
}

function clearPersisted(storageKey: string) {
  try {
    localStorage.removeItem(storageKeyFor(storageKey));
  } catch {
    /* ignore */
  }
}

/**
 * Merge persisted order against the declared ids: keep the user's order for ids that still exist
 * (drop unknown ids silently), and insert ids new to the persisted state at their DECLARED position
 * (right after their nearest earlier declared neighbour that's present). A user's arrangement survives
 * a deploy that adds a column; the new column still shows up where the defs put it.
 */
function mergeOrder(declaredIds: string[], persistedOrder: string[]): ColumnOrderState {
  const declaredSet = new Set(declaredIds);
  const result = persistedOrder.filter((id) => declaredSet.has(id));
  const present = new Set(result);
  declaredIds.forEach((id, idx) => {
    if (present.has(id)) return;
    let insertAt = 0; // no earlier neighbour present ⇒ before everything currently placed
    for (let j = idx - 1; j >= 0; j--) {
      const pos = result.indexOf(declaredIds[j]);
      if (pos !== -1) {
        insertAt = pos + 1;
        break;
      }
    }
    result.splice(insertAt, 0, id);
    present.add(id);
  });
  return result;
}

/**
 * Merge visibility: a known id obeys the persisted hidden set; an id new to the persisted state uses
 * its DECLARED default (`defaultHidden`). With no persisted state, every column takes its declared
 * default. TanStack visibility is `{ id: boolean }` where false = hidden.
 */
function mergeVisibility<Row>(columns: BeamColumn<Row>[], persisted: Persisted | null): VisibilityState {
  const known = persisted ? new Set(persisted.order) : null;
  const hiddenSet = persisted ? new Set(persisted.hidden) : null;
  const vis: VisibilityState = {};
  columns.forEach((c) => {
    const hidden = known && known.has(c.key) ? hiddenSet!.has(c.key) : Boolean(c.defaultHidden);
    vis[c.key] = !hidden;
  });
  return vis;
}

const applyUpdater = <T>(updater: Updater<T>, old: T): T =>
  typeof updater === 'function' ? (updater as (o: T) => T)(old) : updater;

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
  const enabled = Boolean(config);
  const storageKey = config?.storageKey ?? '';
  const declaredIds = useMemo(() => columns.map((c) => c.key), [columns]);

  // Seed once from persisted ⋈ declared. Columns are static within a session, so the merge runs at
  // mount; a deploy that changes the defs is a fresh mount, which re-merges against the new defs.
  const [columnOrder, setColumnOrderState] = useState<ColumnOrderState>(() =>
    enabled ? mergeOrder(declaredIds, readPersisted(storageKey)?.order ?? []) : []
  );
  const [columnVisibility, setColumnVisibilityState] = useState<VisibilityState>(() =>
    enabled ? mergeVisibility(columns, readPersisted(storageKey)) : {}
  );

  const persist = useCallback(
    (order: ColumnOrderState, visibility: VisibilityState) => {
      if (!enabled) return;
      const hidden = Object.keys(visibility).filter((id) => visibility[id] === false);
      writePersisted(storageKey, { order, hidden });
    },
    [enabled, storageKey]
  );

  const onColumnOrderChange = useCallback<OnChangeFn<ColumnOrderState>>(
    (updater) =>
      setColumnOrderState((old) => {
        const next = applyUpdater(updater, old);
        persist(next, columnVisibility);
        return next;
      }),
    [persist, columnVisibility]
  );

  const onColumnVisibilityChange = useCallback<OnChangeFn<VisibilityState>>(
    (updater) =>
      setColumnVisibilityState((old) => {
        const next = applyUpdater(updater, old);
        persist(columnOrder, next);
        return next;
      }),
    [persist, columnOrder]
  );

  const reset = useCallback(() => {
    clearPersisted(storageKey); // Reset clears storage AND returns to declared defaults…
    setColumnOrderState(mergeOrder(declaredIds, [])); // …declared order…
    setColumnVisibilityState(mergeVisibility(columns, null)); // …declared visibility. No re-persist.
  }, [storageKey, declaredIds, columns]);

  return {
    enabled,
    catalog: config?.catalog ?? [],
    columnOrder,
    columnVisibility,
    onColumnOrderChange,
    onColumnVisibilityChange,
    reset,
  };
}
