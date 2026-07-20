import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import DiamondIcon from '@mui/icons-material/Diamond';
import CampaignIcon from '@mui/icons-material/Campaign';
import BarChartIcon from '@mui/icons-material/BarChart';
import PaymentsIcon from '@mui/icons-material/Payments';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import Typography from '@mui/material/Typography';
import { BeamAppShell } from './BeamAppShell';
import type { BeamNavItem } from './BeamAppShell.types';
import type { BrandName, ProductName } from '../theme/tokens';

const SUNLIGHT_NAV: BeamNavItem[] = [
  { label: 'Loyalty Status', icon: <DiamondIcon />, selected: true },
  {
    label: 'Promotions and Loyalty',
    icon: <CampaignIcon />,
    defaultOpen: true,
    children: [{ label: 'Midnight Journey' }, { label: 'Tournaments' }],
  },
  { label: 'Reporting', icon: <BarChartIcon />, children: [{ label: 'Payouts' }] },
];

const GASPAR_NAV: BeamNavItem[] = [
  { label: 'Transactions', icon: <PaymentsIcon />, selected: true },
  {
    label: 'Routing',
    icon: <AccountTreeIcon />,
    defaultOpen: true,
    children: [{ label: 'Rule Builder' }, { label: 'Providers' }],
  },
];

/**
 * Jurisdiction is runtime state in a back office, so the harness owns it —
 * the story exercises the switcher rather than merely displaying it.
 */
function ShellHarness({
  title,
  product,
  navItems,
}: {
  title: string;
  product: ProductName;
  navItems: BeamNavItem[];
}) {
  const [brand, setBrand] = useState<BrandName>('ontario');
  return (
    <BeamAppShell
      title={title}
      product={product}
      navItems={navItems}
      brand={brand}
      onBrandChange={setBrand}
    >
      <Typography variant="h4" component="h1">
        {title} content area
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1 }}>
        Page content renders here, over the derived page gradient.
      </Typography>
    </BeamAppShell>
  );
}

/**
 * The shell is the promotion-path proof: one component, two products, zero
 * forks (BEAM.md §2). What differs between them is entirely props.
 */
const meta = {
  title: 'Organisms/BeamAppShell',
  component: ShellHarness,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ShellHarness>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Sunlight: Story = {
  args: { title: 'SUNLIGHT', product: 'sunlight', navItems: SUNLIGHT_NAV },
};

/** Same component, different product identity — no fork. */
export const Gaspar: Story = {
  args: { title: 'GASPAR', product: 'gaspar', navItems: GASPAR_NAV },
};
