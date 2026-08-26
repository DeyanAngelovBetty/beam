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
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import PublicIcon from '@mui/icons-material/Public';
import type { ReactNode } from 'react';
import { BEAM, APPS, type Surface } from './registry';

/**
 * The index of the demo. Built out of Beam itself, because the page whose
 * argument is "one Beam, many products" should not be the one page that
 * opts out of it.
 */

/** One quiet footer link. Small text + icon, opens in a new tab. */
function FooterLink({ href, icon, children }: { href: string; icon: ReactNode; children: ReactNode }) {
  return (
    <Button
      size="small"
      variant="text"
      color="inherit"
      startIcon={icon}
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      sx={{ minWidth: 0, color: 'text.secondary', fontWeight: 400 }}
    >
      {children}
    </Button>
  );
}

/** The consistent footer row: Docs · Figma · Open app · Official — each shown only if it exists. */
function LinkRow({ surface }: { surface: Surface }) {
  return (
    <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', rowGap: 0.5 }}>
      {surface.docs && (
        <FooterLink href={surface.docs} icon={<ArticleOutlinedIcon fontSize="small" />}>
          Docs
        </FooterLink>
      )}
      {surface.figma && (
        <FooterLink href={surface.figma.url} icon={<OpenInNewIcon fontSize="small" />}>
          Figma
        </FooterLink>
      )}
      <FooterLink href={surface.href} icon={<LaunchIcon fontSize="small" />}>
        {surface.openLabel ?? 'Open app'}
      </FooterLink>
      {surface.official && (
        <FooterLink href={surface.official} icon={<PublicIcon fontSize="small" />}>
          Official
        </FooterLink>
      )}
    </Stack>
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

      <LinkRow surface={surface} />
    </Paper>
  );
}

export function App() {
  const theme = useMemo(() => createBeamTheme('ontario', 'sunlight'), []);

  return (
    <ThemeProvider theme={theme} defaultMode="dark" noSsr>
      <CssBaseline />
      {/* Page mesh is painted globally on a fixed body::before (createBeamTheme
          MuiCssBaseline); nothing to apply here. */}
      <Box sx={{ minHeight: '100vh' }}>
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
