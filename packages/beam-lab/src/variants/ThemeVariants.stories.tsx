import { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  ThemeProvider,
  CssBaseline,
  useColorScheme,
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
  brandLogos,
  brandLogoMaskSx,
  logoGradient,
  type BrandName,
} from '@betty/beam';
import { THEME_VARIANTS, type LabProduct } from './themeVariants';

/**
 * Theme Lab — CANDIDATE VARIANTS decision board. A self-contained lab surface (it owns its own
 * ThemeProvider) for comparing 2–3 candidate themes for a product and choosing between them. The
 * variant select sits alongside the jurisdiction + mode switches so a candidate composes with the
 * REAL axes: variant × light/dark × jurisdiction — the comparison only means something if a candidate
 * can be seen under every real mode combination.
 *
 * LAB-ONLY: the variant registry (./themeVariants) is not part of `@betty/beam-lab`'s public API;
 * apps still build one shipped theme per product. Non-colour params (surface steps, nav glass, star
 * mesh) are deliberately IDENTICAL across variants, so the comparison isolates COLOUR.
 *
 * Gaspar's "Teal (recovered)" is the pre-purple theme resurrected from git history — Ontario only
 * (Alberta was magenta in both eras); flip Jurisdiction to Alberta to confirm the candidates match
 * there. A candidate never ships as a switch — it graduates by BECOMING the product theme.
 */
const meta: Meta = {
  title: 'BeamLab/Theme Variants',
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

function Sel({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <FormControl size="small" sx={{ minWidth: 170 }}>
      <InputLabel>{label}</InputLabel>
      <Select label={label} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

function ControlBar({
  variants,
  variantId,
  onVariant,
  brand,
  onBrand,
}: {
  variants: (typeof THEME_VARIANTS)[LabProduct];
  variantId: string;
  onVariant: (id: string) => void;
  brand: BrandName;
  onBrand: (b: BrandName) => void;
}) {
  const { mode, setMode } = useColorScheme();
  return (
    <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', borderBottom: '1px solid', borderColor: 'divider', background: 'var(--beam-surface-1)' }}>
      <Sel label="Variant" value={variantId} onChange={onVariant} options={variants.map((v) => ({ value: v.id, label: v.label }))} />
      <Sel label="Jurisdiction" value={brand} onChange={(v) => onBrand(v as BrandName)} options={[{ value: 'ontario', label: 'Ontario' }, { value: 'alberta', label: 'Alberta' }]} />
      <Sel label="Mode" value={mode === 'light' ? 'light' : 'dark'} onChange={(v) => setMode(v as 'light' | 'dark')} options={[{ value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }]} />
      <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
        Candidate comparison — lab only, never shipped
      </Typography>
    </Box>
  );
}

function Swatch({ token, label }: { token: string; label: string }) {
  return (
    <Stack spacing={0.5} sx={{ alignItems: 'center' }}>
      <Box sx={{ width: 48, height: 48, borderRadius: 1.5, backgroundColor: token, border: '1px solid', borderColor: 'divider' }} />
      <Typography variant="caption" color="text.secondary">{label}</Typography>
    </Stack>
  );
}

function VariantBoard() {
  // Transparent so the page canvas + mesh (painted by CssBaseline on body::before) show through.
  return (
    <Box sx={{ flex: 1, backgroundColor: 'transparent', display: 'flex' }}>
      <Box sx={{ width: 200, background: 'var(--beam-nav-surface)', borderRight: '1px solid', borderColor: 'divider', p: 2 }}>
        <Stack spacing={1.5}>
          <Box role="img" aria-label="Gaspar" sx={{ ...brandLogoMaskSx(brandLogos.gaspar, 20), background: logoGradient() }} />
          <Typography variant="overline" color="text.secondary">Nav rail</Typography>
          {['Dashboard', 'Transactions', 'Routing'].map((l) => (
            <Typography key={l} variant="body2">{l}</Typography>
          ))}
        </Stack>
      </Box>

      <Stack spacing={3} sx={{ flex: 1, p: 4 }}>
        <BeamPageHeader title="Gaspar candidate" subtitle="Compare the primary, surfaces, and mesh across variant × jurisdiction × mode." />

        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}>
          <Button variant="contained">Primary action</Button>
          <Button variant="outlined">Secondary</Button>
          <BeamStatusBadge status="active" />
          <BeamStatusBadge status="pending" label="Pending" />
          <BeamStatusBadge status="error" />
        </Stack>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="subtitle2">Primary ramp</Typography>
            <Stack direction="row" spacing={2}>
              <Swatch token="var(--mui-palette-primary-dark)" label="down 1" />
              <Swatch token="var(--mui-palette-primary-main)" label="primary" />
              <Swatch token="var(--mui-palette-primary-light)" label="up 1" />
            </Stack>
            <Box sx={{ backgroundColor: 'var(--beam-surface-2)', borderRadius: 2, p: 2 }}>
              <Typography variant="body2" color="text.secondary">Surface 2 (raised) — one more step up the ramp.</Typography>
            </Box>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}

function ThemeVariantsDemo({ product }: { product: LabProduct }) {
  const variants = THEME_VARIANTS[product];
  const [variantId, setVariantId] = useState(variants[0].id); // #1 = current shipped = default
  const [brand, setBrand] = useState<BrandName>('ontario');
  const variant = variants.find((v) => v.id === variantId) ?? variants[0];
  const theme = useMemo(() => variant.buildTheme(brand), [variant, brand]);

  return (
    <ThemeProvider theme={theme} defaultMode="dark" noSsr>
      <CssBaseline />
      <Stack sx={{ minHeight: '100vh' }}>
        <ControlBar variants={variants} variantId={variantId} onVariant={setVariantId} brand={brand} onBrand={setBrand} />
        <VariantBoard />
      </Stack>
    </ThemeProvider>
  );
}

/** Gaspar — Purple (current) vs Teal (recovered). Switch Variant; compose with Jurisdiction + Mode. */
export const Gaspar: Story = { render: () => <ThemeVariantsDemo product="gaspar" /> };
