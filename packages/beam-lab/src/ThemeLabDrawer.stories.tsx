import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box, Stack, Typography, Paper, BeamPageHeader, BeamStatusBadge, brandLogos, brandLogoMaskSx, logoGradient } from '@betty/beam';
import { ThemeLabDrawer } from './ThemeLabDrawer';

/**
 * Theme Lab over a SURFACES BOARD. A drawer that drives the real page is dishonest to demo
 * over nothing, so the story puts it over a compact set of genuine Beam surfaces — page,
 * Paper (surface 1), a raised surface (2), the nav rail, and a gradient title. The override
 * sheet targets THIS iframe's document, so the mechanism is real.
 *
 * Target-chip model: pick a chip ([anchor] [hue-b] [hue-c ƒ] [star ƒ] [logo] [primary BRAND]) →
 * the shared L/C/H group hydrates from it → drag re-derives live (anchor → the ramp strip +
 * surfaces; hue-b/hue-c → the mesh; star → the tiled Betty sparkle on body::after, Pitch slider
 * BREATHES the lattice; logo → the rail-header wordmark's 4-stop gradient, with nested per-stop
 * swatches — un-overridden stops follow primary/hue-b edits; primary → the whole family incl.
 * alpha states). H/C link toggles carry edits across dark/light; the painted strip shows what the
 * canvas wears. Copy combo exports a scoped v3 JSON (sparse star + logo blocks; shape is constant).
 *
 * Graduated from apps/gaspar to @betty/beam-lab on the second consumer (Sunlight) — BEAM.md §2.
 * NOTE: the override sheet is shared module state for the session — Reset (or refresh) clears it.
 */
const meta: Meta<typeof ThemeLabDrawer> = {
  title: 'BeamLab/Theme Lab',
  component: ThemeLabDrawer,
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof ThemeLabDrawer>;

function SurfacesBoard() {
  // TRANSPARENT, not background.default: the page canvas + mesh + the tiled Betty star are
  // painted by the body::before/::after fixed layers (CssBaseline). An opaque board would cover
  // them; transparent lets the real page show through — the honest preview.
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'transparent', display: 'flex' }}>
      {/* Nav rail — derives from the anchor (nav surface/edge). Rail header carries the masked
          logo painted by the live 4-stop gradient, so the [logo] chip drives something real. */}
      <Box sx={{ width: 200, background: 'var(--beam-nav-surface)', borderRight: '1px solid', borderColor: 'divider', p: 2 }}>
        <Stack spacing={1.5}>
          <Box role="img" aria-label="Sunlight" sx={{ ...brandLogoMaskSx(brandLogos.sunlight, 20), background: logoGradient() }} />
          <Typography variant="overline" color="text.secondary">Nav rail</Typography>
          {['Dashboard', 'Transactions', 'Routing'].map((l) => (
            <Typography key={l} variant="body2">{l}</Typography>
          ))}
        </Stack>
      </Box>

      {/* Content — page bg + the ramp surfaces + a gradient title. */}
      <Stack spacing={3} sx={{ flex: 1, p: 4, pr: '400px' /* clear the fixed drawer */ }}>
        <BeamPageHeader title="Theme Lab preview" subtitle="Drag the anchor — every surface re-derives." />

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Stack spacing={1.5}>
            <Typography variant="subtitle2">Surface 1 (Paper)</Typography>
            <Stack direction="row" spacing={1}>
              <BeamStatusBadge status="active" />
              <BeamStatusBadge status="pending" label="Pending" />
              <BeamStatusBadge status="error" />
            </Stack>
            <Box sx={{ backgroundColor: 'var(--beam-surface-2)', borderRadius: 2, p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Surface 2 (Menu / raised) — one more step up the ramp.
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}

/** The drawer open over the board — the honest live-mechanism demo. */
export const OverSurfacesBoard: Story = {
  render: () => (
    <>
      <SurfacesBoard />
      <ThemeLabDrawer open onClose={() => {}} product="sunlight" jurisdiction="ontario" />
    </>
  ),
};
