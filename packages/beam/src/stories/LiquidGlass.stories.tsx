import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Slider from '@mui/material/Slider';
import Paper from '@mui/material/Paper';
import { BORDER_RADIUS_24 } from '../theme/tokens';

/**
 * Liquid Glass bench (Lab) — see real liquid glass over real Beam content and decide where it belongs.
 * Three recipes side by side, two forms each (platter fringe behind a solid box at offset 12/24, and a fully
 * translucent panel with text). Controls: blur, displacement scale, specular strength.
 *
 * ⚠️ Chromium target. I could not visually verify any of this (no browser in the build env) — treat every
 * visual claim as UNVERIFIED until you eyeball it in Chrome. Known caveats are noted per recipe.
 *   A — today's glass (blur + saturate + tint): reliable everywhere.
 *   B — generator-style: specular ::before (inset box-shadow) + refraction ::after (backdrop-filter:blur(0)
 *       + filter:url(#…) feTurbulence→feGaussianBlur→feDisplacementMap) + outer shadow + isolation. The
 *       backdrop-displacement via `filter` on a backdrop-filtered pseudo is the EXPERIMENTAL bit — Chromium-
 *       only, version-sensitive; may show no refraction. Safari/FF ignore the url() filter → degrade to the
 *       blur(0) (plain, not broken).
 *   C — edge-lens: same as B but the displacement map is a SHAPED gradient (bend at the rim, flat centre)
 *       instead of uniform noise. The map here is a BEST-EFFORT radial/linear approximation — a true
 *       rounded-rect normal map needs research (see the report). Experimental; UNVERIFIED.
 */
const meta: Meta = { title: 'Lab/Beam/Liquid Glass', parameters: { layout: 'fullscreen' } };
export default meta;
type Story = StoryObj;

// Edge-lens displacement map (best-effort): mid-grey centre (no displacement) → high-contrast R/G at the rim
// (strong bend). A real rounded-rect lens wants a crafted normal map; this radial approximation is flagged.
const EDGE_MAP =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="150"><defs>` +
      `<radialGradient id="r" cx="50%" cy="50%" r="60%">` +
      `<stop offset="55%" stop-color="rgb(128,128,128)"/>` +
      `<stop offset="100%" stop-color="rgb(255,0,128)"/></radialGradient></defs>` +
      `<rect width="220" height="150" rx="24" fill="rgb(128,128,128)"/>` +
      `<rect width="220" height="150" rx="24" fill="url(%23r)"/></svg>`,
  );

function Filters({ scale }: { scale: number }) {
  return (
    <svg aria-hidden width="0" height="0" style={{ position: 'absolute' }}>
      <defs>
        {/* B — uniform noise wobble */}
        <filter id="beam-liquid-glass" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves={2} seed={7} result="noise" />
          <feGaussianBlur in="noise" stdDeviation="2" result="blurred" />
          <feDisplacementMap in="SourceGraphic" in2="blurred" scale={scale} xChannelSelector="R" yChannelSelector="G" />
        </filter>
        {/* C — shaped map (edge-lens best effort) */}
        <filter id="beam-edge-lens" x="-20%" y="-20%" width="140%" height="140%">
          <feImage href={EDGE_MAP} x="0" y="0" width="100%" height="100%" result="map" preserveAspectRatio="none" />
          <feDisplacementMap in="SourceGraphic" in2="map" scale={scale} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}

// ---- recipes as sx fragments (driven by CSS vars --lg-blur / --lg-specular; scale is the SVG attr) ----
const RADIUS = `${BORDER_RADIUS_24}px`;
const recipeA = {
  backdropFilter: 'blur(var(--lg-blur)) saturate(1.5)',
  WebkitBackdropFilter: 'blur(var(--lg-blur)) saturate(1.5)',
  background: 'color-mix(in oklab, var(--mui-palette-background-paper) 40%, transparent)',
  border: '1px solid var(--beam-nav-edge)',
} as const;

const recipeB = (filterId: string) =>
  ({
    isolation: 'isolate',
    background: 'color-mix(in oklab, var(--mui-palette-background-paper) 20%, transparent)',
    boxShadow: '0 12px 40px -12px rgba(0,0,0,0.5)', // outer shadow
    // specular inset edge
    '&::before': {
      content: '""', position: 'absolute', inset: 0, borderRadius: 'inherit', cornerShape: 'squircle',
      pointerEvents: 'none', zIndex: 1,
      boxShadow: 'inset 0 1px 1px rgba(255,255,255,calc(0.6 * var(--lg-specular))), inset 0 -1px 1px rgba(255,255,255,calc(0.25 * var(--lg-specular)))',
    },
    // refraction: force a backdrop layer (blur 0) then displace it with the SVG filter
    '&::after': {
      content: '""', position: 'absolute', inset: 0, borderRadius: 'inherit', cornerShape: 'squircle',
      pointerEvents: 'none', zIndex: 0,
      backdropFilter: `blur(var(--lg-blur))`,
      WebkitBackdropFilter: `blur(var(--lg-blur))`,
      filter: `url(#${filterId})`,
    },
  }) as const;

