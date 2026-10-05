import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import { pageBackdropSx, derived } from '../theme/tokens';

/**
 * Nav Surface — the case for the SOLID panel (Lab, DECISION RECORD — BEAM.md §9; NOT a proposal to adopt B).
 *
 * Every cell sits on the REAL app background for its mode (canvas base + page mesh via `pageBackdropSx`; the
 * Betty-star is a body-level mask and can't be replicated per-cell — imperceptible for contrast anyway).
 * Four scenes: dark/light × docked/peek:
 *   • DOCKED — the nav sits on the CANVAS only (a bento beside it, not behind). Glass has almost nothing to
 *     refract.
 *   • PEEK — the nav floats OVER a bento (content behind it) — glass's best case.
 * Each scene shows three panels: A solid (ships) · B glass low tint · B glass high tint. Contrast is the
 * inactive label (text.secondary, worst case) vs its effective background, WCAG 2, computed LIVE in-browser:
 * A is one fixed ratio; B is a range (over the content behind it). The conclusion line below is rendered from
 * the live numbers.
 */
const meta: Meta = { title: 'Lab/Beam/Nav Surface', parameters: { layout: 'fullscreen' } };
export default meta;
type Story = StoryObj;

type Scheme = 'dark' | 'light';
type Rgb = [number, number, number];
type Rgba = [number, number, number, number];
const TINT_LOW = 0.45;
const TINT_HIGH = 0.85;
const AA = 4.5;

// The surface ramp + mesh are registered @property colours computed at :root, so a nested data-beam-mode
// alone can't flip them (it flips the MUI palette + the anchor/step, but the ramp inherits :root's already-
// computed colour). Re-declaring the ramp/mesh EXPRESSIONS on the nested element forces them to recompute
// with that element's (flipped) anchor/step — so a cell/probe can truly render a mode different from :root.
const MODE_REDECL: Record<string, string> = {
  '--beam-ramp--1': derived.ramp.sunken,
  '--beam-ramp-0': derived.ramp.anchor,
  '--beam-ramp-1': derived.ramp.paper,
  '--beam-ramp-2': derived.ramp.raised,
  '--beam-ramp-3': derived.ramp.top,
  '--beam-page-mesh': derived.pageMesh,
};

// ---- colour maths (WCAG 2), resolved per mode via a hidden data-beam-mode probe ---------------------------
const probes: Partial<Record<Scheme, HTMLSpanElement>> = {};
function resolve(mode: Scheme, value: string): Rgba {
  let el = probes[mode];
  if (!el) {
    el = document.createElement('span');
    el.setAttribute('data-beam-mode', mode);
    el.style.cssText = 'position:absolute;width:0;height:0;visibility:hidden;pointer-events:none';
    Object.entries(MODE_REDECL).forEach(([k, v]) => el!.style.setProperty(k, v)); // recompute ramp in this mode
    document.body.appendChild(el);
    probes[mode] = el;
  }
  el.style.color = '';
  el.style.color = value;
  const m = getComputedStyle(el).color.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0, 1];
  return [m[0] ?? 0, m[1] ?? 0, m[2] ?? 0, m[3] ?? 1];
}
const flatten = (c: Rgba): Rgb => [c[0], c[1], c[2]]; // theme surfaces are opaque; drop any alpha
const over = (fg: Rgba, bg: Rgb): Rgb => [0, 1, 2].map((i) => fg[i] * fg[3] + bg[i] * (1 - fg[3])) as unknown as Rgb;
const lum = ([r, g, b]: Rgb): number => {
  const f = (c: number) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a: Rgb, b: Rgb): number => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const textOn = (text: Rgba, surface: Rgb): number => ratio(over(text, surface), surface);

type Panel = { title: string; lo: number; hi: number; fixed: boolean };
type SceneData = { panels: Panel[] };
const fmt = (p: Panel) => (p.fixed ? `${p.lo.toFixed(2)}:1 (fixed)` : p.lo.toFixed(2) === p.hi.toFixed(2) ? `${p.lo.toFixed(2)}:1` : `${p.lo.toFixed(2)}–${p.hi.toFixed(2)}:1 (varies)`);

