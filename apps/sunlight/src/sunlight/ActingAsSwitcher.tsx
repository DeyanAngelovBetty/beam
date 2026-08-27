import { Box, Typography, List, ListItemButton, ListItemText, Avatar } from '@betty/beam';
import { DEMO_USERS, setCurrentUser, useCurrentUser } from './currentUser';

/**
 * The demo four-eyes actor switcher — an ALWAYS-VISIBLE persona list in the shell's sidebar footer
 * (nav idiom: ListItemButton rows with a selected state), so the whole four-eyes walkthrough is
 * one-click per hop, never a dropdown. Global, so switching flips every actor-relative derivation
 * live (page-level alert, app bar, own-pending blocker, the CR-detail action set + decision-note
 * twin) — the reactive `useCurrentUser` makes that immediate.
 *
 * A11Y: it's a single-choice control, so radio semantics — role="radiogroup" on the list, role="radio"
 * + aria-checked on each row (ListItemButton's default is a `button`; the role override makes the
 * selection state announce correctly).
 *
 * DEMO SCAFFOLDING, not architecture (approval-flow §6): the real target is the authenticated user +
 * an approve-type permission. Sunlight-local — nothing here is promoted into BeamAppShell.
 */

/** "Maja Novak" → "MN" — the avatar initials. */
const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2);

export function ActingAsSwitcher() {
  const current = useCurrentUser();
  return (
    <Box>
      <Typography
        variant="overline"
        component="div"
        color="text.secondary"
        sx={{ px: 1.5, lineHeight: 2 }}
      >
        Acting as
      </Typography>
      <List role="radiogroup" aria-label="Acting as (demo)" dense disablePadding>
        {DEMO_USERS.map((u) => {
          const selected = u.id === current.id;
          return (
            <ListItemButton
              key={u.id}
              role="radio"
              aria-checked={selected}
              selected={selected}
              onClick={() => setCurrentUser(u.id)}
              sx={{ gap: 1.5, py: 0.5 }}
            >
              <Avatar
                sx={{
                  width: 28,
                  height: 28,
                  fontSize: 12,
                  fontWeight: 600,
                  // Selected actor's avatar carries the accent; the rest stay quiet chrome.
                  bgcolor: selected ? 'primary.main' : 'action.selected',
                  color: selected ? 'primary.contrastText' : 'text.secondary',
                }}
              >
                {initials(u.name)}
              </Avatar>
              <ListItemText
                primary={u.name}
                secondary={u.role}
                slotProps={{
                  primary: { variant: 'body2', noWrap: true },
                  secondary: { variant: 'caption', sx: { textTransform: 'capitalize' } },
                }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );
}
