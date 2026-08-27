import { Stack, Box, Typography, Divider } from '@betty/beam';
import type { ChangeRequest } from './changeRequests';
import type { LoyaltyStatusDraft, StatusReward } from './loyaltyStatuses';
import { REASON_PLACEHOLDER } from './changeRequestShared';

/**
 * ProposedConfigSummary — the READ-ONLY rendering of what a change request proposes. ONE anatomy,
 * two homes: the approvals list's expanded row AND the CR detail route's "Proposed configuration".
 * No diff (parked, Figma-first design round) — the CR carries baseVersion + draft + history(), so a
 * live-vs-proposed comparison lands later with zero store changes.
 */
export function ProposedConfigSummary({ cr }: { cr: ChangeRequest }) {
  if (cr.entityType !== 'loyaltyStatus') return null;
  const d = cr.draft as LoyaltyStatusDraft;
  const fields: [string, string | number][] = [
    ['Name', d.name],
    ['Max days', d.maxDays],
    ['Gems', d.boxes],
    ['Retain status after gem #', d.keepGems],
    ['Retain boxes after', d.keepBoxes],
    ['Multiplier', d.multiplier],
  ];
  return (
    <Stack spacing={2} sx={{ maxWidth: 720 }}>
      <Typography variant="body2" color={cr.submitReason ? 'text.secondary' : 'text.disabled'} sx={cr.submitReason ? undefined : { fontStyle: 'italic' }}>
        {cr.submitReason || REASON_PLACEHOLDER}
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', columnGap: 3, rowGap: 0.5 }}>
        {fields.map(([label, value]) => (
          <Box key={label} sx={{ display: 'contents' }}>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="body2">{value}</Typography>
          </Box>
        ))}
      </Box>
      <Divider />
      <Typography variant="subtitle2" color="text.secondary">
        Proposed rewards ({d.rewards.length})
      </Typography>
      <Stack spacing={0.5}>
        {d.rewards.map((r: StatusReward) => (
          <Typography key={r.id} variant="body2">
            {r.pointsToClaim.toLocaleString()} pts → {r.rewardAmount.toLocaleString()} {r.rewardType} · {r.expiryHours}h
          </Typography>
        ))}
      </Stack>
    </Stack>
  );
}
