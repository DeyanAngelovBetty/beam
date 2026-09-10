import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';
import PaymentsIcon from '@mui/icons-material/Payments';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import HubIcon from '@mui/icons-material/Hub';
import RuleIcon from '@mui/icons-material/Rule';
import BarChartIcon from '@mui/icons-material/BarChart';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import SettingsIcon from '@mui/icons-material/Settings';
import type { BeamNavItem } from '@betty/beam';
import type { Milestone } from './milestone';

/** Top-level app views a nav leaf can route to. App wires selected/onClick from
 *  the `view` tag below — no positional (index-0) coupling. */
export type GasparView = 'dashboard' | 'transactions' | 'ruleBuilder';

/** view → hash route path. The App wires nav onClick → navigate(path) and selected from the pathname;
 *  HashRouter keeps these gh-pages-safe and deep-linkable (…/#/transactions). */
export const VIEW_PATH: Record<GasparView, string> = {
  dashboard: '/dashboard',
  transactions: '/transactions',
  ruleBuilder: '/rule-builder',
};

/** A nav leaf that routes to a top-level view carries `view` — at ANY depth, so children override
 *  BeamNavItem's `children` to stay GasparNavItem (Rule Builder is nested under Routing). */
export type GasparNavItem = Omit<BeamNavItem, 'children'> & { view?: GasparView; children?: GasparNavItem[] };

/** Payment Orchestrator IA. Dashboard is the landing page; Rule Builder is the
 *  marquee canvas editor (lazy-loaded — it carries @xyflow/react). */
export const GASPAR_NAV: GasparNavItem[] = [
  { label: 'Dashboard', icon: <SpaceDashboardIcon />, view: 'dashboard' },
  { label: 'Transactions', icon: <PaymentsIcon />, view: 'transactions' },
  {
    label: 'Routing',
    icon: <AccountTreeIcon />,
    defaultOpen: true,
    children: [
      { label: 'Rule Builder', icon: <RuleIcon fontSize="small" />, view: 'ruleBuilder' },
      { label: 'Providers', icon: <HubIcon fontSize="small" /> },
    ],
  },
  { label: 'Disputes', icon: <ReportProblemIcon />, children: [{ label: 'Chargebacks' }] },
  { label: 'Reporting', icon: <BarChartIcon />, children: [{ label: 'Settlement' }] },
  { label: 'Administration', icon: <SettingsIcon />, children: [{ label: 'Users & Roles' }] },
];

/**
 * Milestone → which views the Back Office HAS (Boryana's release phasing + Deyan's ruling): v1.0 is
 * Transactions-only; v1.1 onward adds Dashboard + Rule Builder. Cumulative. Read literally: the demo
 * nav shows exactly these functional views per phase — the speculative IA sections (Providers,
 * Disputes, Reporting, Administration) are pruned at every milestone, since none maps to a real view
 * and "hidden = absent" is the rule.
 *
 * (Gap for Boryana, recorded not resolved: v1.0 also references 3DS rules living IN the Rule Builder
 * while stating the BO is Transactions-only at v1.0 — a contradiction. Nav follows the ruling: Rule
 * Builder at v1.1.)
 */
const MILESTONE_VIEWS: Record<Milestone, GasparView[]> = {
  v1_0: ['transactions'],
  v1_1: ['dashboard', 'transactions', 'ruleBuilder'],
  v1_2: ['dashboard', 'transactions', 'ruleBuilder'],
  beyond: ['dashboard', 'transactions', 'ruleBuilder'],
};

export const allowedViews = (m: Milestone): Set<GasparView> => new Set(MILESTONE_VIEWS[m]);

/** Landing view for a milestone — Dashboard when the phase has it, else Transactions (v1.0). */
export const landingView = (m: Milestone): GasparView =>
  allowedViews(m).has('dashboard') ? 'dashboard' : 'transactions';

/** Prune the nav tree to items that ARE, or CONTAIN, an allowed view. An item with no allowed view
 *  and no surviving child drops out — so a group is kept only as an ancestor of something real. */
export function pruneNav(items: GasparNavItem[], allowed: Set<GasparView>): GasparNavItem[] {
  return items.flatMap((item) => {
    const children = item.children ? pruneNav(item.children, allowed) : undefined;
    const keep = (item.view && allowed.has(item.view)) || (children && children.length > 0);
    if (!keep) return [];
    return [{ ...item, ...(item.children ? { children } : {}) }];
  });
}
