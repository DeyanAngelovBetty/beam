import { useMemo, useState, useCallback } from 'react';
import type { AddableField, BeamFilterAdvancedConfig } from './BeamFilterBar.types';

/**
 * useFilterFields — the add/remove/persist backbone for BeamFilterBar's advanced representation.
 *
 * DELIBERATELY parallels `useColumnManager` (BeamDataTable): the same opt-in-capability idiom — the
 * organism owns the STRUCTURE state + persistence, seeded from localStorage and merged against the
 * current `addableFields` so a saved panel survives a deploy that adds/removes addable fields. The page
 * owns the VALUES (draft/applied); removal bridges back via `config.onFieldRemoved`. Absent config ⇒
 * inert, and the bar renders exactly today's default representation.
 *
 * Storage: key `beam:filters:<storageKey>:fields:v1`, payload = ordered array of added field ids.
 * Values are NEVER persisted. The `:v1` suffix is the schema escape hatch — bump, don't migrate.
 */

const storageKeyFor = (storageKey: string) => `beam:filters:${storageKey}:fields:v1`;

function readPersisted(storageKey: string): string[] | null {
  try {
    const raw = localStorage.getItem(storageKeyFor(storageKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((x): x is string => typeof x === 'string');
  } catch {
    return null; // private mode, quota, malformed — treat as no persisted state
  }
}

function writePersisted(storageKey: string, ids: string[]) {
  try {
    localStorage.setItem(storageKeyFor(storageKey), JSON.stringify(ids));
  } catch {
    /* best-effort */
  }
}

/** Keep only ids that still exist as an ENABLED addable field (drop unknown/disabled silently), in
 *  the persisted order. Mirrors the column manager's drop-unknown merge posture. */
function mergeIds(addableFields: AddableField[], persisted: string[]): string[] {
  const addable = new Map(addableFields.map((f) => [f.id, f]));
  return persisted.filter((id) => {
    const f = addable.get(id);
    return Boolean(f) && !f!.disabled;
  });
}

export interface FilterFieldsState {
  enabled: boolean;
  /** Added fields, in order, for rendering (each with its `control` + an [x]). */
  addedFields: AddableField[];
  /** Addable fields NOT currently added — the [+] menu contents (disabled entries included). */
  menuFields: AddableField[];
  addField: (id: string) => void;
  removeField: (id: string) => void;
}

export function useFilterFields(config?: BeamFilterAdvancedConfig): FilterFieldsState {
  const enabled = Boolean(config);
  const storageKey = config?.storageKey ?? '';
  const addableFields = useMemo(() => config?.addableFields ?? [], [config]);

  const [addedIds, setAddedIds] = useState<string[]>(() =>
    enabled ? mergeIds(addableFields, readPersisted(storageKey) ?? []) : []
  );

  const persist = useCallback(
    (ids: string[]) => {
      if (enabled) writePersisted(storageKey, ids);
    },
    [enabled, storageKey]
  );

  const addField = useCallback(
    (id: string) => {
      const f = addableFields.find((x) => x.id === id);
      if (!f || f.disabled) return; // disabled entries are never addable
      setAddedIds((old) => {
        if (old.includes(id)) return old; // one instance per field
        const next = [...old, id];
        persist(next);
        return next;
      });
    },
    [addableFields, persist]
  );

  const removeField = useCallback(
    (id: string) => {
      setAddedIds((old) => {
        if (!old.includes(id)) return old;
        const next = old.filter((x) => x !== id);
        persist(next);
        return next;
      });
      config?.onFieldRemoved?.(id); // page clears the field's draft value(s)
    },
    [persist, config]
  );

  const byId = useMemo(() => new Map(addableFields.map((f) => [f.id, f])), [addableFields]);
  const addedFields = useMemo(
    () => addedIds.map((id) => byId.get(id)).filter((f): f is AddableField => Boolean(f)),
    [addedIds, byId]
  );
  const menuFields = useMemo(
    () => addableFields.filter((f) => !addedIds.includes(f.id)),
    [addableFields, addedIds]
  );

  return { enabled, addedFields, menuFields, addField, removeField };
}
