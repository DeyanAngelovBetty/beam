import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useColorScheme } from '@mui/material/styles';
import DiamondIcon from '@mui/icons-material/Diamond';
import CampaignIcon from '@mui/icons-material/Campaign';
import BarChartIcon from '@mui/icons-material/BarChart';
import PeopleIcon from '@mui/icons-material/People';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import { BeamAppShell } from './BeamAppShell';
import type { BeamNavItem } from './BeamAppShell.types';
import { products } from '../theme/tokens';
import type { BrandName } from '../theme/tokens';
import { brandLogos, brandLogoMaskSx } from '../theme/brandLogos';

/**
 * Bench for BeamAppShell v2 — the state matrix for the motion pass
 * (shell-grammar.md). NO motion here: every state is instant. locked · closed
 * (strip only) · peek · narrow drawer, plus a Playground exposing the state and
 * timing knobs. Demo brand = the SUNLIGHT logo (color) + its mono ghost.
 *
 * A Lab entry is a question, not a home (BEAM.md §9).
 */

// Demo brand pair — the SUNLIGHT envelope logo consumed the REAL way (the @betty/beam mask +
// the shared sizing helper), so the bench exercises the new sizing constant exactly as the apps
// do. Wordmark 20px → 44px envelope; painted by a demo gradient (the app owns the real recipe).
const DEMO_GRADIENT = 'linear-gradient(115deg, #00FFAB, #7582EB)';
function DemoColorLogo() {
  return <Box role="img" aria-label="Sunlight" sx={{ ...brandLogoMaskSx(brandLogos.sunlight, 20), background: DEMO_GRADIENT }} />;
}
function DemoGhostLogo() {
  // Mono watermark — the same silhouette desaturated to a heavy subdual (reads as absence, not a
  // dim logo). Opacity is a bench value; the motion/polish pass owns it.
  return <Box aria-hidden sx={{ ...brandLogoMaskSx(brandLogos.sunlight, 20), background: 'currentColor', opacity: 0.16 }} />;
}

const DEMO_BRAND = { color: <DemoColorLogo />, ghost: <DemoGhostLogo /> };

