import { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  ThemeProvider,
  CssBaseline,
  createBeamTheme,
  Box,
  Stack,
  Typography,
  Paper,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  BeamPageHeader,
  BeamStatusBadge,
  type BrandName,
  type Theme,
} from '@betty/beam';
import { THEME_VARIANTS, type LabProduct } from './themeVariants';

/**
 * Theme Lab — candidate variants, SIDE-BY-SIDE static comparison. Renders a product's candidates as
 * adjacent columns under a shared jurisdiction + mode, for a static "which reads better" glance.
 *
 * TUNING HAPPENS IN THE THEME LAB DRAWER: load a preset → tune the knobs → Copy Combo. This board is
 * only the at-a-glance comparison; the drawer is where a candidate is loaded, fine-tuned against real
 * app surfaces, and exported. (Lab-only — a candidate never ships as a switch; it graduates by
 * becoming the product theme. See docs/derived-color-tokens.md §8.)
 */
const meta: Meta = {
  title: 'BeamLab/Theme Variants',
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

function Sel({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <FormControl size="small" sx={{ minWidth: 160 }}>
      <InputLabel>{label}</InputLabel>
      <Select label={label} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

function Swatch({ token, label }: { token: string; label: string }) {
  return (
    <Stack spacing={0.5} sx={{ alignItems: 'center' }}>
      <Box sx={{ width: 44, height: 44, borderRadius: 1.5, backgroundColor: token, border: '1px solid', borderColor: 'divider' }} />
      <Typography variant="caption" color="text.secondary">{label}</Typography>
    </Stack>
  );
}

/** A compact surface board — enough to read the primary, surfaces, and status colours at a glance. */
function Board() {
  return (
    <Stack spacing={2} sx={{ p: 3 }}>
      <BeamPageHeader title="Gaspar" subtitle="Candidate preview" />
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}>
        <Button variant="contained">Primary</Button>
        <Button variant="outlined">Outlined</Button>
        <BeamStatusBadge status="active" />
        <BeamStatusBadge status="pending" label="Pending" />
      </Stack>
      <Stack direction="row" spacing={2}>
        <Swatch token="var(--mui-palette-primary-dark)" label="down 1" />
        <Swatch token="var(--mui-palette-primary-main)" label="primary" />
        <Swatch token="var(--mui-palette-primary-light)" label="up 1" />
      </Stack>
      <Box sx={{ backgroundColor: 'var(--beam-surface-2)', borderRadius: 2, p: 2 }}>
        <Typography variant="body2" color="text.secondary">Surface 2 — one step up the ramp.</Typography>
      </Box>
    </Stack>
  );
}

/** One candidate column — its own themed subtree, mode-scoped by the data-beam-mode attribute. */
function VariantColumn({ label, theme, mode }: { label: string; theme: Theme; mode: 'dark' | 'light' }) {
  return (
    <ThemeProvider theme={theme} defaultMode={mode} noSsr>
      <Box data-beam-mode={mode} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden', backgroundColor: 'background.default' }}>
        <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', background: 'var(--beam-surface-1)' }}>
          <Typography variant="subtitle2">{label}</Typography>
        </Box>
        <Board />
      </Box>
    </ThemeProvider>
  );
}

function StaticCompare({ product }: { product: LabProduct }) {
  const variants = THEME_VARIANTS[product];
  const [brand, setBrand] = useState<BrandName>('ontario');
  const [mode, setMode] = useState<'dark' | 'light'>('dark');
  const chromeTheme = useMemo(() => createBeamTheme('ontario', 'sunlight'), []); // neutral chrome for the controls

  return (
    <ThemeProvider theme={chromeTheme} defaultMode="dark" noSsr>
      <CssBaseline />
      <Box data-beam-mode="dark" sx={{ p: 3 }}>
        <Stack direction="row" spacing={2} sx={{ mb: 3, alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}>
          <Sel label="Jurisdiction" value={brand} onChange={(v) => setBrand(v as BrandName)} options={[{ value: 'ontario', label: 'Ontario' }, { value: 'alberta', label: 'Alberta' }]} />
          <Sel label="Mode" value={mode} onChange={(v) => setMode(v as 'dark' | 'light')} options={[{ value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }]} />
          <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
            Static side-by-side · tune a candidate in the Theme Lab drawer
          </Typography>
        </Stack>
        <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${variants.length}, minmax(0, 1fr))`, gap: 3 }}>
          {variants.map((v) => (
            <VariantColumn key={v.id} label={v.label} theme={v.buildTheme(brand)} mode={mode} />
          ))}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

/** Gaspar — Purple (current) │ Teal (recovered), side by side. Compose with Jurisdiction + Mode. */
export const Gaspar: Story = { render: () => <StaticCompare product="gaspar" /> };
