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
import type { BeamNavItem } from '@betty/beam';

/** Sunlight's navigation, mirroring the Yoda BO's information architecture. */
export const SUNLIGHT_NAV: BeamNavItem[] = [
  { label: 'Loyalty Status', icon: <DiamondIcon />, selected: true },
  { label: 'Player Operations', icon: <ManageAccountsIcon />, children: [{ label: 'Player Search' }] },
  { label: 'Compliance', icon: <VerifiedUserIcon />, children: [{ label: 'KYC Queue' }] },
  { label: 'Casino Content', icon: <CasinoIcon />, children: [{ label: 'Game Catalogue' }] },
  { label: 'Bingo', icon: <AppsIcon />, children: [{ label: 'Rooms' }] },
  {
    label: 'Promotions and Loyalty',
    icon: <CampaignIcon />,
    defaultOpen: true,
    children: [
      { label: 'Midnight Journey', icon: <AutoAwesomeIcon fontSize="small" /> },
      { label: 'Betty Promotions', icon: <RedeemIcon fontSize="small" /> },
      { label: 'Token Campaigns', icon: <TableChartIcon fontSize="small" /> },
      { label: 'Betty Metagame', icon: <LocalOfferIcon fontSize="small" /> },
      { label: 'Tournaments', icon: <EmojiEventsIcon fontSize="small" /> },
    ],
  },
  { label: 'Reporting', icon: <BarChartIcon />, children: [{ label: 'Payouts' }] },
  { label: 'BO Administration', icon: <SettingsIcon />, children: [{ label: 'Users & Roles' }] },
];
