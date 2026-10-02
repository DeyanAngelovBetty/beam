import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Slider from '@mui/material/Slider';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { logoGradient } from '../theme/brandLogos';

/**
 * Selected-item VIGNETTE bench (Lab) — the platter idea TURNED INWARD, for the active/selected nav item.
 * One pseudo-layer over the `--beam-selected-surface` tint: `background: logoGradient('to right')` masked so
 * the brand gradient shows only at the EDGES and is transparent across the CENTRE — so text always sits on the
 * calm tint (legibility unchanged). Confirmed working in Chromium (Deyan, 2026-10-02).
 *
 * NO nav wiring — this is a tuning bench. Controls: edge width (where the mask fades), layer opacity (the
 * "just dim it" lever), right-balance (dim the hotter RIGHT edge — the warm logo stops land there), and
 * linear vs radial mask. Shown in BOTH modes, on a selected item with/without an icon, and on a sub-item.
 *
 * TRIED AND PARKED (2026-10-02, kept as the record — BEAM.md §9). Not wired to the nav: a nav item is too
 * small and dense to carry decoration, and the selected TINT is the correct treatment under the loudness
 * budget — the nav already carries the platter + the brand gradient + the glass fringe. The shared
 * `--beam-selected-surface` token stays (the selected table row + the active nav item read it); the selected
 * row keeps the flat token, no vignette. This bench remains as the evidence the idea was tested.
 */
const meta: Meta = { title: 'Lab/Beam/Selected Vignette', parameters: { layout: 'fullscreen' } };
export default meta;
type Story = StoryObj;

type Shape = 'linear' | 'radial';

/** The mask that hides the gradient across the centre. Linear = left/right edges; radial = all round. */
function maskFor(shape: Shape, edge: number, balance: number): string {
  if (shape === 'radial') {
    // edge → ring thickness from the rim; transparent centre out to (100 − edge), opaque by the edge.
    return `radial-gradient(130% 165% at 50% 50%, transparent ${Math.max(0, 100 - edge * 2)}%, #000 100%)`;
  }
  // left edge full #000; right edge capped at `balance` alpha so the hotter right can be evened out.
  return `linear-gradient(to right, #000 0%, transparent ${edge}%, transparent ${100 - edge}%, rgba(0,0,0,${balance}) 100%)`;
}

function VignetteItem({
  label,
  icon = false,
  inset = false,
  opacity,
  mask,
}: {
  label: string;
  icon?: boolean;
  inset?: boolean;
  opacity: number;
  mask: string;
}) {
  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden', // clips the vignette to the item's rounded corners (answers the corner question)
        borderRadius: '10px',
        cornerShape: 'squircle',
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        height: 40,
        pl: inset ? 5 : 2,
        pr: 2,
        bgcolor: 'var(--beam-selected-surface)', // the calm base tint — same token the real selected states use
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          background: logoGradient('to right'), // the brand gradient — same source as the wordmark/underline
          opacity,
          maskImage: mask,
          WebkitMaskImage: mask,
        },
        '& > *': { position: 'relative', zIndex: 1 }, // content rides ABOVE the vignette
      }}
    >
      {icon && <Box sx={{ width: 20, height: 20, borderRadius: '6px', bgcolor: 'text.secondary', opacity: 0.5, flexShrink: 0 }} />}
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
    </Box>
  );
}

function ModeColumn({ mode, opacity, mask }: { mode: 'dark' | 'light'; opacity: number; mask: string }) {
  return (
    <Box data-beam-mode={mode} sx={{ flex: 1, minWidth: 280, bgcolor: 'background.default', color: 'text.primary', p: 3, borderRadius: 3 }}>
      <Typography variant="overline" color="text.secondary">
        {mode}
      </Typography>
      <Stack spacing={1} sx={{ mt: 1 }}>
        <VignetteItem label="Dashboard" icon opacity={opacity} mask={mask} />
        <VignetteItem label="No icon" opacity={opacity} mask={mask} />
        <VignetteItem label="Sub-item" inset opacity={opacity} mask={mask} />
        {/* an UNselected item for contrast (no tint, no vignette) */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, height: 40, px: 2, opacity: 0.8 }}>
          <Box sx={{ width: 20, height: 20, borderRadius: '6px', bgcolor: 'text.secondary', opacity: 0.35 }} />
          <Typography variant="body2">Unselected</Typography>
        </Box>
      </Stack>
    </Box>
  );
}

export const Bench: Story = {
  render: () => {
    const [edge, setEdge] = useState(30); // Deyan's confirmed starting point
    const [opacity, setOpacity] = useState(1);
    const [balance, setBalance] = useState(1); // 1 = symmetric; < 1 dims the hotter right edge
    const [shape, setShape] = useState<Shape>('linear');
    const mask = maskFor(shape, edge, balance);
    return (
      <Box sx={{ minHeight: '100vh', p: 3 }}>
        {/* Controls */}
        <Stack
          direction="row"
          spacing={4}
          sx={{ p: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10, bgcolor: 'background.paper0', borderBottom: '1px solid', borderColor: 'divider' }}
        >
          <Stack sx={{ width: 180 }}>
            <Typography variant="caption">edge width {edge}%</Typography>
            <Slider size="small" min={20} max={45} value={edge} onChange={(_, v) => setEdge(v as number)} />
          </Stack>
          <Stack sx={{ width: 180 }}>
            <Typography variant="caption">layer opacity {opacity.toFixed(2)}</Typography>
            <Slider size="small" min={0.3} max={1} step={0.05} value={opacity} onChange={(_, v) => setOpacity(v as number)} />
          </Stack>
          <Stack sx={{ width: 180, opacity: shape === 'radial' ? 0.4 : 1 }}>
            <Typography variant="caption">right balance {balance.toFixed(2)} (linear)</Typography>
            <Slider size="small" min={0.3} max={1} step={0.05} value={balance} disabled={shape === 'radial'} onChange={(_, v) => setBalance(v as number)} />
          </Stack>
          <Stack>
            <Typography variant="caption">mask</Typography>
            <ToggleButtonGroup size="small" exclusive value={shape} onChange={(_, v) => v && setShape(v as Shape)}>
              <ToggleButton value="linear">linear</ToggleButton>
              <ToggleButton value="radial">radial</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
          <Typography variant="caption" sx={{ fontFamily: 'monospace', maxWidth: 420, color: 'text.secondary' }}>
            mask-image: {mask}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap' }}>
          <ModeColumn mode="dark" opacity={opacity} mask={mask} />
          <ModeColumn mode="light" opacity={opacity} mask={mask} />
        </Stack>
      </Box>
    );
  },
};
