import { Box, Typography, Link, List, ListItemButton, ListItemText, Avatar } from '@betty/beam';
import OpenInNewIcon from '@mui/icons-material/OpenInNewRounded';
import { MILESTONES, useMilestone } from './milestone';

/**
 * MilestoneSwitcher — the "view as version" control, styled as the always-visible radio list from
 * Sunlight's shell nav (Acting-as): avatar-circle + label + sub-line rows with a selected state, one
 * click per hop (never a dropdown). Reads/writes the URL-backed milestone (see `milestone.tsx`).
 *
 * PROMOTION CANDIDATE (deliberate, not now): this is the SECOND consumer of Sunlight's persona-switcher
 * pattern (ActingAsSwitcher), so the promotion trigger (BEAM.md §2 — a second real need) is genuinely
 * met. Extracting a `BeamChoiceList` / `BeamPersonaSwitcher` organism is queued as its own task; for
 * London speed it's REPLICATED app-locally here. When promoted, both this and ActingAsSwitcher collapse
 * onto it.
 *
 * A11Y: single-choice control → radio semantics (role="radiogroup" on the list, role="radio" +
 * aria-checked per row), mirroring ActingAsSwitcher. The header's spec link is a real external anchor
 * (new tab, rel noopener), separate from the radio group.
 *
 * DEMO SCAFFOLDING, not architecture — a demo lens over release phases; real access control is
 * server-side (Boryana's spec is explicit).
 */
const SPEC_URL =
  'https://app.notion.com/p/Transactions-Page-Technical-Requirements-3d780d649de580e98599f3548c6a6851';

export function MilestoneSwitcher() {
  const { milestone, setMilestone } = useMilestone();
  return (
    <Box>
      {/* Header doubles as the link out to Boryana's spec — the list's provenance, one click away. */}
      <Link
        href={SPEC_URL}
        target="_blank"
        rel="noopener noreferrer"
        underline="hover"
        color="text.secondary"
        sx={{ px: 1.5, display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
      >
        <Typography variant="overline" component="span" sx={{ lineHeight: 2 }}>
          Viewing as
        </Typography>
        <OpenInNewIcon sx={{ fontSize: 14 }} aria-label="(opens the requirements spec in a new tab)" />
      </Link>
      <List role="radiogroup" aria-label="Viewing as version (demo)" dense disablePadding>
        {MILESTONES.map((m) => {
          const selected = m.id === milestone;
          return (
            <ListItemButton
              key={m.id}
              role="radio"
              aria-checked={selected}
              selected={selected}
              onClick={() => setMilestone(m.id)}
              sx={{ gap: 1.5, py: 0.5 }}
            >
              <Avatar
                sx={{
                  width: 28,
                  height: 28,
                  fontSize: 11,
                  fontWeight: 600,
                  // Selected version's badge carries the accent; the rest stay quiet chrome.
                  bgcolor: selected ? 'primary.main' : 'action.selected',
                  color: selected ? 'primary.contrastText' : 'text.secondary',
                }}
              >
                {m.badge}
              </Avatar>
              <ListItemText
                primary={m.label}
                secondary={m.sub}
                slotProps={{
                  primary: { variant: 'body2', noWrap: true },
                  secondary: { variant: 'caption' },
                }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );
}
