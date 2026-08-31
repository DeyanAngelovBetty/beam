import { memo, useMemo } from 'react';
import { Box, Paper, Typography, GemIcon, BeamStat } from '@betty/beam';
import diff from 'microdiff';
import type { ChangeRequest } from './changeRequests';
import type { LoyaltyStatusDraft } from './loyaltyStatuses';
import { ChangeValue } from './ChangeValue';
import { LoyaltyRewardsDeltaTable } from './LoyaltyRewardsDeltaTable';

/**
 * LoyaltyStatusDeltaPanel — FAITHFUL PORT of official Sunlight's LoyaltyStatusEditPresenter (+ its
 * LoyaltyStatusApproval wrapper and StatusApprovalHeader), Alex. The entity's review layout rendered
 * as per-cell old→new deltas: a description line, a gem+name meta header, a responsive grid of the
 * CHANGED scalar fields (each a BeamStat whose value is a ChangeValue), then the positional rewards
 * diff table. See docs/approval-grammar.md "Presentation" for provenance + open items.
 *
 * SCALARS ARE DIFFED KEYED — microdiff over a FIXED flat projection (`scalarsOf`), so each change is
 * addressed by field name; unchanged scalars are omitted entirely and there is no positional cascade.
 * (The rewards table, by contrast, is positional — open item (a).) Ported as-is; only imports, our
 * field names/labels, and the optional-baseSnapshot guard are mechanical adaptations.
 */
const scalarsOf = (d: LoyaltyStatusDraft) => ({
  maxDays: d.maxDays,
  boxes: d.boxes,
  keepGems: d.keepGems,
  keepBoxes: d.keepBoxes,
  multiplier: d.multiplier,
});

const fieldLabels: Record<string, string> = {
  maxDays: 'Max days to complete',
  boxes: 'Gems',
  keepGems: 'Retain status after gem #',
  keepBoxes: 'Retain boxes after',
  multiplier: 'Multiplier on level up',
};

const formatScalar = (value: unknown) => (value === null || value === undefined ? '—' : String(value));

function LoyaltyStatusDeltaPanelBase({ cr }: { cr: ChangeRequest }) {
  const before = cr.baseSnapshot as LoyaltyStatusDraft | undefined;
  const after = cr.draft as LoyaltyStatusDraft;

  const scalarChanges = useMemo(
    () => (before ? diff(scalarsOf(before), scalarsOf(after)) : []),
    [before, after],
  );

  // Mechanical guard (our data plumbing): this panel only handles loyalty statuses, and the CR's
  // baseSnapshot is optional — with no before-state there's no delta to render (ConfigDiffPanel's own
  // "snapshot unavailable" fallback still covers that case below it).
  if (cr.entityType !== 'loyaltyStatus' || !before) return null;

  const showRewards = (before.rewards?.length ?? 0) > 0 || (after.rewards?.length ?? 0) > 0;

  return (
    <Paper elevation={0} sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
        {cr.submitReason || 'No description provided.'}
      </Typography>

      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <GemIcon gem={after.gem} size={30} />
        <Typography variant="body1">{cr.entityName}</Typography>
      </Box>

      {scalarChanges.length > 0 && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' },
            gap: 2,
          }}
        >
          {scalarChanges.map((change) => {
            const field = change.path.join('.');
            const oldValue = change.type === 'CREATE' ? undefined : change.oldValue;
            const newValue = change.type === 'REMOVE' ? undefined : change.value;

            return (
              <BeamStat
                key={field}
                label={fieldLabels[field] ?? field}
                value={<ChangeValue changed before={formatScalar(oldValue)} after={formatScalar(newValue)} />}
              />
            );
          })}
        </Box>
      )}

      {showRewards && <LoyaltyRewardsDeltaTable before={before.rewards ?? []} after={after.rewards ?? []} />}
    </Paper>
  );
}

export const LoyaltyStatusDeltaPanel = memo(LoyaltyStatusDeltaPanelBase);
