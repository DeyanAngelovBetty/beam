# SPEC — Sunlight PrizeWall: Wall Stage + Reward Item (Final Drill-Down Levels)

**Date:** 2026-09-10
**Design:** Figma frames, exported to `apps/sunlight/designs/`:
  - `prizewall-wall-stage-view.png`
  - `prizewall-wall-stage-edit.png`
  - `prizewall-reward-item-edit.png`
  Frames are visual-authoritative for layout, sections, and fields. (Adjust filenames
  to match what's actually dropped.)
**Intent:** FAITHFUL PORT. This completes the PrizeWall design in the repo so it can
be handed to Alex as done. Layout improvements deliberately NOT pursued — anything
tempting goes to a "Later flags" list in build-notes, not into the build.
**Scope:** Wall Stage page (View + Edit modes) and Reward Item edit dialog, wired
into the existing Token Campaigns → Campaign drill-down.
**Out of scope:** any change to Token Campaigns list or Campaign detail beyond the
navigation into Wall Stage; approval-pipeline changes; new organisms.

## Placement in the hierarchy

Token Campaigns (list) → Campaign detail (exists — Wall Stages section lists
Stage 1/2/3 with chevrons) → **Wall Stage page** (this spec) → **Reward Item dialog**
(this spec, opened from Wall Stage Edit).

Route per Sunlight's existing router conventions (browser router; propose the path,
e.g. campaign/:id/stage/:stageId). Breadcrumb per the frame: back to the campaign.

## Wall Stage page

- **View-first doctrine:** route lands in View; Edit is a mode entered via the
  header EDIT action. DELETE + EDIT in the page header per the frame.
- Header: stage name, campaign date-range subline, breadcrumb.
- Stat row: the frame's four stats (win probability, loss probability, cost of
  play, enabled) as BeamStat with the established 44px view↔edit field-twin
  shapeshift — fields in Edit, stats in View.
- Sections — each a BeamPaper surface per the sectioning doctrine, content per the
  frames: Opening Windows (tabular; Edit adds "+ NEW OPENING WINDOW" and per-row
  remove), Quick Rules (name + desktop/mobile URL with copy affordances in View,
  text fields in Edit), Reward Items (card grid: image, xN quantity, dimensions
  caption — Edit makes cards clickable to open the Reward Item dialog), Info Page
  Rules, Images (header/background × desktop/mobile).
- Exact field lists, labels, and section order: the frames govern. Where a frame
  is ambiguous at PNG resolution, ask rather than invent.
- Edit-session semantics: follow the EXISTING campaign-edit pattern found in the
  repo (inventory first) — whatever Campaign detail does for draft state /
  cancel / save / submit-for-approval, Wall Stage does the same one level down.
  Do not invent new change-request wiring in this pass.

## Reward Item edit dialog

- Opened from a reward card in Wall Stage EDIT mode. Fields per the frame
  (name, description, type, value, tier, image URL, quantity, bonus, order —
  verify against the frame); CANCEL / SAVE per the frame.
- Saving updates the reward item in the Wall Stage draft state (same session,
  no separate persistence).
- **Doctrine note (deliberate ruling, record in build-notes):** this is the
  estate's first sanctioned dialog. The repo's "no dialogs" lean stands as the
  default; this is the legitimate exception case — a leaf-level sub-record edited
  inside a parent edit session, where navigation would discard the parent's
  unsaved state. Scope the ruling exactly that narrowly: leaf edit within an
  edit session. Use MUI Dialog per the frame's anatomy; propose sizing/tokens.

## Mock data

Extend the existing campaign/stage mock so each stage carries what the frames
show: opening windows, quick rules, reward items (with quantities, tiers,
image URLs — placeholder/asset-path images are fine), info rules, images.
Enough rows/items to make the grid and tables look inhabited, per the frames'
counts.

## Acceptance

- From Campaign detail, each stage row navigates to its Wall Stage page; refresh
  and deep link work per Sunlight's router.
- View renders all sections per the view frame; EDIT shapeshifts stats and
  sections per the edit frame; field-twin geometry holds (no layout jump).
