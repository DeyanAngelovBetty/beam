import { useState, useRef, useLayoutEffect, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import { BeamStat } from './BeamStat';
import { BeamSwitchField } from '../BeamSwitchField/BeamSwitchField';
import { BeamField } from '../BeamField/BeamField';

/**
 * BeamStat v2 — labelled value with the spine motif; the VIEW half of the 44px field twin. Key in
 * the `meta` voice; `severity` (warning | error) is the only alarm channel — spine token + a paired
 * icon (never colour-alone). ONE fill principle: fill marks a family's notable state — severity
 * (WarningAmber outlined → Error filled), boolean (CheckCircle filled / Cancel outlined). No tone.
 */
const meta = {
  title: 'Organisms/BeamStat',
  component: BeamStat,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof BeamStat>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: 'Cash balance', value: '$20.00', caption: 'CAD' },
};

/** Severity axis — outlined WarningAmber (lower) escalates to the FILLED Error (highest). */
export const Warning: Story = {
  args: { label: 'RG risk', value: 'Elevated', severity: 'warning' },
};
export const Error: Story = {
  args: { label: 'Account status', value: 'Suspended', severity: 'error' },
};

/** Boolean values — the yes/no icon pair (fill = true). Pass a boolean straight into `value`. */
export const BooleanTrue: Story = { args: { label: 'Active', value: true } };
export const BooleanFalse: Story = { args: { label: 'Active', value: false } };

/** showCaption — orthogonal to `caption`: content is present in both; hidden keeps the 44px row
 *  without losing the data (morph contexts). */
export const CaptionShown: Story = { args: { label: 'Cash balance', value: '$20.00', caption: 'CAD', showCaption: true } };
export const CaptionHidden: Story = { args: { label: 'Cash balance', value: '$20.00', caption: 'CAD', showCaption: false } };

/** Multiline value — grows by one line-height (18px) per line; the spine stretches to match. */
export const Multiline: Story = {
  args: {
    label: 'Effective permission',
    value: 'Approve payouts, manage users, and edit loyalty configuration across all jurisdictions',
  },
  render: (args) => (
    <div style={{ maxWidth: 240 }}>
      <BeamStat {...args} />
    </div>
  ),
};

const DESCRIPTION = 'Priority tier for high-volume players — three lines of copy so the multiline twin pairs at 80px by line count.';
const STATUSES = ['Active', 'Paused', 'Retired'];

/** Wraps a cell and displays its measured field/stat height (the `.MuiInputBase-root`, else the
 *  cell's own child) — the twins are proven at 44/44/44 (+80 multiline) from COMPUTED styles here,
 *  not asserted. */
function Measured({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [h, setH] = useState<number | null>(null);
  useLayoutEffect(() => {
    const host = ref.current;
    if (!host) return;
    const field = host.querySelector('.MuiInputBase-root') as HTMLElement | null;
    const target = field ?? (host.firstElementChild as HTMLElement | null);
    setH(target?.offsetHeight ?? null);
  }, []);
  return (
    <Box>
      <Box ref={ref} sx={{ maxWidth: 260 }}>
        {children}
      </Box>
      <Typography variant="caption" color="primary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
        {h != null ? `${h}px` : '—'}
      </Typography>
    </Box>
  );
}

/** The demo row (NAME text · STATUS select · DESCRIPTION multiline · ACTIVE boolean) in BOTH modes,
 *  dark + light. Same grammatical slot morphs in place: label persists, value ↔ input swaps, heights
 *  equal per row (44 floor; multiline pairs by line count). Spine is view-only. */
function TwinsBlock() {
  const [active, setActive] = useState(true);
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 4, rowGap: 2.5, alignItems: 'start', maxWidth: 560 }}>
      <Typography variant="overline" color="text.secondary">View</Typography>
      <Typography variant="overline" color="text.secondary">Edit</Typography>

      <Measured><BeamStat label="Name" value="Gold tier" /></Measured>
      <Measured><BeamField fullWidth label="Name" defaultValue="Gold tier" /></Measured>

      <Measured><BeamStat label="Status" value="Active" /></Measured>
      <Measured>
        <BeamField fullWidth select label="Status" defaultValue="Active">
          {STATUSES.map((s) => (
            <MenuItem key={s} value={s}>{s}</MenuItem>
          ))}
        </BeamField>
      </Measured>

      <Measured><BeamStat label="Description" value={DESCRIPTION} /></Measured>
      <Measured><BeamField fullWidth multiline rows={3} label="Description" defaultValue={DESCRIPTION} /></Measured>

      <Measured><BeamStat label="Active" value={active} /></Measured>
      <Measured><BeamSwitchField name="twin-active" label="Active" checked={active} onChange={setActive} /></Measured>
    </Box>
  );
}

export const ViewEditTwins: Story = {
  args: { label: 'Name', value: 'Gold tier' },
  parameters: { layout: 'fullscreen' },
  render: () => (
    <Stack direction={{ xs: 'column', md: 'row' }}>
      {(['light', 'dark'] as const).map((scheme) => (
        <Box key={scheme} data-beam-mode={scheme} sx={{ flex: 1, bgcolor: 'background.paper', color: 'text.primary', p: 4 }}>
          <Typography variant="subtitle2" sx={{ mb: 2, textTransform: 'capitalize' }}>{scheme} — measured heights in blue</Typography>
          <TwinsBlock />
        </Box>
      ))}
    </Stack>
  ),
};

/** A row of stats — the entity-summary use (plain values + the severity axis + a boolean). */
export const Row: Story = {
  args: { label: 'Status', value: 'Approved' },
  render: () => (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" spacing={4} useFlexGap sx={{ flexWrap: 'wrap' }}>
        <BeamStat label="Status" value="Approved" caption="Online" />
        <BeamStat label="Cash balance" value="$20.00" caption="CAD" />
        <BeamStat label="Active" value={true} />
        <BeamStat label="RG risk" value="Elevated" severity="warning" />
        <BeamStat label="Account" value="Suspended" severity="error" />
      </Stack>
    </Paper>
  ),
};
