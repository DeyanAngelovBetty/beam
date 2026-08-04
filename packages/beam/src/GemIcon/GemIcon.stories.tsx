import type { Meta, StoryObj } from '@storybook/react-vite';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { GemIcon } from './GemIcon';
import type { GemName } from './GemIcon.types';

const ALL: GemName[] = [
  'member', 'amethyst', 'topaz', 'aquamarine', 'opal', 'emerald',
  'ruby', 'sapphire', 'diamond', 'vip',
];

const meta: Meta<typeof GemIcon> = {
  title: 'Organisms/GemIcon',
  component: GemIcon,
  parameters: { layout: 'padded' },
  argTypes: { gem: { control: 'select', options: ALL } },
};
export default meta;

export const Playground: StoryObj<typeof GemIcon> = {
  args: { gem: 'amethyst', size: 64, plate: false },
};

/** The tracer: same asset, two sizes — table cell (20) and hero (64). */
export const TwoSizes: StoryObj = {
  render: () => (
    <Stack spacing={2}>
      {[20, 64].map((size) => (
        <Stack key={size} direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Typography variant="caption" sx={{ width: 32 }}>{size}px</Typography>
          {ALL.map((g) => <GemIcon key={g} gem={g} size={size} />)}
        </Stack>
      ))}
    </Stack>
  ),
};

/** Plate check — verify legibility on BOTH modes with the toolbar. */
export const WithPlate: StoryObj = {
  render: () => (
    <Stack direction="row" spacing={1.5}>
      {ALL.map((g) => <GemIcon key={g} gem={g} size={28} plate />)}
    </Stack>
  ),
};
