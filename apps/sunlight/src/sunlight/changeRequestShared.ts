import type { ChangeRequest } from './changeRequests';

/** Entity-type → human label. Grows with the ChangeRequestEntity union. */
export const ENTITY_LABEL: Record<ChangeRequest['entityType'], string> = { loyaltyStatus: 'Loyalty status' };

/** Short, human ID for display (the full `cr-<ts>-<seq>` is the key; this is the label). */
export const shortCrId = (id: string) => id.slice(-6);

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
