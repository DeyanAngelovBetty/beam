import { memo, useMemo } from 'react';
import { BeamDataTable, type BeamColumn } from '@betty/beam';
import type { StatusReward } from './loyaltyStatuses';
import { ChangeValue } from './ChangeValue';

/**
 * LoyaltyRewardsDeltaTable — FAITHFUL PORT of official Sunlight's StatusBoxesDiffTable (Alex). Zips
 * before/after reward rows POSITIONALLY (index-based) and renders each cell through ChangeValue.
 *
 * PORTED AS-IS, cascade included: rows are paired by INDEX (before[i] vs after[i]) up to the longer
 * list, and the row id IS the index — so an inserted/removed row shifts every row below it and lights
 * them all up as false edits. This is logged as OPEN ITEM (a) in docs/approval-grammar.md
 * "Presentation" and is deliberately NOT fixed here. Mechanical adaptations only: MUI Table →
 * BeamDataTable, formatBettyCoins → toLocaleString, our reward field names.
 */
type BoxDiffRow = { index: number; before?: StatusReward; after?: StatusReward };

const columns: BeamColumn<BoxDiffRow>[] = [
  {
    key: 'pointsToClaim',
    header: 'Points To Next Gem',
    render: ({ before, after }) => (
      <ChangeValue
        changed={before?.pointsToClaim !== after?.pointsToClaim}
        before={before?.pointsToClaim}
        after={after?.pointsToClaim}
      />
    ),
  },
  {
    key: 'rewardType',
    header: 'Reward Type',
    render: ({ before, after }) => (
      <ChangeValue
        changed={before?.rewardType !== after?.rewardType}
        before={before?.rewardType}
        after={after?.rewardType}
      />
    ),
  },
  {
    key: 'rewardAmount',
    header: 'Reward Amount',
    render: ({ before, after }) => (
      <ChangeValue
        changed={before?.rewardAmount !== after?.rewardAmount}
        before={before ? before.rewardAmount.toLocaleString() : undefined}
        after={after ? after.rewardAmount.toLocaleString() : undefined}
      />
    ),
  },
];

const getRowId = (row: BoxDiffRow) => String(row.index);

function LoyaltyRewardsDeltaTableBase({ before, after }: { before: StatusReward[]; after: StatusReward[] }) {
  const rows = useMemo<BoxDiffRow[]>(() => {
    const length = Math.max(before.length, after.length);
    return Array.from({ length }, (_, index) => ({ index, before: before[index], after: after[index] }));
  }, [before, after]);

  return <BeamDataTable columns={columns} rows={rows} getRowId={getRowId} aria-label="Reward changes" />;
}

export const LoyaltyRewardsDeltaTable = memo(LoyaltyRewardsDeltaTableBase);
