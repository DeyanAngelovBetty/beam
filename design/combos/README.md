# design/combos/ — the theme-combo record

This directory is the **official record of theme combos**. A combo is a scoped set of theme
seeds (surface + gradient → product; brand.primary → jurisdiction) exported from the Theme
Lab as a schema-versioned JSON.

- **One JSON per combo.** Filename = `slug(name).json` (lowercase, hyphens) — the same slug
  the Lab shows next to *Copy Combo*.
- **Committing a combo = submitting it.** A combo file landing here (by branch + PR) is the
  proposal.
- **Officiating = running the sync lanes on it** — see [docs/sync-lanes-runbook.md](../../docs/sync-lanes-runbook.md)
  §6. "Official" means the three stores agree and the contrast gate passes; the Lab writes
  nothing to Figma or the repo, it only drafts this file.
- **The git history of this directory IS the theme history.** Git review of a combo file is
  the four-eyes; the diff against the previous combo is the change record. (Same governance
  shape as the maker-checker flow in [docs/approval-flow.md](../../docs/approval-flow.md) —
  one org, one approval grammar.)

`gaspar-plum-baseline.json` is the current live state (today's seeds) — the "known good" the
next combo diffs against.
