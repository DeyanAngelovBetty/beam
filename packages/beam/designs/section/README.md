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

## ⚠️ Missing file

`section-amendment-unlabeled.png` is **referenced above but not yet present in this folder** (only
`section-current.png` and `section-goal.png` are here as of this commit). The unlabeled-inputs behavior was
built from the text ruling; add the screenshot so the folder reads correctly cold.

## Current build vs the spec (visual diff, this commit)

Matches goal+amendment: header kept in edit, static Reward Type, header separators + actions column,
full-bleed dividers/hover, the two typed CTAs with the correct disabled states, unlabeled inputs, and the
zero-reflow twin invariant. **Known deviations flagged for a decision (not changed here):**
- Numeric columns (`# of Rewards` / `Qualification Amount` / `Reward Amount`) are **right-aligned** in the
  build; `section-goal.png` shows them **left-aligned** (values under their header's left edge).
- The Milestone Flip row renders its data value **"MilestoneFlip"** (no space); the goal shows
  **"Milestone Flip"** (spaced) — a display-normalization question (the fixtures value stays "MilestoneFlip").
- Row height is a uniform `FIELD_TWIN` (44px). It satisfies the invariant and is far more compact than the
  goal's notched rows, but the amendment asks to recompute from the *unlabeled* input's natural height
  (≈ `paddingY·2 + valueLineHeight` = 30px); 44 was chosen for a uniform header/body grid. Confirm the
  intended compact height (the amendment screenshot would settle it).
