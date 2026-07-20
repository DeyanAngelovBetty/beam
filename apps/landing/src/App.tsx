import { useMemo } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  createBeamTheme,
  Box,
  Stack,
  Paper,
  Button,
  Typography,
  Divider,
  BeamPageHeader,
  BeamStat,
} from '@betty/beam';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import LaunchIcon from '@mui/icons-material/Launch';
import { BEAM, APPS, type Surface } from './registry';

/**
 * The index of the demo. Built out of Beam itself, because the page whose
 * argument is "one Beam, many products" should not be the one page that
 * opts out of it.
 */

function FigmaLink({ surface }: { surface: Surface }) {
  if (surface.figma) {
    return (
      <Button
        size="small"
        variant="text"
        endIcon={<OpenInNewIcon fontSize="small" />}
        href={surface.figma.url}
        target="_blank"
        rel="noreferrer noopener"
      >
        {surface.figma.file}
      </Button>
    );
  }
  return (
    <Typography variant="caption" color="text.secondary" sx={{ px: 1, py: 0.75 }}>
      {surface.figmaPending}
    </Typography>
  );
}

function SurfaceCard({ surface, primary = false }: { surface: Surface; primary?: boolean }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        // The design system reads as the anchor of the set.
        borderColor: primary ? 'primary.main' : 'divider',
      }}
    >
      <Stack spacing={0.5}>
        <Typography variant="overline" color="text.secondary">
          {surface.tagline}
        </Typography>
        <Typography variant="h5" component="h2">
          {surface.name}
        </Typography>
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
        {surface.description}
      </Typography>

      <Divider />

      <Stack spacing={1}>
        <Button
          variant={primary ? 'contained' : 'outlined'}
          href={surface.href}
          endIcon={<LaunchIcon fontSize="small" />}
          sx={{ alignSelf: 'flex-start' }}
        >
          Open {surface.name}
        </Button>
        <FigmaLink surface={surface} />
      </Stack>
    </Paper>
  );
}

export function App() {
  const theme = useMemo(() => createBeamTheme('ontario', 'sunlight'), []);

  return (
    <ThemeProvider theme={theme} defaultMode="dark" noSsr>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          backgroundImage: 'var(--beam-page-gradient)',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <Box sx={{ maxWidth: 1100, mx: 'auto', p: { xs: 3, md: 6 } }}>
          <Stack spacing={5}>
            <BeamPageHeader
              title="Beam"
              description="Betty's back-office design system, and the demo apps that share it. Every surface below is built from the same tokens, theme, and organisms — flip light/dark or jurisdiction inside any app to watch one system carry all of them."
              summary={
                <>
                  <BeamStat label="Design system" value="1" caption="tokens · theme · organisms" />
                  <BeamStat label="Demo apps" value={String(APPS.length)} caption="one shared Beam" />
                  <BeamStat label="Theming axes" value="3" caption="product · jurisdiction · mode" />
                </>
              }
            />

            <Stack spacing={2}>
              <Typography variant="overline" color="text.secondary">
                The system
              </Typography>
              <SurfaceCard surface={BEAM} primary />
            </Stack>

            <Stack spacing={2}>
              <Typography variant="overline" color="text.secondary">
                The products
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gap: 3,
                  gridTemplateColumns: {
                    xs: '1fr',
                    md: 'repeat(3, minmax(0, 1fr))',
                  },
                }}
              >
                {APPS.map((surface) => (
                  <SurfaceCard key={surface.id} surface={surface} />
                ))}
              </Box>
            </Stack>

            <Typography variant="caption" color="text.secondary">
              Gaspar's token values are glanceable demo placeholders, not its identity. Several
              organisms are explicit placeholders pending their Figma design pass — see the
              "Organisms (placeholder)" section in Storybook.
            </Typography>
          </Stack>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
