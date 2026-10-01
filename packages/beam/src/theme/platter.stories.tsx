import { useRef, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { beamPlatter } from './platter';
import { usePointerAngleTracking } from './usePointerAngleTracking';
import { BORDER_RADIUS_24 } from './tokens';

/**
 * beamPlatter bench — a SOLID paper0 box (the "panel") served on a platter (the decorative `::after`
 * behind it, extending `offset` outside → a fringe around the solid box). Two fills: `gradient` (the conic
 * lit-edge + interaction tiers) and `glass` (backdrop-blur of the canvas + tint + edge light). Rendered
 * fullscreen with a transparent story surface so the real theme canvas shows behind — the glass blurs it and
 * the gradient mixes toward it. Drive product / brand / mode from the toolbar. (Model: panel = served on a
 * platter; the box stays clean, the platter is on an outer WRAP so its z-−1 ::after isn't trapped.)
 */
const meta: Meta = { title: 'Lab/Beam/Platter', parameters: { layout: 'fullscreen' } };
export default meta;
type Story = StoryObj;

/** Outer wrap carries the platter (clean element); inner is the solid paper0 panel box. */
function PlatterBox({
  label,
  fill = 'gradient',
  offset,
  radius = BORDER_RADIUS_24,
  interaction = 'none',
  w = 220,
  h = 150,
}: {
  label: string;
  fill?: 'gradient' | 'glass';
  offset?: number;
  radius?: number;
  interaction?: 'none' | 'hover-step' | 'hover-spin' | 'track';
  w?: number;
  h?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  usePointerAngleTracking(ref); // only meaningful when interaction === 'track'; inert otherwise
  return (
    <Stack spacing={0.75} sx={{ alignItems: 'center' }}>
      <Box ref={ref} sx={{ width: w, height: h, ...(beamPlatter({ fill, offset, radius, interaction }) as object) }}>
        {/* inner = the solid panel: paper0 + 1px edge + radius 24, squircle. Occludes the platter centre →
            the platter reads only as the offset fringe. */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            borderRadius: `${BORDER_RADIUS_24}px`,
            cornerShape: 'squircle',
            bgcolor: 'background.paper0',
            border: '1px solid var(--beam-nav-edge)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Typography variant="overline" color="text.secondary">{label}</Typography>
        </Box>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{label}</Typography>
    </Stack>
  );
}

function Row({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Stack spacing={1.5}>
      <Typography variant="overline" color="text.secondary">{title}</Typography>
      <Stack direction="row" spacing={4} sx={{ flexWrap: 'wrap', alignItems: 'flex-start' }}>{children}</Stack>
    </Stack>
  );
}

export const Bench: Story = {
  // transparent root → the theme canvas (body::before/::after) shows behind the boxes.
  render: () => (
    <Stack spacing={5} sx={{ minHeight: '100vh', p: 6 }}>
      <Row title="fill — gradient vs glass">
        <PlatterBox label="gradient" fill="gradient" />
        <PlatterBox label="glass · offset 4" fill="glass" offset={4} />
      </Row>

      <Row title="glass — offset 4 / 8 / 12">
        <PlatterBox label="offset 4" fill="glass" offset={4} />
        <PlatterBox label="offset 8" fill="glass" offset={8} />
        <PlatterBox label="offset 12" fill="glass" offset={12} />
      </Row>

      <Row title="radius pick (glass, offset 4) — your ruling">
        {/* radius:24 → platter radius calc(24+4)=28, CONCENTRIC with the 24 box corner. */}
        <PlatterBox label="concentric 28 (radius 24)" fill="glass" offset={4} radius={24} />
        {/* radius:20 → platter radius calc(20+4)=24, FLAT = the box corner → pinches. */}
        <PlatterBox label="flat 24 (radius 20)" fill="glass" offset={4} radius={20} />
      </Row>

      <Row title="gradient — interaction tiers (hover / circle the cursor)">
        <PlatterBox label="none" interaction="none" />
        <PlatterBox label="hover-spin" interaction="hover-spin" />
        <PlatterBox label="track" interaction="track" />
      </Row>
    </Stack>
  ),
};
