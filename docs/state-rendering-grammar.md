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

### The sanctioned exception: the JOURNEY ANCHOR *(2026-09-09)*

A product may **pin one status's full rendering — hue AND volume — across all its surfaces** when that
status names the central object of a cross-surface workflow. Recognizing the tracked object at a glance,
everywhere it appears, outranks per-surface volume tuning for that one word. This overrides the
default (volume-per-surface) rule above, for the anchor only.

Anchors are **scarce by rule**: at most one or two per product, and **declared explicitly** (not
inferred). Everything that is not the anchor still obeys the budget.

**Accepted cost, stated honestly:** the anchor's home queue — the surface where every row is the anchor
status — renders **uniform loud**. That is tolerated because it is *uniform*: one base tone, not a set
of competing shouts. The alarm-wall failure is many *different* loud states fighting for attention; a
single status rendered loud on every row is a texture, not a competition. And the budget still governs
every non-anchor status on that surface, so nothing else can pile on.

**Declared anchors:**
- **Sunlight → `Pending`** (`in-progress` / **loud**, every surface). Maker-checker is Sunlight's
  essential workflow; a pending change request is the object the whole product tracks.

**Worked example — `Pending` (default rule vs anchor override):**

| Surface | Word | Hue (fixed) | Volume | Why |
|---|---|---|---|---|
| Loyalty Status (approval column) | Pending | `in-progress` | **loud** | *Default rule also yields loud* — the lone actionable state on a quiet grid. Default and anchor agree here. |
| Pending Approvals (the queue) | Pending | `in-progress` | **loud** | *Default rule would say noted* (whole queue is pending → budget dampens); the **anchor override wins** → loud. Uniform-loud queue, accepted per the cost above. |

Same hue everywhere (`in-progress`); on Loyalty Status the default and the anchor land on the same
volume, on Pending Approvals the anchor overrides the budget's *noted* up to *loud*. Every non-anchor
status on both surfaces still follows the budget (decision-history `approved`/`rejected` are *noted*,
`canceled`/`outdated` *silent*).

When a word's *hue* would need to change per surface (the audit's `Disabled` = config-`draft` vs
lifecycle-`paused`), that is a real collision — not an anchor case — and the fix is renaming the
vocabulary, not overloading the hue. (Token Campaigns took the other branch: `Disabled` is now
silent/neutral estate-consistent, because a disabled campaign asks nobody to act.)

## Spatial accents *(2026-09-09)*

Hue may extend beyond chips to **spatial markers** — a thin colored bar in a row's rail region —
as **redundant reinforcement** of the status chip (the chip names the state, the accent locates the
row; color is additive, never the sole carrier — the a11y rule holds, accents are `aria-hidden`).
Accents key on **hue** (the category), with **`danger`** the primary sanctioned use (scanning a queue
for the rows that need investigation). The **loudness budget governs chips, not accents** — an accent
*locates*, it doesn't *shout*, so multiple accented rows are not an alarm-wall. First use:
`BeamDataTable`'s `rowAccent` (Gaspar transactions, failed rows).

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

## Worked example — Gaspar transactions (ops-validated)

| Status     | Who scans / acts?              | Hue         | Volume | Rendering        |
|------------|--------------------------------|-------------|--------|------------------|
| created    | nobody (system)                | —           | silent | plain outlined   |
| processing | nobody (system)                | —           | silent | plain outlined   |
| pending    | largely self-resolving         | warning     | noted  | outlined warning |
| failed     | ops — scan target, investigate/retry | danger | **LOUD** | filled danger    |
| completed  | nobody — good news             | success     | noted  | outlined success |

One loud state — `failed`, the thing ops scans a payments queue *for* and acts on (investigate / retry).
`pending` is noted, not loud: it largely resolves itself, so it registers without shouting.
**Shipped + ops-validated 2026-09-09** (phase-3 item 1; Boryana/PM confirmed) — this table is the page's
live map, and the example graduates from *proposal* toward *observed truth*. Note the loud slot
(scan-target = `failed`) is deliberately **not** the bulk-action eligibility target (`pending`):
what you scan for and what you act on are different, and the grammar renders the scan-target loud.
(`pending`'s `warning` is a per-product homonym of Sunlight's `in-progress` `Pending` anchor — word-hue
consistency scopes per product vocabulary; the "estate-wide" wording gets that clarification in a later
grammar pass, logged not applied.)

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
- **Gaspar transactions reseeded** to the real vocabulary (`created/processing/pending/failed/
  completed`); Status renders via `BeamBadge` + the worked-example map; Direction / 3DS de-badged to
  plain text; `TxBadge` retired. *(queue item 1, done.)* Backend assumptions (event mapping,
  `pending` pre/post-submit, null-`pspTransactionId`, pending-only eligibility) are in the page's SPEC
  ledger. The per-product word-hue clarification is logged here, to be applied in a later grammar pass.

*Remaining queue — parked, suggested order (each its own gated pass):*
1. **Remaining `BeamStatusBadge` call sites → page maps** (config/payout/preset pages via `statusBadge`,
   midnight players/payments, gaspar bench legend's relabeled tokens `active→"Routing"` etc.), retiring
   the `statusBadge`/`lifecycleBadge` helpers and eventually the adapter.
2. **Severity unification:** `BeamStat` (`warning|error`) and MUI `Alert` (`info|success|warning|error`)
   reconcile to the one hue set (`danger/warning/success/in-progress/neutral`).
3. **Boolean consolidation:** the "Enabled" three-ways (BeamStatusBadge active/draft vs BeamBool vs
   BeamSwitchField) settle on the boolean treatment (BeamBool / switch), not a status chip.
4. **`NodeKindChip`** (gaspar rule builder) — categorical node kinds, decide silent/plain vs a
   sanctioned categorical treatment (not semantic hues).
5. **Hand-rolled story chips** (`BeamPageHeader.stories` Pending/Active) → `BeamBadge`.
6. **Grammar wording:** clarify "hue fixed across the estate" → **per product vocabulary** (the
   Gaspar-`warning` vs Sunlight-`in-progress` `Pending` homonym). Doc-only.

The grammar changes no code by itself; the list above is the ledger, not this pass's mandate.
