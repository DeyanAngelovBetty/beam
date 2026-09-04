# Page-rework workflow — process learnings

How page prompts should be shaped so the build matches the design. Append an entry when a rework
teaches something reusable.

## #1 — Page prompts carry the design artifact *(2026-09-04)*

**What happened.** The Token Campaign detail page was built from a prompt carrying only **prose**. It
diverged from the Figma — the composition (section band, surfaces, column headers) was invented from
the description because the description was all there was. Deyan then hand-edited the page/organism
code toward the real composition, and this rework reconciled those edits and formalized them
(`BeamPaper`, `BeamChildList` composing it, the editability border).

**The learning — a page prompt carries the design artifact, referenced by path:**

- **`apps/sunlight/designs/<Page>-<Mode>.png`** — the exported Figma frame(s), the **composition
  truth**. The prompt references them by path; the build matches them.
- **`apps/sunlight/designs/SPEC.md`** — the **intent deltas doctrine and the frame can't carry**
  (the Figma node link, page-specific numbers, fixed sizes, min-heights, fallbacks) with why.

**Division of authority** (also in `apps/sunlight/designs/README.md`):

- **Grammar governs mechanics** — surfaces, twins, the editability border, actions, drill-down
  (`docs/detail-page-grammar.md`, `docs/list-page-grammar.md`).
- **The frame governs composition** — what sits where, proportions, column headers, ordering.
- **The spec carries what neither can** — the page-specific numbers and intent.

A prose-only page prompt is the anti-pattern: prose under-determines composition, so the model fills
the gap by inventing it. The frame + spec close that gap.

Reference for this entry: Figma node
https://www.figma.com/design/erQ1X8e91k6YwRsKgnzXDY/Sunlight?node-id=376-61792
