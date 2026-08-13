import { useState } from 'react';
import { Typography, Stack, BeamDataTable } from '@betty/beam';
import type { BeamColumn } from '@betty/beam';
import { NextGemPanel } from './NextGemPanel';
import type { LoyaltyStatus, StatusReward } from './loyaltyStatuses';

/**
 * The READ-ONLY loyalty anatomy — rewards table (left) + NextGemPanel companion (right),
 * hover-linked. ONE anatomy, TWO homes: the list page's expanded row AND the detail page's VIEW
 * mode both render this, so "view" reads identically whether you glance from the list or open the
 * record. The editable twin is LoyaltyRewardsEditor (edit mode).
 */
export const rewardColumns: BeamColumn<StatusReward>[] = [
  { key: 'points', header: 'points to next gem', render: (r) => r.pointsToClaim.toLocaleString(), getValue: (r) => r.pointsToClaim },
  { key: 'type', header: 'Reward type', render: (r) => r.rewardType },
  { key: 'amount', header: 'Reward amount', align: 'right', render: (r) => r.rewardAmount.toLocaleString(), getValue: (r) => r.rewardAmount },
  { key: 'expiry', header: 'Expiry hours', align: 'right', render: (r) => r.expiryHours },
];

export function ExpandedLoyaltyPanel({ status, next }: { status: LoyaltyStatus; next?: LoyaltyStatus }) {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const rewards = status.rewards;

  return (
    // Table-left / panel-right (both modes, one anatomy): the rewards table is the primary record
    // and scanning starts left; the gem panel is a companion annex on the right. On xs it stacks.
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={6} sx={{ alignItems: { md: 'flex-start' } }}>
      <Stack spacing={1} sx={{ flex: 1, maxWidth: 720 }}>
        <Typography variant="subtitle2" color="text.secondary">
          {status.name} — claimable rewards
        </Typography>
        <BeamDataTable
          columns={rewardColumns}
          rows={rewards}
          getRowId={(rw) => rw.id}
          highlightRowId={hoverId}
          onRowHover={setHoverId}
          emptyMessage="No rewards configured for this status."
          aria-label={`Rewards for ${status.name}`}
        />
      </Stack>
      <NextGemPanel
        currentGem={status.gem}
        nextStatus={next ? { gem: next.gem, name: next.name, assignedOnly: next.gem === 'vip' } : undefined}
        milestoneCost={rewards[0]?.pointsToClaim ?? 2000}
        milestones={rewards.map((rw) => ({ id: rw.id }))}
        highlightId={hoverId}
        onMilestoneHover={setHoverId}
      />
    </Stack>
  );
}
