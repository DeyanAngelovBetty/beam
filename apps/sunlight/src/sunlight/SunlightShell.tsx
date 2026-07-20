import { useState, type ReactNode } from 'react';
import {
  useColorScheme,
  useTheme,
  useMediaQuery,
  AppBar,
  Toolbar,
  Drawer,
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Typography,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@betty/beam';
import MenuIcon from '@mui/icons-material/Menu';
import DiamondIcon from '@mui/icons-material/Diamond';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import CasinoIcon from '@mui/icons-material/Casino';
import AppsIcon from '@mui/icons-material/Apps';
import CampaignIcon from '@mui/icons-material/Campaign';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import RedeemIcon from '@mui/icons-material/Redeem';
import TableChartIcon from '@mui/icons-material/TableChart';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import type { BrandName } from '@betty/beam';

const DRAWER_WIDTH = 264;

interface SunlightShellProps {
  brand: BrandName;
  onBrandChange: (brand: BrandName) => void;
  children: ReactNode;
}

function ModeToggle() {
  const { mode, setMode } = useColorScheme();
  const next = mode === 'dark' ? 'light' : 'dark';
  return (
    <IconButton onClick={() => setMode(next)} aria-label={`Switch to ${next} mode`} color="inherit">
      {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
    </IconButton>
  );
}

function NavContent() {
  const [promoOpen, setPromoOpen] = useState(true);
  const promoChildren = [
    { label: 'Midnight Journey', icon: <AutoAwesomeIcon fontSize="small" /> },
    { label: 'Betty Promotions', icon: <RedeemIcon fontSize="small" /> },
    { label: 'Token Campaigns', icon: <TableChartIcon fontSize="small" /> },
    { label: 'Betty Metagame', icon: <LocalOfferIcon fontSize="small" /> },
    { label: 'Tournaments', icon: <EmojiEventsIcon fontSize="small" /> },
  ];
  return (
    <>
      <Toolbar sx={{ px: 2.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '0.08em' }}>
          SUNLIGHT
        </Typography>
      </Toolbar>
      <List dense component="nav" aria-label="Main navigation">
        <ListItemButton selected>
          <ListItemIcon><DiamondIcon /></ListItemIcon>
          <ListItemText primary="Loyalty Status" />
        </ListItemButton>
        <ListItemButton>
          <ListItemIcon><ManageAccountsIcon /></ListItemIcon>
          <ListItemText primary="Player Operations" />
          <ExpandMore fontSize="small" />
        </ListItemButton>
        <ListItemButton>
          <ListItemIcon><VerifiedUserIcon /></ListItemIcon>
          <ListItemText primary="Compliance" />
          <ExpandMore fontSize="small" />
        </ListItemButton>
        <ListItemButton>
          <ListItemIcon><CasinoIcon /></ListItemIcon>
          <ListItemText primary="Casino Content" />
          <ExpandMore fontSize="small" />
        </ListItemButton>
        <ListItemButton>
          <ListItemIcon><AppsIcon /></ListItemIcon>
          <ListItemText primary="Bingo" />
          <ExpandMore fontSize="small" />
        </ListItemButton>
        <ListItemButton onClick={() => setPromoOpen(!promoOpen)}>
          <ListItemIcon><CampaignIcon /></ListItemIcon>
          <ListItemText primary="Promotions and Loyalty" />
          {promoOpen ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
        </ListItemButton>
        <Collapse in={promoOpen} timeout="auto" unmountOnExit>
          <List dense disablePadding>
            {promoChildren.map((c) => (
              <ListItemButton key={c.label} sx={{ pl: 4 }}>
                <ListItemIcon>{c.icon}</ListItemIcon>
                <ListItemText primary={c.label} />
              </ListItemButton>
            ))}
          </List>
        </Collapse>
        <ListItemButton>
          <ListItemIcon><BarChartIcon /></ListItemIcon>
          <ListItemText primary="Reporting" />
          <ExpandMore fontSize="small" />
        </ListItemButton>
        <ListItemButton>
          <ListItemIcon><SettingsIcon /></ListItemIcon>
          <ListItemText primary="BO Administration" />
          <ExpandMore fontSize="small" />
        </ListItemButton>
      </List>
    </>
  );
}

export function SunlightShell({ brand, onBrandChange, children }: SunlightShellProps) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

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
              <MenuItem value="ontario">Ontario</MenuItem>
              <MenuItem value="alberta">Alberta</MenuItem>
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
            <NavContent />
          </Drawer>
        ) : (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
          >
            <NavContent />
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
