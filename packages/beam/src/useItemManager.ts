import { useMemo, useState, useCallback } from 'react';

/**
 * useItemManager — the generic show/hide + reorder + persistence backbone, generalized from Table's column
 * manager (2026-10-06). It owns an ORDER (string[]) and a VISIBILITY map ({id: boolean}) over a list of
 * identified items, seeds them from localStorage, persists changes, and — the part that always goes wrong —
 * MERGES a persisted arrangement against the CURRENT item list so a saved layout survives a deploy that
 * adds/removes items (new ids re-insert at their declared position; unknown ids drop silently).
 *
 * Two consumers today: Table columns (via `useColumnManager`, which adapts this to TanStack's types) and the
 * dashboard widget manager. Items are static within a session, so the merge runs at mount; a deploy that
 * changes the list is a fresh mount → a re-merge against the new list. When `config` is absent the hook is
 * inert.
 *
 * Storage: key `beam:grid:<storageKey>:<kind>:v1`, payload `{ order: string[], hidden: string[] }`. `kind`
 * namespaces the consumer (columns | widgets | …) so one storageKey can hold several managers; `:v1` is the
 * schema escape hatch — bump it rather than migrating in place.
 */

export interface ManagerItem {
  id: string;
  label?: string;
  defaultHidden?: boolean;
}

export interface ItemManagerConfig {
  storageKey: string;
  /** Namespaces the persisted slot (default `'items'`). Table columns pass `'columns'` for back-compat. */
  kind?: string;
  /** "Awaiting data" entries — shown in the UI but never toggled/reordered. */
  catalog?: { id: string; label: string }[];
}

/** A TanStack-compatible updater signature (value or old→new), kept dependency-free here. */
export type ItemOnChange<T> = (updater: T | ((old: T) => T)) => void;

export interface ItemManagerState {
  enabled: boolean;
  catalog: { id: string; label: string }[];
  order: string[];
  visibility: Record<string, boolean>;
  onOrderChange: ItemOnChange<string[]>;
  onVisibilityChange: ItemOnChange<Record<string, boolean>>;
  reset: () => void;
}

interface Persisted {
  order: string[];
  hidden: string[];
}

const storageKeyFor = (storageKey: string, kind: string) => `beam:grid:${storageKey}:${kind}:v1`;

