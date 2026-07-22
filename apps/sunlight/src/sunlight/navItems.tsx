import DiamondIcon from '@mui/icons-material/Diamond';
import CasinoIcon from '@mui/icons-material/Casino';
import RedeemIcon from '@mui/icons-material/Redeem';
import PeopleIcon from '@mui/icons-material/People';
import BadgeIcon from '@mui/icons-material/Badge';
import type { BeamNavItem } from '@betty/beam';

/** Every navigable destination in Sunlight. */
export type SunlightPage =
  | 'loyalty-status'
  | 'perks'
  | 'payout-tables'
  | 'prize-wall'
  | 'users'
  | 'roles';

interface NavArgs {
  active: SunlightPage;
  onNavigate: (page: SunlightPage) => void;
}

/**
 * Sunlight's navigation, built per render so `selected` and `onClick` track
 * the app's active page (no router — the demo owns page state).
 */
export function buildSunlightNav({ active, onNavigate }: NavArgs): BeamNavItem[] {
  const leaf = (label: string, page: SunlightPage): BeamNavItem => ({
    label,
    selected: active === page,
    onClick: () => onNavigate(page),
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
      children: [leaf('Payout Tables', 'payout-tables')],
    },
    // Prize Wall — the renamed Token Campaigns, now a top-level destination.
    { ...leaf('Prize Wall', 'prize-wall'), icon: <RedeemIcon /> },
    {
      label: 'Administration',
      section: true,
      children: [
        { ...leaf('Users', 'users'), icon: <PeopleIcon fontSize="small" /> },
        { ...leaf('Roles', 'roles'), icon: <BadgeIcon fontSize="small" /> },
      ],
    },
  ];
}
