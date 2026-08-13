import { Chip } from '@betty/beam';
import { NODE_KIND_LABEL, type NodeKind } from '../ruleSetStore';

/**
 * Page-LOCAL node-kind vocabulary (NOT BeamStatus — BEAM.md §6.4). Three words + pigments,
 * mirroring the BeamStatusBadge *mechanism* only: a word → SEMANTIC-token name → MUI Chip color
 * prop (the theme picks the hex per mode; never a literal). A traffic-light read of the flow:
 *
 *   sequence → info    (structural / the entry — neutral)
 *   condition → warning (a gate / a decision)
 *   action → success   (terminal — it does something)
 *
 * Constraint carried from sign-off (a): render-time ADVISORIES must NOT reuse `warning`, or every
 * condition node reads as troubled. Advisories live on RuleNodeCard as an ERROR-pigment icon badge
 * — a distinct treatment, so real advisories never blend into the warning-pigmented conditions.
 */
const KIND_COLOR: Record<NodeKind, 'info' | 'warning' | 'success'> = {
  sequence: 'info',
  condition: 'warning',
  action: 'success',
};

export function NodeKindChip({ kind, size = 'small' }: { kind: NodeKind; size?: 'small' | 'medium' }) {
  return <Chip label={NODE_KIND_LABEL[kind]} color={KIND_COLOR[kind]} size={size} />;
}
