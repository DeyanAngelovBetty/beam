import type { Meta, StoryObj } from '@storybook/react-vite';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import { Section } from './Section';

/**
 * Section — the section surface. Title inside; padded or full-bleed body; the EDITABILITY border
 * (borderless until the surface contains a field — the "Editable" story shows it appear).
 */
const meta: Meta<typeof Section> = {
  title: 'Components/Section',
  component: Section,
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj<typeof Section>;

export const Padded: Story = {
  render: () => (
    <Box sx={{ maxWidth: 420 }}>
      <Section isEdit="auto" title="Compliance - Terms &amp; Conditions">
        <Typography variant="body2" color="text.secondary">A padded body — text, stats, prose. Borderless: no field inside.</Typography>
      </Section>
    </Box>
  ),
};

export const FullBleed: Story = {
  render: () => (
    <Box sx={{ maxWidth: 420 }}>
      <Section isEdit="auto" title="Promotional Images" bleed>
        <Stack divider={<Box sx={{ borderTop: '1px solid', borderColor: 'divider' }} />}>
          {['Promotional icon', 'Promotional image', 'Info banner image'].map((s) => (
            <Box key={s} sx={{ px: 2, py: 1.5 }}><Typography variant="body2">{s}</Typography></Box>
          ))}
        </Stack>
      </Section>
    </Box>
  ),
};

/** Contains a field → the editability border appears (per-surface, field-driven). */
export const Editable: Story = {
  render: () => (
    <Box sx={{ maxWidth: 420 }}>
      <Section isEdit="auto" title="Compliance - Terms &amp; Conditions">
        <TextField size="small" fullWidth multiline minRows={3} defaultValue="Editable content — the surface grows a divider frame." />
      </Section>
    </Box>
  ),
};
