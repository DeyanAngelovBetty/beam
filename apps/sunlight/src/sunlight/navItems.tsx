import DiamondIcon from '@mui/icons-material/Diamond';
import CasinoIcon from '@mui/icons-material/Casino';
import RedeemIcon from '@mui/icons-material/Redeem';
import PeopleIcon from '@mui/icons-material/People';
import BadgeIcon from '@mui/icons-material/Badge';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import type { BeamNavItem } from '@betty/beam';

/** Every navigable destination in Sunlight, and its route. */
export type SunlightPage =
  | 'loyalty-status'
  | 'perks'
  | 'payout-configs'
  | 'game-configs'
  | 'default-game-configs'
  | 'meta-game-presets'
  | 'prize-wall'
  | 'pending-approvals'
  | 'users'
  | 'roles';

export const PAGE_PATH: Record<SunlightPage, string> = {
  'loyalty-status': '/',
  perks: '/perks',
  'payout-configs': '/payout-configs',
  'game-configs': '/game-configs',
  'default-game-configs': '/default-game-configs',
  'meta-game-presets': '/meta-game-presets',
  'prize-wall': '/prize-wall',
  'pending-approvals': '/pending-approvals',
  users: '/users',
  roles: '/roles',
};

interface NavArgs {
  pathname: string;
  navigate: (path: string) => void;
}

/** A nav path is active on an exact match or when the current route is under it. */
function isActive(path: string, pathname: string): boolean {
  if (path === '/') return pathname === '/';
  return pathname === path || pathname.startsWith(`${path}/`);
}

/**
 * Sunlight's navigation, built per render from the current route so a click
 * both navigates (router) and lights the correct item.
 */
export function buildSunlightNav({ pathname, navigate }: NavArgs): BeamNavItem[] {
  const leaf = (label: string, page: SunlightPage): BeamNavItem => ({
    label,
    selected: isActive(PAGE_PATH[page], pathname),
    onClick: () => navigate(PAGE_PATH[page]),
  });

  return [
    {
      label: 'Loyalty',
      icon: <DiamondIcon />,
      defaultOpen: true,
      children: [leaf('Status', 'loyalty-status'), leaf('Perks', 'perks')],
    },
    {
      label: 'Betty Meta Games',
      icon: <CasinoIcon />,
      children: [
        leaf('Payout Configs', 'payout-configs'),
        leaf('Game Configs', 'game-configs'),
        leaf('Default Game Configs', 'default-game-configs'),
        leaf('MetaGame Presets', 'meta-game-presets'),
      ],
    },
    // Prize Wall — the renamed Token Campaigns, now a top-level destination.
    { ...leaf('Prize Wall', 'prize-wall'), icon: <RedeemIcon /> },
    {
      label: 'Administration',
      section: true,
      children: [
        { ...leaf('Pending Approvals', 'pending-approvals'), icon: <FactCheckIcon fontSize="small" /> },
        { ...leaf('Users', 'users'), icon: <PeopleIcon fontSize="small" /> },
        { ...leaf('Roles', 'roles'), icon: <BadgeIcon fontSize="small" /> },
      ],
    },
  ];
}
