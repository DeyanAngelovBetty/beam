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

## Hue is estate-wide; volume is per-surface *(contextual-volume note, 2026-09-09)*

A word's **hue is fixed across the estate** — `Pending` is `in-progress` everywhere, `Failed` is
`danger` everywhere. Hue is meaning, and meaning does not change per screen. **Volume is chosen
per surface**, by the loudness budget (at most one loud state per surface, earned by actionability).
So the same word can be *noted* on one surface and *loud* on another — same hue, different volume —
and that is not a collision; it is the budget doing its job.

**Worked example — `Pending` on two surfaces (both shipped):**

| Surface | Word | Hue (fixed) | Volume (per budget) | Why |
|---|---|---|---|---|
| Loyalty Status (approval column) | Pending | `in-progress` | **loud** (filled) | the lone actionable state on an otherwise quiet record grid — a checker must decide |
| Pending Approvals (the queue) | Pending | `in-progress` | **noted** (outlined) | the whole queue is pending; loud on every row is a wall of alarm — the budget forbids it |

The hue is identical (both `in-progress`); only the volume differs, and each is right for its surface.
When a word's *hue* would need to change per surface (the audit's `Disabled` = config-`draft` vs
lifecycle-`paused`), that is a real collision — the fix is renaming the vocabulary, not overloading
the hue. (Token Campaigns took the other branch: `Disabled` is now silent/neutral estate-consistent,
because a disabled campaign asks nobody to act.)

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

**Phase 3 (reconciliation) — each reconciliation is its own gated task.**

*Done (2026-09-09, first reconciliation pass):*
- **Keystone** `BeamBadge` (grammar-native `(hue, volume, label)`, filled-neutral + label-less
  unrepresentable); `BeamStatusBadge` reimplemented as a legacy adapter over it (pixel-identical).
- **Three Sunlight surfaces migrated to explicit vocabulary→tier maps:** Token Campaigns (executed the
  amber-`Disabled` collision → silent; Scheduled dimmed loud→noted), Loyalty Status approval
  (`Pending` loud), Pending Approvals `CRStatusChip` (`Pending`/decision-history noted; canceled/
  outdated silent). Raw strings no longer drive color on these three.

*Remaining queue — parked, suggested order (each its own gated pass):*
1. **Gaspar `TxBadge` + mock reseed** to the real five-status vocabulary (`created/processing/pending/
   failed/completed`) via a page map — the worked example above is its target. Also stop rendering
   Direction / 3DS through the badge mechanism (categorical enums render silent/plain, not semantic).
2. **Remaining `BeamStatusBadge` call sites → page maps** (config/payout/preset pages via `statusBadge`,
   midnight players/payments, gaspar bench legend's relabeled tokens `active→"Routing"` etc.), retiring
   the `statusBadge`/`lifecycleBadge` helpers and eventually the adapter.
3. **Severity unification:** `BeamStat` (`warning|error`) and MUI `Alert` (`info|success|warning|error`)
   reconcile to the one hue set (`danger/warning/success/in-progress/neutral`).
4. **Boolean consolidation:** the "Enabled" three-ways (BeamStatusBadge active/draft vs BeamBool vs
   BeamSwitchField) settle on the boolean treatment (BeamBool / switch), not a status chip.
5. **`NodeKindChip`** (gaspar rule builder) — categorical node kinds, decide silent/plain vs a
   sanctioned categorical treatment (not semantic hues).
6. **Hand-rolled story chips** (`BeamPageHeader.stories` Pending/Active) → `BeamBadge`.

The grammar changes no code by itself; the list above is the ledger, not this pass's mandate.
