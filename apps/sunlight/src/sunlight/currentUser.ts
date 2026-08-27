import { useSyncExternalStore } from 'react';

/**
 * currentUser — the demo's four-eyes actor, now a REACTIVE module store. "Who am I right now",
 * flipped by a switcher that lives in the shell chrome (global), so submitter ≠ reviewer is
 * demonstrable end to end: submit as the maker, switch to the checker, approve.
 *
 * The actor is read both at ACTION time (submit/approve) AND at RENDER time now — the app-level
 * review alert must appear the instant you switch actor. So the store gained a tiny subscribe/emit
 * (the noted `useSyncExternalStore` shape) — no state library, just a listener Set.
 *
 * DEMO SCAFFOLDING, not architecture: the real integration target is the authenticated user + an
 * approve-type permission (auth + a permission-check model). Nothing else depends on the shape
 * beyond `.name` + `.id`. Default is the CHECKER, so the seeded maker's CR is actionable at once.
 */
export interface DemoUser {
  id: string;
  name: string;
  role: 'maker' | 'checker';
}

export const DEMO_USERS: DemoUser[] = [
  { id: 'maja', name: 'Maja Novak', role: 'maker' },
  { id: 'ivan', name: 'Ivan Horvat', role: 'maker' }, // second maker — parallel proposals (grammar §3)
  { id: 'ravi', name: 'Ravi Patel', role: 'checker' },
];

// Distinct initials (MN · IH · RP) so avatars/labels read apart. Two makers exercise the parallel
// model: competing pendings on one record, the checker chooses, the loser outdates.
export const DEMO_MAKER = DEMO_USERS.find((u) => u.id === 'maja')!; // maker1
export const DEMO_MAKER2 = DEMO_USERS.find((u) => u.id === 'ivan')!; // maker2
export const DEMO_CHECKER = DEMO_USERS.find((u) => u.role === 'checker')!;

let current: DemoUser = DEMO_CHECKER; // default = checker (see file header)
const listeners = new Set<() => void>();

export function getCurrentUser(): DemoUser {
  return current; // stable ref until setCurrentUser — a safe useSyncExternalStore snapshot
}

export function setCurrentUser(id: string): void {
  const next = DEMO_USERS.find((u) => u.id === id);
  if (next && next !== current) {
    current = next;
    listeners.forEach((l) => l());
  }
}

/** Subscribe to actor changes (the useSyncExternalStore contract). */
export function subscribeCurrentUser(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

/** Reactive read — re-renders on actor switch (chrome switcher, alert, any consumer). */
export function useCurrentUser(): DemoUser {
  return useSyncExternalStore(subscribeCurrentUser, getCurrentUser, getCurrentUser);
}
