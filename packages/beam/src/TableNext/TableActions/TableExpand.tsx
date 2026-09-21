import IconButton from '@mui/material/IconButton';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { memo, type MouseEventHandler } from 'react';

// PORTED from official Beam (beam-alex @ b40e815) `Table/TableActions/TableExpand`.
const TableExpand = ({ isExpanded, onClick }: { isExpanded: boolean; onClick: MouseEventHandler<HTMLButtonElement> }) => (
  <IconButton size="small" onClick={onClick} sx={{ opacity: 0.7 }}>
    <KeyboardArrowRightIcon
      fontSize="small"
      sx={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.3s cubic-bezier(.17,.01,0,1.01)' }}
    />
  </IconButton>
);

export default memo(TableExpand);
