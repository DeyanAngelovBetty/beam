import { useState } from 'react';
import { useColorScheme, useTheme } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import ListSubheader from '@mui/material/ListSubheader';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import useMediaQuery from '@mui/material/useMediaQuery';
import MenuIcon from '@mui/icons-material/Menu';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { products, type BrandName } from '../theme/tokens';
import type { BeamAppShellProps, BeamNavItem } from './BeamAppShell.types';

const DRAWER_WIDTH = 264;

/** Jurisdiction labels are derived, not listed — see BeamAppShellProps.product. */
const label = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

function ModeToggle() {
  const { mode, setMode } = useColorScheme();
  const next = mode === 'dark' ? 'light' : 'dark';
  return (
    <IconButton onClick={() => setMode(next)} aria-label={`Switch to ${next} mode`} color="inherit">
      {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
    </IconButton>
  );
}

/** A flat, navigable leaf — used inside groups and sections. */
function NavLeaf({ item, inset = false }: { item: BeamNavItem; inset?: boolean }) {
  return (
    <ListItemButton selected={item.selected} onClick={item.onClick} sx={inset ? { pl: 4 } : undefined}>
      {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
      <ListItemText primary={item.label} />
    </ListItemButton>
  );
}

function NavItem({ item }: { item: BeamNavItem }) {
  const [open, setOpen] = useState(item.defaultOpen ?? false);
  const children = item.children ?? [];

  // A section: divider + non-clickable subheader, with flat leaves beneath.
  if (item.section) {
    return (
      <>
        <Divider sx={{ my: 1 }} />
        <ListSubheader disableSticky sx={{ bgcolor: 'transparent', letterSpacing: '0.06em' }}>
          {item.label}
        </ListSubheader>
        {children.map((child) => (
          <NavLeaf key={child.label} item={child} />
        ))}
      </>
    );
  }

  // A leaf: navigable, no sub-list.
  if (children.length === 0) {
    return <NavLeaf item={item} />;
  }

  // A collapsible group.
  return (
    <>
      <ListItemButton selected={item.selected} onClick={() => setOpen(!open)}>
        {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
        <ListItemText primary={item.label} />
        {open ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
      </ListItemButton>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <List dense disablePadding>
          {children.map((child) => (
            <NavLeaf key={child.label} item={child} inset />
          ))}
        </List>
      </Collapse>
    </>
  );
}

export function BeamAppShell({
  title,
  product,
  navItems,
  brand,
  onBrandChange,
  children,
}: BeamAppShellProps) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  // Offer exactly the jurisdictions this product defines — a new market added
  // in Figma reaches the switcher through the token sync, with no code change.
  const jurisdictions = Object.keys(products[product]) as BrandName[];

  const nav = (
    <>
      <Toolbar sx={{ px: 2.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '0.08em' }}>
          {title}
        </Typography>
      </Toolbar>
      <List dense component="nav" aria-label="Main navigation">
        {navItems.map((item) => (
          <NavItem key={item.label} item={item} />
        ))}
      </List>
    </>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        color="transparent"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: 'background.default',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Toolbar sx={{ gap: 1 }}>
          {!isDesktop && (
            <IconButton edge="start" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
              <MenuIcon />
            </IconButton>
          )}
          <Box sx={{ flexGrow: 1 }} />
          {/* Runtime jurisdiction context — a BO decision, deliberately unlike
              the player-facing SDK where brand is deploy-time. */}
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel id="location-label">Location</InputLabel>
            <Select
              labelId="location-label"
              label="Location"
              value={brand}
              onChange={(e) => onBrandChange(e.target.value as BrandName)}
            >
              {jurisdictions.map((j) => (
                <MenuItem key={j} value={j}>
                  {label(j)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <ModeToggle />
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        {isDesktop ? (
          <Drawer
            variant="permanent"
            open
            sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' } }}
          >
            {nav}
          </Drawer>
        ) : (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
          >
            {nav}
          </Drawer>
        )}
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 4 },
          minWidth: 0,
          backgroundImage: 'var(--beam-page-gradient)',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
