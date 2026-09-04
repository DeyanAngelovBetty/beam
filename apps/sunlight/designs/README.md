# designs/ — the composition truth for Sunlight pages

Exported Figma frames + per-page specs. This folder exists because a page prompt carrying only
prose diverges from the design (the Token Campaign detail was rebuilt from prose and missed the
Figma; see `docs/page-rework-workflow.md`).

## The convention

Every page prompt references, **by path**, the design artifact for the page:

1. **Exported frame(s)** here — the PNG(s) that are the **composition truth** (layout, section band,
   which surface holds what, column headers, ordering). Name them `<Page>-<Mode>.png`
   (e.g. `TokenCampaign-View.png`, `TokenCampaign-Edit.png`).
2. **A `SPEC.md`** carrying the **intent deltas doctrine doesn't cover** — the Figma node link, and
   any page-specific rulings (fixed sizes, min-heights, fallbacks) with old→new / why.

## Division of authority

- **Grammar governs mechanics** — `docs/detail-page-grammar.md`, `docs/list-page-grammar.md`
  (surfaces, twins, editability border, actions, drill-down).
- **The frame governs composition** — what sits where, proportions, column headers, ordering.
- **The spec carries what neither can** — page-specific numbers and intent the grammar is silent on
  and the frame can't state in words.

When these conflict on the same thing, the more specific wins: spec > frame > grammar for that detail;
but grammar owns mechanics the frame merely renders.
