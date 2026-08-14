import { FormControl, InputLabel, Select, MenuItem, Tooltip } from '@betty/beam';
import { DEMO_USERS, setCurrentUser, useCurrentUser } from './currentUser';

/**
 * The demo four-eyes actor switcher — moved out of the approvals page header into the shell's
 * chrome cluster (chrome controls live with chrome; the Gaspar Theme Lab entry is the precedent).
 * Being global, switching the actor affects the Loyalty pages, the approvals list, AND the
 * app-level review alert identically — the reactive `useCurrentUser` makes that live.
 *
 * DEMO SCAFFOLDING, not architecture (approval-flow §6): the real target is the authenticated user
 * + an approve-type permission.
 */
export function ActingAsSwitcher() {
  const user = useCurrentUser();
  return (
    <Tooltip title="Acting as (demo) — switch to demonstrate four-eyes">
      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel id="acting-as">Acting as</InputLabel>
        <Select labelId="acting-as" label="Acting as" value={user.id} onChange={(e) => setCurrentUser(e.target.value)}>
          {DEMO_USERS.map((u) => (
            <MenuItem key={u.id} value={u.id}>
              {u.name} · {u.role}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Tooltip>
  );
}
