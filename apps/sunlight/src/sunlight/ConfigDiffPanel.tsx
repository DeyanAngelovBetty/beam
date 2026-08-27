import { Paper, Box, Stack, Typography, Divider, Alert, Table, TableHead, TableBody, TableRow, TableCell } from '@betty/beam';
import SyncAltRoundedIcon from '@mui/icons-material/SyncAltRounded';
import type { ChangeRequest } from './changeRequests';
import type { LoyaltyStatusDraft, StatusReward } from './loyaltyStatuses';
import { ProposedConfigSummary } from './ProposedConfigSummary';
import { REASON_PLACEHOLDER } from './changeRequestShared';

/**
 * ConfigDiffPanel — the review diff: side-by-side CURRENT (the CR's frozen `baseSnapshot`) vs
 * PROPOSED (`draft`). Changed rows shown + marked; unchanged hidden behind a count line. No
 * per-entity operation chip (single-entity diff — see the count-line comment). Because the snapshot
 * is frozen at submit, an archived CR shows what changed THEN — stable even after live moves on.
 *
 * SPECULATIVE BY DESIGN: our CR model + this diff are OUR PROPOSAL (the backend team's contract is
 * unavailable). Designed on our semantics with their screenshot as visual reference; it exists for
 * design/a11y vetting regardless of eventual adoption.
 *
 * A11y is a deliverable, not paint:
 *  - Change is NEVER color-only (WCAG 1.4.1): a per-row ⇄ marker (icon + aria-label) carries it,
 *    and the columns are TEXT-labelled "Current"/"Proposed" (the reference's red/green headers fail
 *    this alone). Reward add/remove also carry a TEXT status word, not just tint.
 *  - Row tints derive from SEMANTIC tokens via color-mix toward the surface (the estate recipe), so
 *    text stays legible over them in both schemes (contrast reported in the task).
 *  - The panel is one labelled region; tables use th/scope; the fallback notice is role=status.
 *
 * NOTE: our reference is a LIST diff ("N changed statuses"); the CR detail is one entity, so we
 * adapt to a per-FIELD/per-REWARD diff of that entity ("N changed fields"). Product-local
 * (apps/sunlight, BEAM.md §2); PROMOTION SOCKET: a generic diff panel is a plausible Beam graduate
 * once a second entity type needs it.
 */

// Tints from semantic tokens mixed toward the paper surface — "was" (error) / "now" (success).
const REMOVED_BG = 'color-mix(in oklch, var(--mui-palette-error-main) 14%, var(--mui-palette-background-paper))';
const ADDED_BG = 'color-mix(in oklch, var(--mui-palette-success-main) 14%, var(--mui-palette-background-paper))';

const fmtReward = (r: StatusReward) =>
  `${r.pointsToClaim.toLocaleString()} pts → ${r.rewardAmount.toLocaleString()} ${r.rewardType} · ${r.expiryHours}h`;

/** The ⇄ change marker — an ICON (shape, not colour) with an accessible label. */
function ChangeMark() {
  return (
    <Box component="span" aria-label="changed" role="img" sx={{ display: 'inline-flex', color: 'text.secondary', verticalAlign: 'middle', ml: 0.5 }}>
      <SyncAltRoundedIcon fontSize="inherit" />
    </Box>
  );
}

