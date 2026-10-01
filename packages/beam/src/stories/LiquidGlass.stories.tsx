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
 * Three recipes side by side, three forms each (platter fringe behind a solid box at offset 8 = the nav's,
 * and 12 = Deyan's reference card; plus a fully translucent panel with text). ALL recipes share the LOCKED
 * recipe (backdrop-filter blur → opacity-lift, NO saturate/brightness; sheen + surface fill; ONE box-shadow =
 * inset rim-light + outer drop) and differ ONLY in refraction. Exactly four controls: blur, displacement
 * (B/C), rim-light strength, lift strength — they drive the real themed vars, so the bench == the nav glass.
 *
 * ⚠️ Chromium target. I could not visually verify any of this (no browser in the build env) — treat every
 * visual claim as UNVERIFIED until you eyeball it in Chrome. Known caveats are noted per recipe.
 *   A — no refraction. The calm baseline; reliable everywhere.
 *   B — NOISE displacement (feTurbulence→feGaussianBlur→feDisplacementMap) via DIRECT
 *       `backdrop-filter: … url(#beam-liquid-glass)` (Chromium 141). This is the shipped NAV glass recipe.
 *       Safari/FF ignore the url() filter → degrade to no-refraction (plain, not broken).
 *   C — EDGE-LENS: same as B but the displacement map is a SHAPED gradient (bend at the rim, flat
 *       centre) instead of uniform noise. The map here is a BEST-EFFORT approximation — a true rounded-rect
 *       normal map needs research (see the report). Experimental; UNVERIFIED.
 */
const meta: Meta = { title: 'Lab/Beam/Liquid Glass', parameters: { layout: 'fullscreen' } };
export default meta;
type Story = StoryObj;

// Edge-lens displacement map — SDF-rim approach (per the Chromium finding): neutral 128 centre (no
// displacement), with the bend living in a rim BAND along the inward normal — R encodes x (left +, right −),
// G encodes y (top +, bottom −). Rounded-rect clipped. ⚠️ BEST-EFFORT + UNVERIFIED: the L/R (R-channel)
// bands run full height so they own the CORNERS → corners bend horizontally only; a correct all-corner
// normal map (and the map's coordinate space INSIDE backdrop-filter) is the unsolved research bit.
const W = 240, H = 150, RX = 24, BAND = 24;
const EDGE_MAP =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">` +
      `<defs>` +
      `<linearGradient id="l" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="rgb(255,128,128)"/><stop offset="1" stop-color="rgb(128,128,128)"/></linearGradient>` +
      `<linearGradient id="r" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="rgb(128,128,128)"/><stop offset="1" stop-color="rgb(0,128,128)"/></linearGradient>` +
      `<linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgb(128,255,128)"/><stop offset="1" stop-color="rgb(128,128,128)"/></linearGradient>` +
      `<linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgb(128,128,128)"/><stop offset="1" stop-color="rgb(128,0,128)"/></linearGradient>` +
      `<clipPath id="rr"><rect width="${W}" height="${H}" rx="${RX}"/></clipPath></defs>` +
      `<g clip-path="url(%23rr)">` +
      `<rect width="${W}" height="${H}" fill="rgb(128,128,128)"/>` +
      // top/bottom G bands first, inset from the corners (x: BAND..W−BAND)
      `<rect x="${BAND}" y="0" width="${W - 2 * BAND}" height="${BAND}" fill="url(%23t)"/>` +
      `<rect x="${BAND}" y="${H - BAND}" width="${W - 2 * BAND}" height="${BAND}" fill="url(%23b)"/>` +
      // left/right R bands full height → they own the corners
      `<rect x="0" y="0" width="${BAND}" height="${H}" fill="url(%23l)"/>` +
      `<rect x="${W - BAND}" y="0" width="${BAND}" height="${H}" fill="url(%23r)"/>` +
      `</g></svg>`,
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

// ---- recipes = the LOCKED glass recipe, differing ONLY in refraction (Deyan's ruling 2026-10-01) ----
// backdrop-filter = blur → (optional) refraction url(#id) → opacity-lift. NO saturate/brightness/drop-shadow
// in the filter. Fill = sheen over the surface tint. ONE shadow source: the box-shadow (inset rim-light +
// outer drop). This mirrors platter.ts fill:'glass' byte-for-byte, reading the SAME themed vars — the bench's
// four sliders drive those vars (--beam-nav-glass-blur / -rim / -lift) + the SVG displacement — so A/B/C
// differ only in refraction: none (A) / noise (B) / edge-lens (C).
const RADIUS = `${BORDER_RADIUS_24}px`;
const GLASS_BASE = {
  background: 'var(--beam-nav-sheen), var(--beam-nav-surface)',
  border: '1px solid var(--beam-nav-edge)',
  boxShadow: 'inset 0 0 14px -4px rgb(205 205 205 / var(--beam-nav-glass-rim)), 0 12px 32px -10px rgb(0 0 0 / 8%)',
} as const;
const glassSx = (refract?: string) => {
  const bf = refract
    ? `blur(var(--beam-nav-glass-blur)) url(#${refract}) opacity(var(--beam-nav-glass-lift))`
    : `blur(var(--beam-nav-glass-blur)) opacity(var(--beam-nav-glass-lift))`;
  return { ...GLASS_BASE, backdropFilter: bf, WebkitBackdropFilter: bf } as const;
};

function GlassPanel({ label, filterId }: { label: string; filterId?: string }) {
  return (
    <Box
      sx={{
        position: 'relative', width: 240, height: 150, borderRadius: RADIUS, cornerShape: 'squircle',
        display: 'grid', placeItems: 'center', overflow: 'hidden', ...glassSx(filterId),
      }}
    >
      <Typography variant="subtitle1" sx={{ position: 'relative', zIndex: 2 }}>{label}</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ position: 'relative', zIndex: 2 }}>
        translucent panel · text must stay legible
      </Typography>
    </Box>
  );
}

