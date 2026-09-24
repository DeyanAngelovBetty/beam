import type { Meta, StoryObj } from '@storybook/react-vite';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import { BeamBadge } from './BeamBadge';
import type { BeamBadgeHue } from './BeamBadge.types';

/**
 * BeamBadge — the grammar-native badge (docs/state-rendering-grammar.md). Hue = meaning, volume =
 * loudness; filled-neutral and label-less badges are unrepresentable in the type. Pages own the
 * vocabulary→(hue,volume) map; the organism knows no product words.
 */
const meta: Meta<typeof BeamBadge> = {
  title: 'Components/BeamBadge',
  component: BeamBadge,
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj<typeof BeamBadge>;

/** The legal matrix (§6.13 two-lever): each semantic hue at noted (outlined colour) and loud (filled solid),
 *  plus neutral (outlined colourless). Volume drives the construction again. */
export const Grammar: Story = {
  render: () => (
    <Stack spacing={2}>
      <div>
        <Typography variant="overline" color="text.secondary">Noted (hue — outlined colour)</Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
          <BeamBadge hue="danger" volume="noted" label="Failed" />
          <BeamBadge hue="warning" volume="noted" label="Refunded" />
          <BeamBadge hue="success" volume="noted" label="Completed" />
          <BeamBadge hue="in-progress" volume="noted" label="Pending" />
        </Stack>
      </div>
      <div>
        <Typography variant="overline" color="text.secondary">Loud (hue — filled solid)</Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
          <BeamBadge hue="danger" volume="loud" label="Chargeback" />
          <BeamBadge hue="warning" volume="loud" label="Action needed" />
          <BeamBadge hue="success" volume="loud" label="Active" />
          <BeamBadge hue="in-progress" volume="loud" label="Awaiting review" />
        </Stack>
      </div>
      <div>
        <Typography variant="overline" color="text.secondary">Silent (neutral)</Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
          <BeamBadge hue="neutral" label="Draft" />
          <BeamBadge hue="neutral" label="Ended" />
          <BeamBadge hue="neutral" label="Disabled" />
        </Stack>
      </div>
    </Stack>
  ),
};

// ─────────────────────────────────────────────────────────────────────────────────────────────────────
// STATUS-CHIP CONSTRUCTIONS — the SHIPPED two-lever grammar (§6.13) beside the evaluated TINTED alternative,
// across the wire statuses + Sunlight's Active/Paused/Draft (+ Scheduled, so every severity shows), in BOTH
// modes (each panel forces data-beam-mode, which flips the palette + status vars):
//   • Production (§6.13) — loud = filled DARK solid + white (AAA); noted = outlined colour (far-from-surface
//     ink text + border); transient/neutral = outlined colourless. Volume drives the tier.
//   • Tinted (alt)       — the severity wash + ink construction that briefly shipped; kept here as the
//     evaluated alternative, NOT in production.
// Plus a dark shape-check for the loud solid (Failed): borderless vs a subtle danger @ 50% border.

type Row = { label: string; hue: BeamBadgeHue | 'neutral'; volume?: 'noted' | 'loud' };
const ROWS: Row[] = [
  // Wire statuses (Gaspar transactions — the real five, 2026-09-24)
  { label: 'Failed', hue: 'danger', volume: 'loud' },
  { label: 'Pending challenge', hue: 'warning', volume: 'noted' }, // 3DS challenge outstanding (PendingChallenge)
  { label: 'Processing', hue: 'neutral' },
  { label: 'Succeeded', hue: 'success', volume: 'noted' },
  { label: 'Initiated', hue: 'neutral' },
  // Sunlight lifecycle (loyalty / CJ inherit)
  { label: 'Active', hue: 'success', volume: 'loud' },
  { label: 'Paused', hue: 'warning', volume: 'loud' },
  { label: 'Scheduled', hue: 'in-progress', volume: 'loud' }, // severity coverage (in-progress)
  { label: 'Draft', hue: 'neutral', volume: undefined },
];

const MUI_KEY: Record<BeamBadgeHue, 'error' | 'warning' | 'success' | 'info'> = {
  danger: 'error', warning: 'warning', success: 'success', 'in-progress': 'info',
};
/** Column 2 — the TINTED alternative (evaluated, NOT shipped): severity wash + far-from-surface ink. */
function TintedAlt({ row }: { row: Row }) {
  if (row.hue === 'neutral') return <Chip label={row.label} size="small" variant="outlined" sx={{ fontWeight: 500 }} />;
  const channel = `var(--mui-palette-${MUI_KEY[row.hue]}-mainChannel)`;
  return (
    <Chip
      label={row.label}
      size="small"
      variant="filled"
      sx={{ fontWeight: 500, color: `var(--beam-status-${row.hue}-ink)`, backgroundColor: `rgba(${channel} / var(--beam-status-fill-alpha))`, border: `1px solid rgba(${channel} / var(--beam-status-border-alpha))` }}
    />
  );
}

function ModePanel({ mode }: { mode: 'light' | 'dark' }) {
  return (
    <Box data-beam-mode={mode} sx={{ bgcolor: 'background.paper', color: 'text.primary', p: 2, borderRadius: 1, border: 1, borderColor: 'divider', minWidth: 320 }}>
      <Typography variant="overline" color="text.secondary">{mode} surface</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'auto auto', columnGap: 3, rowGap: 1, alignItems: 'center', mt: 1 }}>
        <Typography variant="caption" color="text.secondary">Production (§6.13 two-lever)</Typography>
        <Typography variant="caption" color="text.secondary">Tinted (alt — not shipped)</Typography>
        {ROWS.map((row) => (
          <Box key={row.label} sx={{ display: 'contents' }}>
            {row.hue === 'neutral'
              ? <BeamBadge hue="neutral" label={row.label} />
              : <BeamBadge hue={row.hue} volume={row.volume ?? 'loud'} label={row.label} />}
            <TintedAlt row={row} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}

/** Dark-mode SHAPE CHECK for the loud solid (Failed): the fill vs #041213 pill edge is only ~2 : 1, so the
 *  pill shape is subtle. Borderless (shipped) vs a subtle danger @ 50% border — the pick. */
function FailedShapeCheck() {
  return (
    <Box data-beam-mode="dark" sx={{ bgcolor: 'background.paper', color: 'text.primary', p: 2, borderRadius: 1, border: 1, borderColor: 'divider' }}>
      <Typography variant="overline" color="text.secondary">Failed · loud solid · dark shape check</Typography>
      <Stack direction="row" spacing={3} sx={{ mt: 1, alignItems: 'center' }}>
        <Stack spacing={0.5} sx={{ alignItems: 'flex-start' }}>
          <Typography variant="caption" color="text.secondary">borderless (shipped)</Typography>
          <BeamBadge hue="danger" volume="loud" label="Failed" />
        </Stack>
        <Stack spacing={0.5} sx={{ alignItems: 'flex-start' }}>
          <Typography variant="caption" color="text.secondary">+ danger @ 50% border</Typography>
          <Chip
            label="Failed"
            size="small"
            variant="filled"
            sx={{ fontWeight: 500, backgroundColor: 'var(--beam-status-danger-solid)', color: 'var(--beam-status-on-solid)', border: '1px solid rgba(var(--mui-palette-error-mainChannel) / 0.5)' }}
          />
        </Stack>
      </Stack>
    </Box>
  );
}

/**
 * Chip-construction evidence: the SHIPPED two-lever grammar (§6.13 — loud filled solid / noted outlined
 * colour / transient outlined colourless) beside the evaluated TINTED alternative, every severity, BOTH
 * modes. Plus the Failed dark shape-check (borderless vs a subtle border). Sunlight's Active/Paused/Draft
 * render through the same BeamBadge → they re-map to the three tiers with no page change.
 */
export const StatusChipRework: Story = {
  parameters: { layout: 'padded' },
  render: () => (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
        <ModePanel mode="light" />
        <ModePanel mode="dark" />
      </Stack>
      <FailedShapeCheck />
    </Stack>
  ),
};
