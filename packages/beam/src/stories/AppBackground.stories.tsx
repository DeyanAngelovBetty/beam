import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box, Paper, Stack, Typography, Section, BeamStat } from '@betty/beam';

/**
 * App background — the CANVAS (docs/surface-grammar.md): base `background.default` + the page mesh
 * (`body::before`) + the Betty stars (`body::after`), painted GLOBALLY by the theme, fixed behind all
 * content at `z-index: -1`. There is no component — this story renders the real thing by leaving its own
 * surface transparent so the theme's body layers show through, with a few opaque cards on top to show the
 * containment (bento) premise: the canvas is expressive because content lives in boxes.
 *
 * Switch **product / brand / mode** in the Storybook toolbar — the canvas is driven entirely by those
 * globals (the same `createBeamTheme` + `CssBaseline` every app uses). Zero product code.
 */
const meta: Meta = { title: 'Foundations/App Background', parameters: { layout: 'fullscreen' } };
export default meta;
type Story = StoryObj;

export const Canvas: Story = {
  // No `bgcolor` on the root — transparent, so the theme's fixed body::before/::after canvas shows through.
  render: () => (
    <Box sx={{ minHeight: '100vh', p: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="overline" color="text.secondary">
        App background — the canvas (base + page mesh + stars) shows in the gaps; content sits on opaque
        cards. Switch product / brand / mode in the toolbar.
      </Typography>

      <Box sx={{ maxWidth: 640 }}>
        <Section title="Contained content" aria-label="App background demo section">
          <Stack direction="row" spacing={4} sx={{ p: 2, flexWrap: 'wrap' }}>
            <BeamStat label="Surface" value="Paper — opaque" caption="occludes the canvas" showCaption />
            <BeamStat label="Canvas" value="body::before / ::after" caption="fixed, z −1" showCaption />
          </Stack>
        </Section>
      </Box>

      <Paper elevation={1} sx={{ p: 3, borderRadius: 2, maxWidth: 640 }}>
        <Typography variant="subtitle1">Working surface (paper)</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Opaque surfaces cover the canvas; it reads only in the page-background gaps around them — which is
          why the canvas may be expressive (containment premise, surface-grammar.md).
        </Typography>
      </Paper>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 2, maxWidth: 640 }}>
        <Typography variant="subtitle1">Recessed surface (paper0)</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          The page sinks one ramp step below paper0, so even a flat sub-panel lifts off the canvas.
        </Typography>
      </Paper>
    </Box>
  ),
};
