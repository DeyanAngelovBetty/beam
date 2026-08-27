import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box, Stack, Typography } from '@betty/beam';
import { ConfigDiffPanel } from './ConfigDiffPanel';
import type { ChangeRequest } from './changeRequests';
import type { LoyaltyStatusDraft } from './loyaltyStatuses';

/**
 * ConfigDiffPanel vetting bench — the design/a11y review surface (Lab tradition). Deyan checks
 * legibility of the tints over surfaces in BOTH schemes, the non-colour change markers, and
 * wrapping. Data is speculative (our CR model, not the backend team's contract) — that's the point.
 */
const meta: Meta<typeof ConfigDiffPanel> = {
  title: 'Lab/Sunlight/ConfigDiffPanel',
  component: ConfigDiffPanel,
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj<typeof ConfigDiffPanel>;

const base: LoyaltyStatusDraft = {
  id: 30,
  gem: 'topaz',
  name: 'Topaz',
  maxDays: '28',
  boxes: 5,
  keepBoxes: '∞',
  keepGems: '1',
  multiplier: 1.5,
  rewards: [
    { id: 'r1', pointsToClaim: 2000, rewardType: 'Coins', rewardAmount: 500, expiryHours: 24 },
    { id: 'r2', pointsToClaim: 4000, rewardType: 'Free Spins', rewardAmount: 10, expiryHours: 48 },
  ],
};

const mkCr = (snapshot: LoyaltyStatusDraft | undefined, draft: LoyaltyStatusDraft): ChangeRequest => ({
  id: 'cr-demo-1',
  entityType: 'loyaltyStatus',
  entityId: '30',
  entityName: draft.name,
  baseVersion: 1,
  baseSnapshot: snapshot,
  draft,
  status: 'pending',
  submittedBy: 'Maja Novak',
  submittedAt: '2026-08-11T10:00:00.000Z',
  submitReason: 'Diff-panel demo fixture.',
  seenBy: {},
});

const few = mkCr(base, {
  ...base,
  multiplier: 1.75,
  rewards: [{ ...base.rewards[0], rewardAmount: 600 }, base.rewards[1]],
});

const many = mkCr(base, {
  ...base,
  name: 'Topaz Elite',
  maxDays: '21',
  boxes: 6,
  keepGems: '2',
  multiplier: 2,
  rewards: [
    { ...base.rewards[0], rewardAmount: 800 }, // changed
    { id: 'r3', pointsToClaim: 6000, rewardType: 'Jackpot Token', rewardAmount: 1, expiryHours: 72 }, // added; r2 removed
  ],
});

const longValues = mkCr(base, {
  ...base,
  name: 'Topaz — Autumn Promotion (Ontario, high-roller cohort, reviewed 2026)',
  rewards: [
    { ...base.rewards[0], rewardType: 'Coins + Loyalty Multiplier Boost (stacked, weekend only)', rewardAmount: 12500 },
    base.rewards[1],
  ],
});

/** A handful of changed fields + one changed reward. */
export const ChangedFew: Story = { render: () => <Box sx={{ maxWidth: 760 }}><ConfigDiffPanel cr={few} /></Box> };

/** Many fields + a reward added and one removed. */
export const ChangedMany: Story = { render: () => <Box sx={{ maxWidth: 760 }}><ConfigDiffPanel cr={many} /></Box> };

/** No frozen snapshot → the info-notice fallback + proposed-only. */
export const NoSnapshotFallback: Story = { render: () => <Box sx={{ maxWidth: 760 }}><ConfigDiffPanel cr={mkCr(undefined, few.draft as LoyaltyStatusDraft)} /></Box> };

/** Long values — wrapping legibility inside the tinted cells. */
export const LongValues: Story = { render: () => <Box sx={{ maxWidth: 760 }}><ConfigDiffPanel cr={longValues} /></Box> };

/** Both schemes at once — tint contrast side by side (data-beam-mode scopes the palette vars). */
export const BothSchemes: Story = {
  render: () => (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
      {(['light', 'dark'] as const).map((mode) => (
        <Box key={mode} data-beam-mode={mode} sx={{ flex: 1, minWidth: 340, p: 2, backgroundColor: 'var(--mui-palette-background-default)', borderRadius: 2 }}>
          <Typography variant="overline" color="text.secondary">{mode}</Typography>
          <ConfigDiffPanel cr={many} />
        </Box>
      ))}
    </Stack>
  ),
};
