import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Box from '@mui/material/Box';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { memo, useState, type MouseEvent } from 'react';
import type { ActionMenuItem } from '../Table.types';

/**
 * TableMenu — PORTED from official Beam (`Table/TableActions/TableMenu` + `ActionMenu`), inlined so the
 * new Table port is self-contained and does not disturb our existing (controlled) `ActionMenu`. A kebab
 * trigger opening a menu of `ActionMenuItem`s; destructive items are grouped below a divider and tinted.
 */
const menuItemSx = (item: ActionMenuItem) => ({
  opacity: item.disabled ? 0.5 : 1,
  cursor: item.disabled ? 'default' : 'pointer',
  ...(item.destructive ? { color: 'error.main' } : {}),
});

function ItemBody({ item }: { item: ActionMenuItem }) {
  return (
    <Tooltip title={item.disabled ? item.disabledTooltip : item.tooltip}>
      <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', gap: 2 }}>
        {item.icon}
        {item.label}
      </Box>
    </Tooltip>
  );
}

const TableMenu = ({ menuItems }: { menuItems: ActionMenuItem[] }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);
  const close = () => setAnchorEl(null);
  if (menuItems.length === 0) return null;

  const normal = menuItems.filter((i) => !i.destructive);
  const destructive = menuItems.filter((i) => i.destructive);
  const select = (item: ActionMenuItem) => {
    if (item.disabled) return;
    close();
    item.onSelect();
  };

  return (
    <>
      <IconButton
        className="beam-kebab"
        size="small"
        aria-label="Row actions"
        onClick={(e: MouseEvent<HTMLElement>) => {
          e.stopPropagation();
          setAnchorEl(e.currentTarget);
        }}
        sx={{ opacity: 0.7 }}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={close} onClick={(e) => e.stopPropagation()}>
        {normal.map((item) => (
          <MenuItem key={item.id} onClick={() => select(item)} sx={menuItemSx(item)} aria-disabled={item.disabled || undefined}>
            <ItemBody item={item} />
          </MenuItem>
        ))}
        {normal.length > 0 && destructive.length > 0 && <Divider sx={{ borderColor: 'error.main', opacity: 0.4 }} />}
        {destructive.map((item) => (
          <MenuItem key={item.id} onClick={() => select(item)} sx={menuItemSx(item)} aria-disabled={item.disabled || undefined}>
            <ItemBody item={item} />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default memo(TableMenu);
