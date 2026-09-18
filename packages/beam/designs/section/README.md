# designs/section — Section embedded-table contract

The reference frames behind the Section **embedded-table contract** (bleed + the twin invariant +
unlabeled columnar inputs). Implemented in `packages/beam/src/Section/Section.tsx` scoped styles; the
doctrine lives in [BEAM.md](../../../../BEAM.md) §6 (twin invariant + columnar-field labeling). The live
regression harness is the `Components/Section` → **TwinInvariant** Storybook story.

## The frames

| PNG | Mode | Specifies |
|---|---|---|
| `section-current.png` | before (what's wrong) | The pre-contract state. Two stacked "Rewards Strategy" sections. VIEW has no header column separators; EDIT **drops the column header row** and instead labels each row with a per-cell "REWARD TYPE" overline, uses **notched** inputs, and shows "MilestoneFlip" (no space). These are the four defects the contract fixes. |
| `section-goal.png` | after (the spec) | VIEW + EDIT twins. EDIT **keeps the column header row**; the Reward Type column is **static text** (no per-row overline); header carries **vertical column separators** and an **empty actions column** (with a separator before it); `+ ADD PRIZE` / `+ ADD MILESTONE FLIP` toolbar (the flip CTA greyed while one exists); per-row `(−)` remove (the prize's greyed when it's the last prize, the flip's red). The twin invariant: view↔edit reflows nothing below the toolbar. |
| `section-amendment-unlabeled.png` | **supersedes the goal on one point** | The screenshot behind the ruling agreed with Alex (official Beam frontend): inputs in twin-capable embedded tables render **UNLABELED** — no notched/floating per-cell labels; the column header is the label (wired via `aria-labelledby`). **This supersedes the notched inputs shown in `section-goal.png`.** The goal PNG's mislabeled "REWARD AMOUNT" notch (it reads "# OF REWARDS") is therefore moot — there are no notches. |

## Supersedence order

`section-goal.png` is the spec **except** for input labeling, where `section-amendment-unlabeled.png`
wins: unlabeled compact inputs, not notched. The twin invariant is unchanged — the view-row min-height is
recomputed from the *unlabeled* edit-row height (derived from `FIELD_GEOMETRY`, never a literal).

## ⚠️ Known-stale in the reference PNGs

The header cells in `section-current.png` / `section-goal.png` show **vertical column separators**
(`border-right` on each TH). These are a **Figma component artifact** — the Figma TH carries a border-right
the code convention does not. The estate convention (Gaspar transactions) has **no static column
separators**; edge separators appear only as the horizontal-scroll overflow affordance. The contract
removed the TH separators in v2.1; the PNGs are stale on this point **pending a Figma component fix**.

## ⚠️ Missing file

`section-amendment-unlabeled.png` was expected to land this task but is **still not present in this folder**
(only `section-current.png` and `section-goal.png` are here). The unlabeled-inputs behavior was built from
the text ruling; drop the screenshot in so the folder reads correctly cold.

## Current build vs the spec (contract v2)

Matches goal+amendment: header kept in edit (44 chrome band), static Reward Type, header separators +
actions column, full-bleed dividers/hover, the two typed CTAs with the correct disabled states, unlabeled
**full-height** inputs, and the zero-reflow twin invariant. The three deviations flagged in v1 are now
**resolved** (contract v2):
- **Alignment** — twin/field-list tables now **left-align** values + inputs under the header's left edge
  (density datagrids like Gaspar transactions keep right-aligned numerics).
- **Display label** — the Milestone Flip row renders **"Milestone Flip"** (spaced) via a display map; the
  stored data value stays `MilestoneFlip`.
- **Row height** — the two-tier row doctrine: twin rows are **`TWIN_ROW_HEIGHT` (57 = 44 + 2·6 + 1)** so a
  **full field twin** fits (no compact input, matching `DetailsPanel`); density/read-only embedded tables
  (Winners) stay at 44. See BEAM.md §6.
