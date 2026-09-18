import type { Meta, StoryObj } from '@storybook/react-vite';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import { Section } from './Section';

/** The canonical toolbar control — a small `+`-prefixed text button (the designs' add-CTA). */
function AddButton({ children }: { children: string }) {
  return (
    <Button variant="text" size="small" startIcon={<AddIcon fontSize="small" />}>
      {children}
    </Button>
  );
}

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

/**
 * Toolbar band — the lane extension (title → toolbar → body). The variant grid from the design canvas:
 * empty (title+toolbar only), edit field-list, view list, mixed body (content + illustration region),
 * and text-only body. Toolbar hosts the canonical small `+` text button.
 */
export const Toolbar: Story = {
  render: () => (
    <Box
      sx={{
        display: 'grid',
        gap: 3,
        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(3, minmax(0, 1fr))' },
      }}
    >
      {/* Empty — title + toolbar only (no body content yet). */}
      <Section title="Milestones" toolbar={<AddButton>Add Milestone</AddButton>}>
        <Typography variant="body2" color="text.secondary">No milestones yet.</Typography>
      </Section>

      {/* Edit field-list — toolbar CTA + an editable row list (the border appears: fields inside). */}
      <Section isEdit title="Rewards Strategy" toolbar={<AddButton>Add Reward Strategy</AddButton>}>
        <Stack spacing={1.5}>
          {['Prize', 'MilestoneFlip'].map((t) => (
            <Box key={t} sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
              <TextField size="small" label="Reward Type" defaultValue={t} />
              <TextField size="small" type="number" label="# of Rewards" defaultValue={1} />
              <TextField size="small" type="number" label="Reward Amount" defaultValue={0} />
            </Box>
          ))}
        </Stack>
      </Section>

      {/* View list — toolbar + a read-only row list (borderless: no fields). */}
      <Section isEdit={false} title="Rewards Strategy" toolbar={<AddButton>Add Reward Strategy</AddButton>} bleed>
        <Stack divider={<Box sx={{ borderTop: '1px solid', borderColor: 'divider' }} />}>
          {['Prize · 1 · 5 · 0', 'MilestoneFlip · 1 · 5 · 0'].map((s) => (
            <Box key={s} sx={{ px: 2, py: 1.5 }}><Typography variant="body2">{s}</Typography></Box>
          ))}
        </Stack>
      </Section>

      {/* Mixed body — content beside an illustration region. */}
      <Section title="Theme" toolbar={<AddButton>Upload Theme</AddButton>}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
            A short description paired with a preview region — the mixed body variant.
          </Typography>
          <Box sx={{ width: 96, height: 64, borderRadius: 1, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider', flexShrink: 0 }} />
        </Stack>
      </Section>

      {/* Text-only body. */}
      <Section title="Notes" toolbar={<AddButton>Add Note</AddButton>}>
        <Typography variant="body2" color="text.secondary">A plain text body under a toolbar — prose only.</Typography>
      </Section>
    </Box>
  ),
};
