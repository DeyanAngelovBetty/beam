import { useRef } from 'react';
import type { SerializedDockview } from 'dockview-react'; // SPIKE: remove if Variant 1 wins

/**
 * Stub persistence for the dockview bench. A real implementation would round-
 * trip the serialized layout through an API or localStorage keyed per user;
 * this keeps it in-memory (a ref) so the bench proves the toJSON/fromJSON wiring
 * without a backend. Dummy only.
 */
export function useDockPersistence(_key: string) {
  const store = useRef<SerializedDockview | null>(null);
  return {
    save: (layout: SerializedDockview) => {
      store.current = layout;
    },
    load: (): SerializedDockview | null => store.current,
  };
}
