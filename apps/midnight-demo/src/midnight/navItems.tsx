import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import CasinoIcon from '@mui/icons-material/Casino';
import AppsIcon from '@mui/icons-material/Apps';
import CampaignIcon from '@mui/icons-material/Campaign';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import DescriptionIcon from '@mui/icons-material/Description';
import type { BeamNavItem } from '@betty/beam';

/** Midnight's real IA, kept so the retrofit is recognisable to its operators. */
export const MIDNIGHT_NAV: BeamNavItem[] = [
  {
    label: 'Player Operations',
    icon: <ManageAccountsIcon />,
    defaultOpen: true,
    children: [
      { label: 'Players', selected: true },
      { label: 'Audience Management' },
      { label: 'Beta Testers' },
      { label: 'Loyalty Status Uploads' },
      { label: 'Players Audit' },
      { label: 'Bulk Notes' },
    ],
  },
  { label: 'Compliance', icon: <VerifiedUserIcon />, children: [{ label: 'KYC Checks' }] },
  { label: 'Casino Content', icon: <CasinoIcon />, children: [{ label: 'Game Catalogue' }] },
  { label: 'Bingo', icon: <AppsIcon />, children: [{ label: 'Rooms' }] },
  { label: 'Promotions and Loyalty', icon: <CampaignIcon />, children: [{ label: 'Promotions' }] },
  { label: 'Reporting', icon: <BarChartIcon />, children: [{ label: 'Payments' }] },
  { label: 'BO Administration', icon: <SettingsIcon />, children: [{ label: 'Users & Roles' }] },
  { label: 'Documents', icon: <DescriptionIcon /> },
];