function computeScene(mode: Scheme, kind: 'docked' | 'peek'): SceneData {
  const text = resolve(mode, 'var(--mui-palette-text-secondary)');
  const paper0 = flatten(resolve(mode, 'var(--mui-palette-background-paper0, var(--beam-surface-0))'));
  const paper = resolve(mode, 'var(--mui-palette-background-paper)');
  const canvas = flatten(resolve(mode, 'var(--mui-palette-background-default)'));
  // what sits BEHIND a translucent panel: docked = canvas only; peek = the bento (cards=paper .. floor=canvas)
  const backdrops: Rgb[] = kind === 'docked' ? [canvas] : [canvas, flatten(paper)];
  const bOf = (t: number): Panel => {
    const tint: Rgba = [paper[0], paper[1], paper[2], t];
    const rs = backdrops.map((bd) => textOn(text, over(tint, bd)));
    return { title: `B glass ${Math.round(t * 100)}%`, lo: Math.min(...rs), hi: Math.max(...rs), fixed: false };
  };
  return {
    panels: [
      { title: 'A solid', lo: textOn(text, paper0), hi: textOn(text, paper0), fixed: true },
      bOf(TINT_LOW),
      bOf(TINT_HIGH),
    ],
  };
}

// ---- view -------------------------------------------------------------------------------------------------
function Bento({ sx }: { sx?: object }) {
  return (
    <Paper elevation={1} sx={{ p: 1.5, borderRadius: 2, width: 190, ...sx }}>
      <Typography variant="overline" color="text.secondary">Bento</Typography>
      <Box component="table" sx={{ width: '100%', mt: 0.5, borderCollapse: 'collapse', '& td': { borderBottom: '1px solid', borderColor: 'divider', py: 0.25, fontSize: 11 } }}>
        <tbody>{['Volume 1,284', 'Latency 42ms', 'Approvals 7', 'Health OK'].map((r) => (<tr key={r}><Box component="td">{r}</Box></tr>))}</tbody>
      </Box>
    </Paper>
  );
}

const NAV_LABELS = ['Overview', 'Players', 'Payments', 'Reports'];
function NavPanel({ title, badge, sx }: { title: string; badge: string; sx: object }) {
  const pass = (() => { const n = parseFloat(badge); return Number.isFinite(n) ? n >= AA : true; })();
  return (
    <Box sx={{ width: 150, flexShrink: 0 }}>
      <Box sx={{ borderRadius: 2.5, cornerShape: 'squircle', border: '1px solid var(--beam-nav-edge)', overflow: 'hidden', ...sx }}>
        <Stack spacing={0.5} sx={{ p: 1.25 }}>
          {NAV_LABELS.map((l) => (<Typography key={l} variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>{l}</Typography>))}
        </Stack>
      </Box>
      <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontWeight: 700 }}>{title}</Typography>
      <Typography variant="caption" sx={{ display: 'block', fontFamily: 'monospace', color: pass ? 'success.main' : 'error.main' }}>
        {badge}{badge.includes(':') ? (pass ? ' ✓AA' : ' ✗AA') : ''}
      </Typography>
    </Box>
  );
}

