# Drill-Down Grammar

**Status:** Ratified 2026-09-10 (after building + testing the Token Campaigns → Campaign → Wall Stage →
Reward Item chain). Governs how nested entities are navigated and edited across the estate.
**Companions:** `detail-page-grammar.md` (a route level IS a detail page), `list-page-grammar.md`,
`state-rendering-grammar.md`.

A drill-down is a chain of entities of increasing specificity. Every node in the chain is one of exactly
**two kinds of level** — and the kind, not the depth, decides its behavior.

## Two kinds of level (at any depth)

### Route level — own URL, own session
A **route level** is a full detail page:
- its **own URL** (own breadcrumb, deep-linkable, refresh-safe);
- its **own view↔edit session** — **view-first, with an explicit edit door** (the header EDIT action);
- its **own draft** and its **own Cancel / Submit** (Submit is the record's change-request path — a
  stub until the pipeline lands).

The pattern **repeats identically at every route level**. Token Campaigns (list) → **Campaign** (route)
→ **Wall Stage** (route) are the same detail-page grammar applied one level down each time — same header
anatomy, same field-twin morph, same Cancel/Submit. Nothing about being deeper changes the pattern.

### Leaf surface — no URL, no session, inherits the parent's mode
A **leaf surface** is a sub-record with no list-bearing children of its own. It has **no URL, no session,
and no mode of its own** — it **inherits the parent route level's mode**:
- parent in **View** → the leaf opens **read-only** (view reps, a single Close);
- parent in **Edit** → the leaf **edits the parent's draft** (Save writes into that draft; Cancel
  discards the leaf's changes, not the parent's session).

A leaf surface may render as **inline rows** in the parent (e.g. Opening Windows) **or as a dialog** when
the leaf is richer than a row comfortably holds. The **Reward Item dialog is the founding leaf-surface
example** — ~9 fields, edited inside the Wall Stage edit session, read-only inside the Wall Stage view.
See the **dialog ruling** in `apps/sunlight/docs/SPEC-sunlight-prizewall-wall-stage.md` (the estate's
first sanctioned dialog, scoped to *leaf-edit / leaf-view within a parent session* — the "no dialogs for
entity editing" default from `detail-page-grammar.md` still holds for everything that is a route level).

*(Evolution note: the 2026-09-02 drill-down rulings floated "RewardItem → inline, with a fallback to a
leaf ROUTE if cramped." Testing chose a third form — a leaf **dialog** — which this grammar ratifies as
a first-class leaf-surface option alongside inline rows.)*

## The invariant: sessions never nest

**Each route level owns its own draft; sessions do not stack.** Moving between levels means **leaving a
session, not entering a nested one**:
- You cannot be editing a Campaign *and* a Wall Stage at once — a child route level renders **view-only
  (or is hidden) in a parent's edit mode**; you drill into the stage to edit it, in the stage's own
  session (detail-page-grammar §"Children are edited on their own pages").
- A **leaf surface is the one exception that is not a nesting** — it has no session of its own; it is a
  window onto the *parent's* single draft, so no second draft exists to stack.

One draft alive per route level, one route level in edit at a time. That is what keeps Cancel/Submit
unambiguous at every depth.

## The create route — an edit session with no view

**A create route is an edit session with no view; view-first applies from the entity's first save
onward.** A `/new` route (e.g. `token-campaigns/new`) lands *directly in edit* — there is no record to
view yet, so there is no view mode and no Edit door. Cancel returns to the **list** (no parent view to
fall back to); Submit is the same change-request stub as edit. A child route level a create page would
contain is **locked** until the parent exists — you cannot open a child session before the parent has
been created (sessions never nest). Consumers: the Token Campaign create page (`TokenCampaignDetailPage`,
`create` prop), whose Wall Stages section renders the locked message in place of the child list; and —
**now generalized to a second consumer** — the Wall Stage create page (`WallStagePage`, `create` prop) at
`…/stages/new`, reached from the campaign's "+ ADD WALL STAGE" (which navigates, one level down).

## Creation grammar — NEW vs ADD

Two verbs, two meanings. The word on the button is a claim about **what gets created and who approves it**.

### NEW — creates a route-level, approval-bearing entity
- **Where:** a **list page**'s primary action — **"+ NEW &lt;entity&gt;"** (New Token Campaign, New Config,
  New Preset).
- **What:** a standalone entity with **its own page and its own change request**. The create route is an
  **edit session with no view** (see above); its primary CTA is **Submit for Approval** (a stub until the
  pipeline lands). **The entity is the CR unit.**

### ADD — composes a child into an existing parent
- **Where:** inside a parent's edit/create session — **"+ ADD &lt;child&gt;"** (Add Wall Stage), or a bare
  **ADD** where a **dialog title** already carries the context (Add Reward Item).
- **What:** a child folded into the parent. It has **no approval of its own — the parent's approval covers
  its children.** So an ADD **commits directly into the parent** (into its draft when the parent is mid-edit,
  or into the parent record when the child is authored on its own page); there is no child-level Submit.
- **Route-level ≠ NEW.** A child may still be a *route level* (its own page — a Wall Stage is) and still be
  an **ADD**: the NEW/ADD split is about **the CR unit**, not about depth. A Wall Stage has its own page yet
  rolls up into the campaign's CR, so its create page's CTA is **"ADD WALL STAGE"**, not Submit for Approval.

### This resolves CR granularity (design answer, pending backend confirmation)

The old open question — does a Wall Stage's Submit create a stage-level CR or roll up into the campaign's?
— is **answered by this grammar as the design's claim: the campaign is the CR unit; stages, opening
windows, and rewards roll up into it.** Only NEW mints a change request; every ADD is covered by the
parent's. This is **design-answer-pending-backend-confirmation** — it needs Tzeno's change-request ledger
to confirm the model supports campaign-grained CRs with nested child deltas (it interacts with the
delta-rendering of nested lists in approval-grammar, and with Delete's pipeline). **Claimed here, awaiting
backend sign-off — no longer open.**

*(Consequence still open: Wall Stage **EDIT** currently inherits a "Submit for Approval" CTA, which under
this grammar should become a **Save-to-campaign** — a stage edit rolls up too. Flagged for a separate
ruling; not changed with the grammar.)*
