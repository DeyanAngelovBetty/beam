import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Box from '@mui/material/Box';
import type { BeamRowAction, BeamRowMenuProps } from './BeamRowMenu.types';

function Item({ item, onClose }: { item: BeamRowAction; onClose: () => void }) {
  const menuItem = (
    <MenuItem
      disabled={item.disabled}
      onClick={() => {
        item.onSelect();
        onClose();
      }}
      sx={item.destructive ? { color: 'error.main' } : undefined}
    >
      {item.icon && (
        <ListItemIcon sx={item.destructive ? { color: 'error.main' } : undefined}>
          {item.icon}
        </ListItemIcon>
      )}
      <ListItemText>{item.label}</ListItemText>
    </MenuItem>
  );

  // A disabled MenuItem swallows pointer events, so the tooltip needs a live
  // wrapper element to hang off of.
  if (item.disabled && item.disabledReason) {
    return (
      <Tooltip title={item.disabledReason} placement="left">
        <Box component="span">{menuItem}</Box>
      </Tooltip>
    );
  }
  return menuItem;
}

export function BeamRowMenu({
  anchorEl,
  open,
  onClose,
  items,
  'aria-label': ariaLabel = 'Row actions',
}: BeamRowMenuProps) {
  const normal = items.filter((i) => !i.destructive);
  const destructive = items.filter((i) => i.destructive);

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      slotProps={{ list: { 'aria-label': ariaLabel, dense: true } }}
    >
      {normal.map((item) => (
        <Item key={item.id} item={item} onClose={onClose} />
      ))}
      {destructive.length > 0 && normal.length > 0 && (
        <Divider sx={{ borderColor: 'error.main', opacity: 0.4 }} />
      )}
      {destructive.map((item) => (
        <Item key={item.id} item={item} onClose={onClose} />
      ))}
    </Menu>
  );
}
