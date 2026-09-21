import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Box from '@mui/material/Box';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { memo, useState, type MouseEvent } from 'react';
import type { ActionMenuItem } from '../Table.types';

/**
 * TableMenu — PORTED from official Beam (`Table/TableActions/TableMenu` + `ActionMenu`), inlined so the
 * new Table port is self-contained and does not disturb our existing (controlled) `ActionMenu`. A kebab
 * trigger opening a menu of `ActionMenuItem`s; destructive items are grouped below a divider and tinted.
 *
 * SUBMENU LANE (2b): an item with `options` opens a nested submenu (chevron), rather than firing `onSelect`
 * — mirroring the organism ActionMenu's submenu verbatim so Gaspar's row-kebab Export ▸ keeps today's exact
 * contents + order. Inert when `options` is absent (official-subset flat behaviour unchanged).
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

/** One menu row — a flat item (fires onSelect) or, when it carries `options`, a submenu trigger (chevron). */
function Item({ item, onClose }: { item: ActionMenuItem; onClose: () => void }) {
  const [subAnchor, setSubAnchor] = useState<HTMLElement | null>(null);

  if (item.options) {
    return (
      <>
        <MenuItem
          aria-disabled={item.disabled || undefined}
          onClick={(e) => { if (!item.disabled) setSubAnchor(e.currentTarget); }}
          sx={menuItemSx(item)}
        >
          <ItemBody item={item} />
          <ChevronRightIcon fontSize="small" sx={{ ml: 2, opacity: 0.6 }} />
        </MenuItem>
        <Menu
          anchorEl={subAnchor}
          open={Boolean(subAnchor)}
          onClose={() => setSubAnchor(null)}
          onClick={(e) => e.stopPropagation()}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          slotProps={{ list: { dense: true } }}
        >
          {item.options.map((opt) => (
            <MenuItem key={opt.id} onClick={() => { opt.onSelect(); setSubAnchor(null); onClose(); }}>
              {opt.label}
            </MenuItem>
          ))}
        </Menu>
      </>
    );
  }

  return (
    <MenuItem
      onClick={() => { if (item.disabled) return; onClose(); item.onSelect(); }}
      sx={menuItemSx(item)}
      aria-disabled={item.disabled || undefined}
    >
      <ItemBody item={item} />
    </MenuItem>
  );
}

const TableMenu = ({ menuItems }: { menuItems: ActionMenuItem[] }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);
  const close = () => setAnchorEl(null);
  if (menuItems.length === 0) return null;

  const normal = menuItems.filter((i) => !i.destructive);
  const destructive = menuItems.filter((i) => i.destructive);

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
          <Item key={item.id} item={item} onClose={close} />
        ))}
        {normal.length > 0 && destructive.length > 0 && <Divider sx={{ borderColor: 'error.main', opacity: 0.4 }} />}
        {destructive.map((item) => (
          <Item key={item.id} item={item} onClose={close} />
        ))}
      </Menu>
    </>
  );
};

export default memo(TableMenu);
