import Checkbox from '@mui/material/Checkbox';
import { memo, type MouseEventHandler } from 'react';

// PORTED from official Beam (beam-alex @ b40e815) `Table/TableActions/TableSelect`.
const TableSelect = ({
  isSelected,
  onClick,
  indeterminate,
}: {
  isSelected: boolean;
  onClick: MouseEventHandler<HTMLButtonElement>;
  indeterminate?: boolean;
}) => (
  <Checkbox
    checked={isSelected}
    indeterminate={indeterminate}
    onClick={onClick}
    slotProps={{
      root: {
        sx: {
          opacity: isSelected || indeterminate ? 1 : 0.7,
          ':active': { transform: 'scale(0.85)', transition: 'transform 0.2s ease' },
        },
      },
    }}
  />
);

export default memo(TableSelect);