- Reward card click in Edit opens the dialog; SAVE reflects changes in the grid;
  CANCEL discards; dialog is keyboard-operable and focus-trapped (standard MUI
  Dialog behavior — verify, don't rebuild).
- Status/state renderings on these pages comply with docs/state-rendering-grammar.md
  (enabled indicators etc. — BeamBool/BeamBadge as appropriate, no new mechanisms).
- Existing pages byte-identical; no organism changes.
- Build-notes: "Later flags" list for every parked improvement temptation, the
  dialog ruling, and anything the frames left ambiguous that was resolved by asking.

## Notes for repo-Claude

- Inventory first: the existing Campaign detail implementation (edit pattern,
  mock shape, routing), and report how Wall Stage will slot in — propose before
  building.
- The frames are ports of finished Figma design: match them. Intent deltas, if
  any emerge (e.g. established organism behavior diverging from a frame detail),
  get flagged and recorded, not silently chosen.

---

## Build notes (2026-09-10)

Faithful port shipped. `WallStagePage.tsx` replaces the `tokenCampaignStubs` stub (deleted; App import
repointed). Route + stage-row nav pre-existed; deep-link/refresh work via Sunlight's browser router.

### INTENT DELTA (recorded per the handoff convention)
- **Edit header.** The `WallStage-Edit.png` frame still shows `DELETE / EDIT` in edit — **un-redrawn
  view chrome**. Per the spec ("inherit the campaign edit-session semantics"), the header swaps to
  **`[Cancel · Submit for Approval]`** in edit, matching Campaign detail. Deliberate divergence from the
  frame's literal header; confirmed with Deyan before building.

### Dialog ruling (the estate's FIRST sanctioned dialog)
The Reward Item edit uses an MUI `Dialog` (`maxWidth="sm"`, full-width; title "Edit Reward Item";
two-column `BeamField` grid; `CANCEL`/`SAVE`; keyboard + focus-trap are MUI defaults). **Scope of the
ruling, exactly:** a *leaf sub-record edited inside a parent edit session*, where navigating to a page
would discard the parent's unsaved draft. Save writes into the wall-stage draft (same session); Cancel
discards. The repo's **"no dialogs" default stands everywhere else** — this is the sanctioned exception,
not a new pattern to spread. The dialog is the **founding leaf-surface** example of the drill-down
model — see [/docs/drill-down-grammar.md](../../../docs/drill-down-grammar.md) (route level vs leaf
surface; sessions never nest).

*Scope extension (2026-09-10): **view usage of the same dialog surface is sanctioned alongside
leaf-edit.*** Reward cards are clickable in **View** too, opening the SAME dialog **read-only** — fields
as view reps (BeamStat, mirroring the page's own view-twins), title "Reward Item" (no "Edit"), a single
**Close** action, no Save. This is **View-first extended to the leaf level**: every drill-down level is
inspectable without entering an edit session. Cards carry a proper button affordance in both modes
(pointer, focus ring, Enter/Space opens) — View was previously inert.

*Scope extension (2026-09-11): **the same surface gains an ADD flavor** — three flavors total (view /
edit / add).* The reward grid is a **fixed 12-slot grid** (frame + mock: 12/stage); a filled slot is a
card, an empty slot is a **"+ ADD" tile in a session** and an **inert placeholder in view** (no add
outside a session — the leaf inherits the parent's mode, creation included). Clicking "+ ADD" opens the
dialog with **empty fields, title "Add Reward Item", CTA "Add"** → appends to the stage draft, tile
becomes a card; Cancel discards. No 13th slot (hard cap — Deyan).

### Ambiguities resolved by asking (not invented)
- **Reward card caption** (frame `×5` / `100 × $100`): confirmed **badge = `×{quantity}`, caption =
  `{coins} × ${cashValue}`** (design intent, not a guess). Mock seeds quantity 5, coins 100, cash 100.
- **Opening-window duration:** `durationMin` **derived** (end − open) in View; an editable field in Edit;
  **no recompute coupling** this pass. Real duration semantics stay on the Radi/Tzeno flag.
- **`RewardItem` additions:** `type` / `cashValue` / `quantity` added; `coins` / `quality` retained.

### Create route + reconciliation (2026-09-11)

- **`…/stages/new`** (`WallStagePage`, `create` prop) — a create route = an edit session with no view
  (drill-down-grammar; Wall Stage is its **second consumer**). Empty stage draft: one empty opening
  window + "+ Add opening window"; **3 empty Quick + 3 empty Info** rule rows (mock counts); the 2 fixed
  Image rows; a 12-slot reward grid of "+ ADD" tiles. Title **"Create Wall Stage"**, breadcrumb
  `← {campaign}`. The frame's "Wall Stage 1" title + Delete/Edit chrome is View/Edit residue — not copied.
- **A Wall Stage is an ADD, not a NEW (creation grammar, 2026-09-11).** It rolls up into the campaign's
  CR, so the primary CTA is **"ADD WALL STAGE"** and it **commits the stage straight into the campaign's
  `wallStages` (in-memory, `addWallStage`)** — NOT a Submit-for-Approval stub (that governs campaign
  CREATE, a NEW). No Submit, no Delete (create-mode ruling). **Contrast the campaign-create stub, which
  stands for NEW** — a NEW mints a CR, an ADD is covered by the parent's.
  - **Landing (argued): back to the campaign, not the new stage's view.** Under the grammar you *added a
    child to the campaign*, so returning to the parent — now showing the stage in its Wall Stages list —
    is the coherent continuity (immediate proof the add landed; add another, or continue). It also mirrors
    Cancel's destination, the only difference being that ADD committed the stage. Landing on the new stage
    would be a NEW-shaped "land on the thing you made"; and the stage is already fully authored in the
    form before ADD, so its view would be mere confirmation. Campaign wins.
- **Reconciliation — "+ ADD WALL STAGE" now NAVIGATES.** With a real create route, the campaign Edit's
  draft-row append (2026-09-10) **retires** — one add path, no competing mechanisms. The button navigates
  to `…/stages/new` from **view and edit alike**; drilling from edit leaves (discards) the campaign draft
  per the no-confirm cancel semantics — the sanctioned drill (distinct from View-Winners, a blocked peek).
  The campaign Wall Stages section is now one page-local table (both modes), rows are real drill links.
- **Rule names editable in-session.** The Add frame shows editable rule NAME fields; `RulesTable` names
  become an editable field whenever in a session (create + **existing-stage edit** — a consistency change
  flowing from the frame). No add/remove of rule rows (frame has none — fixed 3, the mock count).
- **Frame divergences (recorded, not applied):** editable image NAME in the frame — Header/Background are
  **fixed structural slots**, kept fixed-name with empty URLs. Empty **numeric** fields render `0`, not
  blank (a blank-vs-0 empty-number treatment is the shared deferred item across the create screens).

### FLAG — Wall Stage EDIT's CTA is now grammar-inconsistent (Deyan rules separately)

Under the NEW/ADD creation grammar, a stage EDIT rolls up into the campaign too — so the inherited
**"Submit for Approval"** CTA on Wall Stage edit should become a **Save-to-campaign** (write into the
campaign, no stage-level CR). **Flagged, not changed** — the edit-CTA question waits for Deyan's ruling;
the grammar pass only reworded/reworked CREATE. (The stub comment in `submitForApproval` carries the same
flag.)

### Vocabulary sweep (2026-09-11, report + label-only fixes)

Audited create/add actions estate-wide against the grammar (list → NEW, child → ADD):
- **Correct NEW (list pages):** New Token Campaign · New Config (game) · New config (payout) · New Preset.
- **Correct ADD (children):** Add Wall Stage · Add reward (Loyalty) · Add Reward (Payout) · Add Row ·
  Add Sector · Add Condition · Add else (Gaspar rule node) · reward "+ ADD" tiles · Add Reward Item (dialog).
- **FIXED (label-only):** WallStage "**New opening window**" → "**Add opening window**" — an opening window
  is a child (ADD).
- **FLAGGED (structural — not fixed):** UsersPage "**Add user**" and RolesPage "**Add role**" are
  list-page primary actions for standalone route-level entities, so the list→NEW convention would make them
  "New user" / "New role" (matching the four config/campaign list pages). But the grammar defines NEW as
  *approval-bearing*, and users/roles aren't CR-gated — so whether this grammar governs them is a
  **scope question for the team**, not an unambiguous relabel. Recommend "New user"/"New role" for
  list-page consistency if NEW is extended to non-approval standalone entities.

### Later flags (parked improvement temptations — PrizeWall done, not improved)
- **Shared page-local components duplicated** — `MediaCell` / `CopyUrlButton`(now inline) / `Thumb` /
  `fmtDateTimeET` exist in both `TokenCampaignDetailPage` and `WallStagePage`. Extraction into a shared
  `prizeWall/` module is the obvious cleanup; parked to avoid touching Campaign detail this pass.
- **Two-column masonry** kept per the frame; a single responsive auto-grid would reflow more gracefully.
- **Info Page Rules** rendered as a bleed surface with a padded title field on top (minor spacing
  deviation from a uniform table surface).
- **Opening-window remove** shown on every row; the Edit frame drew it on rows 2–3 only (possible
  "keep ≥1" intent) — left as all-removable, revisit if a minimum is wanted.
- **Date format** uses `dd-MMM-yyyy hh:mm:ss AM ET` (matching Campaign detail); the frame's window rows
  use numeric `dd-MM-yyyy`. Format is Figma-authoritative, corrected on review; the ruling is the ET tz.
- **win/loss/finalOpenDate/duration semantics** (sum-to-100? window↔finalOpenDate coupling?) remain on
  the existing Radi/Tzeno open items — no validation invented here.

### Fence
No organism changes (reused `BeamPaper` / `DetailsPanel` / `BeamStat` / `BeamBool` / `BeamField` /
`BeamSwitchField` / MUI `Dialog` + `Table`, all barrel atoms). No approval-pipeline changes (Submit is
the same stub as Campaign detail). Token Campaigns / Campaign detail untouched beyond the pre-existing
stage-row navigation. Status/state renderings comply with the grammar (`BeamBool` for Enabled).
