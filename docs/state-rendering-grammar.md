# State Rendering Grammar

**Status:** Draft for adoption — written against `docs/status-grammar-audit.md` (2026-09-09).
**Scope:** Every rendering of a status, state, or condition in Beam and its consumer products — chips, badges, dots, colored text, stat severities, alerts.
**Founding precedent:** the BeamStat boolean treatment — two levers, color and fill — generalized here into an estate-wide language.

## The two axes

**Hue = meaning.** *What kind of state is this?* Semantic category only: `danger`,
`warning`, `success`, `in-progress`, `neutral`. Hue never encodes importance — only
category.

**Fill = volume.** *How loudly should it speak?* Filled shouts, outlined states,
no-color whispers. Fill never changes meaning — only emphasis.

The axes are orthogonal, and the grammar is the set of legal combinations plus the
rules for choosing among them.

## Volume tiers

Three legal volumes:

- **Silent** — no hue, outlined or plain text. The state exists; nobody needs to look.
- **Noted** — hue, outlined. Worth registering while scanning.
- **Loud** — hue, filled. Demands attention now.

Illegal combinations:
- **Filled neutral** — shouting nothing. If it deserves fill, it has a category.
- **Hue without a label** — color is always redundant reinforcement; the text names
  the state. (Accessibility is structural here, not a checklist item.)

**Loud only works against quiet.** Loudness is a budget, not a style: within one
surface (a grid, a panel), at most one state should be loud, and only when the
actionability rule below earns it. A surface where everything shouts communicates
nothing — the alarm-wall failure.

## Choosing tiers: two rules

1. **Transient system states are silent.** If the machine is mid-work and no human
   is involved (`created`, `processing`), render silent. Progress is not news.
2. **Actionability drives loudness — not badness.** Loud is reserved for states
   waiting on a human. A terminal failure wants investigation, not alarm: it is
   *noted danger*. A state blocking on someone's decision is the loud one, whatever
   its emotional color. Map by asking "who must act?", never "how bad does it feel?".

## Architecture: who speaks what

- **The organism speaks tiers.** One badge component; its API is
  `(hue, volume, label)` — it renders grammar, it knows no product vocabulary.
- **Pages map vocabulary → tier.** Each page/product owns a small explicit map from
  its API strings to `(hue, volume)`. Raw strings never drive color directly.
- **Unobserved vocabulary renders silent.** A value not in the map gets the silent
  tier with its raw label — the estate's established honesty rule, now canonical.

## Vocabulary rules (from the audit's collisions)

- **One word, one meaning per surface** — and cross-surface, a word should not
  change hue category. When it must ("Disabled" as config-draft vs lifecycle-paused),
  the fix is renaming the vocabulary, not overloading the hue.
- **Semantic hues are for states only.** Categorical enums that aren't states —
  Direction, 3DS status, node kinds, provider names — render silent (or as plainly
  categorical chips), never in semantic hues. A red chip labeled "Adyen" borrows
  alarm it hasn't earned.
- **One severity vocabulary.** `danger / warning / success / in-progress / neutral`
  everywhere; component-local member sets (BeamStat's, Alert's) reconcile to it.
- **Boolean states prefer the boolean treatment** (BeamBool / switch) over chips;
  a boolean rendered three ways is three components doing one job.
- **Labels:** sentence case for display; raw API value available on hover where they
  differ.

## Worked example — Gaspar transactions (incoming vocabulary)

| Status     | Who must act?            | Hue         | Volume | Rendering        |
|------------|--------------------------|-------------|--------|------------------|
| created    | nobody (system)          | —           | silent | plain outlined   |
| processing | nobody (system)          | —           | silent | plain outlined   |
| pending    | ops (complete/decline)   | warning     | LOUD   | filled warning   |
| failed     | investigator, eventually | danger      | noted  | outlined danger  |
| completed  | nobody — good news       | success     | noted  | outlined success |

One loud state, and it's the one the grid's own Complete/Decline eligibility already
points at. This mapping is a proposal for ops validation, not a decree.

## Adoption

This grammar governs the design repo now. Official Beam/Sunlight repos are invited
to adopt by reference — collisions found there reconcile toward this document, and
proposed amendments come back as edits here, not as local divergence.

**Phase 3 (reconciliation, separate pass):** one badge organism speaking tiers;
page vocabulary maps for every audit surface; the audit's anomalies (fill
conventions, severity member sets, relabeled tokens, hand-rolled story chips)
resolved against these rules; Gaspar transactions reseeded to the real five-status
vocabulary. Each reconciliation is its own gated task — the grammar changes no code
by itself.
