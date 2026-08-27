import type { ChangeRequest } from './changeRequests';

/** Entity-type → human label. Grows with the ChangeRequestEntity union. */
export const ENTITY_LABEL: Record<ChangeRequest['entityType'], string> = { loyaltyStatus: 'Loyalty status' };

export type CrActionKind = 'approve' | 'reject' | 'cancel';

/**
 * The actor-relative action set — the recorded vocabulary ruling in one derivation, used by BOTH
 * the detail page and the list kebab so they never diverge. Actions follow the actor's RELATIONSHIP
 * to the CR, not a fixed reviewer toolbar with some buttons greyed out:
 *   - archived (any non-pending)      → []           (browse-only)
 *   - own + pending    (requester)    → ['cancel']   (retract your own proposal)
 *   - other + pending  (approver)     → ['approve', 'reject']
 * The maker never sees a disabled Approve/Reject — the page offers what the actor can actually do.
 */
export function crActionsFor(cr: ChangeRequest, me: string): CrActionKind[] {
  if (cr.status !== 'pending') return [];
  return cr.submittedBy === me ? ['cancel'] : ['approve', 'reject'];
}

/** Short, human ID for display (the full `cr-<ts>-<seq>` is the key; this is the label). */
export const shortCrId = (id: string) => id.slice(-6);

/** submitReason is optional (grammar §4). Surfaces that show it render this quiet placeholder when
 *  it's absent — never a blank-looking layout. */
export const REASON_PLACEHOLDER = 'No description';

/** Approve/reject failure → an operator-facing sentence. Shared by the list + detail surfaces. */
export function reasonMessage(reason: string, cr: ChangeRequest): string {
  switch (reason) {
    case 'conflict':
      return `The live ${ENTITY_LABEL[cr.entityType].toLowerCase()} changed since this request was made; it can't be applied. Ask the submitter to redo it.`;
    case 'forbidden':
      return 'You submitted this change — a different reviewer must approve it.';
    case 'unregistered':
      return 'This entity type is not registered (the entity store was not imported). A dev-wiring gap, not a data problem.';
    default:
      return 'This request is no longer pending.';
  }
}