export function ConfigDiffPanel({ cr }: { cr: ChangeRequest }) {
  if (cr.entityType !== 'loyaltyStatus') return null;
  const proposed = cr.draft as LoyaltyStatusDraft;
  const snapshot = cr.baseSnapshot as LoyaltyStatusDraft | undefined;

  // Fallback — no frozen before-state to compare against.
  if (!snapshot) {
    return (
      <Paper component="section" variant="outlined" aria-label={`Proposed configuration for ${cr.entityName}`} sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Alert severity="info" role="status">
            A previous snapshot is unavailable for this request — only the proposed configuration is shown.
          </Alert>
          <ProposedConfigSummary cr={cr} />
        </Stack>
      </Paper>
    );
  }

  const fieldDefs: { label: string; get: (d: LoyaltyStatusDraft) => string }[] = [
    { label: 'Name', get: (d) => d.name },
    { label: 'Max days', get: (d) => d.maxDays },
    { label: 'Gems', get: (d) => String(d.boxes) },
    { label: 'Retain status after gem #', get: (d) => d.keepGems },
    { label: 'Retain boxes after', get: (d) => d.keepBoxes },
    { label: 'Multiplier', get: (d) => String(d.multiplier) },
  ];
  const fieldRows = fieldDefs
    .map((f) => ({ label: f.label, before: f.get(snapshot), after: f.get(proposed) }))
    .filter((r) => r.before !== r.after);

  const rewardIds = [...new Set([...snapshot.rewards.map((r) => r.id), ...proposed.rewards.map((r) => r.id)])];
  const rewardRows = rewardIds
    .map((id) => {
      const before = snapshot.rewards.find((r) => r.id === id);
      const after = proposed.rewards.find((r) => r.id === id);
      const kind: 'added' | 'removed' | 'changed' | 'unchanged' = !before
        ? 'added'
        : !after
          ? 'removed'
          : fmtReward(before) === fmtReward(after)
            ? 'unchanged'
            : 'changed';
      return { id, before, after, kind };
    })
    .filter((r) => r.kind !== 'unchanged');

  const changedCount = fieldRows.length + rewardRows.length;
  const hiddenUnchanged = (fieldDefs.length - fieldRows.length) + (rewardIds.length - rewardRows.length);
  const cell = { verticalAlign: 'top' as const };

  return (
    <Paper component="section" variant="outlined" aria-label={`Configuration changes for ${cr.entityName}`} sx={{ p: 2 }}>
      <Stack spacing={2}>
        {/* The submit reason (grammar §4) heads the diff — captured once, displayed wherever the CR
            appears; here it describes WHY this change, above WHAT changed. Optional → a quiet
            placeholder when absent, never blank layout. */}
        <Typography variant="body2" color={cr.submitReason ? 'text.primary' : 'text.disabled'} sx={cr.submitReason ? undefined : { fontStyle: 'italic' }}>
          {cr.submitReason || REASON_PLACEHOLDER}
        </Typography>
        {/* No per-entity "Updated" operation chip here: this diff is SINGLE-ENTITY (one CR = one
            entity), so the section header + this count line already carry the context. The chip
            differentiates entities only in a MULTI-entity (grid-import) diff, where each entity's
            operation must be named — a future panel, not this one (detail-grammar identity-zone rule:
            state is declared once, not repeated). */}
        <Typography variant="body2" color="text.secondary">
          {changedCount === 0
            ? 'No changes.'
            : `Showing ${changedCount} changed item${changedCount === 1 ? '' : 's'}${hiddenUnchanged ? ` · ${hiddenUnchanged} unchanged hidden` : ''}.`}
        </Typography>

        {fieldRows.length > 0 && (
          <Table size="small" aria-label={`Field changes for ${cr.entityName}`}>
            <TableHead>
              <TableRow>
                <TableCell component="th" scope="col">Field</TableCell>
                <TableCell component="th" scope="col">Current</TableCell>
                <TableCell component="th" scope="col">Proposed</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fieldRows.map((r) => (
                <TableRow key={r.label}>
                  <TableCell component="th" scope="row" sx={cell}>
                    {r.label}
                    <ChangeMark />
                  </TableCell>
                  <TableCell sx={{ ...cell, backgroundColor: REMOVED_BG }}>{r.before || '—'}</TableCell>
                  <TableCell sx={{ ...cell, backgroundColor: ADDED_BG }}>{r.after || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {rewardRows.length > 0 && (
          <>
            <Divider />
            <Typography variant="subtitle2" color="text.secondary">
              Reward changes
            </Typography>
            <Table size="small" aria-label={`Reward changes for ${cr.entityName}`}>
              <TableHead>
                <TableRow>
                  <TableCell component="th" scope="col">Change</TableCell>
                  <TableCell component="th" scope="col">Current</TableCell>
                  <TableCell component="th" scope="col">Proposed</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rewardRows.map((r) => (
                  <TableRow key={r.id}>
                    {/* Text status word — the non-colour marker for add/remove/change. */}
                    <TableCell component="th" scope="row" sx={{ ...cell, textTransform: 'capitalize' }}>
                      {r.kind}
                    </TableCell>
                    <TableCell sx={{ ...cell, backgroundColor: r.kind === 'added' ? undefined : REMOVED_BG }}>
                      {r.before ? fmtReward(r.before) : '—'}
                    </TableCell>
                    <TableCell sx={{ ...cell, backgroundColor: r.kind === 'removed' ? undefined : ADDED_BG }}>
                      {r.after ? fmtReward(r.after) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </Stack>
    </Paper>
  );
}
