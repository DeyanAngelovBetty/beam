import { useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { beamGradientBorder } from './gradientBorder';
import { usePointerAngleTracking } from './usePointerAngleTracking';

/**
 * beamGradientBorder({ track }) + usePointerAngleTracking — the pointer leads, the bright sector
 * follows. The circle test surface: hover a card and circle the cursor CONTINUOUSLY, both
 * directions, slow and fast — the bright sector should track smoothly and NEVER whip the long way,
 * especially crossing the 12-o'clock seam (that's the unwrap doing its job). Enter from each corner:
 * the rim leans from rest, no snap. Leave: it eases home. Two cards: only the hovered one tracks.
 *
 * Keyboard focus is unchanged — there is no pointer, so nothing tracks (the rim rests). Under
 * prefers-reduced-motion the hook is inert (rim rests; the 1→2px hover-grow still works).
 *
 * TUNING SURFACE: the lean's "magnetic" feel is the QUICK motion var (rest ease-home is MOVE) —
 * Deyan's bench dial.
 */
const meta: Meta = {
  title: 'Recipes/GradientBorder (tracked)',
  parameters: { layout: 'centered' },
};
export default meta;
type Story = StoryObj;

function TrackedCard({ label }: { label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  usePointerAngleTracking(ref);
  return (
    <Paper
      ref={ref}
      variant="outlined"
      sx={{ width: 200, height: 120, display: 'grid', placeItems: 'center', ...(beamGradientBorder({ track: true }) as object) }}
    >
      <Typography variant="overline" color="text.secondary">
        {label}
      </Typography>
    </Paper>
  );
}

/** 2×2 grid — circle the cursor around each card; hover the seam deliberately for the unwrap test. */
export const TrackingGrid: Story = {
  render: () => (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 5, p: 6 }}>
      {['Volume', 'Latency', 'Approvals', 'Health'].map((l) => (
        <TrackedCard key={l} label={l} />
      ))}
    </Box>
  ),
};

/** One distribution, three variants — the beacon is present in all: static shows it at the rest
 *  angle (135°), spin sweeps it on hover, track leans it to the cursor. Confirms the redistribution
 *  renders identically across the builder. Tune --beam-border-hotspot live in devtools here. */
export const Variants: Story = {
  render: () => (
    <Box sx={{ display: 'flex', gap: 5, p: 6, flexWrap: 'wrap' }}>
      <Paper variant="outlined" sx={{ width: 200, height: 120, display: 'grid', placeItems: 'center', ...(beamGradientBorder() as object) }}>
        <Typography variant="overline" color="text.secondary">Static</Typography>
      </Paper>
      <Paper variant="outlined" sx={{ width: 200, height: 120, display: 'grid', placeItems: 'center', ...(beamGradientBorder({ interactive: true }) as object) }}>
        <Typography variant="overline" color="text.secondary">Spin (hover)</Typography>
      </Paper>
      <TrackedCard label="Track (hover)" />
    </Box>
  ),
};
