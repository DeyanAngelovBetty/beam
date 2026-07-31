# Detail / Editor Page Spec — [Page Name]

*Fill and hand to any agent. Assumes docs/detail-page-grammar.md — the
agent reads it first; this form supplies the page's facts. The Payout
Config editor (PayoutConfigEditor.tsx) is the worked example for every
section below — deviate only via Flags. Delete guidance (▸) when
filling.*

**Author:** · **Date:** · **Domain doc:**

## Identity & routes
- Page title (create / edit variants):
- Routes: create `/.../new` · edit `/.../:id`
- Back link: label + destination ▸ BeamPageHeader's `back` prop —
  NEVER a hand-rolled link or a button in secondaryActions
- Subtitle line (create): ▸ e.g. "New X are created as Disabled."

## Modes
- [ ] Create + Edit only (MetaGame default — no view mode; record the
      divergence, dated)
- [ ] View ↔ Edit (User-page model) — what differs per mode:

## Save model  ▸ FIXED by grammar §4: Cancel + Create/Save in the
BeamPageHeader ACTIONS slot. Not a bottom bar, not floating buttons.
- Save gating: valid form AND: (aggregate conditions, e.g. "total
  probability exactly 100%")
- Unsaved-changes guard: yes (grammar default — useBlocker + dialog,
  worked example in UserEdit/PayoutConfigEditor)

## Status  ▸ status is IDENTITY, not action: chip below the title, not
in the actions slot; not editable on this page if lifecycle says so
- Status values + where lifecycle changes happen instead:

## Basic information (the top form section)
| Field | Type/control | Required | Rules (length/unique/read-only-on-edit) |
|---|---|---|---|
|  |  |  |  |

## Editable collections  ▸ the page's heart; per collection:
▸ section actions (Add Row/Rule) = a LEFT-aligned strip directly above
the organism; the right edge is page-only (grammar §4 altitude rule)
- Name + what one item is:
- Columns/fields per item:
- Item actions (add/remove/reorder): ▸ reorder = design-lane flag if
  no precedent
- Shares a skeleton with a view component? (name it — the two-mode
  doctrine)
- Nested sub-collections (e.g. rewards inside rows): shape + limits:

## Validation  ▸ the principle: STRUCTURAL prevention for local rules,
VALIDATION for aggregate rules — classify every rule:
| Rule | Local → structural (make it unreachable) or Aggregate → validated |
|---|---|
|  |  |
- Inline errors attach to the exact field/item (grammar default)
- Aggregate errors surface: (where — e.g. beside the Live Check)

## Live Checks  ▸ computed verdicts = BeamStat with severity
- Stats shown + formulas:
- Severity mapping: (e.g. =target → quiet · under → warning · over →
  danger)

## Persistence
- Mock-level against the seed store; aggregate save semantics if the
  future API is PUT-the-aggregate (retain ids, omitted = removed —
  worked example: PayoutRow id?/_key)

## Flags  ▸ anything the grammar + worked examples don't cover — list;
ships plain with `// pending design pass`, or waits; NEVER improvised
-

## Doc note
Dated line(s) for the owning domain doc:
