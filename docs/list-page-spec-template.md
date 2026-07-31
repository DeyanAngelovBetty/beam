# List Page Spec — [Page Name]

*Fill this and hand it to any agent. It assumes docs/list-page-grammar.md
— the agent reads that first; this form only supplies the page's facts.
Delete guidance lines (▸) when filling.*

**Author:** · **Date:** · **Domain doc:** (link the reference doc this
implements, if any)

## Identity
- Page title:
- Route: `/...`  ▸ tier 3 (full page) is the default; say if not
- Nav placement: (section → label)
- One-line purpose (becomes the subtitle):

## Domain
- Record type + fields: ▸ shape only; agent proposes the TS
- Seed data: ▸ realistic, recognizable to the team; note any state
  worth demoing (e.g. one invalid record)
- Derived/computed values shown anywhere:

## Columns (in order)
| Column | Field | Type/format | Sortable? | Notes |
|---|---|---|---|---|
|  |  |  |  | ▸ identity link column first; numeric right-aligned |

## Filter & search
- Promoted filters: ▸ the 1–3 that earn bar placement
- Search over: (fields)
- Default state / URL-resident: yes (grammar default)

## Row actions  ▸ ONE definition, data-shaped; every surface projects it
- Actions (in order): label → what it does · state-dependent? ·
  destructive?
- Any disabled states + their reasons:

## Batch actions  ▸ complexity clause: batch + row together is a cost
▸ the batch strip renders LEFT, directly above the table; the page's
right edge is page-only (grammar §4 altitude rule)
- [ ] None (default)
- [ ] Yes — the multi-select workflow that justifies it:

## Expansion
- [ ] None
- [ ] Yes — expanded row shows: ▸ existing component, or describe;
  novel content = design-lane flag

## States
- Empty list copy + primary action:
- No-filter-results: (grammar default: preserve filters + reset)
- Anything else non-standard:

## Flags  ▸ anything this page needs that the grammar doesn't cover —
list it here; the agent builds around it plain, never improvises it
-

## Doc note
One dated line for docs/metagame-pages.md (or the owning domain doc)
recording this page's decisions:
