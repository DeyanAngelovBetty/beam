import { memo } from 'react';
import { BeamDataTable, type BeamColumn } from '@betty/beam';
import { getLoyaltyLevels, type LoyaltyLevel, type SchemeType } from './loyaltyLevels';

/**
 * LoyaltyLevelsList — ported from official Sunlight (LoyaltyLevelsList + its .table columns). The
 * level ladder for a scheme, as a paginated table. Mechanical adaptations: the source's RTK-Query
 * paged fetch → the local seed store; MUI `Table` (controlled pagination, stickyHeader, maxHeight) →
 * `BeamDataTable` (internal pagination). Columns are faithful (isSpecial stays out of the table, as
 * in the source — it rides along in the CSV export only).
 */
const columns: BeamColumn<LoyaltyLevel>[] = [
  { key: 'level', header: 'Level', getValue: (l) => l.level, render: (l) => l.level, width: 80 },
  { key: 'startPoints', header: 'Start XP', getValue: (l) => l.startPoints, render: (l) => l.startPoints.toLocaleString(), align: 'right', width: 110 },
  { key: 'endPoints', header: 'End XP', getValue: (l) => l.endPoints, render: (l) => l.endPoints.toLocaleString(), align: 'right', width: 110 },
  { key: 'prizeType', header: 'Prize Type', getValue: (l) => l.prizeType, render: (l) => l.prizeType },
  { key: 'prizeAmount', header: 'Prize Amount', getValue: (l) => l.prizeAmount, render: (l) => l.prizeAmount.toLocaleString(), align: 'right', width: 130 },
  { key: 'prizeDelivery', header: 'Prize Delivery', getValue: (l) => l.prizeDelivery, render: (l) => l.prizeDelivery },
  { key: 'expiryHours', header: 'Expiry Hours', getValue: (l) => l.expiryHours ?? 0, render: (l) => l.expiryHours ?? '—', align: 'right', width: 120 },
];

const getRowId = (level: LoyaltyLevel) => String(level.level);

function LoyaltyLevelsListBase({ schemeType }: { schemeType: SchemeType }) {
  return (
    <BeamDataTable
      columns={columns}
      rows={getLoyaltyLevels(schemeType)}
      getRowId={getRowId}
      paginated
      emptyMessage="No levels found."
      aria-label="Loyalty levels"
    />
  );
}

export const LoyaltyLevelsList = memo(LoyaltyLevelsListBase);