function GlassPanel({ label, recipe, filterId }: { label: string; recipe: 'A' | 'B' | 'C'; filterId?: string }) {
  const sx =
    recipe === 'A' ? recipeA : recipeB(filterId ?? 'beam-liquid-glass');
  return (
    <Box
      sx={{
        position: 'relative', width: 240, height: 150, borderRadius: RADIUS, cornerShape: 'squircle',
        display: 'grid', placeItems: 'center', overflow: 'hidden', ...sx,
      }}
    >
      <Typography variant="subtitle1" sx={{ position: 'relative', zIndex: 2 }}>{label}</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ position: 'relative', zIndex: 2 }}>
        translucent panel · text must stay legible
      </Typography>
    </Box>
  );
}

function FringeBox({ label, recipe, offset, filterId }: { label: string; recipe: 'A' | 'B' | 'C'; offset: number; filterId?: string }) {
  const sx = recipe === 'A' ? recipeA : recipeB(filterId ?? 'beam-liquid-glass');
  return (
    // wrap carries the glass platter (inset -offset, behind); inner solid box is the opaque panel.
    <Box sx={{ position: 'relative', width: 240, height: 150 }}>
      <Box sx={{ position: 'absolute', inset: `${-offset}px`, borderRadius: `${BORDER_RADIUS_24 + offset}px`, cornerShape: 'squircle', ...sx }} />
      <Box
        sx={{
          position: 'absolute', inset: 0, borderRadius: RADIUS, cornerShape: 'squircle',
          bgcolor: 'background.paper0', border: '1px solid var(--beam-nav-edge)', display: 'grid', placeItems: 'center',
        }}
      >
        <Typography variant="overline" color="text.secondary">{label}</Typography>
      </Box>
    </Box>
  );
}

/** Real Beam content behind the glass — cards + a small table — so refraction has detail to bend. */
function Backdrop() {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2, p: 2, opacity: 0.9 }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <Paper key={i} elevation={i % 3} sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="overline" color="text.secondary">Card {i + 1}</Typography>
          <Box component="table" sx={{ width: '100%', mt: 1, borderCollapse: 'collapse', '& td': { borderBottom: '1px solid', borderColor: 'divider', py: 0.5, fontSize: 12 } }}>
            <tbody>
              {['Volume 1,284', 'Latency 42ms', 'Approvals 7', 'Health OK'].map((r) => (
                <tr key={r}><Box component="td">{r}</Box></tr>
              ))}
            </tbody>
          </Box>
        </Paper>
      ))}
    </Box>
  );
}

export const Bench: Story = {
  render: () => {
    const [blur, setBlur] = useState(8);
    const [scale, setScale] = useState(40);
    const [specular, setSpecular] = useState(0.6);
    return (
      <Box sx={{ minHeight: '100vh', ['--lg-blur' as string]: `${blur}px`, ['--lg-specular' as string]: String(specular) }}>
        <Filters scale={scale} />

        {/* Controls */}
        <Stack direction="row" spacing={4} sx={{ p: 2, position: 'sticky', top: 0, zIndex: 10, bgcolor: 'background.paper0', borderBottom: '1px solid', borderColor: 'divider', flexWrap: 'wrap' }}>
          <Stack sx={{ width: 180 }}><Typography variant="caption">blur {blur}px</Typography><Slider size="small" min={0} max={30} value={blur} onChange={(_, v) => setBlur(v as number)} /></Stack>
          <Stack sx={{ width: 180 }}><Typography variant="caption">displacement {scale}</Typography><Slider size="small" min={0} max={200} value={scale} onChange={(_, v) => setScale(v as number)} /></Stack>
          <Stack sx={{ width: 180 }}><Typography variant="caption">specular {specular.toFixed(2)}</Typography><Slider size="small" min={0} max={1} step={0.05} value={specular} onChange={(_, v) => setSpecular(v as number)} /></Stack>
        </Stack>

        {/* Content backdrop (fixed behind) + glass samples over it */}
        <Box sx={{ position: 'relative' }}>
          <Box sx={{ position: 'absolute', inset: 0, zIndex: 0 }}><Backdrop /></Box>
          <Stack spacing={5} sx={{ position: 'relative', zIndex: 1, p: 6 }}>
            {([
              ['A — blur + saturate + tint', 'A', undefined],
              ['B — generator (noise displacement)', 'B', 'beam-liquid-glass'],
              ['C — edge-lens (shaped map · best-effort)', 'C', 'beam-edge-lens'],
            ] as const).map(([title, recipe, filterId]) => (
              <Stack key={title} spacing={1.5}>
                <Typography variant="overline" sx={{ color: 'text.primary' }}>{title}</Typography>
                <Stack direction="row" spacing={4} sx={{ flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <GlassPanel label="Panel" recipe={recipe} filterId={filterId} />
                  <FringeBox label="fringe 12" recipe={recipe} offset={12} filterId={filterId} />
                  <FringeBox label="fringe 24" recipe={recipe} offset={24} filterId={filterId} />
                </Stack>
              </Stack>
            ))}
          </Stack>
        </Box>
      </Box>
    );
  },
};
