import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box, Stack, Typography } from '../index';

/**
 * Not a component — a cartographic proof. Every spacing / size constant in the
 * estate as a labeled specimen (bar width = the value). Grouped by kind. Plain
 * furniture; the toolbar axes are inherited but INERT — spacing is
 * axis-invariant (unlike ColorBoard, nothing here moves across product / brand /
 * mode). Full ledger + the density proposal: docs/spacing-notes.md.
 */

interface Spec {
  name: string;
  px: number;
  note?: string;
}

// theme.spacing has no override → spacing(1) = 8px (MUI default). No token lane.
const SCALE: Spec[] = [
  { name: 'spacing(0.25)', px: 2, note: 'BeamStat lines' },
  { name: 'spacing(0.5)', px: 4, note: 'tight · rail pl' },
  { name: 'spacing(1)', px: 8, note: 'default gap (~15×)' },
  { name: 'spacing(1.5)', px: 12, note: 'control-group gap' },
  { name: 'spacing(2)', px: 16, note: 'section-internal · p:2' },
  { name: 'spacing(3)', px: 24, note: 'the PAGE section gap' },
  { name: 'spacing(4)', px: 32, note: 'nav inset · gutter sm' },
  { name: 'spacing(6)', px: 48, note: 'datagrid empty py' },
  { name: 'spacing(7)', px: 56, note: 'gutter md · = STRIP_HEIGHT' },
  { name: 'spacing(10)', px: 80, note: 'CONTENT_VERTICAL · empty state' },
];

const LAYOUT: Spec[] = [
  { name: 'spine width', px: 2, note: 'BeamStat · off-grid' },
  { name: 'RAIL_DIVIDER_INSET', px: 6, note: 'BeamDataTable · off-grid' },
  { name: 'radius', px: 8, note: 'shape.borderRadius' },
  { name: 'contentGutter xs', px: 16 },
  { name: 'radius (soft)', px: 24, note: 'MuiPaper rounded / squircle' },
  { name: 'contentGutter sm', px: 32 },
  { name: 'STRIP_HEIGHT', px: 56, note: 'literal = spacing(7)' },
  { name: 'contentGutter md', px: 56, note: 'collides w/ STRIP_HEIGHT' },
  { name: 'CONTENT_VERTICAL md', px: 80 },
  { name: 'DRAWER_WIDTH', px: 264, note: 'literal' },
];

const CONTROLS: Spec[] = [
  { name: 'row / tab minHeight', px: 40, note: 'BeamDataTable · BeamTabs (×2)' },
  { name: 'BeamStat minWidth', px: 140 },
  { name: 'field: name', px: 150, note: 'PayoutConfig editor' },
  { name: 'field: values', px: 260, note: 'ConditionBuilder' },
  { name: 'search field', px: 280, note: 'BeamDataTable toolbar' },
  { name: 'PayoutConfig select (min)', px: 360 },
  { name: 'PayoutConfig select (max)', px: 480 },
];

function Specimen({ name, px, note }: Spec) {
  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <Box sx={{ width: 220, flexShrink: 0, textAlign: 'right' }}>
        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
          {name}
        </Typography>
      </Box>
      <Box sx={{ width: px, height: 14, flexShrink: 0, bgcolor: 'text.primary', borderRadius: 0.5, opacity: 0.75 }} />
      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
        {px}px{note ? ` · ${note}` : ''}
      </Typography>
    </Stack>
  );
}

function Group({ title, items }: { title: string; items: Spec[] }) {
  return (
    <Stack spacing={1}>
      <Typography variant="subtitle2">{title}</Typography>
      <Stack spacing={0.5}>
        {items.map((s) => (
          <Specimen key={s.name} {...s} />
        ))}
      </Stack>
    </Stack>
  );
}

function SpacingBoard() {
  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Stack spacing={4} sx={{ p: 3, minWidth: 'fit-content' }}>
        <Stack spacing={0.5}>
          <Typography variant="h6">Spacing Board</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 640 }}>
            Every spacing / size constant as a specimen — bar width = the value.
            Spacing is axis-invariant: this reads the same across product / brand /
            mode. Full ledger + density proposal in docs/spacing-notes.md.
          </Typography>
        </Stack>
        <Group title="Spacing scale — theme.spacing, 8px base (no token lane)" items={SCALE} />
        <Group title="Layout constants" items={LAYOUT} />
        <Group title="Control sizes — px literals (squatters)" items={CONTROLS} />
      </Stack>
    </Box>
  );
}

const meta: Meta<typeof SpacingBoard> = {
  title: 'Lab/Foundation/SpacingBoard',
  component: SpacingBoard,
  parameters: { layout: 'fullscreen' },
};
export default meta;

export const Board: StoryObj<typeof SpacingBoard> = {};
