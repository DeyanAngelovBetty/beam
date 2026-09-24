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

/** The legal matrix: each semantic hue (now ONE tinted construction — volume no longer changes the fill;
 *  the row accent carries loudness, §6.13), plus neutral/silent. */
export const Grammar: Story = {
  render: () => (
    <Stack spacing={2}>
      <div>
        <Typography variant="overline" color="text.secondary">Noted (hue — tinted)</Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
          <BeamBadge hue="danger" volume="noted" label="Failed" />
          <BeamBadge hue="warning" volume="noted" label="Refunded" />
          <BeamBadge hue="success" volume="noted" label="Completed" />
          <BeamBadge hue="in-progress" volume="noted" label="Pending" />
        </Stack>
      </div>
      <div>
        <Typography variant="overline" color="text.secondary">Loud (hue — tinted, same construction)</Typography>
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
// STATUS-CHIP REWORK — the Friday evidence matrix (2026-09-24). Three constructions × the wire statuses +
// Sunlight's Active/Paused/Draft (+ Scheduled, so every severity shows), rendered in BOTH modes at once
// (each panel forces data-beam-mode, which flips the palette + status vars). The pick happens here:
//   • Tinted (bordered)   — the shipped BeamBadge construction.
//   • Tinted (borderless) — same wash + ink, no 40% edge (the border sub-question).
//   • Option A (fallback) — darkened fill + white text, AA-passing (the pre-rework filled family, fixed).
// Read across: no sub-AA pair anywhere; the tinted columns stay calm-but-legible, Option A stays loud.

type Row = { label: string; hue: BeamBadgeHue | 'neutral'; volume?: 'noted' | 'loud' };
const ROWS: Row[] = [
  // Wire statuses (Gaspar transactions)
  { label: 'Failed', hue: 'danger', volume: 'loud' },
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
// Option A darkened fills (harness only) — the AA-passing filled fallback for the Friday comparison.
const OPTION_A_FILL: Record<BeamBadgeHue, string> = {
  danger: '#C62828', warning: '#B26A00', success: '#2E7D32', 'in-progress': '#0277BD',
};

/** Tinted, no border — same theme-var wash + ink as BeamBadge, minus the 40% edge. */
function TintedBorderless({ row }: { row: Row }) {
  if (row.hue === 'neutral') return <Chip label={row.label} size="small" variant="outlined" sx={{ fontWeight: 500 }} />;
  const channel = `var(--mui-palette-${MUI_KEY[row.hue]}-mainChannel)`;
  return (
    <Chip
      label={row.label}
      size="small"
      variant="filled"
      sx={{ fontWeight: 500, color: `var(--beam-status-${row.hue}-ink)`, backgroundColor: `rgba(${channel} / var(--beam-status-fill-alpha))`, border: 'none' }}
    />
  );
}

/** Option A — darkened fill + white text (the pre-rework filled family, fixed to pass AA). */
function OptionA({ row }: { row: Row }) {
  if (row.hue === 'neutral') return <Chip label={row.label} size="small" variant="outlined" sx={{ fontWeight: 500 }} />;
  return <Chip label={row.label} size="small" variant="filled" sx={{ fontWeight: 500, color: '#fff', backgroundColor: OPTION_A_FILL[row.hue] }} />;
}

function ModePanel({ mode }: { mode: 'light' | 'dark' }) {
  return (
    <Box data-beam-mode={mode} sx={{ bgcolor: 'background.paper', color: 'text.primary', p: 2, borderRadius: 1, border: 1, borderColor: 'divider', minWidth: 340 }}>
      <Typography variant="overline" color="text.secondary">{mode} surface</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'auto auto auto', columnGap: 3, rowGap: 1, alignItems: 'center', mt: 1 }}>
        <Typography variant="caption" color="text.secondary">Tinted · bordered</Typography>
        <Typography variant="caption" color="text.secondary">Tinted · borderless</Typography>
        <Typography variant="caption" color="text.secondary">Option A · fill</Typography>
        {ROWS.map((row) => (
          <Box key={row.label} sx={{ display: 'contents' }}>
            {row.hue === 'neutral'
              ? <BeamBadge hue="neutral" label={row.label} />
              : <BeamBadge hue={row.hue} volume={row.volume ?? 'loud'} label={row.label} />}
            <TintedBorderless row={row} />
            <OptionA row={row} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}

/**
 * The rework evidence: both constructions, every severity, BOTH modes side by side. AA (4.5:1) holds for
 * every tinted pair (ratios in createBeamTheme STATUS_CHIP). Sunlight's Active/Paused/Draft render through
 * the same BeamBadge → they inherit the tinted grammar with no page change.
 */
export const StatusChipRework: Story = {
  parameters: { layout: 'padded' },
  render: () => (
    <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
      <ModePanel mode="light" />
      <ModePanel mode="dark" />
    </Stack>
  ),
};
