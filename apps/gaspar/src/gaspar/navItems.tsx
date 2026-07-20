import PaymentsIcon from '@mui/icons-material/Payments';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import HubIcon from '@mui/icons-material/Hub';
import RuleIcon from '@mui/icons-material/Rule';
import BarChartIcon from '@mui/icons-material/BarChart';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import SettingsIcon from '@mui/icons-material/Settings';
import type { BeamNavItem } from '@betty/beam';

/** Payment Orchestrator IA. Rule Builder is the marquee screen, still to come. */
export const GASPAR_NAV: BeamNavItem[] = [
  { label: 'Transactions', icon: <PaymentsIcon />, selected: true },
  {
    label: 'Routing',
    icon: <AccountTreeIcon />,
    defaultOpen: true,
    children: [
      { label: 'Rule Builder', icon: <RuleIcon fontSize="small" /> },
      { label: 'Providers', icon: <HubIcon fontSize="small" /> },
    ],
  },
  { label: 'Disputes', icon: <ReportProblemIcon />, children: [{ label: 'Chargebacks' }] },
  { label: 'Reporting', icon: <BarChartIcon />, children: [{ label: 'Settlement' }] },
  { label: 'Administration', icon: <SettingsIcon />, children: [{ label: 'Users & Roles' }] },
];
