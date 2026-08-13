import { Chip } from '@betty/beam';
import type { ChangeRequestStatus } from './changeRequests';

/**
 * CR-status pigments — a PAGE-LOCAL vocabulary, deliberately NOT BeamStatus (changeRequests.ts
 * declares CR lifecycle "NOT BeamStatus — no design-vocabulary implications"). Mirrors only the
 * BeamStatusBadge *mechanism*: word → semantic-token colour → MUI Chip (theme picks the hex).
 */
const CR_STATUS_COLOR: Record<ChangeRequestStatus, 'info' | 'success' | 'error' | 'default'> = {
  pending: 'info',
  approved: 'success',
  rejected: 'error',
  superseded: 'default',
};
const CR_STATUS_LABEL: Record<ChangeRequestStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  superseded: 'Superseded',
};

export function CRStatusChip({ status, size = 'small' }: { status: ChangeRequestStatus; size?: 'small' | 'medium' }) {
  return <Chip label={CR_STATUS_LABEL[status]} color={CR_STATUS_COLOR[status]} size={size} variant="outlined" />;
}

/**
 * Operation chip — STATIC "Update". Our CR model is update-shaped only (a draft applied over a live
 * entity). Create / delete operations are a BACKEND-ALIGNMENT question (Tzeno's reference shows
 * them); we don't invent them here. See the alignment list in the task report.
 */
export function OperationChip({ size = 'small' }: { size?: 'small' | 'medium' }) {
  return <Chip label="Update" size={size} variant="outlined" />;
}