function FringeBox({ label, offset, filterId }: { label: string; offset: number; filterId?: string }) {
  return (
    // wrap carries the glass platter (inset -offset, behind); inner solid box is the opaque panel.
    <Box sx={{ position: 'relative', width: 240, height: 150 }}>
      <Box sx={{ position: 'absolute', inset: `${-offset}px`, borderRadius: `${BORDER_RADIUS_24 + offset}px`, cornerShape: 'squircle', ...glassSx(filterId) }} />
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
    // EXACTLY four controls (Deyan's ruling) — they drive the real themed glass vars, so the bench == the nav.
    const [blur, setBlur] = useState(18); // --beam-nav-glass-blur (seed default 18)
    const [scale, setScale] = useState(12); // SVG displacement scale (B/C) — range 0–200
    const [rim, setRim] = useState(21); // --beam-nav-glass-rim (%) — inset rim-light strength (dark exact 21)
    const [lift, setLift] = useState(0.9); // --beam-nav-glass-lift — backdrop opacity() clarity-lift (dark exact 0.9)
    return (
      <Box sx={{ minHeight: '100vh', ['--beam-nav-glass-blur' as string]: `${blur}px`, ['--beam-nav-glass-rim' as string]: `${rim}%`, ['--beam-nav-glass-lift' as string]: String(lift) }}>
        <Filters scale={scale} />

        {/* Controls — blur, displacement, rim-light strength, lift strength (nothing else) */}
        <Stack direction="row" spacing={4} sx={{ p: 2, position: 'sticky', top: 0, zIndex: 10, bgcolor: 'background.paper0', borderBottom: '1px solid', borderColor: 'divider', flexWrap: 'wrap' }}>
          <Stack sx={{ width: 180 }}><Typography variant="caption">blur {blur}px</Typography><Slider size="small" min={0} max={30} value={blur} onChange={(_, v) => setBlur(v as number)} /></Stack>
          <Stack sx={{ width: 180 }}><Typography variant="caption">displacement {scale} (B/C)</Typography><Slider size="small" min={0} max={200} value={scale} onChange={(_, v) => setScale(v as number)} /></Stack>
          <Stack sx={{ width: 180 }}><Typography variant="caption">rim-light {rim}%</Typography><Slider size="small" min={0} max={60} value={rim} onChange={(_, v) => setRim(v as number)} /></Stack>
          <Stack sx={{ width: 180 }}><Typography variant="caption">lift {lift.toFixed(2)}</Typography><Slider size="small" min={0.5} max={1} step={0.01} value={lift} onChange={(_, v) => setLift(v as number)} /></Stack>
        </Stack>

        {/* Content backdrop (fixed behind) + glass samples over it */}
        <Box sx={{ position: 'relative' }}>
          <Box sx={{ position: 'absolute', inset: 0, zIndex: 0 }}><Backdrop /></Box>
          <Stack spacing={5} sx={{ position: 'relative', zIndex: 1, p: 6 }}>
            {([
              ['A — lighting only (no refraction)', undefined],
              ['B — lighting + noise displacement', 'beam-liquid-glass'],
              ['C — lighting + edge-lens (shaped map · best-effort)', 'beam-edge-lens'],
            ] as const).map(([title, filterId]) => (
              <Stack key={title} spacing={1.5}>
                <Typography variant="overline" sx={{ color: 'text.primary' }}>{title}</Typography>
                <Stack direction="row" spacing={4} sx={{ flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <GlassPanel label="Panel" filterId={filterId} />
                  <FringeBox label="fringe 8" offset={8} filterId={filterId} />
                  <FringeBox label="fringe 12" offset={12} filterId={filterId} />
                </Stack>
              </Stack>
            ))}
          </Stack>
        </Box>
      </Box>
    );
  },
};
