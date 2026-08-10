import { useState } from 'react';
import {
  Typography,
  Stack,
  BeamDataTable,
  GemIcon,
  BeamPageHeader,
  BeamTabs,
  BeamStatusBadge,
} from '@betty/beam';
import type { BeamColumn, BeamTabItem } from '@betty/beam';
import { NextGemPanel } from './NextGemPanel';
import { RouterIdentityLink } from './RouterIdentityLink';
import { LOYALTY_STATUSES, type LoyaltyStatus, type StatusReward } from './loyaltyStatuses';
import { getPendingFor } from './changeRequests';

const rewardColumns: BeamColumn<StatusReward>[] = [
  { key: 'points', header: 'points to next gem', render: (r) => r.pointsToClaim.toLocaleString(), getValue: (r) => r.pointsToClaim },
  { key: 'type', header: 'Reward type', render: (r) => r.rewardType },
  { key: 'amount', header: 'Reward amount', align: 'right', render: (r) => r.rewardAmount.toLocaleString(), getValue: (r) => r.rewardAmount },
  { key: 'expiry', header: 'Expiry hours', align: 'right', render: (r) => r.expiryHours },
];

const TABS: BeamTabItem[] = [
  'Status', 'A Levels', 'B Levels', 'RTP Multipliers', 'Daily Gifts',
  'Wheel Settings', 'Status Perks', 'Onboarding Checklist', 'MetaGame Presets',
].map((label) => ({ id: label.toLowerCase().replace(/\s+/g, '-'), label }));

export function LoyaltyStatusPage() {
  const [tab, setTab] = useState(TABS[0].id);
  const columns: BeamColumn<LoyaltyStatus>[] = [
    { key: 'id', header: 'ID', render: (r) => r.id, getValue: (r) => r.id, width: 64 },
    {
      key: 'status',
      header: 'Loyalty status',
      getValue: (r) => r.name,
      // Identity cell → true link to the editor (the canonical page), list-grammar §2.
      // Row click still expands (tier 1) — the two affordances coexist.
      isIdentity: true,
      getHref: (r) => `${import.meta.env.BASE_URL}loyalty-status/${r.id}`,
      render: (r) => (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <GemIcon gem={r.gem} size={20} />
          <span>{r.name}</span>
        </Stack>
      ),
    },
    { key: 'maxDays', header: 'Max days to complete', render: (r) => r.maxDays, align: 'right', width: '140px' },
    { key: 'boxes', header: 'gems', render: (r) => r.boxes, align: 'right', width: '140px' },
    { key: 'keepGems', header: 'retain status after gem #', render: (r) => r.keepGems, align: 'right', width: '140px' },
    { key: 'multiplier', header: 'Multiplier on level up', render: (r) => r.multiplier, align: 'right', width: '140px' },
    {
      // Approval state, visible on the object (BEAM §8): a pending change request shows
      // Pending, otherwise empty. Calm by default; no "live" badge, no name mutation.
      key: 'approval',
      header: 'Approval',
      width: '120px',
      render: (r) => {
        const pending = getPendingFor(String(r.id));
        return pending ? <BeamStatusBadge status="pending" label="Pending" size="small" /> : null;
      },
    },
  ];

  return (
    <Stack spacing={3}>
      <BeamPageHeader title="Loyalty Status" />

      <BeamTabs items={TABS} value={tab} onChange={setTab} aria-label="Loyalty status sections" />

      <BeamDataTable
        columns={columns}
        rows={LOYALTY_STATUSES}
        getRowId={(r) => String(r.id)}
        LinkComponent={RouterIdentityLink}
        paginated
        renderExpanded={(r) => (
          <ExpandedLoyaltyPanel
            status={r}
            next={LOYALTY_STATUSES[LOYALTY_STATUSES.findIndex((s) => s.id === r.id) + 1]}
          />
        )}
        aria-label="Loyalty statuses"
      />
    </Stack>
  );
}

/**
 * Expanded row content: NextGemPanel + rewards table, hover-linked. Rewards now come from
 * the status's own `rewards` (owned by the entity store), not a separate REWARDS record.
 */
function ExpandedLoyaltyPanel({ status, next }: { status: LoyaltyStatus; next?: LoyaltyStatus }) {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const rewards = status.rewards;

  return (
    // Table-left / panel-right (both modes, one anatomy): the rewards table is the
    // primary record and scanning starts left; the gem panel is a companion annex on the
    // right. On xs the row stacks — table-first now. Hover linking (milestones ↔ rows)
    // is unchanged.
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
