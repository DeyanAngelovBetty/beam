import { useState } from 'react';
import {
  Typography,
  Stack,
  BeamDataTable,
  GemIcon,
  BeamPageHeader,
  BeamTabs,
} from '@betty/beam';
import type { GemName, BeamColumn, BeamTabItem } from '@betty/beam';
import { NextGemPanel } from './NextGemPanel';

interface LoyaltyStatus {
  id: number;
  gem: GemName;
  name: string;
  maxDays: string;
  boxes: number;
  keepBoxes: string;
  keepGems: string;
  multiplier: number;
}

interface StatusReward {
  id: string;
  pointsToClaim: number;
  rewardType: string;
  rewardAmount: number;
  expiryHours: number;
}

/** Claimable rewards per loyalty status — shape mirrors MetaGamePreset (ExpiryHours). */
const REWARDS: Record<number, StatusReward[]> = Object.fromEntries(
  [1, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((statusId, i) => [
    statusId,
    [1100, 770, 860, 950, 720].map((base, j) => ({
      id: `${statusId}-${j}`,
      pointsToClaim: 2000,
      rewardType: 'Coins',
      rewardAmount: base + i * 40,
      expiryHours: j % 2 === 0 ? 24 : 48,
    })),
  ])
);

const rewardColumns: BeamColumn<StatusReward>[] = [
  { key: 'points', header: 'points to next gem', render: (r) => r.pointsToClaim.toLocaleString(), getValue: (r) => r.pointsToClaim },
  { key: 'type', header: 'Reward type', render: (r) => r.rewardType },
  { key: 'amount', header: 'Reward amount', align: 'right', render: (r) => r.rewardAmount.toLocaleString(), getValue: (r) => r.rewardAmount },
  { key: 'expiry', header: 'Expiry hours', align: 'right', render: (r) => r.expiryHours },
];

const INF = '\u221E';
const STATUSES: LoyaltyStatus[] = [
  { id: 1, gem: 'member', name: 'Member', maxDays: INF, boxes: 1, keepBoxes: INF, keepGems: INF, multiplier: 1 },
  { id: 20, gem: 'amethyst', name: 'Amethyst', maxDays: '28', boxes: 5, keepBoxes: INF, keepGems: '1', multiplier: 1 },
  { id: 30, gem: 'topaz', name: 'Topaz', maxDays: '28', boxes: 6, keepBoxes: INF, keepGems: '1', multiplier: 1.5 },
  { id: 40, gem: 'aquamarine', name: 'Aquamarine', maxDays: '28', boxes: 8, keepBoxes: INF, keepGems: '1', multiplier: 1 },
  { id: 50, gem: 'opal', name: 'Opal', maxDays: '28', boxes: 8, keepBoxes: INF, keepGems: '2', multiplier: 1 },
  { id: 60, gem: 'emerald', name: 'Emerald', maxDays: '28', boxes: 8, keepBoxes: INF, keepGems: '1', multiplier: 1 },
  { id: 70, gem: 'ruby', name: 'Ruby', maxDays: '28', boxes: 8, keepBoxes: INF, keepGems: '2', multiplier: 1.4 },
  { id: 80, gem: 'sapphire', name: 'Sapphire', maxDays: '28', boxes: 8, keepBoxes: INF, keepGems: '2', multiplier: 1.6 },
  { id: 90, gem: 'diamond', name: 'Diamond', maxDays: '28', boxes: 8, keepBoxes: INF, keepGems: '4', multiplier: 2 },
  { id: 100, gem: 'vip', name: 'VIP', maxDays: '28', boxes: 12, keepBoxes: INF, keepGems: INF, multiplier: 2 },
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
  ];

  return (
    <Stack spacing={3}>
      <BeamPageHeader title="Loyalty Status" />

      <BeamTabs items={TABS} value={tab} onChange={setTab} aria-label="Loyalty status sections" />

      <BeamDataTable
        columns={columns}
        rows={STATUSES}
        getRowId={(r) => String(r.id)}
        paginated
        renderExpanded={(r) => (
          <ExpandedLoyaltyPanel
            status={r}
            next={STATUSES[STATUSES.findIndex((s) => s.id === r.id) + 1]}
          />
        )}
        aria-label="Loyalty statuses"
      />
    </Stack>
  );
}


/**
 * Expanded row content: NextGemPanel + rewards table, hover-linked.
 * Milestones are 1:1 with reward rows (same ids) — hovering either side
 * highlights the other. Extracted as a component so the shared hover
 * state has somewhere to live.
 */
function ExpandedLoyaltyPanel({ status, next }: { status: LoyaltyStatus; next?: LoyaltyStatus }) {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const rewards = REWARDS[status.id] ?? [];

  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={6} sx={{ alignItems: { md: 'flex-start' } }}>
      <NextGemPanel
        currentGem={status.gem}
        nextStatus={
          next
            ? { gem: next.gem, name: next.name, assignedOnly: next.gem === 'vip' }
            : undefined
        }
        milestoneCost={rewards[0]?.pointsToClaim ?? 2000}
        milestones={rewards.map((rw) => ({ id: rw.id }))}
        highlightId={hoverId}
        onMilestoneHover={setHoverId}
      />
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
    </Stack>
  );
}