function readPersisted(storageKey: string, kind: string): Persisted | null {
  try {
    const raw = localStorage.getItem(storageKeyFor(storageKey, kind));
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

function writePersisted(storageKey: string, kind: string, value: Persisted) {
  try {
    localStorage.setItem(storageKeyFor(storageKey, kind), JSON.stringify(value));
  } catch {
    /* ignore — persistence is best-effort */
  }
}

function clearPersisted(storageKey: string, kind: string) {
  try {
    localStorage.removeItem(storageKeyFor(storageKey, kind));
  } catch {
    /* ignore */
  }
}

/**
 * Merge persisted order against the declared ids: keep the user's order for ids that still exist (drop
 * unknown ids), and insert ids new to the persisted state at their DECLARED position (right after their
 * nearest earlier declared neighbour that's present). A saved arrangement survives a deploy that adds an item.
 */
export function mergeOrder(declaredIds: string[], persistedOrder: string[]): string[] {
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
 * Merge visibility: a known id obeys the persisted hidden set; an id new to the persisted state uses its
 * DECLARED default (`defaultHidden`). With no persisted state, every item takes its declared default.
 * Result is `{ id: boolean }` where false = hidden.
 */
function mergeVisibility(items: ManagerItem[], persisted: Persisted | null): Record<string, boolean> {
  const known = persisted ? new Set(persisted.order) : null;
  const hiddenSet = persisted ? new Set(persisted.hidden) : null;
  const vis: Record<string, boolean> = {};
  items.forEach((it) => {
    const hidden = known && known.has(it.id) ? hiddenSet!.has(it.id) : Boolean(it.defaultHidden);
    vis[it.id] = !hidden;
  });
  return vis;
}

const applyUpdater = <T>(updater: T | ((o: T) => T), old: T): T =>
  typeof updater === 'function' ? (updater as (o: T) => T)(old) : updater;

/**
 * bindItemManager — the glue from `ItemManagerState` to a `BeamItemManager`'s props (items + toggle/move/
 * reorder/reset). Generic (the Table does the same derivation inline today). `entries` give labels + the
 * declared fallback order. Enforces min-one-visible in the toggle (the UI also disables the last checkbox).
 */
export function bindItemManager(
  state: ItemManagerState,
  entries: { id: string; label: string }[]
): {
  items: { id: string; label: string; visible: boolean }[];
  onToggle: (id: string) => void;
  onMove: (id: string, dir: 'up' | 'down') => void;
  onReorder: (id: string, toIndex: number) => void;
  onReset: () => void;
} {
  const declaredIds = entries.map((e) => e.id);
  const labelFor = (id: string) => entries.find((e) => e.id === id)?.label ?? id;
  const ordered = state.order.length ? state.order : declaredIds;
  const items = ordered
    .filter((id) => declaredIds.includes(id))
    .map((id) => ({ id, label: labelFor(id), visible: state.visibility[id] !== false }));
  const visibleCount = items.filter((i) => i.visible).length;
  const onToggle = (id: string) =>
    state.onVisibilityChange((old) => {
      const nowVisible = old[id] !== false;
      if (nowVisible && visibleCount <= 1) return old; // keep at least one visible
      return { ...old, [id]: !nowVisible };
    });
  const onMove = (id: string, dir: 'up' | 'down') =>
    state.onOrderChange((old) => {
      const base = old.length ? [...old] : declaredIds.slice();
      const i = base.indexOf(id);
      const j = dir === 'up' ? i - 1 : i + 1;
      if (i < 0 || j < 0 || j >= base.length) return old;
      [base[i], base[j]] = [base[j], base[i]];
      return base;
    });
  const onReorder = (id: string, toIndex: number) =>
    state.onOrderChange((old) => {
      const base = old.length ? [...old] : declaredIds.slice();
      const from = base.indexOf(id);
      if (from < 0 || toIndex < 0 || toIndex >= base.length || toIndex === from) return old;
      base.splice(toIndex, 0, base.splice(from, 1)[0]);
      return base;
    });
  return { items, onToggle, onMove, onReorder, onReset: state.reset };
}

export function useItemManager(items: ManagerItem[], config?: ItemManagerConfig): ItemManagerState {
  const enabled = Boolean(config);
  const storageKey = config?.storageKey ?? '';
  const kind = config?.kind ?? 'items';
  const declaredIds = useMemo(() => items.map((it) => it.id), [items]);

  const [order, setOrder] = useState<string[]>(() =>
    enabled ? mergeOrder(declaredIds, readPersisted(storageKey, kind)?.order ?? []) : []
  );
  const [visibility, setVisibility] = useState<Record<string, boolean>>(() =>
    enabled ? mergeVisibility(items, readPersisted(storageKey, kind)) : {}
  );

  const persist = useCallback(
    (nextOrder: string[], nextVisibility: Record<string, boolean>) => {
      if (!enabled) return;
      const hidden = Object.keys(nextVisibility).filter((id) => nextVisibility[id] === false);
      writePersisted(storageKey, kind, { order: nextOrder, hidden });
    },
    [enabled, storageKey, kind]
  );

  const onOrderChange = useCallback<ItemOnChange<string[]>>(
    (updater) =>
      setOrder((old) => {
        const next = applyUpdater(updater, old);
        persist(next, visibility);
        return next;
      }),
    [persist, visibility]
  );

  const onVisibilityChange = useCallback<ItemOnChange<Record<string, boolean>>>(
    (updater) =>
      setVisibility((old) => {
        const next = applyUpdater(updater, old);
        persist(order, next);
        return next;
      }),
    [persist, order]
  );

  const reset = useCallback(() => {
    clearPersisted(storageKey, kind); // clear storage AND return to declared defaults
    setOrder(mergeOrder(declaredIds, []));
    setVisibility(mergeVisibility(items, null));
  }, [storageKey, kind, declaredIds, items]);

  return {
    enabled,
    catalog: config?.catalog ?? [],
    order,
    visibility,
    onOrderChange,
    onVisibilityChange,
    reset,
  };
}
