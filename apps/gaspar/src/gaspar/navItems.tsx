import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';
import PaymentsIcon from '@mui/icons-material/Payments';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import HubIcon from '@mui/icons-material/Hub';
import RuleIcon from '@mui/icons-material/Rule';
import BarChartIcon from '@mui/icons-material/BarChart';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import SettingsIcon from '@mui/icons-material/Settings';
import type { BeamNavItem } from '@betty/beam';

/** Top-level app views a nav leaf can route to. App wires selected/onClick from
 *  the `view` tag below — no positional (index-0) coupling. */
export type GasparView = 'dashboard' | 'transactions';

/** A nav leaf that routes to a top-level view carries `view`. */
export type GasparNavItem = BeamNavItem & { view?: GasparView };

/** Payment Orchestrator IA. Dashboard is the landing page; Rule Builder (the
 *  marquee screen) is still to come. */
export const GASPAR_NAV: GasparNavItem[] = [
  { label: 'Dashboard', icon: <SpaceDashboardIcon />, view: 'dashboard' },
  { label: 'Transactions', icon: <PaymentsIcon />, view: 'transactions' },
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
