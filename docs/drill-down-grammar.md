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

## Open question — recorded, not resolved

**CR granularity.** When a Wall Stage's *Submit for Approval* fires, does it create a **stage-level**
change request, or **roll up** into the parent campaign's CR? Today **both route levels stub their own
Submit**, which quietly asserts **stage-level** granularity. That is a placeholder, not a decision — it
is backend-ledger material (Tzeno's change-request model), and it interacts with the delta-rendering of
nested lists (approval-grammar) and Delete's pipeline. **Flagged, not chosen here.**