function Scene({ mode, kind, data }: { mode: Scheme; kind: 'docked' | 'peek'; data?: SceneData }) {
  const paper = 'var(--mui-palette-background-paper)';
  const bSx = (t: number) => ({ background: `color-mix(in oklab, ${paper} ${Math.round(t * 100)}%, transparent)`, backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' });
  const panelSx = [{ bgcolor: 'background.paper0' }, bSx(TINT_LOW), bSx(TINT_HIGH)];
  return (
    <Box data-beam-mode={mode} sx={{ ...MODE_REDECL, ...pageBackdropSx, position: 'relative', minWidth: 360, minHeight: 300, borderRadius: 3, overflow: 'hidden', p: 2, color: 'text.primary' }}>
      <Typography variant="overline" sx={{ color: kind === 'peek' && mode === 'light' ? 'warning.main' : 'text.secondary', position: 'relative', zIndex: 2 }}>
        {mode} · {kind}{kind === 'docked' ? ' (nav over canvas, bento beside)' : ' (nav over bento)'}
      </Typography>
      {/* PEEK: the bento sits BEHIND the panels (content to refract). DOCKED: bento is beside, panels over canvas. */}
      {kind === 'peek' && (
        <Box sx={{ position: 'absolute', inset: 0, p: 2, pt: 5, display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          {Array.from({ length: 4 }).map((_, i) => <Bento key={i} />)}
        </Box>
      )}
      <Stack direction="row" spacing={1.5} sx={{ position: 'relative', zIndex: 1, mt: 3, alignItems: 'flex-start' }}>
        {['A solid + platter', 'B glass low', 'B glass high'].map((t, i) => (
          <NavPanel key={t} title={t} badge={data ? fmt(data.panels[i]) : '…'} sx={panelSx[i]} />
        ))}
        {kind === 'docked' && <Bento sx={{ alignSelf: 'stretch' }} />}
      </Stack>
    </Box>
  );
}

const SCENES: { mode: Scheme; kind: 'docked' | 'peek' }[] = [
  { mode: 'dark', kind: 'docked' }, { mode: 'dark', kind: 'peek' },
  { mode: 'light', kind: 'docked' }, { mode: 'light', kind: 'peek' },
];

export const Bench: Story = {
  render: () => {
    const [data, setData] = useState<SceneData[] | null>(null);
    const [verdict, setVerdict] = useState('Computing…');
    useEffect(() => {
      try {
        const d = SCENES.map((s) => computeScene(s.mode, s.kind));
        setData(d);
        const aMin = Math.min(...d.map((s) => s.panels[0].lo));
        const bLowMin = Math.min(...d.map((s) => s.panels[1].lo));
        const bHighMin = Math.min(...d.map((s) => s.panels[2].lo));
        if (aMin >= AA && bLowMin < AA) {
          setVerdict(
            `The numbers bear it out. A (solid) clears AA everywhere at a FIXED ${aMin.toFixed(2)}:1+; low-tint glass drops to ${bLowMin.toFixed(2)}:1 over light/varied content — below AA (4.5:1). To guarantee the label you need a tint high enough (here ${Math.round(TINT_HIGH * 100)}% ≈ ${bHighMin.toFixed(2)}:1 worst) that the panel is effectively SOLID. The more legible the glass, the less glassy it looks — and in the docked scenes there's only canvas behind it, so the refraction barely reads.`,
          );
        } else {
          setVerdict(
            `The numbers do NOT cleanly bear it out in this environment: A min ${aMin.toFixed(2)}:1, low-tint glass min ${bLowMin.toFixed(2)}:1, high-tint min ${bHighMin.toFixed(2)}:1. (If low-tint glass isn't below AA here, the legibility gap is narrower than argued — eyeball the docked scenes for the "nothing to refract" point regardless.)`,
          );
        }
      } catch {
        setVerdict('Could not compute contrast in this environment.');
      }
    }, []);
    return (
      <Stack spacing={2} sx={{ p: 3, minHeight: '100vh' }}>
        <Typography variant="h6">Nav surface — solid (A) vs translucent (B). Decision record, not a proposal.</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 760 }}>
          Inactive label (text.secondary) contrast vs its effective background, WCAG 2, live. A = one fixed
          ratio (opaque surface). B = a range (tint over whatever is behind). AA = 4.5:1 for this text.
        </Typography>
        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="overline" color="text.secondary">Conclusion (from the live numbers)</Typography>
          <Typography variant="body2">{verdict}</Typography>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 2 }}>
          {SCENES.map((s, i) => (<Scene key={`${s.mode}-${s.kind}`} mode={s.mode} kind={s.kind} data={data?.[i]} />))}
        </Box>
      </Stack>
    );
  },
};
