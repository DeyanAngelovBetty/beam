import { useMemo, useState, useRef, type ReactNode } from 'react';
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
  beamGradientBorder,
  usePointerAngleTracking,
} from '@betty/beam';
import { ThemeLabDrawer } from '@betty/beam-lab';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import LaunchIcon from '@mui/icons-material/Launch';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import PublicIcon from '@mui/icons-material/Public';
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined';
import { BEAM, APPS, type Surface } from './registry';

/**
 * The index of the demo. Built out of Beam itself, because the page whose
 * argument is "one Beam, many products" should not be the one page that
 * opts out of it.
 */

// The cards are laid on the page's default background (a transparent content column over the fixed
// body mesh), so the rim mixes toward background.default; radius MUST equal MuiPaper.rounded (24).
const CARD_SURFACE = 'var(--mui-palette-background-default)';
const CARD_RADIUS = 24;

/**
 * TrackedPaper — a card whose rim is the pointer-tracked gradient border (the existing Beam
 * capability; the landing is now its next consumer). `track` supersedes the spin — no interactive
 * rotation anywhere. The card carries NO transform/filter/z-index, so it never makes its own
 * stacking context and the rim's z-index:-1 tucks correctly behind it (recipe constraint).
 * Reduced-motion no-op comes free from the hook.
 */
function TrackedPaper({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  usePointerAngleTracking(ref);
  return (
    <Paper
      ref={ref}
      variant="outlined"
      sx={{
        p: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        ...(beamGradientBorder({ track: true, surface: CARD_SURFACE, radius: CARD_RADIUS }) as object),
      }}
    >
      {children}
    </Paper>
  );
}

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

function SurfaceCard({ surface }: { surface: Surface }) {
  return (
    <TrackedPaper>
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
    </TrackedPaper>
  );
}

/**
 * ThemeLabCard — a one-off (not a registry Surface): it opens the Theme Lab drawer ON THIS PAGE
 * rather than navigating. The landing already renders in createBeamTheme, and the drawer's whole
 * design is overlay-editing of the live page, so tuning it retunes the landing you're looking at.
 */
function ThemeLabCard({ onOpen }: { onOpen: () => void }) {
  return (
    <TrackedPaper>
      <Stack spacing={0.5}>
        <Typography variant="overline" color="text.secondary">
          On this page
        </Typography>
        <Typography variant="h5" component="h2">
          Theme Lab
        </Typography>
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
        Live theme editing on this very page — seeds, L/C/H, both schemes.
      </Typography>

      <Divider />
      <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', rowGap: 0.5 }}>
        <Button
          size="small"
          variant="text"
          color="inherit"
          startIcon={<PaletteOutlinedIcon fontSize="small" />}
          onClick={onOpen}
          sx={{ minWidth: 0, color: 'text.secondary', fontWeight: 400 }}
        >
          Open Theme Lab
        </Button>
        <FooterLink href="storybook/?path=/story/beamlab-theme-lab--over-surfaces-board" icon={<LaunchIcon fontSize="small" />}>
          Storybook
        </FooterLink>
      </Stack>
    </TrackedPaper>
  );
}

export function App() {
  const theme = useMemo(() => createBeamTheme('ontario', 'sunlight'), []);
  const [labOpen, setLabOpen] = useState(false);

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
              {/* Beam + a narrower, subordinate Theme Lab card in one row (its own flex). */}
              <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' }, alignItems: 'stretch' }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <SurfaceCard surface={BEAM} />
                </Box>
                <Box sx={{ width: { xs: '100%', md: 300 }, flexShrink: 0 }}>
                  <ThemeLabCard onOpen={() => setLabOpen(true)} />
                </Box>
              </Box>
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

      {/* The lab drafts against the live page's CSS vars — editing here retunes THIS landing. */}
      <ThemeLabDrawer open={labOpen} onClose={() => setLabOpen(false)} product="sunlight" jurisdiction="ontario" />
    </ThemeProvider>
  );
}