/** Demo mode toggle — mirrors each app's ShellFooter. */
function DemoModeToggle() {
  const { mode, setMode } = useColorScheme();
  const next = mode === 'dark' ? 'light' : 'dark';
  return (
    <IconButton onClick={() => setMode(next)} aria-label={`Switch to ${next} mode`} color="inherit">
      {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
    </IconButton>
  );
}

const cap = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

/**
 * The app-owned footer, demoed. Post header-subtraction (grammar §5) the
 * jurisdiction switch + mode toggle live in each app's ShellFooter; the bench
 * reproduces one so the slot reads true.
 */
function DemoFooter({
  brand,
  onBrandChange,
}: {
  brand: BrandName;
  onBrandChange: (brand: BrandName) => void;
}) {
  const jurisdictions = Object.keys(products.sunlight) as BrandName[];
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', p: 1.5 }}>
      <FormControl size="small" sx={{ minWidth: 120, flexGrow: 1 }}>
        <InputLabel id="bench-location">Location</InputLabel>
        <Select
          labelId="bench-location"
          label="Location"
          value={brand}
          onChange={(e) => onBrandChange(e.target.value as BrandName)}
        >
          {jurisdictions.map((j) => (
            <MenuItem key={j} value={j}>
              {cap(j)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <DemoModeToggle />
    </Stack>
  );
}

const NAV: BeamNavItem[] = [
  { label: 'Loyalty Status', icon: <DiamondIcon />, selected: true },
  {
    label: 'Promotions and Loyalty',
    icon: <CampaignIcon />,
    defaultOpen: true,
    children: [{ label: 'Midnight Journey' }, { label: 'Tournaments' }],
  },
  { label: 'Reporting', icon: <BarChartIcon />, children: [{ label: 'Payouts' }] },
  { label: 'Administration', section: true, children: [{ label: 'Users', icon: <PeopleIcon fontSize="small" /> }] },
];

function DemoPage() {
  return (
    <Box sx={{ maxWidth: 720 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Loyalty Status
      </Typography>
      <Typography color="text.secondary">
        The page owns its top edge — no bar above it (grammar §5). BeamPageHeader would be the
        first row here. Hover the strip (or the left edge) to peek; the chevron locks it.
      </Typography>
    </Box>
  );
}

interface BenchArgs {
  navItems?: BeamNavItem[];
  locked?: boolean;
  defaultLocked?: boolean;
  peekOpenDelayMs?: number;
  peekCloseGraceMs?: number;
  // Motion-token duration overrides (Playground only). INERT for now: nothing
  // consumes the named-motion vars yet, and the interim lock transition is the
  // UA-default root crossfade, which these do NOT govern. They go live when the
  // choreography CSS (Deyan's bench pass) names the transition.
  motionQuick?: string;
  motionMove?: string;
  motionFade?: string;
  appAlert?: ReactNode;
}

/** Wires the app-owned footer (jurisdiction + mode) to real state. */
function ShellBench({
  navItems = NAV,
  motionQuick,
  motionMove,
  motionFade,
  ...shellProps
}: BenchArgs) {
  const [brand, setBrand] = useState<BrandName>('ontario');
  // Style-less wrapper; only carries the motion-duration var overrides (if any).
  const motionVars = {
    ...(motionQuick ? { '--beam-motion-quick-duration': motionQuick } : {}),
    ...(motionMove ? { '--beam-motion-move-duration': motionMove } : {}),
    ...(motionFade ? { '--beam-motion-fade-duration': motionFade } : {}),
  } as CSSProperties;
  return (
    <div style={motionVars}>
      <BeamAppShell
        brandMark={DEMO_BRAND}
        navItems={navItems}
        persistKey={false}
        footer={<DemoFooter brand={brand} onBrandChange={setBrand} />}
        {...shellProps}
      >
        <DemoPage />
      </BeamAppShell>
    </div>
  );
}

/** Clicks the hamburger on mount — used narrow, where click opens the drawer. */
function AutoOpen({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const t = setTimeout(() => {
      ref.current?.querySelector<HTMLButtonElement>('[aria-label="Open navigation"]')?.click();
    }, 60);
    return () => clearTimeout(t);
  }, []);
  return <div ref={ref}>{children}</div>;
}

/**
 * Hovers the strip hamburger on mount so the static story shows the peek. Wide
 * click now LOCKS (not peeks), so the peek is reachable only by hover — a
 * bubbling `mouseover` is what React derives `onMouseEnter` from. Pair with
 * `peekOpenDelayMs={0}` so it opens without the hover-intent wait.
 */
function AutoHover({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const t = setTimeout(() => {
      ref.current
        ?.querySelector<HTMLButtonElement>('[aria-controls="beam-shell-panel"]')
        ?.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    }, 60);
    return () => clearTimeout(t);
  }, []);
  return <div ref={ref}>{children}</div>;
}

const meta = {
  title: 'Organisms/BeamAppShell',
  component: ShellBench,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ShellBench>;

export default meta;
type Story = StoryObj<typeof meta>;

// A demo app-alert bar for the slot (the real bar lives in apps/sunlight; packages/beam can't
// import it). Mirrors its look — full viewport width, severity tint, message + action.
const demoAlert = (
  <Box
    sx={{
      width: '100%',
      backgroundColor: 'color-mix(in oklch, var(--mui-palette-info-main) 14%, var(--mui-palette-background-default))',
      borderBottom: '1px solid',
      borderColor: 'info.main',
    }}
  >
    <Stack direction="row" spacing={2} sx={{ alignItems: 'center', px: { xs: 2, sm: 4, md: 7 }, py: 1 }}>
      <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }}>
        2 change requests await your review
      </Typography>
      <Button size="small" variant="outlined">Review</Button>
    </Stack>
  </Box>
);

/** The `appAlert` slot — row 1 of the shell frame: full VIEWPORT width, above the rail AND content,
 *  pushing everything down (in-flow), not a floating toast. Here over the locked rail. */
export const WithAppAlert: Story = {
  render: () => <ShellBench defaultLocked appAlert={demoAlert} />,
};

/** Regression test for 46eff14's flagged overlap: the closed brand strip (hamburger + mark) now
 *  sits BELOW the bar, not under it — because the strip is `absolute` within appFrame, which starts
 *  below row 1. This is the previously-broken combination. */
export const ClosedWithAlert: Story = {
  render: () => <ShellBench defaultLocked={false} appAlert={demoAlert} />,
};

export const Locked: Story = {
  args: { defaultLocked: true },
};

/** Closed — only the brand strip (hamburger + color mark); no bar. */
export const ClosedStrip: Story = {
  args: { defaultLocked: false },
};

/** Peek — the floating panel the closed state slides in on hover (opened here on mount). */
export const PeekOpen: Story = {
  render: (args) => (
    <AutoHover>
      <ShellBench {...args} />
    </AutoHover>
  ),
  args: { defaultLocked: false, peekOpenDelayMs: 0 },
};

/** Narrow — the peek in mobile clothes: a modal drawer with scrim + focus trap. */
export const NarrowDrawer: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: (args) => (
    <AutoOpen>
      <ShellBench {...args} />
    </AutoOpen>
  ),
  args: { defaultLocked: false },
};

/**
 * Playground — the state + timing knobs (the constants are the shipped
 * defaults). The motion-duration knobs are wired to the token vars but INERT
 * until the choreography CSS consumes them (see BenchArgs) — they're here to
 * scaffold the bench, not to animate anything yet.
 */
export const Playground: Story = {
  args: {
    defaultLocked: false,
    peekOpenDelayMs: 250,
    peekCloseGraceMs: 300,
    motionQuick: '180ms',
    motionMove: '300ms',
    motionFade: '200ms',
  },
  argTypes: {
    defaultLocked: { control: 'boolean' },
    peekOpenDelayMs: { control: { type: 'number', min: 0, max: 1000, step: 50 } },
    peekCloseGraceMs: { control: { type: 'number', min: 0, max: 1000, step: 50 } },
    motionQuick: { control: 'text' },
    motionMove: { control: 'text' },
    motionFade: { control: 'text' },
    navItems: { table: { disable: true } },
    locked: { table: { disable: true } },
  },
};
