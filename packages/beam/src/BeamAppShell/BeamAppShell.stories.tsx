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
import { BeamAppShell } from './BeamAppShell';
import type { BeamNavItem } from './BeamAppShell.types';
import { products } from '../theme/tokens';
import type { BrandName } from '../theme/tokens';

/**
 * Bench for BeamAppShell v2 — the state matrix for the motion pass
 * (shell-grammar.md). NO motion here: every state is instant. locked · closed
 * (strip only) · peek · narrow drawer, plus a Playground exposing the state and
 * timing knobs. Demo brand = the SUNLIGHT logo (color) + its mono ghost.
 *
 * A Lab entry is a question, not a home (BEAM.md §9).
 */

// The SUNLIGHT wordmark, as a demo brand pair. Real per-app SVGs land with the
// app adoption (commit 2); inlined here so the bench has a realistic mark.
const SUNLIGHT_PATHS = [
  'M16.4205 15.6048C16.3447 14.6579 15.9896 13.9192 15.3551 13.3889C14.7301 12.8586 13.7784 12.5935 12.5 12.5935C11.6856 12.5935 11.018 12.6929 10.4972 12.8918C9.9858 13.0812 9.60701 13.3416 9.3608 13.673C9.11458 14.0045 8.98674 14.3832 8.97727 14.8094C8.95833 15.1598 9.01989 15.477 9.16193 15.7611C9.31345 16.0357 9.55019 16.2867 9.87216 16.5139C10.1941 16.7317 10.6061 16.9306 11.108 17.1105C11.6098 17.2904 12.2064 17.4514 12.8977 17.5935L15.2841 18.1048C16.8939 18.4457 18.2718 18.8956 19.4176 19.4543C20.5634 20.013 21.5009 20.6711 22.2301 21.4287C22.9593 22.1768 23.4943 23.0196 23.8352 23.9571C24.1856 24.8946 24.3655 25.9173 24.375 27.0253C24.3655 28.9382 23.8873 30.5575 22.9403 31.8832C21.9934 33.209 20.6392 34.2175 18.8778 34.9088C17.1259 35.6001 15.0189 35.9457 12.5568 35.9457C10.0284 35.9457 7.82197 35.5717 5.9375 34.8236C4.0625 34.0755 2.60417 32.9249 1.5625 31.3719C0.530303 29.8094 0.00946969 27.8113 0 25.3776H7.5C7.54735 26.2677 7.76989 27.0158 8.16761 27.6219C8.56534 28.2279 9.12405 28.6872 9.84375 28.9997C10.5729 29.3122 11.4394 29.4685 12.4432 29.4685C13.286 29.4685 13.9915 29.3643 14.5597 29.156C15.1278 28.9476 15.5587 28.6588 15.8523 28.2895C16.1458 27.9202 16.2973 27.4988 16.3068 27.0253C16.2973 26.5802 16.1506 26.192 15.8665 25.8605C15.5919 25.5196 15.1373 25.2166 14.5028 24.9514C13.8684 24.6768 13.0114 24.4211 11.9318 24.1844L9.03409 23.5594C6.45833 23.0007 4.42708 22.0679 2.94034 20.7611C1.46307 19.4448 0.729167 17.6503 0.738636 15.3776C0.729167 13.531 1.22159 11.9164 2.21591 10.5338C3.2197 9.14177 4.60701 8.05749 6.37784 7.28097C8.15814 6.50446 10.1989 6.1162 12.5 6.1162C14.8485 6.1162 16.8797 6.50919 18.5938 7.29518C20.3078 8.08116 21.6288 9.18912 22.5568 10.619C23.4943 12.0395 23.9678 13.7014 23.9773 15.6048H16.4205Z',
  'M44.7452 6.51393H52.6429V25.1503C52.6429 27.3662 52.1126 29.2838 51.052 30.9031C50.0009 32.513 48.5331 33.7582 46.6486 34.6389C44.7641 35.5101 42.5766 35.9457 40.0861 35.9457C37.5766 35.9457 35.3796 35.5101 33.4952 34.6389C31.6107 33.7582 30.1429 32.513 29.0918 30.9031C28.0501 29.2838 27.5293 27.3662 27.5293 25.1503V6.51393H35.427V24.4685C35.427 25.3681 35.6259 26.173 36.0236 26.8832C36.4213 27.584 36.9705 28.1332 37.6713 28.531C38.3815 28.9287 39.1865 29.1276 40.0861 29.1276C40.9952 29.1276 41.8001 28.9287 42.5009 28.531C43.2016 28.1332 43.7509 27.584 44.1486 26.8832C44.5463 26.173 44.7452 25.3681 44.7452 24.4685V6.51393Z',
  'M81.7169 6.51393V35.6048H75.126L64.6146 20.3207H64.4442V35.6048H56.5464V6.51393H63.251L73.5919 21.7412H73.8192V6.51393H81.7169Z',
  'M85.6027 35.6048V6.51393H93.5004V29.2412H105.262V35.6048H85.6027Z',
  'M139.287 16.1162C139.164 15.6143 138.97 15.174 138.705 14.7952C138.439 14.4069 138.108 14.0802 137.71 13.8151C137.322 13.5404 136.867 13.3368 136.347 13.2043C135.835 13.0622 135.272 12.9912 134.656 12.9912C133.33 12.9912 132.199 13.3084 131.261 13.9429C130.333 14.5774 129.623 15.4912 129.131 16.6844C128.648 17.8776 128.406 19.317 128.406 21.0026C128.406 22.7071 128.638 24.1654 129.102 25.3776C129.566 26.5897 130.258 27.5177 131.176 28.1617C132.095 28.8056 133.236 29.1276 134.599 29.1276C135.802 29.1276 136.801 28.9524 137.597 28.602C138.402 28.2516 139.003 27.7545 139.401 27.1105C139.798 26.4666 139.997 25.709 139.997 24.8378L141.361 24.9798H134.713V19.3548H147.611V23.3889C147.611 26.0404 147.047 28.3084 145.92 30.1929C144.803 32.0679 143.259 33.5073 141.29 34.5111C139.33 35.5054 137.08 36.0026 134.543 36.0026C131.711 36.0026 129.225 35.4012 127.085 34.1986C124.945 32.9959 123.274 31.2819 122.071 29.0565C120.878 26.8312 120.281 24.1844 120.281 21.1162C120.281 18.7109 120.646 16.5802 121.375 14.7242C122.114 12.8681 123.136 11.3009 124.443 10.0225C125.75 8.73457 127.26 7.76393 128.974 7.11052C130.688 6.44764 132.526 6.1162 134.486 6.1162C136.209 6.1162 137.81 6.36241 139.287 6.85484C140.774 7.33779 142.085 8.02908 143.222 8.9287C144.367 9.81885 145.291 10.8747 145.991 12.0963C146.692 13.3179 147.118 14.6579 147.27 16.1162H139.287Z',
  'M151.443 35.6048V6.51393H159.341V17.8776H169.796V6.51393H177.693V35.6048H169.796V24.2412H159.341V35.6048H151.443Z',
  'M180.798 12.8776V6.51393H206.082V12.8776H197.332V35.6048H189.548V12.8776H180.798Z',
  'M109.169 14.7822C110.982 16.1319 112.483 18.1038 113.885 21.1807C114.225 21.9274 114.916 23.2507 115.406 23.9023C115.977 21.2603 116.169 18.997 116.906 16.7412L117.066 16.7822V35.6048H109.169V14.7822ZM111.828 0C112.074 0.330239 112.517 1.28725 112.728 1.67188C114.233 4.39793 114.858 6.10133 117.96 7.00684C118.657 7.21045 119.407 7.49127 120.187 7.65332C120.637 7.74686 121.63 7.8949 122.003 8.0752C121.731 8.49998 117.686 10.396 116.788 11.7178C115.196 14.0602 115.211 16.1039 114.643 18.7285C114.328 18.3091 113.883 17.4571 113.664 16.9766C111.499 12.2254 108.974 11.5555 104.163 10.7354C110.465 7.5813 110.343 6.76846 111.828 0Z',
];

function DemoColorLogo() {
  return (
    <svg width="115" height="20" viewBox="0 0 207 36" fill="none" aria-label="Sunlight" role="img">
      <defs>
        <linearGradient id="beam-demo-brand" x1="207" y1="36" x2="0" y2="9" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00FFAB" />
          <stop offset="1" stopColor="#7582EB" />
        </linearGradient>
      </defs>
      {SUNLIGHT_PATHS.map((d, i) => (
        <path key={i} d={d} fill="url(#beam-demo-brand)" />
      ))}
    </svg>
  );
}

function DemoGhostLogo() {
  // Mono watermark: currentColor at heavy subdual. The app bakes the subdual
  // into the ghost node (the shell renders it as-is). Opacity is a bench value —
  // the motion/polish pass owns it.
  return (
    <svg width="115" height="20" viewBox="0 0 207 36" fill="none" aria-hidden style={{ opacity: 0.16 }}>
      {SUNLIGHT_PATHS.map((d, i) => (
        <path key={i} d={d} fill="currentColor" />
      ))}
    </svg>
  );
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

/** Locked — sidebar in-flow, flush, full-height; content reflows beside it. */
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
