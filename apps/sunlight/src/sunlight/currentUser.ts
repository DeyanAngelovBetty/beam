/**
 * currentUser — the simplest honest four-eyes mechanism for the demo. A module-level
 * "who am I right now", flipped by a visible dev switcher on the approvals page, so
 * submitter ≠ reviewer is demonstrable end to end rather than faked: submit as the maker,
 * switch to the checker, approve.
 *
 * Read at ACTION time (submit / approve click), never at render — so no global
 * reactivity is needed; only the switcher's own display uses local state. Replaced by
 * real auth later; nothing else depends on the shape beyond `.name`.
 *
 * Default is the CHECKER: the store seeds one pending CR authored by the maker, so the
 * out-of-the-box state is a request the current user CAN act on — not a disabled button.
 */
export interface DemoUser {
  id: string;
  name: string;
  role: 'maker' | 'checker';
}

export const DEMO_USERS: DemoUser[] = [
  { id: 'maja', name: 'Maja Novak', role: 'maker' },
  { id: 'ravi', name: 'Ravi Patel', role: 'checker' },
];

export const DEMO_MAKER = DEMO_USERS.find((u) => u.role === 'maker')!;
export const DEMO_CHECKER = DEMO_USERS.find((u) => u.role === 'checker')!;

let current: DemoUser = DEMO_CHECKER; // default = checker (see file header)

export function getCurrentUser(): DemoUser {
  return current;
}

export function setCurrentUser(id: string): void {
  const next = DEMO_USERS.find((u) => u.id === id);
  if (next) current = next;
}
